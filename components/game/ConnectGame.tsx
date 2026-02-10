"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { WorldMap } from "@/components/map/WorldMap";
import { PhaseReveal } from "./PhaseReveal";
import { PhaseExecution } from "./PhaseExecution";
import { PhaseResolution } from "./PhaseResolution";
import {
  createGame,
  startExecution,
  submitMove,
  useHint,
  handleTimeout,
  handleMoveTimeout,
} from "@/lib/game-engine/connect";
import type { ConnectGameState, Continent, Difficulty } from "@/lib/game-engine/types";
import { useTranslation } from "@/lib/i18n/context";

interface ConnectGameProps {
  difficulty: Difficulty;
  continent: Continent;
  onGoHome: () => void;
}

export function ConnectGame({ difficulty, continent, onGoHome }: ConnectGameProps) {
  const { t, locale } = useTranslation();
  const [gameState, setGameState] = useState<ConnectGameState | null>(null);
  const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [hintCountry, setHintCountry] = useState<string | null>(null);

  // Create game only on the client (avoids hydration mismatch from Math.random)
  useEffect(() => {
    setGameState(createGame(difficulty, continent));
  }, [difficulty, continent]);

  // Reveal phase timer
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gameState?.phase === "reveal") {
      revealTimerRef.current = setInterval(() => {
        setGameState((prev) => {
          if (!prev) return prev;
          const newTime = prev.revealTimeLeft - 1;
          if (newTime <= 0) {
            if (revealTimerRef.current) clearInterval(revealTimerRef.current);
            return startExecution(prev);
          }
          return { ...prev, revealTimeLeft: newTime };
        });
      }, 1000);

      return () => {
        if (revealTimerRef.current) clearInterval(revealTimerRef.current);
      };
    }
  }, [gameState?.phase]);

  // Handle submitting a move
  const handleSubmitMove = useCallback(
    (input: string) => {
      if (!gameState) return;
      const result = submitMove(gameState, input, locale);

      if (result.result === "correct") {
        setFeedbackState("correct");
        setHintCountry(null);
      } else if (result.result === "destination_country") {
        // Player tried to type the destination — not an error, just ignored
        setFeedbackState("wrong");
      } else if (
        result.result === "not_neighbor" ||
        result.result === "already_visited"
      ) {
        setFeedbackState("wrong");
        setWrongFlash(input);
        setTimeout(() => setWrongFlash(null), 500);
      } else {
        // invalid_country
        setFeedbackState("wrong");
      }

      setGameState(result.state);

      // Reset feedback after animation
      setTimeout(() => setFeedbackState(null), 600);
    },
    [gameState, locale]
  );

  // Handle hint
  const handleUseHint = useCallback(() => {
    if (!gameState) return;
    const result = useHint(gameState);
    setGameState(result.state);
    setHintCountry(result.hintCountry);
  }, [gameState]);

  // Handle execution timer tick
  const handleExecutionTick = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.phase !== "execution") return prev;
      const newTime = prev.executionTimeLeft - 1;
      if (newTime <= 0) {
        return handleTimeout(prev);
      }
      return { ...prev, executionTimeLeft: newTime };
    });
  }, []);

  // Handle per-move timer tick
  const handleMoveTick = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.phase !== "execution") return prev;
      const newTime = prev.moveTimeLeft - 1;
      if (newTime <= 0) {
        return handleMoveTimeout(prev);
      }
      return { ...prev, moveTimeLeft: newTime };
    });
  }, []);

  // Skip — generate a new game (same settings)
  const handleSkip = useCallback(() => {
    setGameState(createGame(difficulty, continent));
    setFeedbackState(null);
    setWrongFlash(null);
    setHintCountry(null);
  }, [difficulty, continent]);

  // Play again
  const handlePlayAgain = useCallback(() => {
    setGameState(createGame(difficulty, continent));
    setFeedbackState(null);
    setWrongFlash(null);
    setHintCountry(null);
  }, [difficulty, continent]);

  // Loading state while game initializes on client
  if (!gameState) {
    return (
      <div className="relative w-full h-dvh overflow-hidden bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#94a3b8] text-lg animate-pulse">
          {t("common.generatingRoute")}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-[#0a0e1a]">
      {/* World Map (always visible as background) */}
      <div className="absolute inset-0 pointer-events-none">
        <WorldMap
          startCountry={gameState.startCountry}
          endCountry={gameState.endCountry}
          playerPath={gameState.playerPath}
          optimalPath={gameState.optimalPath}
          showOptimalPath={gameState.phase === "resolution"}
          wrongFlash={wrongFlash}
          className="w-full h-full"
        />
      </div>

      {/* Phase overlays */}
      <AnimatePresence>
        {gameState.phase === "reveal" && (
          <PhaseReveal
            key="reveal"
            startCountry={gameState.startCountry}
            endCountry={gameState.endCountry}
            timeLeft={gameState.revealTimeLeft}
            difficulty={gameState.difficulty}
            onGoHome={onGoHome}
          />
        )}
      </AnimatePresence>

      {gameState.phase === "execution" && (
        <PhaseExecution
          gameState={gameState}
          feedbackState={feedbackState}
          hintCountry={hintCountry}
          onSubmitMove={handleSubmitMove}
          onUseHint={handleUseHint}
          onSkip={handleSkip}
          onExecutionTick={handleExecutionTick}
          onMoveTick={handleMoveTick}
          onGoHome={onGoHome}
        />
      )}

      <AnimatePresence>
        {gameState.phase === "resolution" && (
          <PhaseResolution
            key="resolution"
            gameState={gameState}
            onPlayAgain={handlePlayAgain}
            onGoHome={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
