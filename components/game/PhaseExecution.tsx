"use client";

import { motion } from "framer-motion";
import { CountryInput } from "./CountryInput";
import { Timer } from "./Timer";
import { MoveHistory } from "./MoveHistory";
import { ScoreDisplay } from "./ScoreDisplay";
import type { ConnectGameState } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface PhaseExecutionProps {
  gameState: ConnectGameState;
  feedbackState: "correct" | "wrong" | null;
  hintCountry: string | null;
  onSubmitMove: (input: string) => void;
  onUseHint: () => void;
  onSkip: () => void;
  onExecutionTick: () => void;
  onMoveTick: () => void;
}

export function PhaseExecution({
  gameState,
  feedbackState,
  hintCountry,
  onSubmitMove,
  onUseHint,
  onSkip,
  onExecutionTick,
  onMoveTick,
}: PhaseExecutionProps) {
  const { t, countryName } = useTranslation();
  const startName = countryName(gameState.startCountry);
  const endName = countryName(gameState.endCountry);
  const currentName = countryName(gameState.currentPosition);

  return (
    <>
      {/* Top bar: route info + timers — fixed at top */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-[#111827]/90 backdrop-blur-sm border-b border-[#1e293b]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#22c55e] font-semibold">{startName}</span>
          <span className="text-[#94a3b8]">→</span>
          <span className="text-[#ef4444] font-semibold">{endName}</span>
        </div>
        <div className="flex items-center gap-4">
          <Timer
            seconds={gameState.moveTimeLeft}
            maxSeconds={gameState.moveDuration}
            label={t("execution.move")}
            size="sm"
            onTick={onMoveTick}
            running={true}
          />
          <Timer
            seconds={gameState.executionTimeLeft}
            maxSeconds={gameState.executionDuration}
            label={t("execution.total")}
            size="sm"
            onTick={onExecutionTick}
            running={true}
          />
        </div>
      </motion.div>

      {/* Bottom panel — fixed at bottom */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a0e1a]/95 backdrop-blur-sm border-t border-[#1e293b]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-3xl mx-auto px-3 py-2 sm:px-4 sm:py-4 space-y-2 sm:space-y-3">
          {/* Current position */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#94a3b8]">
              {t("execution.currentlyAt")}{" "}
              <span className="text-[#3b82f6] font-semibold">{currentName}</span>
              <span className="text-[#475569] ml-2">
                {t("execution.reachNeighborOf")}{" "}
                <span className="text-[#ef4444]">{endName}</span> {t("execution.toWin")}
              </span>
            </div>
            <ScoreDisplay
              score={gameState.score}
              wrongAttempts={gameState.wrongAttempts}
              hintsUsed={gameState.hintsUsed}
            />
          </div>

          {/* Hint display */}
          {hintCountry && (
            <motion.div
              className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-2 text-sm text-[#f59e0b]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              {t("execution.hintTry")}{" "}
              <span className="font-bold">
                {countryName(hintCountry)}
              </span>
            </motion.div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2">
            <CountryInput
              onSubmit={onSubmitMove}
              currentPosition={gameState.currentPosition}
              feedbackState={feedbackState}
            />
            <button
              onClick={onUseHint}
              className="shrink-0 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] px-3 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#f59e0b]/30"
              title={t("execution.hintTooltip")}
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
            <button
              onClick={onSkip}
              disabled={gameState.consecutiveWrongAttempts < 2}
              className={`shrink-0 px-3 py-3 rounded-xl text-sm font-semibold transition-all border ${
                gameState.consecutiveWrongAttempts >= 2
                  ? "bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] border-[#a855f7]/30"
                  : "bg-[#1e293b]/50 text-[#475569] border-[#1e293b] cursor-not-allowed"
              }`}
              title={
                gameState.consecutiveWrongAttempts >= 2
                  ? t("execution.skipTooltip")
                  : `${t("execution.skipLocked")} (${gameState.consecutiveWrongAttempts}/2)`
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

          {/* Move history */}
          <MoveHistory
            moves={gameState.moves}
            startCountry={gameState.startCountry}
          />
        </div>
      </motion.div>
    </>
  );
}
