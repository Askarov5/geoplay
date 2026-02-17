import { countries } from "@/data/countries";
import { resolveCountryCode } from "@/data/countries";
import { adjacencyGraph } from "@/data/adjacency";
import { getCountryTier, getMaxTierForDifficulty } from "@/data/country-tiers";
import type {
  Continent,
  Difficulty,
  BorderBlitzGameState,
} from "./types";
import { BORDER_BLITZ_CONFIGS } from "./types";

/** Get neighbor codes for a country (from adjacency graph). */
export function getNeighborsForAnchor(code: string): string[] {
  return adjacencyGraph[code] || [];
}

/** Get a pool of valid anchor countries filtered by continent, neighbor count range, and tier. */
function getAnchorPool(
  continent: Continent,
  minNeighbors: number,
  maxNeighbors: number,
  difficulty: Difficulty
): string[] {
  const maxTier = getMaxTierForDifficulty(difficulty);
  return countries
    .filter((c) => {
      const neighbors = adjacencyGraph[c.code];
      if (!neighbors || neighbors.length < 1) return false;
      if (neighbors.length < minNeighbors || neighbors.length > maxNeighbors) return false;
      if (getCountryTier(c.code) > maxTier) return false;
      if (continent === "all") return true;
      return c.continent === continent;
    })
    .map((c) => c.code);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick a random anchor that isn't the current one, within neighbor count range. */
function pickAnchor(
  continent: Continent,
  difficulty: Difficulty,
  exclude?: string
): string {
  const config = BORDER_BLITZ_CONFIGS[difficulty];
  let pool = getAnchorPool(continent, config.minNeighbors, config.maxNeighbors, difficulty)
    .filter((c) => c !== exclude);

  // Fallback: if no countries match the exact range (e.g. small continent),
  // relax the neighbor filter but keep the tier filter
  if (pool.length === 0) {
    pool = getAnchorPool(continent, 1, 99, difficulty).filter((c) => c !== exclude);
  }

  // Ultimate fallback: relax tier filter too
  if (pool.length === 0) {
    pool = getAnchorPool(continent, 1, 99, "hard").filter((c) => c !== exclude);
  }

  const shuffled = shuffle(pool);
  return shuffled[0] || "DE";
}

/** Create a new Border Blitz game. */
export function createBorderBlitzGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): BorderBlitzGameState {
  const config = BORDER_BLITZ_CONFIGS[difficulty];
  const anchorCode = pickAnchor(continent, difficulty);

  return {
    phase: "countdown",
    difficulty,
    continent,
    anchorCode,
    foundNeighbors: [],
    hintedNeighbors: [],
    wrongAttempts: 0,
    consecutiveWrongAttempts: 0,
    hintsUsed: 0,
    skipsUsed: 0,
    score: 0,
    timeLeft: config.totalTime,
    totalDuration: config.totalTime,
    countdownLeft: 3,
  };
}

/** Start playing after countdown. */
export function startPlaying(
  state: BorderBlitzGameState
): BorderBlitzGameState {
  return {
    ...state,
    phase: "playing",
  };
}

/** Submit a guess: must be a neighbor of the anchor, not already found. */
export function submitGuess(
  state: BorderBlitzGameState,
  input: string,
  locale?: string
): { state: BorderBlitzGameState; result: "correct" | "wrong" } {
  if (state.phase !== "playing") {
    return { state, result: "wrong" };
  }

  const code = resolveCountryCode(input.trim(), locale);
  const config = BORDER_BLITZ_CONFIGS[state.difficulty];

  if (!code) {
    return {
      state: {
        ...state,
        wrongAttempts: state.wrongAttempts + 1,
        consecutiveWrongAttempts: state.consecutiveWrongAttempts + 1,
        score: Math.max(0, state.score - config.wrongPenalty),
      },
      result: "wrong",
    };
  }

  const neighbors = getNeighborsForAnchor(state.anchorCode);
  const alreadyFound = state.foundNeighbors.includes(code);

  if (!neighbors.includes(code) || alreadyFound) {
    return {
      state: {
        ...state,
        wrongAttempts: state.wrongAttempts + 1,
        consecutiveWrongAttempts: state.consecutiveWrongAttempts + 1,
        score: Math.max(0, state.score - config.wrongPenalty),
      },
      result: "wrong",
    };
  }

  // Correct guess
  const newFound = [...state.foundNeighbors, code];
  const isComplete = newFound.length === neighbors.length;

  return {
    state: {
      ...state,
      foundNeighbors: newFound,
      consecutiveWrongAttempts: 0,
      score: state.score + config.pointsPerNeighbor,
      phase: isComplete ? "resolution" : "playing",
    },
    result: "correct",
  };
}

/** Use a hint: reveal one random unfound neighbor. Returns the hinted code or null. */
export function useHint(
  state: BorderBlitzGameState
): { state: BorderBlitzGameState; hintCode: string | null } {
  if (state.phase !== "playing") {
    return { state, hintCode: null };
  }

  const neighbors = getNeighborsForAnchor(state.anchorCode);
  const unfound = neighbors.filter((n) => !state.foundNeighbors.includes(n));

  if (unfound.length === 0) {
    return { state, hintCode: null };
  }

  const config = BORDER_BLITZ_CONFIGS[state.difficulty];
  const hintCode = unfound[Math.floor(Math.random() * unfound.length)];
  const newFound = [...state.foundNeighbors, hintCode];
  const newHinted = [...state.hintedNeighbors, hintCode];
  const isComplete = newFound.length === neighbors.length;

  // Hints reveal the neighbor but at a penalty cost (no points earned)
  return {
    state: {
      ...state,
      foundNeighbors: newFound,
      hintedNeighbors: newHinted,
      hintsUsed: state.hintsUsed + 1,
      score: Math.max(0, state.score - config.hintPenalty),
      phase: isComplete ? "resolution" : "playing",
    },
    hintCode,
  };
}

/** Skip to a new anchor country. Keeps score, timer, and stats. */
export function skipAnchor(
  state: BorderBlitzGameState
): BorderBlitzGameState {
  if (state.phase !== "playing") return state;

  const newAnchor = pickAnchor(state.continent, state.difficulty, state.anchorCode);

  return {
    ...state,
    anchorCode: newAnchor,
    foundNeighbors: [],
    hintedNeighbors: [],
    consecutiveWrongAttempts: 0,
    skipsUsed: state.skipsUsed + 1,
  };
}

/** Handle game timeout (time ran out). */
export function handleTimeout(
  state: BorderBlitzGameState
): BorderBlitzGameState {
  return {
    ...state,
    phase: "resolution",
    timeLeft: 0,
  };
}

/** Get stats for resolution screen. */
export function getBorderBlitzStats(state: BorderBlitzGameState) {
  const neighbors = getNeighborsForAnchor(state.anchorCode);
  const total = neighbors.length;
  const found = state.foundNeighbors.length;
  const allFound = found === total;

  return {
    score: state.score,
    found,
    total,
    allFound,
    wrongAttempts: state.wrongAttempts,
    hintsUsed: state.hintsUsed,
    skipsUsed: state.skipsUsed,
  };
}
