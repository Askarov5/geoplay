"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface PhaseRevealProps {
  startCountry: string;
  endCountry: string;
  timeLeft: number;
  difficulty: string;
  onGoHome?: () => void;
}

export function PhaseReveal({
  startCountry,
  endCountry,
  timeLeft,
  difficulty,
  onGoHome,
}: PhaseRevealProps) {
  const { t, countryName } = useTranslation();
  const startName = countryName(startCountry);
  const endName = countryName(endCountry);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="text-center space-y-6">
        <motion.div
          className="text-sm uppercase tracking-[0.3em] text-[#94a3b8] font-semibold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {difficulty} {t("reveal.mode")}
        </motion.div>

        <div className="flex items-center gap-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-3xl md:text-5xl font-bold text-[#22c55e]">
              {startName}
            </div>
            <div className="text-xs text-[#94a3b8] mt-1 uppercase tracking-wider">{t("reveal.start")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path
                d="M0 12H44M44 12L34 4M44 12L34 20"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-3xl md:text-5xl font-bold text-[#ef4444]">
              {endName}
            </div>
            <div className="text-xs text-[#94a3b8] mt-1 uppercase tracking-wider">{t("reveal.end")}</div>
          </motion.div>
        </div>

        <motion.div
          className="text-7xl font-bold tabular-nums"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            color:
              timeLeft > 3
                ? "#f1f5f9"
                : timeLeft > 1
                  ? "#f59e0b"
                  : "#ef4444",
          }}
        >
          {Math.ceil(timeLeft)}
        </motion.div>

        <motion.div
          className="text-sm text-[#94a3b8]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {t("reveal.planRoute")}
        </motion.div>
      </div>
    </motion.div>
  );
}
