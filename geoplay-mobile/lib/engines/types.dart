/// Shared game types — ported from lib/game-engine/types.ts.
library;

/// Difficulty levels for all games.
enum Difficulty { easy, medium, hard }

/// Continent filter for game generation.
enum Continent {
  all,
  europe,
  asia,
  africa,
  northAmerica,
  southAmerica,
  oceania,
}

/// Continent metadata for UI display.
class ContinentInfo {
  final Continent id;
  final String label;
  final String emoji;
  final String dataName; // Matches the continent string in Country model

  const ContinentInfo({
    required this.id,
    required this.label,
    required this.emoji,
    required this.dataName,
  });
}

const List<ContinentInfo> continents = [
  ContinentInfo(id: Continent.all, label: 'All', emoji: '🌍', dataName: 'all'),
  ContinentInfo(id: Continent.europe, label: 'Europe', emoji: '🇪🇺', dataName: 'Europe'),
  ContinentInfo(id: Continent.asia, label: 'Asia', emoji: '🌏', dataName: 'Asia'),
  ContinentInfo(id: Continent.africa, label: 'Africa', emoji: '🌍', dataName: 'Africa'),
  ContinentInfo(id: Continent.northAmerica, label: 'N. America', emoji: '🌎', dataName: 'North America'),
  ContinentInfo(id: Continent.southAmerica, label: 'S. America', emoji: '🌎', dataName: 'South America'),
  ContinentInfo(id: Continent.oceania, label: 'Oceania', emoji: '🌊', dataName: 'Oceania'),
];

/// Get the data name string from a Continent enum.
String continentDataName(Continent continent) {
  return continents.firstWhere((c) => c.id == continent).dataName;
}

/// The three phases of gameplay.
enum GamePhase { countdown, playing, roundResult, resolution }

// ─── Flag Sprint Types ───

/// A single answered flag in the sprint.
class FlagAttempt {
  final String countryCode;
  final bool correct;
  final int timeMs;

  const FlagAttempt({
    required this.countryCode,
    required this.correct,
    required this.timeMs,
  });
}

/// Full state of a Flag Sprint game.
class FlagSprintState {
  final GamePhase phase;
  final Difficulty difficulty;
  final Continent continent;
  final List<String> queue; // Remaining country codes to show
  final String currentCountry; // Current flag being shown
  final List<FlagAttempt> attempts;
  final int score;
  final int streak;
  final int bestStreak;
  final int timeLeft;
  final int totalTime;
  final int wrongPenalty;

  const FlagSprintState({
    required this.phase,
    required this.difficulty,
    required this.continent,
    required this.queue,
    required this.currentCountry,
    required this.attempts,
    required this.score,
    required this.streak,
    required this.bestStreak,
    required this.timeLeft,
    required this.totalTime,
    required this.wrongPenalty,
  });

  FlagSprintState copyWith({
    GamePhase? phase,
    List<String>? queue,
    String? currentCountry,
    List<FlagAttempt>? attempts,
    int? score,
    int? streak,
    int? bestStreak,
    int? timeLeft,
  }) {
    return FlagSprintState(
      phase: phase ?? this.phase,
      difficulty: difficulty,
      continent: continent,
      queue: queue ?? this.queue,
      currentCountry: currentCountry ?? this.currentCountry,
      attempts: attempts ?? this.attempts,
      score: score ?? this.score,
      streak: streak ?? this.streak,
      bestStreak: bestStreak ?? this.bestStreak,
      timeLeft: timeLeft ?? this.timeLeft,
      totalTime: totalTime,
      wrongPenalty: wrongPenalty,
    );
  }
}

/// Flag Sprint difficulty configuration.
class FlagSprintConfig {
  final int totalTime;
  final int wrongPenalty;
  final int correctPoints;
  final int streakBonusMultiplier;

  const FlagSprintConfig({
    required this.totalTime,
    required this.wrongPenalty,
    required this.correctPoints,
    required this.streakBonusMultiplier,
  });
}

const Map<Difficulty, FlagSprintConfig> flagSprintConfigs = {
  Difficulty.easy: FlagSprintConfig(totalTime: 60, wrongPenalty: 0, correctPoints: 10, streakBonusMultiplier: 1),
  Difficulty.medium: FlagSprintConfig(totalTime: 60, wrongPenalty: 5, correctPoints: 10, streakBonusMultiplier: 2),
  Difficulty.hard: FlagSprintConfig(totalTime: 45, wrongPenalty: 10, correctPoints: 10, streakBonusMultiplier: 2),
};

// ─── Capital Clash Types ───

/// Question direction in Capital Clash.
enum CapitalDirection { countryToCapital, capitalToCountry }

/// A single Capital Clash question.
class CapitalQuestion {
  final String countryCode;
  final CapitalDirection direction;
  final String question; // Display text
  final String answer; // Correct answer text

  const CapitalQuestion({
    required this.countryCode,
    required this.direction,
    required this.question,
    required this.answer,
  });
}

/// A single attempt in Capital Clash.
class CapitalAttempt {
  final String countryCode;
  final CapitalDirection direction;
  final bool correct;
  final String? userAnswer;
  final int timeMs;

  const CapitalAttempt({
    required this.countryCode,
    required this.direction,
    required this.correct,
    this.userAnswer,
    required this.timeMs,
  });
}

/// Full state of a Capital Clash game.
class CapitalClashState {
  final GamePhase phase;
  final Difficulty difficulty;
  final Continent continent;
  final List<CapitalQuestion> questions;
  final int currentIndex;
  final List<CapitalAttempt> attempts;
  final int score;
  final int streak;
  final int bestStreak;
  final int timeLeft;
  final int totalTime;
  final int wrongPenalty;
  final bool bothWays; // true if questions go both directions

  const CapitalClashState({
    required this.phase,
    required this.difficulty,
    required this.continent,
    required this.questions,
    required this.currentIndex,
    required this.attempts,
    required this.score,
    required this.streak,
    required this.bestStreak,
    required this.timeLeft,
    required this.totalTime,
    required this.wrongPenalty,
    required this.bothWays,
  });

  CapitalQuestion? get currentQuestion =>
      currentIndex < questions.length ? questions[currentIndex] : null;

  CapitalClashState copyWith({
    GamePhase? phase,
    int? currentIndex,
    List<CapitalAttempt>? attempts,
    int? score,
    int? streak,
    int? bestStreak,
    int? timeLeft,
  }) {
    return CapitalClashState(
      phase: phase ?? this.phase,
      difficulty: difficulty,
      continent: continent,
      questions: questions,
      currentIndex: currentIndex ?? this.currentIndex,
      attempts: attempts ?? this.attempts,
      score: score ?? this.score,
      streak: streak ?? this.streak,
      bestStreak: bestStreak ?? this.bestStreak,
      timeLeft: timeLeft ?? this.timeLeft,
      totalTime: totalTime,
      wrongPenalty: wrongPenalty,
      bothWays: bothWays,
    );
  }
}

/// Capital Clash difficulty configuration.
class CapitalClashConfig {
  final int totalTime;
  final int wrongPenalty;
  final int correctPoints;
  final bool bothWays; // country→capital AND capital→country

  const CapitalClashConfig({
    required this.totalTime,
    required this.wrongPenalty,
    required this.correctPoints,
    required this.bothWays,
  });
}

const Map<Difficulty, CapitalClashConfig> capitalClashConfigs = {
  Difficulty.easy: CapitalClashConfig(totalTime: 60, wrongPenalty: 0, correctPoints: 10, bothWays: false),
  Difficulty.medium: CapitalClashConfig(totalTime: 60, wrongPenalty: 5, correctPoints: 10, bothWays: false),
  Difficulty.hard: CapitalClashConfig(totalTime: 45, wrongPenalty: 10, correctPoints: 15, bothWays: true),
};
