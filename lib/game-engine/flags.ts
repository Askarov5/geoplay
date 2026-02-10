import { countries, resolveCountryCode } from "@/data/countries";
import type {
  Continent,
  Difficulty,
  FlagSprintGameState,
  FlagAttempt,
} from "./types";
import { FLAG_SPRINT_CONFIGS } from "./types";

/** Get the flag image URL for a country code (CDN) */
export function getFlagUrl(code: string, width = 320): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Get the pool of countries filtered by continent */
function getCountryPool(continent: Continent): string[] {
  return countries
    .filter((c) => {
      if (continent === "all") return true;
      return c.continent === continent;
    })
    .map((c) => c.code);
}

/** Create a new Flag Sprint game */
export function createFlagSprintGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): FlagSprintGameState {
  const config = FLAG_SPRINT_CONFIGS[difficulty];
  const pool = getCountryPool(continent);

  // Shuffle and make a large queue (repeat if needed for 60s of play)
  let queue = shuffle(pool);
  // Ensure we have plenty of flags — most players won't get through 50+ in 60s
  while (queue.length < 80) {
    queue = [...queue, ...shuffle(pool)];
  }

  return {
    phase: "countdown",
    difficulty,
    continent,
    flagQueue: queue,
    currentIndex: 0,
    attempts: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: config.totalTime,
    totalDuration: config.totalTime,
    countdownLeft: 3,
    flagShownAt: 0,
  };
}

/** Start playing after countdown */
export function startPlaying(state: FlagSprintGameState): FlagSprintGameState {
  return {
    ...state,
    phase: "playing",
    flagShownAt: Date.now(),
  };
}

/** Calculate current multiplier from streak */
export function getMultiplier(state: FlagSprintGameState): number {
  const config = FLAG_SPRINT_CONFIGS[state.difficulty];
  const mult = 1 + Math.floor(state.streak / config.streakMultiplierStep);
  return Math.min(mult, config.maxMultiplier);
}

/** Submit a guess for the current flag */
export function submitFlagGuess(
  state: FlagSprintGameState,
  input: string,
  locale?: string
): { state: FlagSprintGameState; result: "correct" | "wrong" | "invalid" } {
  if (state.phase !== "playing") {
    return { state, result: "invalid" };
  }

  const code = resolveCountryCode(input, locale);
  if (!code) {
    return { state, result: "invalid" };
  }

  const currentFlag = state.flagQueue[state.currentIndex];
  const config = FLAG_SPRINT_CONFIGS[state.difficulty];
  const timeMs = Date.now() - state.flagShownAt;

  if (code === currentFlag) {
    // Correct!
    const multiplier = getMultiplier(state);
    const points = config.basePoints * multiplier;
    const newStreak = state.streak + 1;

    const attempt: FlagAttempt = {
      countryCode: currentFlag,
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
        flagShownAt: Date.now(),
      },
      result: "correct",
    };
  }

  // Wrong guess
  const attempt: FlagAttempt = {
    countryCode: currentFlag,
    correct: false,
    timeMs,
  };

  return {
    state: {
      ...state,
      currentIndex: state.currentIndex + 1,
      attempts: [...state.attempts, attempt],
      score: Math.max(0, state.score - config.wrongPenalty),
      streak: 0,
      flagShownAt: Date.now(),
    },
    result: "wrong",
  };
}

/** Skip the current flag */
export function skipFlag(state: FlagSprintGameState): FlagSprintGameState {
  if (state.phase !== "playing") return state;

  const config = FLAG_SPRINT_CONFIGS[state.difficulty];
  const timeMs = Date.now() - state.flagShownAt;

  const attempt: FlagAttempt = {
    countryCode: state.flagQueue[state.currentIndex],
    correct: false,
    timeMs,
  };

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
    attempts: [...state.attempts, attempt],
    score: Math.max(0, state.score - config.skipPenalty),
    streak: 0,
    flagShownAt: Date.now(),
  };
}

/** End the game (time ran out) */
export function endGame(state: FlagSprintGameState): FlagSprintGameState {
  return {
    ...state,
    phase: "resolution",
    timeLeft: 0,
  };
}

/** Get final stats */
export function getFlagSprintStats(state: FlagSprintGameState) {
  const correct = state.attempts.filter((a) => a.correct).length;
  const wrong = state.attempts.filter((a) => !a.correct).length;
  const total = state.attempts.length;
  const avgTime = total > 0
    ? Math.round(state.attempts.reduce((sum, a) => sum + a.timeMs, 0) / total)
    : 0;

  return {
    score: state.score,
    correct,
    wrong,
    total,
    bestStreak: state.bestStreak,
    avgTimeMs: avgTime,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}
