import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../engines/types.dart';
import '../engines/flag_sprint_engine.dart';
import '../engines/capital_clash_engine.dart';

// ─── Flag Sprint Provider ───

final flagSprintProvider =
    StateNotifierProvider<FlagSprintNotifier, FlagSprintState?>((ref) {
  return FlagSprintNotifier();
});

class FlagSprintNotifier extends StateNotifier<FlagSprintState?> {
  Timer? _timer;

  FlagSprintNotifier() : super(null);

  void startGame(Difficulty difficulty, Continent continent) {
    state = createFlagSprintGame(difficulty, continent);
    // Start countdown → playing transition handled by UI
  }

  void beginPlaying() {
    if (state == null) return;
    state = state!.copyWith(phase: GamePhase.playing);
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state == null || state!.phase != GamePhase.playing) {
        _timer?.cancel();
        return;
      }
      state = flagSprintTick(state!);
      if (state!.phase == GamePhase.resolution) {
        _timer?.cancel();
        HapticFeedback.heavyImpact();
      }
    });
  }

  void submitGuess(String input) {
    if (state == null || state!.phase != GamePhase.playing) return;
    final result = submitFlagGuess(state!, input);
    state = result.state;
    if (result.correct) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.heavyImpact();
    }
  }

  void skip() {
    if (state == null || state!.phase != GamePhase.playing) return;
    state = skipFlag(state!);
  }

  void endGame() {
    _timer?.cancel();
    if (state != null) {
      state = state!.copyWith(phase: GamePhase.resolution);
    }
  }

  void reset() {
    _timer?.cancel();
    state = null;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

// ─── Capital Clash Provider ───

final capitalClashProvider =
    StateNotifierProvider<CapitalClashNotifier, CapitalClashState?>((ref) {
  return CapitalClashNotifier();
});

class CapitalClashNotifier extends StateNotifier<CapitalClashState?> {
  Timer? _timer;

  CapitalClashNotifier() : super(null);

  void startGame(Difficulty difficulty, Continent continent) {
    state = createCapitalClashGame(difficulty, continent);
  }

  void beginPlaying() {
    if (state == null) return;
    state = state!.copyWith(phase: GamePhase.playing);
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state == null || state!.phase != GamePhase.playing) {
        _timer?.cancel();
        return;
      }
      state = capitalClashTick(state!);
      if (state!.phase == GamePhase.resolution) {
        _timer?.cancel();
        HapticFeedback.heavyImpact();
      }
    });
  }

  void submitGuess(String input) {
    if (state == null || state!.phase != GamePhase.playing) return;
    final result = submitCapitalGuess(state!, input);
    state = result.state;
    if (result.correct) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.heavyImpact();
    }
    if (state!.phase == GamePhase.resolution) {
      _timer?.cancel();
    }
  }

  void skip() {
    if (state == null || state!.phase != GamePhase.playing) return;
    state = skipCapitalQuestion(state!);
    if (state!.phase == GamePhase.resolution) {
      _timer?.cancel();
    }
  }

  void endGame() {
    _timer?.cancel();
    if (state != null) {
      state = state!.copyWith(phase: GamePhase.resolution);
    }
  }

  void reset() {
    _timer?.cancel();
    state = null;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
