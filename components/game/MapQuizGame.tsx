"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createMapQuizGame,
  startPlaying,
  submitClick,
  skipCountry,
  endGame,
  getMapQuizStats,
  getMultiplier,
} from "@/lib/game-engine/map-quiz";
import { WorldMap, type MapHighlight } from "@/components/map/WorldMap";
import type { MapQuizGameState, Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface MapQuizGameProps {
  difficulty: Difficulty;
  continent: Continent;
  onGoHome: () => void;
}

export function MapQuizGame({ difficulty, continent, onGoHome }: MapQuizGameProps) {
  const { t, countryName } = useTranslation();
  const [gameState, setGameState] = useState<MapQuizGameState | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  const [flashCode, setFlashCode] = useState<string | null>(null);
  const [flashColor, setFlashColor] = useState<string>("#22c55e");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGameState(createMapQuizGame(difficulty, continent));
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

  // Handle country click
  const handleCountryClick = useCallback(
    (code: string) => {
      if (!gameState || gameState.phase !== "playing") return;

      // Clear previous feedback
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

      const result = submitClick(gameState, code);
      setGameState(result.state);

      if (result.result === "correct") {
        setFeedbackState("correct");
        setFlashCode(code);
        setFlashColor("#22c55e");
      } else {
        setFeedbackState("wrong");
        setFlashCode(code);
        setFlashColor("#ef4444");
      }

      feedbackTimerRef.current = setTimeout(() => {
        setFeedbackState(null);
        setFlashCode(null);
      }, 800);
    },
    [gameState]
  );

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!gameState || gameState.phase !== "playing") return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setGameState(skipCountry(gameState));
    setFeedbackState(null);
    setFlashCode(null);
  }, [gameState]);

  // Build highlights for feedback flashes
  const highlights: MapHighlight[] = useMemo(() => {
    if (!flashCode) return [];
    return [{ code: flashCode, color: flashColor }];
  }, [flashCode, flashColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

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
            {t("mapQuiz.title")}
          </div>
          <motion.div
            key={gameState.countdownLeft}
            className="text-9xl font-black text-[#06b6d4]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {gameState.countdownLeft}
          </motion.div>
          <div className="text-[#94a3b8]">{t("mapQuiz.getReady")}</div>
        </motion.div>
      </div>
    );
  }

  // ── Resolution ──
  if (gameState.phase === "resolution") {
    const stats = getMapQuizStats(gameState);

    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex flex-col items-center justify-start p-4 overflow-auto">
        <motion.div
          className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 sm:p-6 max-w-xl w-full space-y-4 my-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold">
              {t("mapQuiz.title")}
            </div>
            <div className="text-sm text-[#475569]">
              {t("resolution.timeUp")}
            </div>
          </div>

          {/* Score */}
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            <div className="text-5xl font-black tabular-nums text-[#06b6d4]">{stats.score}</div>
            <div className="text-sm text-[#94a3b8] mt-1">
              {stats.correct} / {stats.total} {t("flags.correct").toLowerCase()}
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#22c55e] tabular-nums">{stats.correct}</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("flags.correct")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#ef4444] tabular-nums">{stats.wrong}</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("flags.wrong")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#f59e0b] tabular-nums">{stats.bestStreak}</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("flags.bestStreak")}</div>
            </div>
            <div className="bg-[#0a0e1a] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#8b5cf6] tabular-nums">{stats.accuracy}%</div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{t("flags.accuracy")}</div>
            </div>
          </motion.div>

          {/* Answer review (scrollable) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="text-xs text-[#94a3b8] font-semibold mb-2 uppercase tracking-wider">
              {t("flags.answers")}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {gameState.attempts.map((attempt, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${attempt.correct
                    ? "bg-[#22c55e]/10 text-[#22c55e]"
                    : "bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                >
                  <span className="font-medium">
                    {countryName(attempt.targetCode)}
                  </span>
                  <span className="text-xs opacity-70">
                    {attempt.correct
                      ? `${(attempt.timeMs / 1000).toFixed(1)}s`
                      : attempt.clickedCode
                        ? countryName(attempt.clickedCode)
                        : t("mapQuiz.skipped")}
                  </span>
                </div>
              ))}
            </div>
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
                setFlashCode(null);
                setGameState(createMapQuizGame(difficulty, continent));
              }}
              className="flex-1 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
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
  const currentTarget = gameState.countryQueue[gameState.currentIndex];
  const timerPct = (gameState.timeLeft / gameState.totalDuration) * 100;
  const multiplier = getMultiplier(gameState);
  const answeredCount = gameState.attempts.length;
  const correctCount = gameState.attempts.filter((a) => a.correct).length;

  const feedbackBg =
    feedbackState === "correct"
      ? "bg-[#22c55e]/20 border-[#22c55e]"
      : feedbackState === "wrong"
        ? "bg-[#ef4444]/20 border-[#ef4444]"
        : "bg-[#111827] border-[#334155]";

  return (
    <div className="min-h-dvh bg-[#0a0e1a] flex flex-col">
      {/* Timer bar */}
      <div className="relative h-1 sm:h-1.5 bg-[#1e293b]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{
            width: `${timerPct}%`,
            backgroundColor: timerPct > 30 ? "#06b6d4" : timerPct > 10 ? "#ef4444" : "#dc2626",
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
          {multiplier > 1 && (
            <span className="text-xs font-bold text-[#f59e0b] bg-[#f59e0b]/20 px-1.5 py-0.5 rounded">
              x{multiplier}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-[#94a3b8] tabular-nums">
            {correctCount}/{answeredCount}
          </div>
          {gameState.streak >= 2 && (
            <span className="text-xs font-bold text-[#22c55e] bg-[#22c55e]/20 px-1.5 py-0.5 rounded">
              {gameState.streak} streak
            </span>
          )}
          <div
            className={`text-xl font-bold tabular-nums ${gameState.timeLeft <= 10 ? "text-[#ef4444] animate-pulse" : "text-[#f1f5f9]"
              }`}
          >
            {gameState.timeLeft}s
          </div>
        </div>
      </div>

      {/* Target country prompt */}
      <div className="px-4 pt-3 pb-2 sm:pt-4 sm:pb-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTarget}
            className={`rounded-xl border-2 px-4 py-3 sm:px-6 sm:py-4 text-center transition-colors ${feedbackBg}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs uppercase tracking-wider text-[#94a3b8] font-semibold mb-1">
              {t("mapQuiz.find")}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#f1f5f9]">
              {countryName(currentTarget)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Map */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 min-h-0">
        <div className="w-full max-w-4xl">
          <WorldMap
            highlights={highlights}
            onCountryClick={handleCountryClick}
            zoomContinent={continent !== "all" ? continent : undefined}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-[#1e293b] px-3 py-2 sm:px-4 sm:py-3">
        <div className="max-w-md mx-auto flex justify-center">
          <button
            onClick={handleSkip}
            className="bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors border border-[#334155]"
          >
            {t("mapQuiz.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
