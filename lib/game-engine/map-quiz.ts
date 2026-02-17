import { countries } from "@/data/countries";
import { getCountryTier, getMaxTierForDifficulty } from "@/data/country-tiers";
import type {
  Continent,
  Difficulty,
  MapQuizGameState,
  MapQuizAttempt,
} from "./types";
import { MAP_QUIZ_CONFIGS } from "./types";

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Get the pool of countries filtered by continent and difficulty tier */
function getCountryPool(continent: Continent, difficulty: Difficulty): string[] {
  const maxTier = getMaxTierForDifficulty(difficulty);
  return countries
    .filter((c) => {
      if (getCountryTier(c.code) > maxTier) return false;
      if (continent === "all") return true;
      return c.continent === continent;
    })
    .map((c) => c.code);
}

/** Create a new Map Quiz game */
export function createMapQuizGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): MapQuizGameState {
  const config = MAP_QUIZ_CONFIGS[difficulty];
  const pool = getCountryPool(continent, difficulty);

  // Shuffle and ensure we have enough countries
  let queue = shuffle(pool);
  while (queue.length < 80) {
    queue = [...queue, ...shuffle(pool)];
  }

  return {
    phase: "countdown",
    difficulty,
    continent,
    countryQueue: queue,
    currentIndex: 0,
    attempts: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: config.totalTime,
    totalDuration: config.totalTime,
    countdownLeft: 3,
    questionShownAt: 0,
  };
}

/** Start playing after countdown */
export function startPlaying(state: MapQuizGameState): MapQuizGameState {
  return {
    ...state,
    phase: "playing",
    questionShownAt: Date.now(),
  };
}

/** Calculate current multiplier from streak */
export function getMultiplier(state: MapQuizGameState): number {
  const config = MAP_QUIZ_CONFIGS[state.difficulty];
  const mult = 1 + Math.floor(state.streak / config.streakMultiplierStep);
  return Math.min(mult, config.maxMultiplier);
}

/** Submit a click for the current target country */
export function submitClick(
  state: MapQuizGameState,
  clickedCode: string
): { state: MapQuizGameState; result: "correct" | "wrong" } {
  if (state.phase !== "playing") {
    return { state, result: "wrong" };
  }

  const targetCode = state.countryQueue[state.currentIndex];
  const config = MAP_QUIZ_CONFIGS[state.difficulty];
  const timeMs = Date.now() - state.questionShownAt;

  if (clickedCode === targetCode) {
    // Correct!
    const multiplier = getMultiplier(state);
    const points = config.basePoints * multiplier;
    const newStreak = state.streak + 1;

    const attempt: MapQuizAttempt = {
      targetCode,
      clickedCode,
      correct: true,
      timeMs,
    };

    return {
      state: {
        ...state,
        currentIndex: state.currentIndex + 1,
        attempts: [...state.attempts, attempt],
        score: state.score + points,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        questionShownAt: Date.now(),
      },
      result: "correct",
    };
  }

  // Wrong click
  const attempt: MapQuizAttempt = {
    targetCode,
    clickedCode,
    correct: false,
    timeMs,
  };

  return {
    state: {
      ...state,
      attempts: [...state.attempts, attempt],
      score: Math.max(0, state.score - config.wrongPenalty),
      streak: 0,
    },
    result: "wrong",
  };
}

/** Skip the current country */
export function skipCountry(state: MapQuizGameState): MapQuizGameState {
  if (state.phase !== "playing") return state;

  const config = MAP_QUIZ_CONFIGS[state.difficulty];
  const timeMs = Date.now() - state.questionShownAt;

  const attempt: MapQuizAttempt = {
    targetCode: state.countryQueue[state.currentIndex],
    clickedCode: null,
    correct: false,
    timeMs,
  };

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
    attempts: [...state.attempts, attempt],
    score: Math.max(0, state.score - config.skipPenalty),
    streak: 0,
    questionShownAt: Date.now(),
  };
}

/** End the game (time ran out) */
export function endGame(state: MapQuizGameState): MapQuizGameState {
  return {
    ...state,
    phase: "resolution",
    timeLeft: 0,
  };
}

/** Get final stats */
export function getMapQuizStats(state: MapQuizGameState) {
  const correct = state.attempts.filter((a) => a.correct).length;
  const wrong = state.attempts.filter((a) => !a.correct && a.clickedCode !== null).length;
  const skipped = state.attempts.filter((a) => a.clickedCode === null).length;
  const total = state.attempts.length;
  const avgTime =
    total > 0
      ? Math.round(
          state.attempts.reduce((sum, a) => sum + a.timeMs, 0) / total
        )
      : 0;

  return {
    score: state.score,
    correct,
    wrong,
    skipped,
    total,
    bestStreak: state.bestStreak,
    avgTimeMs: avgTime,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}
