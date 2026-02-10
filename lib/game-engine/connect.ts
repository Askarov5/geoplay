import { countryByCode, resolveCountryCode } from "@/data/countries";
import {
  findShortestPath,
  isValidNeighbor,
  getRandomConnectedCountry,
  countriesAtDistance,
} from "@/lib/graph";
import { calculateScore } from "@/lib/scoring";
import type {
  ConnectGameState,
  Continent,
  Difficulty,
  GameMove,
  MoveResult,
} from "./types";
import { DIFFICULTY_CONFIGS as CONFIGS } from "./types";

/**
 * Create a new Connect Countries game.
 * Picks a valid start/end pair at the target difficulty distance.
 * Optionally constrained to a specific continent.
 */
export function createGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): ConnectGameState {
  const config = CONFIGS[difficulty];
  let start: string = "PT";
  let end: string = "CN";
  let optimalPath: string[] | null = null;
  let attempts = 0;

  // Find a valid start/end pair with an interesting path
  do {
    start = getRandomConnectedCountry(continent);
    const targetDistance =
      config.minPathLength +
      Math.floor(Math.random() * (config.maxPathLength - config.minPathLength + 1));

    const candidates = countriesAtDistance(start, targetDistance, continent);
    if (candidates.length > 0) {
      end = candidates[Math.floor(Math.random() * candidates.length)];
      optimalPath = findShortestPath(start, end);
    }
    attempts++;
  } while (
    (!optimalPath ||
      optimalPath.length - 1 < config.minPathLength ||
      optimalPath.length - 1 > config.maxPathLength) &&
    attempts < 100
  );

  // Fallback: if we couldn't find a good pair, pick a known good one
  if (!optimalPath) {
    if (continent === "Europe") {
      start = "PT";
      end = "GR";
    } else if (continent === "Asia") {
      start = "TR";
      end = "CN";
    } else if (continent === "Africa") {
      start = "MA";
      end = "ZA";
    } else if (continent === "South America") {
      start = "CO";
      end = "AR";
    } else if (continent === "North America") {
      start = "US";
      end = "PA";
    } else {
      start = "PT";
      end = "CN";
    }
    optimalPath = findShortestPath(start, end) || [start, end];
  }

  return {
    phase: "reveal",
    difficulty,
    startCountry: start,
    endCountry: end,
    optimalPath,
    playerPath: [start], // player starts at the start country
    moves: [],
    currentPosition: start,
    wrongAttempts: 0,
    consecutiveWrongAttempts: 0,
    hintsUsed: 0,
    score: 0,
    isComplete: false,
    isTimeout: false,
    revealTimeLeft: 5,
    executionTimeLeft: config.executionTime,
    moveTimeLeft: config.moveTime,
    revealDuration: 5,
    executionDuration: config.executionTime,
    moveDuration: config.moveTime,
  };
}

/**
 * Transition from reveal to execution phase.
 */
export function startExecution(state: ConnectGameState): ConnectGameState {
  return {
    ...state,
    phase: "execution",
  };
}

/**
 * Submit a move (country name or code).
 * Player types only intermediate countries — NOT the destination.
 * The game auto-completes when the player reaches a country that borders the destination.
 */
export function submitMove(
  state: ConnectGameState,
  input: string,
  locale?: string
): { state: ConnectGameState; result: MoveResult } {
  if (state.phase !== "execution" || state.isComplete) {
    return { state, result: "invalid_country" };
  }

  // Resolve input to country code (supports localized names when locale is provided)
  const code = resolveCountryCode(input, locale);
  if (!code || !countryByCode[code]) {
    return { state, result: "invalid_country" };
  }

  // Block typing the destination country directly
  if (code === state.endCountry) {
    return { state, result: "destination_country" };
  }

  // Check if already visited
  if (state.playerPath.includes(code)) {
    const move: GameMove = {
      countryCode: code,
      countryName: countryByCode[code].name,
      result: "already_visited",
      timestamp: Date.now(),
    };
    return {
      state: {
        ...state,
        moves: [...state.moves, move],
        wrongAttempts: state.wrongAttempts + 1,
        consecutiveWrongAttempts: state.consecutiveWrongAttempts + 1,
        score: calculateScore({
          ...state,
          wrongAttempts: state.wrongAttempts + 1,
        }),
      },
      result: "already_visited",
    };
  }

  // Check if it's a valid neighbor of current position
  if (!isValidNeighbor(state.currentPosition, code)) {
    const move: GameMove = {
      countryCode: code,
      countryName: countryByCode[code].name,
      result: "not_neighbor",
      timestamp: Date.now(),
    };
    return {
      state: {
        ...state,
        moves: [...state.moves, move],
        wrongAttempts: state.wrongAttempts + 1,
        consecutiveWrongAttempts: state.consecutiveWrongAttempts + 1,
        score: calculateScore({
          ...state,
          wrongAttempts: state.wrongAttempts + 1,
        }),
      },
      result: "not_neighbor",
    };
  }

  // Valid move — add to path
  const newPath = [...state.playerPath, code];

  // Auto-complete: if this country borders the destination, the player wins
  const reachedDestination = isValidNeighbor(code, state.endCountry);

  const move: GameMove = {
    countryCode: code,
    countryName: countryByCode[code].name,
    result: "correct",
    timestamp: Date.now(),
  };

  const newState: ConnectGameState = {
    ...state,
    playerPath: newPath,
    moves: [...state.moves, move],
    currentPosition: code,
    consecutiveWrongAttempts: 0, // reset on correct move
    isComplete: reachedDestination,
    phase: reachedDestination ? "resolution" : "execution",
    moveTimeLeft: state.moveDuration, // reset per-move timer
  };

  newState.score = calculateScore(newState);

  return { state: newState, result: "correct" };
}

/**
 * Use a hint — reveals the next intermediate country toward the destination.
 * If the player is already one step away (borders destination), no hint is needed.
 */
export function useHint(state: ConnectGameState): {
  state: ConnectGameState;
  hintCountry: string | null;
} {
  if (state.phase !== "execution" || state.isComplete) {
    return { state, hintCountry: null };
  }

  // If already bordering the destination, no hint needed
  if (isValidNeighbor(state.currentPosition, state.endCountry)) {
    return { state, hintCountry: null };
  }

  // Find the optimal path from current position to end
  const pathFromHere = findShortestPath(state.currentPosition, state.endCountry);
  if (!pathFromHere || pathFromHere.length < 3) {
    // pathFromHere.length < 3 means [current, end] — already adjacent (handled above)
    // or no path at all
    return { state, hintCountry: null };
  }

  // Next intermediate step (skip destination — player never types it)
  const hintCountry = pathFromHere[1];

  const newState: ConnectGameState = {
    ...state,
    hintsUsed: state.hintsUsed + 1,
    score: calculateScore({
      ...state,
      hintsUsed: state.hintsUsed + 1,
    }),
  };

  return { state: newState, hintCountry };
}

/**
 * Handle timeout (execution timer ran out).
 */
export function handleTimeout(state: ConnectGameState): ConnectGameState {
  const newState: ConnectGameState = {
    ...state,
    phase: "resolution",
    isComplete: false,
    isTimeout: true,
  };
  newState.score = calculateScore(newState);
  return newState;
}

/**
 * Handle per-move timeout (single move timer ran out).
 */
export function handleMoveTimeout(state: ConnectGameState): ConnectGameState {
  return {
    ...state,
    wrongAttempts: state.wrongAttempts + 1,
    moveTimeLeft: state.moveDuration, // reset
    score: calculateScore({
      ...state,
      wrongAttempts: state.wrongAttempts + 1,
    }),
  };
}
