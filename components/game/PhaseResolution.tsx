"use client";

import { motion } from "framer-motion";
import { getScoreBreakdown, getRating } from "@/lib/scoring";
import type { ConnectGameState } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/types";

interface PhaseResolutionProps {
  gameState: ConnectGameState;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const ratingKeys: Record<string, keyof Translations> = {
  PERFECT: "rating.perfect",
  GREAT: "rating.great",
  GOOD: "rating.good",
  OK: "rating.ok",
  "KEEP TRYING": "rating.keepTrying",
};

export function PhaseResolution({
  gameState,
  onPlayAgain,
  onGoHome,
}: PhaseResolutionProps) {
  const { t, countryName } = useTranslation();
  const breakdown = getScoreBreakdown(gameState);
  const rating = getRating(breakdown.total, breakdown.optimalMoves);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0e1a]/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 max-w-lg w-full mx-4 space-y-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          {gameState.isComplete ? (
            <motion.div
              className="text-5xl font-black"
              style={{ color: rating.color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            >
              {t(ratingKeys[rating.label] || "rating.ok")}
            </motion.div>
          ) : (
            <div className="text-4xl font-black text-[#ef4444]">{t("resolution.timeUp")}</div>
          )}
          <div className="text-sm text-[#94a3b8]">
            {countryName(gameState.startCountry)} →{" "}
            {countryName(gameState.endCountry)}
          </div>
        </div>

        {/* Score */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-6xl font-bold tabular-nums text-[#f1f5f9]">
            {breakdown.total}
          </div>
          <div className="text-sm text-[#94a3b8] mt-1">{t("resolution.totalScore")} ({t("resolution.lowerIsBetter")})</div>
        </motion.div>

        {/* Breakdown */}
        <motion.div
          className="space-y-2 bg-[#0a0e1a] rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-[#94a3b8]">{t("resolution.movesTaken")}</span>
            <span className="text-[#f1f5f9] font-semibold">{breakdown.moves}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#94a3b8]">{t("resolution.optimalPath")}</span>
            <span className="text-[#f59e0b] font-semibold">{breakdown.optimalMoves}</span>
          </div>
          {breakdown.wrongPenalty > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("resolution.wrongPenalty")}</span>
              <span className="text-[#ef4444] font-semibold">+{breakdown.wrongPenalty}</span>
            </div>
          )}
          {breakdown.hintPenalty > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("resolution.hintsPenalty")}</span>
              <span className="text-[#f59e0b] font-semibold">+{breakdown.hintPenalty}</span>
            </div>
          )}
          {breakdown.timeoutPenalty > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">{t("resolution.timeoutPenalty")}</span>
              <span className="text-[#ef4444] font-semibold">+{breakdown.timeoutPenalty}</span>
            </div>
          )}
          <div className="border-t border-[#1e293b] pt-2 flex justify-between text-sm">
            <span className="text-[#94a3b8]">{t("resolution.efficiency")}</span>
            <span className="text-[#f1f5f9] font-semibold">{breakdown.efficiency}%</span>
          </div>
        </motion.div>

        {/* Optimal path */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
            {t("resolution.optimalPath")} ({Math.max(gameState.optimalPath.length - 2, 0)} {t("resolution.moves")})
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {gameState.optimalPath.map((code, i) => (
              <span key={code} className="flex items-center gap-1">
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    i === 0
                      ? "bg-[#22c55e]/20 text-[#22c55e]"
                      : i === gameState.optimalPath.length - 1
                        ? "bg-[#ef4444]/20 text-[#ef4444]"
                        : "bg-[#f59e0b]/20 text-[#f59e0b]"
                  }`}
                >
                  {countryName(code)}
                </span>
                {i < gameState.optimalPath.length - 1 && (
                  <span className="text-[#475569]">→</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-6 rounded-xl text-lg transition-colors"
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
    </motion.div>
  );
}
