import 'dart:math';
import '../core/data/countries.dart';
import '../core/data/country_tiers.dart';
import '../core/data/country_names.dart';
import 'types.dart';

/// Flag Sprint game engine — pure Dart logic.
/// Ported from lib/game-engine/flags.ts.

/// Create a new Flag Sprint game.
FlagSprintState createFlagSprintGame(Difficulty difficulty, Continent continent) {
  final config = flagSprintConfigs[difficulty]!;
  final continentName = continentDataName(continent);

  // Build pool filtered by tier and continent
  final pool = getCountryPool(
    difficulty.name,
    continentName,
  );

  // Shuffle the pool
  final shuffled = List<String>.from(pool)..shuffle(Random());

  return FlagSprintState(
    phase: GamePhase.countdown,
    difficulty: difficulty,
    continent: continent,
    queue: shuffled.length > 1 ? shuffled.sublist(1) : [],
    currentCountry: shuffled.first,
    attempts: const [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: config.totalTime,
    totalTime: config.totalTime,
    wrongPenalty: config.wrongPenalty,
  );
}

/// Submit a guess for the current flag.
/// Returns the new state and whether the answer was correct.
({FlagSprintState state, bool correct}) submitFlagGuess(
  FlagSprintState state,
  String input,
) {
  final config = flagSprintConfigs[state.difficulty]!;
  final resolvedCode = resolveCountryCode(input);

  final isCorrect = resolvedCode != null &&
      resolvedCode.toUpperCase() == state.currentCountry.toUpperCase();

  final attempt = FlagAttempt(
    countryCode: state.currentCountry,
    correct: isCorrect,
    timeMs: DateTime.now().millisecondsSinceEpoch,
  );

  final newAttempts = [...state.attempts, attempt];

  int newScore = state.score;
  int newStreak = state.streak;
  int newBestStreak = state.bestStreak;

  if (isCorrect) {
    newStreak++;
    newScore += config.correctPoints;
    // Streak bonus: every 3 correct in a row gives extra points
    if (newStreak > 0 && newStreak % 3 == 0) {
      newScore += config.streakBonusMultiplier * config.correctPoints;
    }
    if (newStreak > newBestStreak) {
      newBestStreak = newStreak;
    }
  } else {
    newStreak = 0;
    newScore -= config.wrongPenalty;
    if (newScore < 0) newScore = 0;
  }

  // Advance to next country
  String nextCountry = state.currentCountry;
  List<String> newQueue = List.from(state.queue);

  if (newQueue.isNotEmpty) {
    nextCountry = newQueue.removeAt(0);
  } else {
    // Re-shuffle remaining countries that haven't been correctly identified
    final incorrectCodes = newAttempts
        .where((a) => !a.correct)
        .map((a) => a.countryCode)
        .toSet()
        .toList()
      ..shuffle(Random());

    if (incorrectCodes.isNotEmpty) {
      nextCountry = incorrectCodes.first;
      newQueue = incorrectCodes.sublist(1);
    }
    // If all correct, keep cycling the last country (game ends by timer anyway)
  }

  return (
    state: state.copyWith(
      queue: newQueue,
      currentCountry: nextCountry,
      attempts: newAttempts,
      score: newScore,
      streak: newStreak,
      bestStreak: newBestStreak,
    ),
    correct: isCorrect,
  );
}

/// Skip the current flag.
FlagSprintState skipFlag(FlagSprintState state) {
  final attempt = FlagAttempt(
    countryCode: state.currentCountry,
    correct: false,
    timeMs: DateTime.now().millisecondsSinceEpoch,
  );

  List<String> newQueue = List.from(state.queue);
  // Put skipped country at the back
  newQueue.add(state.currentCountry);

  String nextCountry = state.currentCountry;
  if (newQueue.isNotEmpty) {
    nextCountry = newQueue.removeAt(0);
  }

  return state.copyWith(
    queue: newQueue,
    currentCountry: nextCountry,
    attempts: [...state.attempts, attempt],
    streak: 0,
  );
}

/// Handle timer tick.
FlagSprintState flagSprintTick(FlagSprintState state) {
  final newTime = state.timeLeft - 1;
  if (newTime <= 0) {
    return state.copyWith(
      phase: GamePhase.resolution,
      timeLeft: 0,
    );
  }
  return state.copyWith(timeLeft: newTime);
}

/// Get display name for a country code.
String getFlagCountryName(String code, {String locale = 'en'}) {
  return countryName(code, locale: locale);
}

/// Get game summary statistics.
Map<String, dynamic> getFlagSprintStats(FlagSprintState state) {
  final correct = state.attempts.where((a) => a.correct).length;
  final wrong = state.attempts.where((a) => !a.correct).length;
  return {
    'score': state.score,
    'correct': correct,
    'wrong': wrong,
    'total': state.attempts.length,
    'bestStreak': state.bestStreak,
    'accuracy': state.attempts.isEmpty ? 0.0 : correct / state.attempts.length,
  };
}
