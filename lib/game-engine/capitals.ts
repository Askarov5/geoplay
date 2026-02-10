import { countries, countryByCode, resolveCountryCode } from "@/data/countries";
import type {
  Continent,
  Difficulty,
  CapitalClashGameState,
  CapitalQuestion,
  CapitalAttempt,
  CapitalQuestionType,
} from "./types";
import { CAPITAL_CLASH_CONFIGS } from "./types";

/** Shuffle array (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a pool of questions from country data */
function buildQuestionPool(
  continent: Continent,
  mixDirections: boolean
): CapitalQuestion[] {
  const pool = countries.filter((c) => {
    if (continent === "all") return true;
    return c.continent === continent;
  });

  const questions: CapitalQuestion[] = [];

  for (const c of pool) {
    if (mixDirections) {
      // Both directions
      const type: CapitalQuestionType =
        Math.random() > 0.5 ? "countryToCapital" : "capitalToCountry";
      questions.push({
        countryCode: c.code,
        countryName: c.name,
        capital: c.capital,
        type,
      });
    } else {
      // Easy: always show capital, ask for country
      questions.push({
        countryCode: c.code,
        countryName: c.name,
        capital: c.capital,
        type: "capitalToCountry",
      });
    }
  }

  return shuffle(questions);
}

/** Create a new Capital Clash game */
export function createCapitalClashGame(
  difficulty: Difficulty,
  continent: Continent = "all"
): CapitalClashGameState {
  const config = CAPITAL_CLASH_CONFIGS[difficulty];

  let questions = buildQuestionPool(continent, config.mixDirections);
  // Ensure enough questions for a full session
  while (questions.length < 80) {
    questions = [
      ...questions,
      ...buildQuestionPool(continent, config.mixDirections),
    ];
  }

  return {
    phase: "countdown",
    difficulty,
    continent,
    questions,
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
export function startPlaying(
  state: CapitalClashGameState
): CapitalClashGameState {
  return {
    ...state,
    phase: "playing",
    questionShownAt: Date.now(),
  };
}

/** Calculate current multiplier from streak */
export function getMultiplier(state: CapitalClashGameState): number {
  const config = CAPITAL_CLASH_CONFIGS[state.difficulty];
  const mult =
    1 + Math.floor(state.streak / config.streakMultiplierStep);
  return Math.min(mult, config.maxMultiplier);
}

/** Normalize a string for comparison (lowercase, trim, remove accents) */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Check if input matches the expected answer (capital or country name) */
function isCorrectAnswer(
  question: CapitalQuestion,
  input: string,
  locale?: string
): boolean {
  const normalized = normalize(input);

  if (question.type === "countryToCapital") {
    // Player must type the capital
    if (normalize(question.capital) === normalized) return true;
    // Accept partial match for long capitals like "Washington, D.C."
    if (
      normalize(question.capital).includes(normalized) &&
      normalized.length >= 4
    )
      return true;
    return false;
  } else {
    // Player must type the country name
    // Check English name
    if (normalize(question.countryName) === normalized) return true;
    // Check by resolveCountryCode (handles localized names)
    const code = resolveCountryCode(input, locale);
    if (code === question.countryCode) return true;
    return false;
  }
}

/** Submit a guess for the current question */
export function submitCapitalGuess(
  state: CapitalClashGameState,
  input: string,
  locale?: string
): {
  state: CapitalClashGameState;
  result: "correct" | "wrong";
} {
  if (state.phase !== "playing") {
    return { state, result: "wrong" };
  }

  const question = state.questions[state.currentIndex];
  const config = CAPITAL_CLASH_CONFIGS[state.difficulty];
  const timeMs = Date.now() - state.questionShownAt;
  const correct = isCorrectAnswer(question, input, locale);

  const attempt: CapitalAttempt = {
    question,
    answer: input,
    correct,
    timeMs,
  };

  if (correct) {
    const multiplier = getMultiplier(state);
    const points = config.basePoints * multiplier;
    const newStreak = state.streak + 1;

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

  return {
    state: {
      ...state,
      currentIndex: state.currentIndex + 1,
      attempts: [...state.attempts, attempt],
      score: Math.max(0, state.score - config.wrongPenalty),
      streak: 0,
      questionShownAt: Date.now(),
    },
    result: "wrong",
  };
}

/** Skip the current question */
export function skipQuestion(
  state: CapitalClashGameState
): CapitalClashGameState {
  if (state.phase !== "playing") return state;

  const question = state.questions[state.currentIndex];
  const timeMs = Date.now() - state.questionShownAt;

  const attempt: CapitalAttempt = {
    question,
    answer: "",
    correct: false,
    timeMs,
  };

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
    attempts: [...state.attempts, attempt],
    streak: 0,
    questionShownAt: Date.now(),
  };
}

/** End the game (time ran out) */
export function endGame(
  state: CapitalClashGameState
): CapitalClashGameState {
  return {
    ...state,
    phase: "resolution",
    timeLeft: 0,
  };
}

/** Get final stats */
export function getCapitalClashStats(state: CapitalClashGameState) {
  const correct = state.attempts.filter((a) => a.correct).length;
  const wrong = state.attempts.filter((a) => !a.correct).length;
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
    total,
    bestStreak: state.bestStreak,
    avgTimeMs: avgTime,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

/** Get the display text for a question */
export function getQuestionDisplay(
  question: CapitalQuestion,
  countryNameFn?: (code: string) => string
): { prompt: string; answer: string } {
  if (question.type === "countryToCapital") {
    const name = countryNameFn
      ? countryNameFn(question.countryCode)
      : question.countryName;
    return {
      prompt: name,
      answer: question.capital,
    };
  } else {
    return {
      prompt: question.capital,
      answer: countryNameFn
        ? countryNameFn(question.countryCode)
        : question.countryName,
    };
  }
}
