import { countries, countryByCode, resolveCountryCode } from "@/data/countries";
import { adjacencyGraph } from "@/data/adjacency";
import { getCountryTier, getMaxTierForDifficulty } from "@/data/country-tiers";
import type {
  Continent,
  Difficulty,
  SilhouetteGameState,
  SilhouetteRound,
  SilhouetteHint,
  SILHOUETTE_CONFIGS as _SC,
} from "./types";
import { SILHOUETTE_CONFIGS } from "./types";

// Countries that are too small to render as recognizable silhouettes at 110m resolution
// These are excluded from ALL difficulty levels (even hard) because they're invisible on the SVG
const TINY_SILHOUETTE_CODES = new Set([
  "AD", "MC", "SM", "VA", "LI", "MT", "SG", "BH", "MV",
  "SC", "CV", "ST", "AG", "BB", "DM", "GD", "KN", "LC", "VC",
  "WS", "TO", "MU",
]);

/** Get a pool of valid countries filtered by continent and difficulty tier */
function getCountryPool(continent: Continent, difficulty: Difficulty): string[] {
  const maxTier = getMaxTierForDifficulty(difficulty);
  return countries
    .filter((c) => {
      if (TINY_SILHOUETTE_CODES.has(c.code)) return false;
      if (getCountryTier(c.code) > maxTier) return false;
      if (continent === "all") return true;
      return c.continent === continent;
    })
    .map((c) => c.code);
}

/** Build the progressive hint set for a given country */
function buildHints(code: string): SilhouetteHint[] {
  const country = countryByCode[code];
  if (!country) return [];

  const hints: SilhouetteHint[] = [];

  // Hint 1: Continent
  hints.push({ type: "continent", value: country.continent });

  // Hint 2: First letter of English name
  hints.push({ type: "firstLetter", value: country.name[0].toUpperCase() });

  // Hint 3: Capital (store country code so UI can localize)
  hints.push({ type: "capital", value: code });

  // Hint 4: Neighboring countries (up to 3, store codes so UI can localize)
  const neighbors = adjacencyGraph[code] || [];
  if (neighbors.length > 0) {
    const shown = neighbors.slice(0, 3).join(",");
    hints.push({ type: "neighbors", value: shown });
  }

  return hints;
}

/** Shuffle array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Create a new silhouette game */
export function createSilhouetteGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): SilhouetteGameState {
  const config = SILHOUETTE_CONFIGS[difficulty];
  const pool = getCountryPool(continent, difficulty);
  const shuffled = shuffle([...pool]);
  const selected = shuffled.slice(0, config.totalRounds);

  // If not enough countries in pool, pad from "all"
  if (selected.length < config.totalRounds) {
    const allPool = getCountryPool("all", difficulty).filter((c) => !selected.includes(c));
    const extra = shuffle(allPool).slice(0, config.totalRounds - selected.length);
    selected.push(...extra);
  }

  const rounds: SilhouetteRound[] = selected.map((code) => ({
    countryCode: code,
    guesses: [],
    hintsRevealed: [],
    hintsAvailable: buildHints(code),
    solved: false,
    skipped: false,
    points: 0,
  }));

  return {
    phase: "playing",
    difficulty,
    continent,
    rounds,
    currentRound: 0,
    totalRounds: rounds.length,
    totalScore: 0,
    timeLeft: config.roundTime,
    roundDuration: config.roundTime,
  };
}

/** Submit a guess for the current round. Returns "correct", "wrong", or "invalid". */
export function submitGuess(
  state: SilhouetteGameState,
  input: string,
  locale?: string
): { state: SilhouetteGameState; result: "correct" | "wrong" | "invalid" } {
  if (state.phase !== "playing") {
    return { state, result: "invalid" };
  }

  const code = resolveCountryCode(input, locale);
  if (!code) {
    return { state, result: "invalid" };
  }

  const config = SILHOUETTE_CONFIGS[state.difficulty];
  const round = { ...state.rounds[state.currentRound] };
  const newRounds = [...state.rounds];

  if (code === round.countryCode) {
    // Correct!
    const penalty =
      round.guesses.length * config.guessPenalty +
      round.hintsRevealed.length * config.hintPenalty;
    round.solved = true;
    round.points = Math.max(config.maxPoints - penalty, 10); // minimum 10 points
    newRounds[state.currentRound] = round;

    return {
      state: {
        ...state,
        rounds: newRounds,
        totalScore: state.totalScore + round.points,
        phase: "roundResult",
      },
      result: "correct",
    };
  }

  // Wrong guess
  if (!round.guesses.includes(code)) {
    round.guesses = [...round.guesses, code];
  }
  newRounds[state.currentRound] = round;

  return {
    state: { ...state, rounds: newRounds },
    result: "wrong",
  };
}

/** Reveal the next available hint for the current round */
export function revealHint(
  state: SilhouetteGameState
): SilhouetteGameState {
  if (state.phase !== "playing") return state;

  const round = { ...state.rounds[state.currentRound] };
  const nextIdx = round.hintsRevealed.length;
  if (nextIdx >= round.hintsAvailable.length) return state; // no more hints

  round.hintsRevealed = [...round.hintsRevealed, round.hintsAvailable[nextIdx]];
  const newRounds = [...state.rounds];
  newRounds[state.currentRound] = round;

  return { ...state, rounds: newRounds };
}

/** Skip the current round (0 points) */
export function skipRound(
  state: SilhouetteGameState
): SilhouetteGameState {
  if (state.phase !== "playing") return state;

  const round = { ...state.rounds[state.currentRound] };
  round.skipped = true;
  round.points = 0;
  const newRounds = [...state.rounds];
  newRounds[state.currentRound] = round;

  return {
    ...state,
    rounds: newRounds,
    phase: "roundResult",
  };
}

/** Handle round timeout — same as skip */
export function handleRoundTimeout(
  state: SilhouetteGameState
): SilhouetteGameState {
  return skipRound(state);
}

/** Advance to the next round or end the game */
export function nextRound(
  state: SilhouetteGameState
): SilhouetteGameState {
  const next = state.currentRound + 1;
  const config = SILHOUETTE_CONFIGS[state.difficulty];

  if (next >= state.totalRounds) {
    // Game over
    return { ...state, phase: "resolution" };
  }

  return {
    ...state,
    phase: "playing",
    currentRound: next,
    timeLeft: config.roundTime,
  };
}

/** Get final game stats */
export function getSilhouetteStats(state: SilhouetteGameState) {
  const config = SILHOUETTE_CONFIGS[state.difficulty];
  const maxPossible = state.totalRounds * config.maxPoints;
  const solved = state.rounds.filter((r) => r.solved).length;
  const skipped = state.rounds.filter((r) => r.skipped).length;
  const totalHints = state.rounds.reduce((sum, r) => sum + r.hintsRevealed.length, 0);
  const totalWrong = state.rounds.reduce((sum, r) => sum + r.guesses.length, 0);

  return {
    totalScore: state.totalScore,
    maxPossible,
    percentage: Math.round((state.totalScore / maxPossible) * 100),
    solved,
    skipped,
    totalRounds: state.totalRounds,
    totalHints,
    totalWrong,
  };
}
