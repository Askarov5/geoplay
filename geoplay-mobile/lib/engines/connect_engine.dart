import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/data/countries.dart';
import '../core/data/graph.dart';
import '../core/data/adjacency.dart';
import 'types.dart';
import '../core/map/map_controller.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

// --- Types ---

class GameMove {
  final String countryCode;
  final int timeMs;

  const GameMove({
    required this.countryCode,
    required this.timeMs,
  });
}

class ConnectSubmitResult {
  final ConnectGameState state;
  final String result; // 'correct', 'wrong', 'already_guessed', 'not_neighbor'

  const ConnectSubmitResult({
    required this.state,
    required this.result,
  });
}

class ConnectGameState {
  final GamePhase phase;
  final Difficulty difficulty;
  final Continent continent;
  final String startCountry;
  final String endCountry;
  final List<String> optimalPath;
  final List<String> playerPath; // Includes startCountry
  final List<GameMove> moves;
  final String currentPosition;
  final int wrongAttempts;
  final int consecutiveWrongAttempts;
  final int hintsUsed;
  final int score;
  final bool isComplete;
  final bool isTimeout;
  final int revealTimeLeft;
  final int executionTimeLeft;

  const ConnectGameState({
    required this.phase,
    required this.difficulty,
    required this.continent,
    required this.startCountry,
    required this.endCountry,
    required this.optimalPath,
    required this.playerPath,
    required this.moves,
    required this.currentPosition,
    required this.wrongAttempts,
    required this.consecutiveWrongAttempts,
    required this.hintsUsed,
    required this.score,
    required this.isComplete,
    required this.isTimeout,
    required this.revealTimeLeft,
    required this.executionTimeLeft,
  });

  ConnectGameState copyWith({
    GamePhase? phase,
    String? startCountry,
    String? endCountry,
    List<String>? optimalPath,
    List<String>? playerPath,
    List<GameMove>? moves,
    String? currentPosition,
    int? wrongAttempts,
    int? consecutiveWrongAttempts,
    int? hintsUsed,
    int? score,
    bool? isComplete,
    bool? isTimeout,
    int? revealTimeLeft,
    int? executionTimeLeft,
  }) {
    return ConnectGameState(
      phase: phase ?? this.phase,
      difficulty: difficulty,
      continent: continent,
      startCountry: startCountry ?? this.startCountry,
      endCountry: endCountry ?? this.endCountry,
      optimalPath: optimalPath ?? this.optimalPath,
      playerPath: playerPath ?? this.playerPath,
      moves: moves ?? this.moves,
      currentPosition: currentPosition ?? this.currentPosition,
      wrongAttempts: wrongAttempts ?? this.wrongAttempts,
      consecutiveWrongAttempts:
          consecutiveWrongAttempts ?? this.consecutiveWrongAttempts,
      hintsUsed: hintsUsed ?? this.hintsUsed,
      score: score ?? this.score,
      isComplete: isComplete ?? this.isComplete,
      isTimeout: isTimeout ?? this.isTimeout,
      revealTimeLeft: revealTimeLeft ?? this.revealTimeLeft,
      executionTimeLeft: executionTimeLeft ?? this.executionTimeLeft,
    );
  }
}

// --- Logic ---

ConnectGameState createConnectGame(Difficulty difficulty, Continent continent) {
  var availableCountries = countries.toList();
  Set<String>? continentCountryCodes;
  if (continent != Continent.all) {
    final contName = continentDataName(continent);
    availableCountries =
        availableCountries.where((c) => c.continent == contName).toList();
    continentCountryCodes = availableCountries.map((c) => c.code).toSet();
  }

  // Fallback if continent has too few countries
  if (availableCountries.length < 5) {
    availableCountries = countries.toList();
    continentCountryCodes = null;
  }

  availableCountries.shuffle();
  final targetDistanceRange = _getDistanceRangeForDifficulty(difficulty);
  
  String? startCountryCode;
  String? endCountryCode;
  
  // Try to find a pair of countries matching the exact distance criteria
  for (final candidate in availableCountries) {
     if (getNeighbors(candidate.code).isEmpty) continue;
     
     final distances = _bfsDistances(candidate.code, allowedCountries: continentCountryCodes);
     
     final validTargets = distances.entries.where((e) {
        return e.value >= targetDistanceRange[0] && e.value <= targetDistanceRange[1];
     }).map((e) => e.key).toList();
     
     if (validTargets.isNotEmpty) {
         startCountryCode = candidate.code;
         validTargets.shuffle();
         endCountryCode = validTargets.first;
         break;
     }
  }

  // If strict constraints fail (e.g. playing Hard on a small continent), relax distance > 1
  if (startCountryCode == null || endCountryCode == null) {
      for (final candidate in availableCountries) {
         if (getNeighbors(candidate.code).isEmpty) continue;
         final distances = _bfsDistances(candidate.code, allowedCountries: continentCountryCodes);
         final anyValidTarget = distances.entries.where((e) => e.value > 1).map((e) => e.key).toList();
         if (anyValidTarget.isNotEmpty) {
             startCountryCode = candidate.code;
             anyValidTarget.shuffle();
             endCountryCode = anyValidTarget.first;
             break;
         }
      }
  }

  // Final fallback (extremely broken graph)
  if (startCountryCode == null || endCountryCode == null) {
      startCountryCode = availableCountries.firstWhere((c) => getNeighbors(c.code).isNotEmpty).code;
      endCountryCode = getNeighbors(startCountryCode).first;
  }
  
  // Calculate optimal path
  final optimalPath = findShortestPath(startCountryCode, endCountryCode, allowedCountries: continentCountryCodes) ?? [];

  return ConnectGameState(
    phase: GamePhase.countdown,
    difficulty: difficulty,
    continent: continent,
    startCountry: startCountryCode,
    endCountry: endCountryCode,
    optimalPath: optimalPath,
    playerPath: [startCountryCode],
    moves: [],
    currentPosition: startCountryCode,
    wrongAttempts: 0,
    consecutiveWrongAttempts: 0,
    hintsUsed: 0,
    score: 0,
    isComplete: false,
    isTimeout: false,
    revealTimeLeft: 3, // Standard 3-2-1 countdown
    executionTimeLeft: getTimeLimitForDifficulty(difficulty),
  );
}

List<int> _getDistanceRangeForDifficulty(Difficulty diff) {
  switch (diff) {
    case Difficulty.easy:
      return [2, 3]; 
    case Difficulty.medium:
      return [4, 6]; 
    case Difficulty.hard:
      return [7, 99]; 
  }
}

int getTimeLimitForDifficulty(Difficulty diff) {
    switch (diff) {
        case Difficulty.easy: return 90;
        case Difficulty.medium: return 120;
        case Difficulty.hard: return 180;
    }
}


Map<String, int> _bfsDistances(String start, {Set<String>? allowedCountries}) {
  final Map<String, int> distances = {start: 0};
  final List<String> queue = [start];
  
  while (queue.isNotEmpty) {
    final current = queue.removeAt(0);
    final dist = distances[current]!;
    
    for (final neighbor in getNeighbors(current)) {
      if (allowedCountries != null && !allowedCountries.contains(neighbor)) {
        continue;
      }
      if (!distances.containsKey(neighbor)) {
        distances[neighbor] = dist + 1;
        queue.add(neighbor);
      }
    }
  }
  return distances;
}

ConnectSubmitResult connectSubmitMove(ConnectGameState state, String inputCode) {
    if (state.isComplete || state.isTimeout || state.phase != GamePhase.playing) {
        return ConnectSubmitResult(state: state, result: 'invalid_state');
    }

    if (state.playerPath.contains(inputCode)) {
        return ConnectSubmitResult(state: state, result: 'already_guessed');
    }

    final validNeighbor = isNeighbor(state.currentPosition, inputCode);
    
    if (!validNeighbor) {
         final newState = state.copyWith(
            wrongAttempts: state.wrongAttempts + 1,
            consecutiveWrongAttempts: state.consecutiveWrongAttempts + 1,
            score: (state.score - 10).clamp(0, 9999), 
        );
        return ConnectSubmitResult(state: newState, result: 'wrong');
    }

    // Correct Move
    final newPath = List<String>.from(state.playerPath)..add(inputCode);
    final moveTime = getTimeLimitForDifficulty(state.difficulty) - state.executionTimeLeft;
    final moves = List<GameMove>.from(state.moves)..add(GameMove(countryCode: inputCode, timeMs: moveTime * 1000));
    
    final isComplete = inputCode == state.endCountry || isNeighbor(inputCode, state.endCountry);
    
    // Calculate Score for this move
    int moveScore = 10;
    final timeRatio = state.executionTimeLeft / getTimeLimitForDifficulty(state.difficulty);
    moveScore += (timeRatio * 10).round();
    
    // Streak bonus if following optimal path length (simplified streak logic)
    if (newPath.length <= state.optimalPath.length) {
         moveScore = (moveScore * (1.0 + (newPath.length -1) * 0.02)).round();
    }

    final newState = state.copyWith(
        playerPath: newPath,
        currentPosition: inputCode,
        moves: moves,
        score: state.score + moveScore,
        isComplete: isComplete,
        consecutiveWrongAttempts: 0,
        phase: isComplete ? GamePhase.resolution : GamePhase.playing,
    );

    return ConnectSubmitResult(state: newState, result: 'correct');
}


// --- Riverpod Provider ---

final connectGameProvider = StateNotifierProvider<ConnectGameNotifier, ConnectGameState?>((ref) {
  return ConnectGameNotifier(ref);
});

class ConnectGameNotifier extends StateNotifier<ConnectGameState?> {
  final Ref _ref;
  Timer? _timer;

  ConnectGameNotifier(this._ref) : super(null);

  void startGame(Difficulty difficulty, Continent continent) {
    _timer?.cancel();
    state = createConnectGame(difficulty, continent);
    
    // Map setup
    final mapCtrl = _ref.read(mapControllerProvider.notifier);
    mapCtrl.setInteractionEnabled(false);
    mapCtrl.setBuiltInLabelsVisible(false); // Hide all built-in country names
    mapCtrl.hideAllLabels(); // Clear any dynamically added point annotations
    mapCtrl.clearAllHighlights();
    mapCtrl.clearPath();
    mapCtrl.clearMarkers();
    
    // Highlight start/end
    mapCtrl.highlightCountries({
        state!.startCountry: Colors.green,
        state!.endCountry: Colors.red,
    });
    
    // Fly to show both
    mapCtrl.flyToShowCountries([state!.startCountry, state!.endCountry], padding: 120);
    // The standard 3-2-1 CountdownOverlay handles the countdown in the UI.
    // beginPlaying() is called when the countdown completes.
  }

  /// Called by the standard CountdownOverlay when the 3-2-1 finishes.
  void beginPlaying() {
    if (state == null) return;
    state = state!.copyWith(phase: GamePhase.playing);
    
    // Map Setup for playing
    final mapCtrl = _ref.read(mapControllerProvider.notifier);
    mapCtrl.highlightCountries({
      state!.startCountry: Colors.blue.shade700,
      state!.endCountry: Colors.red,
    });
    mapCtrl.flyToShowCountries([state!.startCountry, state!.endCountry], padding: 80);
    mapCtrl.addPulsingMarker(state!.startCountry, Colors.white);

    _startExecutionTimer();
  }


  void _startExecutionTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state == null || state!.phase != GamePhase.playing) {
        timer.cancel();
        return;
      }

      if (state!.executionTimeLeft > 0) {
        state = state!.copyWith(executionTimeLeft: state!.executionTimeLeft - 1);
      } else {
        timer.cancel();
        handleTimeout();
      }
    });
  }

  void submitMove(String inputCode) {
    if (state == null || state!.phase != GamePhase.playing) return;

    final result = connectSubmitMove(state!, inputCode);
    state = result.state;

    final mapCtrl = _ref.read(mapControllerProvider.notifier);

    if (result.result == 'correct') {
      HapticFeedback.mediumImpact();
      mapCtrl.addPulsingMarker(state!.currentPosition, Colors.white);
      
      // Update highlights: green silhouette for revealed countries, red for target
      final highlights = <String, Color>{ state!.endCountry: Colors.red };
      for (final p in state!.playerPath) {
          highlights[p] = const Color(0xFF4CAF50); // Green silhouette for visited
      }
      // Start country stays blue
      highlights[state!.startCountry] = const Color(0xFF1976D2);
      mapCtrl.highlightCountries(highlights);
      
      // Reveal country names for visited countries
      final labels = <String, String>{};
      for (final code in state!.playerPath) {
        final country = getCountryByCode(code);
        if (country != null) {
          labels[code] = country.name;
        }
      }
      mapCtrl.showCountryLabels(labels);
      
      mapCtrl.drawPath(state!.playerPath, Colors.white);
      mapCtrl.flyToCountry(state!.currentPosition, zoom: 5.0); // Gentle reframe

      if (state!.isComplete) {
         _timer?.cancel();
         _handleResolution();
      }
    } else if (result.result == 'wrong') {
      HapticFeedback.heavyImpact();
      mapCtrl.flashCountry(inputCode, Colors.red);
    }
  }

  void useHint() {
      if (state == null || state!.hintsUsed >= 2) return;
      
      // Simple hint: Next optimal step
      Set<String>? continentCountryCodes;
      if (state!.continent != Continent.all) {
          final contName = continentDataName(state!.continent);
          continentCountryCodes = countries.where((c) => c.continent == contName).map((c) => c.code).toSet();
      }

      final pathFromCurrent = findShortestPath(state!.currentPosition, state!.endCountry, allowedCountries: continentCountryCodes);
      if (pathFromCurrent != null && pathFromCurrent.length > 1) {
          final nextStep = pathFromCurrent[1]; 
          
          final mapCtrl = _ref.read(mapControllerProvider.notifier);
          mapCtrl.flashCountry(nextStep, Colors.amber, durationMs: 1500);
          
          state = state!.copyWith(
              hintsUsed: state!.hintsUsed + 1,
              score: (state!.score - 15).clamp(0, 9999),
          );
      }
  }

  void skip() {
      // Skip just starts a new game with different countries
       if (state == null) return;
       _timer?.cancel();
       final difficulty = state!.difficulty;
       final continent = state!.continent;
       cleanup();
       startGame(difficulty, continent);
  }

  void handleTimeout() {
     if (state == null) return;
     state = state!.copyWith(isTimeout: true, phase: GamePhase.resolution);
     _handleResolution();
  }

  void _handleResolution() {
       final mapCtrl = _ref.read(mapControllerProvider.notifier);
       mapCtrl.clearMarkers();
       
       // Highlight optimal path
       mapCtrl.drawPath(state!.optimalPath, Colors.amber);
       
       final highlights = <String, Color>{};
       for (final code in state!.optimalPath) {
           highlights[code] = Colors.amber.withValues(alpha: 0.6);
       }
       if (!state!.isComplete) {
            highlights[state!.endCountry] = Colors.red;
       }
       
       mapCtrl.highlightCountries(highlights);
       mapCtrl.flyToShowCountries(state!.optimalPath, padding: 80);
       
        // We'd store results here using Hive/SharedPreferences
  }


  void cleanup() {
    _timer?.cancel();
    state = null;
    final mapCtrl = _ref.read(mapControllerProvider.notifier);
    mapCtrl.clearAllHighlights();
    mapCtrl.clearPath();
    mapCtrl.clearMarkers();
    mapCtrl.setInteractionEnabled(true);
    mapCtrl.setBuiltInLabelsVisible(true); // Restore labels when leaving game
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
