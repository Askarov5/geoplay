"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  available: boolean;
  difficultyInfo?: string;
  onClick?: () => void;
}

export function GameCard({
  title,
  description,
  icon,
  accentColor,
  available,
  difficultyInfo,
  onClick,
}: GameCardProps) {
  const { t } = useTranslation();

  return (
    <motion.button
      onClick={available ? onClick : undefined}
      className={`relative w-full text-left bg-[#111827] border rounded-2xl p-6 transition-all group ${
        available
          ? "border-[#1e293b] hover:border-[var(--accent)] cursor-pointer"
          : "border-[#1e293b]/50 opacity-50 cursor-not-allowed"
      }`}
      style={{ "--accent": accentColor } as React.CSSProperties}
      whileHover={available ? { scale: 1.02, y: -2 } : undefined}
      whileTap={available ? { scale: 0.98 } : undefined}
    >
      {/* Accent glow */}
      {available && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"
          style={{ background: `radial-gradient(ellipse at top, ${accentColor}, transparent 70%)` }}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#f1f5f9]">{title}</h3>
            {!available && (
              <span className="text-xs bg-[#1e293b] text-[#64748b] px-2 py-0.5 rounded-full">
                {t("common.comingSoon")}
              </span>
            )}
          </div>
          <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">{description}</p>
          {difficultyInfo && available && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {difficultyInfo}
            </div>
          )}
        </div>

        {available && (
          <div className="shrink-0 text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors mt-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  );
}
