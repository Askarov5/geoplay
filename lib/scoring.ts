import type { ConnectGameState } from "./game-engine/types";

/** Scoring constants */
export const SCORE_CORRECT_MOVE = 1;
export const SCORE_WRONG_MOVE = 3;
export const SCORE_HINT_USED = 2;
export const SCORE_TIMEOUT = 5;

/**
 * Calculate the current score from game state.
 * Lower is better.
 */
export function calculateScore(state: ConnectGameState): number {
  const moveCost = state.playerPath.length > 0 ? state.playerPath.length - 1 : 0; // exclude start
  const wrongPenalty = state.wrongAttempts * SCORE_WRONG_MOVE;
  const hintPenalty = state.hintsUsed * SCORE_HINT_USED;
  const timeoutPenalty = state.isTimeout ? SCORE_TIMEOUT : 0;

  return moveCost + wrongPenalty + hintPenalty + timeoutPenalty;
}

/**
 * Calculate the score breakdown for display.
 */
export function getScoreBreakdown(state: ConnectGameState) {
  const moveCost = state.playerPath.length > 0 ? state.playerPath.length - 1 : 0;
  const wrongPenalty = state.wrongAttempts * SCORE_WRONG_MOVE;
  const hintPenalty = state.hintsUsed * SCORE_HINT_USED;
  const timeoutPenalty = state.isTimeout ? SCORE_TIMEOUT : 0;
  const total = moveCost + wrongPenalty + hintPenalty + timeoutPenalty;

  // Optimal moves = path length minus start and end (player types neither)
  const optimalMoves = Math.max(state.optimalPath.length - 2, 0);

  return {
    moves: moveCost,
    wrongPenalty,
    hintPenalty,
    timeoutPenalty,
    total,
    optimalMoves,
    efficiency:
      optimalMoves > 0
        ? Math.round((optimalMoves / Math.max(total, 1)) * 100)
        : 100,
  };
}

/**
 * Get a rating based on score vs optimal.
 */
export function getRating(
  score: number,
  optimalMoves: number
): { label: string; color: string } {
  const ratio = score / Math.max(optimalMoves, 1);

  if (ratio <= 1) return { label: "PERFECT", color: "#f59e0b" };
  if (ratio <= 1.5) return { label: "GREAT", color: "#22c55e" };
  if (ratio <= 2.5) return { label: "GOOD", color: "#3b82f6" };
  if (ratio <= 4) return { label: "OK", color: "#94a3b8" };
  return { label: "KEEP TRYING", color: "#ef4444" };
}
