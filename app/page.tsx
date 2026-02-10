"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GameCard } from "@/components/ui/GameCard";
import type { Continent, Difficulty } from "@/lib/game-engine/types";
import { CONTINENTS, DIFFICULTY_CONFIGS } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/types";
import type { Locale, Translations } from "@/lib/i18n/types";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

const difficultyKeys: Record<Difficulty, { label: keyof Translations; desc: keyof Translations }> = {
  easy: { label: "difficulty.easy", desc: "difficulty.easyDesc" },
  medium: { label: "difficulty.medium", desc: "difficulty.mediumDesc" },
  hard: { label: "difficulty.hard", desc: "difficulty.hardDesc" },
};

const continentKeys: Record<string, keyof Translations> = {
  all: "continent.all",
  Europe: "continent.europe",
  Asia: "continent.asia",
  Africa: "continent.africa",
  "North America": "continent.northAmerica",
  "South America": "continent.southAmerica",
};

export default function HomePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [selectedContinent, setSelectedContinent] = useState<Continent>("all");

  const handleGameSelect = (path: string) => {
    const params = new URLSearchParams();
    params.set("difficulty", selectedDifficulty);
    params.set("continent", selectedContinent);
    router.push(`${path}?${params.toString()}`);
  };

  const gameModes = [
    {
      id: "connect",
      title: t("home.connectTitle"),
      description: t("home.connectDesc"),
      icon: "🔗",
      accentColor: "#3b82f6",
      available: true,
      path: "/games/connect",
    },
    {
      id: "silhouette",
      title: t("home.silhouetteTitle"),
      description: t("home.silhouetteDesc"),
      icon: "🗺️",
      accentColor: "#a855f7",
      available: true,
      path: "/games/silhouette",
    },
    {
      id: "flags",
      title: t("home.flagsTitle"),
      description: t("home.flagsDesc"),
      icon: "🏁",
      accentColor: "#22c55e",
      available: true,
      path: "/games/flags",
    },
    {
      id: "capitals",
      title: t("home.capitalsTitle"),
      description: t("home.capitalsDesc"),
      icon: "⚡",
      accentColor: "#f59e0b",
      available: false,
      path: "/games/capitals",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Language picker */}
      <div className="flex justify-end px-4 pt-4">
        <div className="flex gap-1 bg-[#111827] border border-[#1e293b] rounded-lg p-1">
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              onClick={() => setLocale(loc.code)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                locale === loc.code
                  ? "bg-[#3b82f6] text-white"
                  : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
              title={loc.nativeName}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header className="pt-10 pb-8 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="text-[#f1f5f9]">GEO</span>
            <span className="text-[#3b82f6]">PLAY</span>
          </h1>
          <p className="text-[#94a3b8] mt-3 text-lg max-w-md mx-auto">
            {t("home.subtitle")}
          </p>
        </motion.div>
      </header>

      {/* Difficulty selector */}
      <motion.div
        className="px-4 pb-6 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="inline-flex bg-[#111827] border border-[#1e293b] rounded-xl p-1">
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20"
                    : "text-[#94a3b8] hover:text-[#f1f5f9]"
                }`}
              >
                <div>{t(difficultyKeys[diff].label)}</div>
                <div className={`text-xs mt-0.5 ${isSelected ? "text-blue-200" : "text-[#64748b]"}`}>
                  {t(difficultyKeys[diff].desc)}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Continent selector */}
      <motion.div
        className="px-4 pb-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {CONTINENTS.map((cont) => {
            const isSelected = selectedContinent === cont.id;
            return (
              <button
                key={cont.id}
                onClick={() => setSelectedContinent(cont.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                  isSelected
                    ? "bg-[#1e293b] border-[#3b82f6] text-[#f1f5f9] shadow-lg shadow-[#3b82f6]/10"
                    : "bg-[#111827] border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#334155]"
                }`}
              >
                <span className="mr-1.5">{cont.emoji}</span>
                {t(continentKeys[cont.id] || "continent.all")}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Game modes */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-xl mx-auto space-y-3">
          {gameModes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <GameCard
                title={mode.title}
                description={mode.description}
                icon={mode.icon}
                accentColor={mode.accentColor}
                available={mode.available}
                onClick={() => handleGameSelect(mode.path)}
              />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#475569]">
        <p>{t("home.footer")}</p>
      </footer>
    </div>
  );
}
