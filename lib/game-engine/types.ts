/** Difficulty levels for Connect Countries */
export type Difficulty = "easy" | "medium" | "hard";

/** Continent filter for game generation */
export type Continent =
  | "all"
  | "Europe"
  | "Asia"
  | "Africa"
  | "North America"
  | "South America";

export const CONTINENTS: { id: Continent; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "🌍" },
  { id: "Europe", label: "Europe", emoji: "🇪🇺" },
  { id: "Asia", label: "Asia", emoji: "🌏" },
  { id: "Africa", label: "Africa", emoji: "🌍" },
  { id: "North America", label: "N. America", emoji: "🌎" },
  { id: "South America", label: "S. America", emoji: "🌎" },
];

/** The three phases of a Connect Countries round */
export type GamePhase = "reveal" | "execution" | "resolution";

/** Result of a single move attempt */
export type MoveResult =
  | "correct"
  | "wrong"
  | "already_visited"
  | "not_neighbor"
  | "invalid_country"
  | "destination_country";

/** A recorded move in the game history */
export interface GameMove {
  countryCode: string;
  countryName: string;
  result: MoveResult;
  timestamp: number;
}

/** Full state of a Connect Countries game */
export interface ConnectGameState {
  phase: GamePhase;
  difficulty: Difficulty;
  startCountry: string; // ISO code
  endCountry: string;   // ISO code
  optimalPath: string[]; // precomputed shortest path (codes)
  playerPath: string[];  // player's valid moves so far (codes)
  moves: GameMove[];     // full move history (including wrong moves)
  currentPosition: string; // ISO code of where the player currently is
  wrongAttempts: number;
  consecutiveWrongAttempts: number;
  hintsUsed: number;
  score: number;
  isComplete: boolean;
  isTimeout: boolean;

  // Timers
  revealTimeLeft: number;     // seconds remaining in reveal phase
  executionTimeLeft: number;  // total execution time remaining
  moveTimeLeft: number;       // per-move timer

  // Config
  revealDuration: number;     // total reveal time (5s)
  executionDuration: number;  // total execution time (60s)
  moveDuration: number;       // per-move time (5s)
}

/** Difficulty configuration */
export interface DifficultyConfig {
  label: string;
  description: string;
  minPathLength: number;
  maxPathLength: number;
  executionTime: number; // seconds
  moveTime: number;      // seconds per move
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    description: "2-3 countries apart",
    minPathLength: 2,
    maxPathLength: 3,
    executionTime: 90,
    moveTime: 8,
  },
  medium: {
    label: "Medium",
    description: "4-6 countries apart",
    minPathLength: 4,
    maxPathLength: 6,
    executionTime: 60,
    moveTime: 5,
  },
  hard: {
    label: "Hard",
    description: "7+ countries apart",
    minPathLength: 7,
    maxPathLength: 12,
    executionTime: 45,
    moveTime: 4,
  },
};

// ─────────────────────────────────────────────
// Silhouette Game ("Find the Country")
// ─────────────────────────────────────────────

/** Hint types revealed progressively */
export type SilhouetteHintType = "continent" | "firstLetter" | "capital" | "neighbors";

export interface SilhouetteHint {
  type: SilhouetteHintType;
  value: string;
}

/** A single round in the silhouette game */
export interface SilhouetteRound {
  countryCode: string;       // answer
  guesses: string[];         // player's guess codes (wrong ones)
  hintsRevealed: SilhouetteHint[];  // hints shown so far
  hintsAvailable: SilhouetteHint[]; // all possible hints for this country
  solved: boolean;
  skipped: boolean;
  points: number;            // points earned for this round
}

/** Full state of the silhouette game */
export interface SilhouetteGameState {
  phase: "playing" | "roundResult" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  rounds: SilhouetteRound[];
  currentRound: number;      // 0-indexed
  totalRounds: number;
  totalScore: number;
  timeLeft: number;          // seconds remaining in current round
  roundDuration: number;     // seconds per round
}

/** Silhouette difficulty configuration */
export interface SilhouetteDifficultyConfig {
  totalRounds: number;
  roundTime: number;      // seconds per round
  maxPoints: number;      // max points per round (decreases with hints/wrong guesses)
  hintPenalty: number;    // points lost per hint
  guessPenalty: number;   // points lost per wrong guess
}

export const SILHOUETTE_CONFIGS: Record<Difficulty, SilhouetteDifficultyConfig> = {
  easy: {
    totalRounds: 5,
    roundTime: 30,
    maxPoints: 100,
    hintPenalty: 15,
    guessPenalty: 10,
  },
  medium: {
    totalRounds: 8,
    roundTime: 20,
    maxPoints: 100,
    hintPenalty: 20,
    guessPenalty: 15,
  },
  hard: {
    totalRounds: 10,
    roundTime: 15,
    maxPoints: 100,
    hintPenalty: 25,
    guessPenalty: 20,
  },
};

// ─────────────────────────────────────────────
// Flag Sprint Game
// ─────────────────────────────────────────────

/** A single answered flag in the sprint */
export interface FlagAttempt {
  countryCode: string;
  correct: boolean;
  timeMs: number;       // how long the player took
}

/** Full state of a Flag Sprint game */
export interface FlagSprintGameState {
  phase: "countdown" | "playing" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  flagQueue: string[];        // shuffled country codes to show
  currentIndex: number;       // index into flagQueue
  attempts: FlagAttempt[];    // completed attempts
  score: number;
  streak: number;             // current consecutive correct answers
  bestStreak: number;
  timeLeft: number;           // seconds remaining
  totalDuration: number;      // total game time in seconds
  countdownLeft: number;      // 3-2-1 countdown
  flagShownAt: number;        // timestamp when current flag was displayed
}

/** Flag Sprint difficulty config */
export interface FlagSprintDifficultyConfig {
  totalTime: number;           // seconds
  basePoints: number;          // points per correct answer
  streakMultiplierStep: number; // every N streak, multiplier goes up
  maxMultiplier: number;
  wrongPenalty: number;        // points lost per wrong answer
  skipPenalty: number;         // points lost per skip
}

export const FLAG_SPRINT_CONFIGS: Record<Difficulty, FlagSprintDifficultyConfig> = {
  easy: {
    totalTime: 60,
    basePoints: 10,
    streakMultiplierStep: 3,
    maxMultiplier: 3,
    wrongPenalty: 0,
    skipPenalty: 0,
  },
  medium: {
    totalTime: 60,
    basePoints: 10,
    streakMultiplierStep: 3,
    maxMultiplier: 4,
    wrongPenalty: 5,
    skipPenalty: 0,
  },
  hard: {
    totalTime: 45,
    basePoints: 10,
    streakMultiplierStep: 5,
    maxMultiplier: 5,
    wrongPenalty: 10,
    skipPenalty: 5,
  },
};
