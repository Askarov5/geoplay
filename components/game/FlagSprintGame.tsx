"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createFlagSprintGame,
  startPlaying,
  submitFlagGuess,
  skipFlag,
  endGame,
  getMultiplier,
  getFlagUrl,
  getFlagSprintStats,
} from "@/lib/game-engine/flags";
import { getAllCountryNames, resolveCountryCode } from "@/data/countries";
import type { FlagSprintGameState, Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface FlagSprintGameProps {
  difficulty: Difficulty;
  continent: Continent;
  onGoHome: () => void;
}

export function FlagSprintGame({ difficulty, continent, onGoHome }: FlagSprintGameProps) {
  const { t, countryName, locale } = useTranslation();
  const [gameState, setGameState] = useState<FlagSprintGameState | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  const [lastAnswer, setLastAnswer] = useState<{ code: string; correct: boolean } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allNames = useRef<string[]>(getAllCountryNames(locale));

  // Update names on locale change
  useEffect(() => {
    allNames.current = getAllCountryNames(locale);
  }, [locale]);

  // Create game on mount
  useEffect(() => {
    setGameState(createFlagSprintGame(difficulty, continent));
  }, [difficulty, continent]);

  // Countdown timer
  useEffect(() => {
    if (gameState?.phase === "countdown") {
      const id = setInterval(() => {
        setGameState((prev) => {
          if (!prev || prev.phase !== "countdown") return prev;
          const newCount = prev.countdownLeft - 1;
          if (newCount <= 0) {
            clearInterval(id);
            return startPlaying(prev);
          }
          return { ...prev, countdownLeft: newCount };
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [gameState?.phase]);

  // Game timer
  useEffect(() => {
    if (gameState?.phase === "playing") {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (!prev || prev.phase !== "playing") return prev;
          const newTime = prev.timeLeft - 1;
          if (newTime <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return endGame(prev);
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState?.phase]);

  // Focus input when playing & scroll into view for mobile keyboard
  useEffect(() => {
    if (gameState?.phase === "playing" && inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 300);
    }
  }, [gameState?.phase, gameState?.currentIndex]);

  const filterSuggestions = useCallback(
    (input: string) => {
      if (input.length < 1) {
        setSuggestions([]);
        return;
      }
      const lower = input.toLowerCase();
      const filtered = allNames.current
        .filter((name) => name.toLowerCase().includes(lower))
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(lower);
          const bStarts = b.toLowerCase().startsWith(lower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.localeCompare(b);
        })
        .slice(0, 5);
      setSuggestions(filtered);
      setSelectedIndex(-1);
    },
    [locale]
  );

  const handleSubmit = useCallback(
    (name?: string) => {
      const toSubmit = name || inputValue;
      if (!toSubmit.trim() || !gameState || gameState.phase !== "playing") return;

      const result = submitFlagGuess(gameState, toSubmit.trim(), locale);

      if (result.result === "correct") {
        setFeedbackState("correct");
        setLastAnswer({ code: gameState.flagQueue[gameState.currentIndex], correct: true });
      } else if (result.result === "wrong") {
        setFeedbackState("wrong");
        setLastAnswer({ code: gameState.flagQueue[gameState.currentIndex], correct: false });
      }

      setGameState(result.state);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setTimeout(() => {
        setFeedbackState(null);
        setLastAnswer(null);
      }, 800);

      if (inputRef.current) inputRef.current.focus();
    },
    [gameState, inputValue, locale]
  );

  const handleSkip = useCallback(() => {
    if (!gameState || gameState.phase !== "playing") return;
    setLastAnswer({ code: gameState.flagQueue[gameState.currentIndex], correct: false });
    setGameState(skipFlag(gameState));
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setFeedbackState("wrong");
    setTimeout(() => {
      setFeedbackState(null);
      setLastAnswer(null);
    }, 800);
    if (inputRef.current) inputRef.current.focus();
  }, [gameState]);

  const handlePlayAgain = useCallback(() => {
    setFeedbackState(null);
    setLastAnswer(null);
    setInputValue("");
    setGameState(createFlagSprintGame(difficulty, continent));
  }, [difficulty, continent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    filterSuggestions(val);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSubmit(suggestions[selectedIndex]);
      } else if (suggestions.length > 0 && showSuggestions) {
        handleSubmit(suggestions[0]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Loading
  if (!gameState) {
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#94a3b8] text-lg animate-pulse">{t("common.loadingGame")}</div>
      </div>
    );
  }

  // ─── Countdown ───
  if (gameState.phase === "countdown") {
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold">
            {t("home.flagsTitle")}
          </div>
          <motion.div
            key={gameState.countdownLeft}
            className="text-9xl font-black text-[#22c55e]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {gameState.countdownLeft}
          </motion.div>
          <div className="text-[#94a3b8]">{t("flags.getReady")}</div>
        </motion.div>
      </div>
    );
  }

  // ─── Resolution ───
  if (gameState.phase === "resolution") {
    const stats = getFlagSprintStats(gameState);
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center p-4">
        <motion.div
          className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 max-w-lg w-full space-y-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Title */}
          <div className="text-center space-y-1">
            <div className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold">
              {t("home.flagsTitle")}
            </div>
            <div className="text-sm text-[#475569]">{t("resolution.timeUp")}</div>
          </div>

          {/* Score */}
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <div className="text-7xl font-black tabular-nums text-[#22c55e]">
              {stats.score}
            </div>
            <div className="text-sm text-[#94a3b8] mt-1">{t("silhouette.points")}</div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-[#0a0e1a] rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#22c55e] tabular-nums">{stats.correct}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{t("flags.correct")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#ef4444] tabular-nums">{stats.wrong}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{t("flags.wrong")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#f59e0b] tabular-nums">{stats.bestStreak}</div>
              <div className="text-xs text-[#94a3b8] mt-1">{t("flags.bestStreak")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#3b82f6] tabular-nums">{stats.accuracy}%</div>
              <div className="text-xs text-[#94a3b8] mt-1">{t("flags.accuracy")}</div>
            </div>
          </motion.div>

          {/* Scrollable answer review */}
          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold mb-2">
                {t("flags.answers")}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {gameState.attempts.map((attempt, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      attempt.correct
                        ? "bg-[#22c55e]/15 text-[#22c55e]"
                        : "bg-[#ef4444]/15 text-[#ef4444]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlagUrl(attempt.countryCode, 40)}
                      alt=""
                      className="w-4 h-3 object-cover rounded-sm"
                    />
                    {countryName(attempt.countryCode)}
                    <span className="opacity-50">{attempt.correct ? "✓" : "✕"}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
            >
              {t("common.playAgain")}
            </button>
            <button
              onClick={onGoHome}
              className="bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {t("common.home")}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── Playing ───
  const currentFlag = gameState.flagQueue[gameState.currentIndex];
  const multiplier = getMultiplier(gameState);
  const timerPct = (gameState.timeLeft / gameState.totalDuration) * 100;

  const feedbackBorder =
    feedbackState === "correct"
      ? "border-[#22c55e]"
      : feedbackState === "wrong"
        ? "border-[#ef4444]"
        : "border-[#334155] focus-within:border-[#22c55e]";

  return (
    <div className="min-h-dvh bg-[#0a0e1a] flex flex-col">
      {/* Timer bar */}
      <div className="relative h-1 sm:h-1.5 bg-[#1e293b]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{
            width: `${timerPct}%`,
            backgroundColor: timerPct > 30 ? "#22c55e" : timerPct > 10 ? "#f59e0b" : "#ef4444",
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-[#111827]/90 backdrop-blur-sm border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Score */}
          <div className="text-lg font-bold text-[#f1f5f9] tabular-nums">
            {gameState.score}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak */}
          {gameState.streak > 0 && (
            <motion.div
              key={gameState.streak}
              className="flex items-center gap-1 bg-[#f59e0b]/15 text-[#f59e0b] px-2.5 py-1 rounded-lg text-sm font-bold"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              🔥 {gameState.streak}
              {multiplier > 1 && (
                <span className="text-xs opacity-70">×{multiplier}</span>
              )}
            </motion.div>
          )}

          {/* Timer */}
          <div
            className={`text-2xl font-bold tabular-nums ${
              gameState.timeLeft <= 10 ? "text-[#ef4444] animate-pulse" : "text-[#f1f5f9]"
            }`}
          >
            {gameState.timeLeft}s
          </div>
        </div>
      </div>

      {/* Flag display area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-2 sm:gap-4 overflow-hidden">
        {/* Last answer flash */}
        <AnimatePresence>
          {lastAnswer && (
            <motion.div
              className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                lastAnswer.correct
                  ? "bg-[#22c55e]/15 text-[#22c55e]"
                  : "bg-[#ef4444]/15 text-[#ef4444]"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {countryName(lastAnswer.code)} {lastAnswer.correct ? "✓" : "✕"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flag image */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentFlag}
            className="relative"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div
              className={`rounded-2xl overflow-hidden border-4 shadow-2xl transition-colors duration-200 ${
                feedbackState === "correct"
                  ? "border-[#22c55e] shadow-[#22c55e]/20"
                  : feedbackState === "wrong"
                    ? "border-[#ef4444] shadow-[#ef4444]/20"
                    : "border-[#334155] shadow-black/30"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFlagUrl(currentFlag, 640)}
                alt="Flag"
                className="w-48 sm:w-72 md:w-96 max-h-[30dvh] h-auto object-contain bg-[#1e293b]"
                draggable={false}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flag counter */}
        <div className="text-xs text-[#475569]">
          #{gameState.attempts.length + 1}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-[#1e293b] px-3 py-2 sm:px-4 sm:py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <div
                className={`flex items-center gap-2 bg-[#111827] border-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 transition-colors ${feedbackBorder}`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => inputValue && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t("flags.placeholder")}
                  className="flex-1 bg-transparent text-[#f1f5f9] text-lg outline-none placeholder:text-[#475569]"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim()}
                  className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-30 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t("common.go")}
                </button>
              </div>

              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
                  {suggestions.map((name, i) => (
                    <button
                      key={name}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        i === selectedIndex
                          ? "bg-[#1e293b] text-white"
                          : "text-[#cbd5e1] hover:bg-[#1e293b]"
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSubmit(name);
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="shrink-0 px-3 py-3 rounded-xl text-sm font-semibold transition-all border bg-[#1e293b]/50 hover:bg-[#1e293b] text-[#94a3b8] border-[#1e293b] hover:text-[#f1f5f9]"
              title={t("flags.skip")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
