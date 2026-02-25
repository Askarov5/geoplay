import 'dart:math';
import '../core/data/countries.dart';
import '../core/data/country_tiers.dart';
import '../core/data/country_names.dart';
import '../core/data/capital_names.dart';
import 'types.dart';

/// Capital Clash game engine — pure Dart logic.
/// Ported from lib/game-engine/capitals.ts.

/// Create a new Capital Clash game.
CapitalClashState createCapitalClashGame(Difficulty difficulty, Continent continent) {
  final config = capitalClashConfigs[difficulty]!;
  final continentName = continentDataName(continent);

  // Build pool filtered by tier and continent
  final pool = getCountryPool(difficulty.name, continentName);
  final shuffled = List<String>.from(pool)..shuffle(Random());

  // Generate questions
  final questions = <CapitalQuestion>[];
  for (final code in shuffled) {
    final name = countryName(code);
    final capital = capitalName(code);

    if (config.bothWays && Random().nextBool()) {
      // capital → country
      questions.add(CapitalQuestion(
        countryCode: code,
        direction: CapitalDirection.capitalToCountry,
        question: capital,
        answer: name,
      ));
    } else {
      // country → capital
      questions.add(CapitalQuestion(
        countryCode: code,
        direction: CapitalDirection.countryToCapital,
        question: name,
        answer: capital,
      ));
    }
  }

  return CapitalClashState(
    phase: GamePhase.countdown,
    difficulty: difficulty,
    continent: continent,
    questions: questions,
    currentIndex: 0,
    attempts: const [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    timeLeft: config.totalTime,
    totalTime: config.totalTime,
    wrongPenalty: config.wrongPenalty,
    bothWays: config.bothWays,
  );
}

/// Submit a guess for the current capital question.
({CapitalClashState state, bool correct}) submitCapitalGuess(
  CapitalClashState state,
  String input,
) {
  final config = capitalClashConfigs[state.difficulty]!;
  final question = state.currentQuestion;
  if (question == null) return (state: state, correct: false);

  bool isCorrect = false;
  final trimmed = input.trim().toLowerCase();

  if (question.direction == CapitalDirection.countryToCapital) {
    // User types a capital — match against the correct capital
    final correctCapital = question.answer.toLowerCase();
    isCorrect = trimmed == correctCapital;

    // Also check if they typed a valid capital name (flexible matching)
    if (!isCorrect) {
      final code = question.countryCode;
      final possibleCapitals = capitalNames.values
          .map((m) => m[code]?.toLowerCase())
          .where((c) => c != null);
      isCorrect = possibleCapitals.any((c) => c == trimmed);
    }
  } else {
    // User types a country name — resolve to code
    final resolvedCode = resolveCountryCode(input);
    isCorrect = resolvedCode != null &&
        resolvedCode.toUpperCase() == question.countryCode.toUpperCase();
  }

  final attempt = CapitalAttempt(
    countryCode: question.countryCode,
    direction: question.direction,
    correct: isCorrect,
    userAnswer: input,
    timeMs: DateTime.now().millisecondsSinceEpoch,
  );

  final newAttempts = [...state.attempts, attempt];

  int newScore = state.score;
  int newStreak = state.streak;
  int newBestStreak = state.bestStreak;

  if (isCorrect) {
    newStreak++;
    newScore += config.correctPoints;
    if (newStreak > 0 && newStreak % 3 == 0) {
      newScore += config.correctPoints; // streak bonus
    }
    if (newStreak > newBestStreak) {
      newBestStreak = newStreak;
    }
  } else {
    newStreak = 0;
    newScore -= config.wrongPenalty;
    if (newScore < 0) newScore = 0;
  }

  final newIndex = state.currentIndex + 1;

  // Check if we've run out of questions
  final isFinished = newIndex >= state.questions.length;

  return (
    state: state.copyWith(
      phase: isFinished ? GamePhase.resolution : null,
      currentIndex: newIndex,
      attempts: newAttempts,
      score: newScore,
      streak: newStreak,
      bestStreak: newBestStreak,
    ),
    correct: isCorrect,
  );
}

/// Skip the current question.
CapitalClashState skipCapitalQuestion(CapitalClashState state) {
  final question = state.currentQuestion;
  if (question == null) return state;

  final attempt = CapitalAttempt(
    countryCode: question.countryCode,
    direction: question.direction,
    correct: false,
    timeMs: DateTime.now().millisecondsSinceEpoch,
  );

  final newIndex = state.currentIndex + 1;
  final isFinished = newIndex >= state.questions.length;

  return state.copyWith(
    phase: isFinished ? GamePhase.resolution : null,
    currentIndex: newIndex,
    attempts: [...state.attempts, attempt],
    streak: 0,
  );
}

/// Handle timer tick.
CapitalClashState capitalClashTick(CapitalClashState state) {
  final newTime = state.timeLeft - 1;
  if (newTime <= 0) {
    return state.copyWith(
      phase: GamePhase.resolution,
      timeLeft: 0,
    );
  }
  return state.copyWith(timeLeft: newTime);
}

/// Get game summary statistics.
Map<String, dynamic> getCapitalClashStats(CapitalClashState state) {
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
