"use client";

import type { GameMove } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface MoveHistoryProps {
  moves: GameMove[];
  startCountry: string;
}

export function MoveHistory({ moves, startCountry }: MoveHistoryProps) {
  const { t, countryName } = useTranslation();

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1e293b] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#1e293b]">
        <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
          {t("history.title")}
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {/* Start country */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e293b]/50">
          <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-xs font-bold text-[#22c55e]">
            S
          </div>
          <span className="text-sm text-[#f1f5f9]">{countryName(startCountry)}</span>
        </div>

        {/* Moves */}
        {moves.map((move, i) => (
          <div
            key={`${move.countryCode}-${i}`}
            className={`flex items-center gap-3 px-4 py-2 border-b border-[#1e293b]/50 animate-slide-up ${
              move.result !== "correct" ? "opacity-60" : ""
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                move.result === "correct"
                  ? "bg-[#3b82f6]/20 text-[#3b82f6]"
                  : "bg-[#ef4444]/20 text-[#ef4444]"
              }`}
            >
              {move.result === "correct" ? i + 1 : "✕"}
            </div>
            <span
              className={`text-sm ${
                move.result === "correct" ? "text-[#f1f5f9]" : "text-[#ef4444] line-through"
              }`}
            >
              {countryName(move.countryCode)}
            </span>
            {move.result === "not_neighbor" && (
              <span className="text-xs text-[#ef4444]/70 ml-auto">{t("history.notNeighbor")}</span>
            )}
            {move.result === "already_visited" && (
              <span className="text-xs text-[#ef4444]/70 ml-auto">{t("history.alreadyVisited")}</span>
            )}
          </div>
        ))}

        {moves.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[#475569]">
            {t("history.startTyping")}
          </div>
        )}
      </div>
    </div>
  );
}
