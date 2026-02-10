"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createBorderBlitzGame,
  startPlaying,
  submitGuess,
  useHint,
  skipAnchor,
  handleTimeout,
  getBorderBlitzStats,
  getNeighborsForAnchor,
} from "@/lib/game-engine/border-blitz";
import { getAllCountryNames } from "@/data/countries";
import { CountrySilhouette } from "@/components/map/CountrySilhouette";
import type { BorderBlitzGameState, Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface BorderBlitzGameProps {
  difficulty: Difficulty;
  continent: Continent;
  onGoHome: () => void;
}

export function BorderBlitzGame({ difficulty, continent, onGoHome }: BorderBlitzGameProps) {
  const { t, countryName, locale } = useTranslation();
  const [gameState, setGameState] = useState<BorderBlitzGameState | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  const [hintFlash, setHintFlash] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allNames = useRef<string[]>(getAllCountryNames(locale));

  useEffect(() => {
    allNames.current = getAllCountryNames(locale);
  }, [locale]);

  useEffect(() => {
    setGameState(createBorderBlitzGame(difficulty, continent));
  }, [difficulty, continent]);

  // Countdown
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
            return handleTimeout(prev);
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState?.phase]);

  // Focus & scroll input
  useEffect(() => {
    if (gameState?.phase === "playing" && inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 300);
    }
  }, [gameState?.phase, gameState?.foundNeighbors.length]);

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
        .slice(0, 6);
      setSuggestions(filtered);
      setSelectedIndex(-1);
    },
    [locale]
  );

  const handleSubmit = useCallback(
    (name?: string) => {
      const toSubmit = name || inputValue;
      if (!toSubmit.trim() || !gameState || gameState.phase !== "playing") return;

      const result = submitGuess(gameState, toSubmit.trim(), locale);
      setGameState(result.state);
      setFeedbackState(result.result);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      setTimeout(() => setFeedbackState(null), 600);
      if (inputRef.current) inputRef.current.focus();
    },
    [gameState, inputValue, locale]
  );

  const handleUseHint = useCallback(() => {
    if (!gameState || gameState.phase !== "playing") return;
    const result = useHint(gameState);
    setGameState(result.state);
    if (result.hintCode) {
      setHintFlash(result.hintCode);
      setTimeout(() => setHintFlash(null), 1500);
    }
    if (inputRef.current) inputRef.current.focus();
  }, [gameState]);

  const handleSkip = useCallback(() => {
    if (!gameState || gameState.phase !== "playing") return;
    setGameState(skipAnchor(gameState));
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    setFeedbackState(null);
    setHintFlash(null);
    if (inputRef.current) inputRef.current.focus();
  }, [gameState]);

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
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // ── Loading ──
  if (!gameState) {
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#94a3b8] text-lg animate-pulse">{t("common.loadingGame")}</div>
      </div>
    );
  }

  // ── Countdown ──
  if (gameState.phase === "countdown") {
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold">
            {t("borderBlitz.title")}
          </div>
          <motion.div
            key={gameState.countdownLeft}
            className="text-9xl font-black text-[#8b5cf6]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {gameState.countdownLeft}
          </motion.div>
          <div className="text-[#94a3b8]">{t("borderBlitz.getReady")}</div>
        </motion.div>
      </div>
    );
  }

  // ── Resolution ──
  if (gameState.phase === "resolution") {
    const stats = getBorderBlitzStats(gameState);
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center p-4">
        <motion.div
          className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-center space-y-1">
            <div className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold">
              {t("borderBlitz.title")}
            </div>
            <div className="text-sm text-[#475569]">
              {stats.allFound ? t("borderBlitz.allFound") : t("resolution.timeUp")}
            </div>
          </div>

          {/* Score */}
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <div className="text-6xl font-black tabular-nums text-[#8b5cf6]">{stats.score}</div>
            <div className="text-sm text-[#94a3b8] mt-1">
              {stats.found} / {stats.total} {t("borderBlitz.neighborsFound")}
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {stats.wrongAttempts > 0 && (
              <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#ef4444] tabular-nums">{stats.wrongAttempts}</div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("flags.wrong")}</div>
              </div>
            )}
            {stats.hintsUsed > 0 && (
              <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#f59e0b] tabular-nums">{stats.hintsUsed}</div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("borderBlitz.hintsLabel")}</div>
              </div>
            )}
            {stats.skipsUsed > 0 && (
              <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[#a855f7] tabular-nums">{stats.skipsUsed}</div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("borderBlitz.skipsLabel")}</div>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => {
                setFeedbackState(null);
                setHintFlash(null);
                setInputValue("");
                setGameState(createBorderBlitzGame(difficulty, continent));
              }}
              className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
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

  // ── Playing ──
  const totalNeighbors = getNeighborsForAnchor(gameState.anchorCode).length;
  const foundCount = gameState.foundNeighbors.length;
  const timerPct = (gameState.timeLeft / gameState.totalDuration) * 100;
  const skipEnabled = gameState.consecutiveWrongAttempts >= 2;

  const feedbackBorder =
    feedbackState === "correct"
      ? "border-[#22c55e]"
      : feedbackState === "wrong"
        ? "border-[#ef4444]"
        : "border-[#334155] focus-within:border-[#8b5cf6]";

  return (
    <div className="min-h-dvh bg-[#0a0e1a] flex flex-col">
      {/* Timer bar */}
      <div className="relative h-1 sm:h-1.5 bg-[#1e293b]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{
            width: `${timerPct}%`,
            backgroundColor: timerPct > 30 ? "#8b5cf6" : timerPct > 10 ? "#ef4444" : "#dc2626",
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
          <div className="text-lg font-bold text-[#f1f5f9] tabular-nums">{gameState.score}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold tabular-nums text-[#8b5cf6]">
            {foundCount} / {totalNeighbors}
          </div>
          <div
            className={`text-xl font-bold tabular-nums ${
              gameState.timeLeft <= 10 ? "text-[#ef4444] animate-pulse" : "text-[#f1f5f9]"
            }`}
          >
            {gameState.timeLeft}s
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Anchor country: name + silhouette */}
        <div className="flex flex-col items-center py-3 sm:py-4 px-4 gap-2">
          <div className="text-xs uppercase tracking-wider text-[#94a3b8] font-semibold">
            {t("borderBlitz.findNeighborsOf")}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#f1f5f9]">
            {countryName(gameState.anchorCode)}
          </div>
          <div className="w-32 h-24 sm:w-40 sm:h-28 shrink-0">
            <CountrySilhouette
              countryCode={gameState.anchorCode}
              size={160}
              className="w-full h-full max-h-[20dvh]"
            />
          </div>
        </div>

        {/* Hint flash banner */}
        <AnimatePresence>
          {hintFlash && (
            <motion.div
              className="mx-4 mb-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-2 text-sm text-[#f59e0b] text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {t("borderBlitz.hintRevealed")}{" "}
              <span className="font-bold">{countryName(hintFlash)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Found neighbors: grid of silhouettes */}
        {gameState.foundNeighbors.length > 0 && (
          <motion.div
            className="px-4 pb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-xs uppercase tracking-wider text-[#94a3b8] font-semibold mb-2">
              {t("borderBlitz.revealed")}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              <AnimatePresence mode="popLayout">
                {gameState.foundNeighbors.map((code) => {
                  const isHinted = gameState.hintedNeighbors.includes(code);
                  return (
                    <motion.div
                      key={code}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className={`w-14 h-12 sm:w-16 sm:h-14 rounded-lg overflow-hidden ${
                        isHinted ? "bg-[#f59e0b]/20 ring-1 ring-[#f59e0b]/40" : "bg-[#1e293b]"
                      }`}>
                        <CountrySilhouette
                          countryCode={code}
                          size={80}
                          className="w-full h-full"
                        />
                      </div>
                      <span className={`text-[10px] sm:text-xs mt-0.5 truncate max-w-full text-center ${
                        isHinted ? "text-[#f59e0b]" : "text-[#94a3b8]"
                      }`}>
                        {countryName(code)}
                        {isHinted && " 💡"}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Input area */}
        <div className="mt-auto bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-[#1e293b] px-3 py-2 sm:px-4 sm:py-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div
                  className={`flex items-center gap-2 bg-[#111827] border-2 rounded-xl px-3 py-2 sm:px-4 sm:py-3 transition-colors ${feedbackBorder}`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      filterSuggestions(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={t("borderBlitz.placeholder")}
                    className="flex-1 bg-transparent text-[#f1f5f9] text-lg outline-none placeholder:text-[#475569]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!inputValue.trim()}
                    className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-30 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {t("common.go")}
                  </button>
                </div>

                {/* Autocomplete dropdown */}
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

              {/* Hint button */}
              <button
                onClick={handleUseHint}
                className="shrink-0 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] px-3 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#f59e0b]/30"
                title={t("borderBlitz.hintTooltip")}
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </button>

              {/* Skip button (enabled after 2 consecutive wrong) */}
              <button
                onClick={handleSkip}
                disabled={!skipEnabled}
                className={`shrink-0 px-3 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  skipEnabled
                    ? "bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border-[#a855f7]/30"
                    : "bg-[#1e293b]/50 text-[#475569] border-[#1e293b] cursor-not-allowed"
                }`}
                title={
                  skipEnabled
                    ? t("borderBlitz.skipTooltip")
                    : `${t("borderBlitz.skipLocked")} (${gameState.consecutiveWrongAttempts}/2)`
                }
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
    </div>
  );
}
