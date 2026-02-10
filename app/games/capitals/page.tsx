"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { CapitalClashGame } from "@/components/game/CapitalClashGame";
import type { Continent, Difficulty } from "@/lib/game-engine/types";

function CapitalClashPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const difficulty = (searchParams.get("difficulty") as Difficulty) || "medium";
  const continent = (searchParams.get("continent") as Continent) || "all";

  return (
    <CapitalClashGame
      difficulty={difficulty}
      continent={continent}
      onGoHome={() => router.push("/")}
    />
  );
}

export default function CapitalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
          <div className="text-[#94a3b8] text-lg animate-pulse">Loading...</div>
        </div>
      }
    >
      <CapitalClashPage />
    </Suspense>
  );
}
