import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../engines/types.dart';

import '../../providers/settings_provider.dart';
import '../../providers/game_providers.dart';
import '../../theme/game_colors.dart';
import '../../widgets/game_top_bar.dart';
import '../../widgets/timer_bar.dart';
import '../../widgets/flag_image.dart';
import '../../widgets/autocomplete_input.dart';
import '../../core/data/countries.dart';
import 'countdown_overlay.dart';
import 'result_overlay.dart';

/// Flag Sprint gameplay screen.
class FlagSprintScreen extends ConsumerStatefulWidget {
  const FlagSprintScreen({super.key});

  @override
  ConsumerState<FlagSprintScreen> createState() => _FlagSprintScreenState();
}

class _FlagSprintScreenState extends ConsumerState<FlagSprintScreen> {
  bool _showFlash = false;
  Color _flashColor = Colors.transparent;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final difficulty = ref.read(difficultyProvider);
      final continent = ref.read(continentProvider);
      ref.read(flagSprintProvider.notifier).startGame(difficulty, continent);
    });
  }

  void _onSubmit(String input) {
    if (input.trim().isEmpty) return;
    final notifier = ref.read(flagSprintProvider.notifier);
    final stateBefore = ref.read(flagSprintProvider);
    notifier.submitGuess(input);
    final stateAfter = ref.read(flagSprintProvider);

    if (stateAfter == null || stateBefore == null) return;

    // Flash feedback
    final wasCorrect = stateAfter.score > stateBefore.score;
    setState(() {
      _showFlash = true;
      _flashColor = wasCorrect
          ? GameColors.correct.withValues(alpha: 0.2)
          : GameColors.wrong.withValues(alpha: 0.2);
    });
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _showFlash = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(flagSprintProvider);
    if (gameState == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF0A0E1A).withValues(alpha: 0.85)
          : const Color(0xFFF8FAFC).withValues(alpha: 0.85),
      body: Stack(
        children: [
          // Main game content
          Column(
            children: [
              GameTopBar(
                title: 'Flag Sprint',
                score: gameState.score,
                streak: gameState.streak,
                accentColor: GameColors.flagSprint,
                onClose: () {
                  ref.read(flagSprintProvider.notifier).reset();
                  context.pop();
                },
              ),
              TimerBar(
                timeLeft: gameState.timeLeft,
                totalTime: gameState.totalTime,
                color: GameColors.flagSprint,
              ),

              // Flag display
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FlagImage(
                        countryCode: gameState.currentCountry,
                        size: 120,
                      ).animate(
                        key: ValueKey(gameState.currentCountry),
                      ).fadeIn(duration: 200.ms).scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1, 1),
                        duration: 300.ms,
                        curve: Curves.easeOut,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Which country\'s flag is this?',
                        style: TextStyle(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white.withValues(alpha: 0.5)
                              : Colors.black.withValues(alpha: 0.5),
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Input bar (bottom)
          if (gameState.phase == GamePhase.playing)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AutocompleteInput(
                    suggestions: getAllCountryNames(),
                    hintText: 'Type country name...',
                    onSubmit: _onSubmit,
                    onSkip: () => ref.read(flagSprintProvider.notifier).skip(),
                    accentColor: GameColors.flagSprint,
                  ),
                ],
              ),
            ),

          // Flash feedback
          if (_showFlash)
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  color: _flashColor,
                ),
              ),
            ),

          // Countdown overlay
          if (gameState.phase == GamePhase.countdown)
            Positioned.fill(
              child: CountdownOverlay(
                onComplete: () {
                  ref.read(flagSprintProvider.notifier).beginPlaying();
                },
              ),
            ),

          // Result overlay
          if (gameState.phase == GamePhase.resolution)
            Positioned.fill(
              child: ResultOverlay(
                score: gameState.score,
                correct: gameState.attempts.where((a) => a.correct).length,
                wrong: gameState.attempts.where((a) => !a.correct).length,
                bestStreak: gameState.bestStreak,
                accentColor: GameColors.flagSprint,
                onPlayAgain: () {
                  final difficulty = ref.read(difficultyProvider);
                  final continent = ref.read(continentProvider);
                  ref.read(flagSprintProvider.notifier).startGame(difficulty, continent);
                },
                onHome: () {
                  ref.read(flagSprintProvider.notifier).reset();
                  context.pop();
                },
              ),
            ),
        ],
      ),
    );
  }
}
