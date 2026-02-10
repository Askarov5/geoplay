"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CountrySilhouette } from "@/components/map/CountrySilhouette";
import { CountryInput } from "./CountryInput";
import {
  createSilhouetteGame,
  submitGuess,
  revealHint,
  skipRound,
  handleRoundTimeout,
  nextRound,
  getSilhouetteStats,
} from "@/lib/game-engine/silhouette";
import type { SilhouetteGameState, Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/types";

interface SilhouetteGameProps {
  difficulty: Difficulty;
  continent: Continent;
  onGoHome: () => void;
}

const hintTypeLabels: Record<string, keyof Translations> = {
  continent: "silhouette.hintContinent",
  firstLetter: "silhouette.hintFirstLetter",
  capital: "silhouette.hintCapital",
  neighbors: "silhouette.hintNeighbors",
};

export function SilhouetteGame({ difficulty, continent, onGoHome }: SilhouetteGameProps) {
  const { t, countryName, capitalName, locale } = useTranslation();
  const [gameState, setGameState] = useState<SilhouetteGameState | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create game on mount (client only)
  useEffect(() => {
    setGameState(createSilhouetteGame(difficulty, continent));
  }, [difficulty, continent]);

  // Round timer
  useEffect(() => {
    if (gameState?.phase === "playing") {
      timerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (!prev || prev.phase !== "playing") return prev;
          const newTime = prev.timeLeft - 1;
          if (newTime <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return handleRoundTimeout(prev);
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState?.phase, gameState?.currentRound]);

  const handleGuess = useCallback(
    (input: string) => {
      if (!gameState || gameState.phase !== "playing") return;
      const result = submitGuess(gameState, input, locale);

      if (result.result === "correct") {
        setFeedbackState("correct");
      } else if (result.result === "wrong") {
        setFeedbackState("wrong");
        setTimeout(() => setFeedbackState(null), 600);
      }
      // "invalid" — no feedback, input just isn't a valid country

      setGameState(result.state);
      if (result.result === "correct") {
        setTimeout(() => setFeedbackState(null), 600);
      }
    },
    [gameState, locale]
  );

  const handleRevealHint = useCallback(() => {
    if (!gameState) return;
    setGameState(revealHint(gameState));
  }, [gameState]);

  const handleSkip = useCallback(() => {
    if (!gameState) return;
    setGameState(skipRound(gameState));
  }, [gameState]);

  const handleNext = useCallback(() => {
    if (!gameState) return;
    setFeedbackState(null);
    setGameState(nextRound(gameState));
  }, [gameState]);

  const handlePlayAgain = useCallback(() => {
    setFeedbackState(null);
    setGameState(createSilhouetteGame(difficulty, continent));
  }, [difficulty, continent]);

  // Loading
  if (!gameState) {
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#94a3b8] text-lg animate-pulse">{t("common.loadingGame")}</div>
      </div>
    );
  }

  const currentRound = gameState.rounds[gameState.currentRound];

  // ─── Resolution Screen ───
  if (gameState.phase === "resolution") {
    const stats = getSilhouetteStats(gameState);
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center p-4">
        <motion.div
          className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 max-w-lg w-full space-y-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <motion.div
              className="text-5xl font-black"
              style={{
                color:
                  stats.percentage >= 80
                    ? "#f59e0b"
                    : stats.percentage >= 60
                      ? "#22c55e"
                      : stats.percentage >= 40
                        ? "#3b82f6"
                        : "#ef4444",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              {stats.percentage}%
            </motion.div>
            <div className="text-sm text-[#94a3b8]">{t("silhouette.finalScore")}</div>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-6xl font-bold tabular-nums text-[#f1f5f9]">
              {stats.totalScore}
            </div>
            <div className="text-sm text-[#94a3b8] mt-1">
              / {stats.maxPossible} {t("silhouette.points")}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 bg-[#0a0e1a] rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("silhouette.roundsSolved")}</span>
              <span className="text-[#22c55e] font-semibold">
                {stats.solved} / {stats.totalRounds}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("silhouette.roundsSkipped")}</span>
              <span className="text-[#f59e0b] font-semibold">{stats.skipped}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("silhouette.hintsUsed")}</span>
              <span className="text-[#f59e0b] font-semibold">{stats.totalHints}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("silhouette.wrongGuesses")}</span>
              <span className="text-[#ef4444] font-semibold">{stats.totalWrong}</span>
            </div>
          </div>

          {/* Round-by-round mini review */}
          <div className="space-y-1">
            <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold mb-2">
              {t("silhouette.roundReview")}
            </div>
            <div className="flex flex-wrap gap-2">
              {gameState.rounds.map((round, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    round.solved
                      ? "bg-[#22c55e]/15 text-[#22c55e]"
                      : "bg-[#ef4444]/15 text-[#ef4444]"
                  }`}
                >
                  <span>{countryName(round.countryCode)}</span>
                  <span className="opacity-60">
                    {round.solved ? `+${round.points}` : "✕"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
            >
              {t("common.playAgain")}
            </button>
            <button
              onClick={onGoHome}
              className="bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {t("common.home")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Round Result Screen ───
  if (gameState.phase === "roundResult") {
    const wasCorrect = currentRound.solved;
    return (
      <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center p-4">
        <motion.div
          className="text-center space-y-6 max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Silhouette (revealed) */}
          <div className="flex justify-center">
            <CountrySilhouette
              countryCode={currentRound.countryCode}
              revealed={wasCorrect}
              wrong={!wasCorrect}
              size={200}
            />
          </div>

          {/* Country name */}
          <div>
            <div
              className={`text-3xl font-black ${
                wasCorrect ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {countryName(currentRound.countryCode)}
            </div>
            {wasCorrect ? (
              <div className="text-[#22c55e]/70 text-sm mt-1">
                +{currentRound.points} {t("silhouette.points")}
              </div>
            ) : (
              <div className="text-[#ef4444]/70 text-sm mt-1">
                {currentRound.skipped ? t("silhouette.skippedLabel") : t("silhouette.timeUpLabel")}
              </div>
            )}
          </div>

          {/* Round progress */}
          <div className="text-sm text-[#94a3b8]">
            {t("silhouette.round")} {gameState.currentRound + 1} / {gameState.totalRounds}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors"
          >
            {gameState.currentRound + 1 < gameState.totalRounds
              ? t("silhouette.nextRound")
              : t("silhouette.seeResults")}
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Playing Screen ───
  const hintsLeft =
    currentRound.hintsAvailable.length - currentRound.hintsRevealed.length;

  return (
    <div className="min-h-dvh bg-[#0a0e1a] flex flex-col">
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
          <div className="text-sm text-[#94a3b8]">
            {t("silhouette.round")} <span className="text-[#f1f5f9] font-semibold">{gameState.currentRound + 1}</span> / {gameState.totalRounds}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-sm">
            <span className="text-[#94a3b8]">{t("score.label")}: </span>
            <span className="text-[#f1f5f9] font-bold tabular-nums">{gameState.totalScore}</span>
          </div>

          {/* Timer */}
          <div
            className={`text-2xl font-bold tabular-nums ${
              gameState.timeLeft <= 5 ? "text-[#ef4444] animate-pulse" : "text-[#f1f5f9]"
            }`}
          >
            {gameState.timeLeft}s
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-6 gap-3 sm:gap-6 overflow-hidden">
        {/* Silhouette — responsive size */}
        <motion.div
          key={gameState.currentRound}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-h-[35dvh] flex items-center justify-center"
        >
          <CountrySilhouette
            countryCode={currentRound.countryCode}
            wrong={feedbackState === "wrong"}
            size={280}
            className="max-h-[35dvh] w-auto"
          />
        </motion.div>

        {/* Hints */}
        <AnimatePresence mode="popLayout">
          {currentRound.hintsRevealed.length > 0 && (
            <motion.div
              className="flex flex-wrap justify-center gap-2 max-w-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {currentRound.hintsRevealed.map((hint, i) => (
                <motion.div
                  key={hint.type}
                  className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-1.5 text-sm text-[#f59e0b]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="opacity-70">{t(hintTypeLabels[hint.type])}: </span>
                  <span className="font-semibold">
                    {hint.type === "capital"
                      ? capitalName(hint.value)
                      : hint.type === "neighbors"
                        ? hint.value.split(",").map((c) => countryName(c)).join(", ")
                        : hint.value}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wrong guesses */}
        {currentRound.guesses.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {currentRound.guesses.map((code) => (
              <span
                key={code}
                className="text-xs bg-[#ef4444]/10 text-[#ef4444] px-2 py-0.5 rounded-full line-through"
              >
                {countryName(code)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom input area */}
      <div className="bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-[#1e293b] px-3 py-2 sm:px-4 sm:py-4">
        <div className="max-w-md mx-auto space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <CountryInput
              onSubmit={handleGuess}
              currentPosition=""
              feedbackState={feedbackState}
            />
            {/* Hint button */}
            <button
              onClick={handleRevealHint}
              disabled={hintsLeft === 0}
              className={`shrink-0 px-3 py-3 rounded-xl text-sm font-semibold transition-all border ${
                hintsLeft > 0
                  ? "bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] border-[#f59e0b]/30"
                  : "bg-[#1e293b]/50 text-[#475569] border-[#1e293b] cursor-not-allowed"
              }`}
              title={t("silhouette.getHint")}
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
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="shrink-0 px-3 py-3 rounded-xl text-sm font-semibold transition-all border bg-[#1e293b]/50 hover:bg-[#1e293b] text-[#94a3b8] border-[#1e293b] hover:text-[#f1f5f9]"
              title={t("silhouette.skip")}
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
