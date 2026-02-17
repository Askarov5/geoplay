"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { MapQuizGame } from "@/components/game/MapQuizGame";
import type { Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

function MapQuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "medium";
  const continent = (searchParams.get("continent") as Continent) || "all";

  return (
    <MapQuizGame
      difficulty={difficulty}
      continent={continent}
      onGoHome={() => router.push("/")}
    />
  );
}

export default function MapQuizRoute() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#0a0e1a] flex items-center justify-center">
          <div className="text-[#94a3b8] text-lg animate-pulse">{t("common.loadingGame")}</div>
        </div>
      }
    >
      <MapQuizPage />
    </Suspense>
  );
}
