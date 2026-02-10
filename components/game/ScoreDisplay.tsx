"use client";

import { useTranslation } from "@/lib/i18n/context";

interface ScoreDisplayProps {
  score: number;
  wrongAttempts: number;
  hintsUsed: number;
}

export function ScoreDisplay({
  score,
  wrongAttempts,
  hintsUsed,
}: ScoreDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1e293b] px-4 py-3">
      <div className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">{t("score.label")}</div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-[#f1f5f9]">{score}</span>
        <div className="flex gap-2 text-xs">
          {wrongAttempts > 0 && (
            <span className="text-[#ef4444]">+{wrongAttempts * 3} {t("score.penalty")}</span>
          )}
          {hintsUsed > 0 && (
            <span className="text-[#f59e0b]">+{hintsUsed * 2} {t("score.hints")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
