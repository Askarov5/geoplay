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
import '../../widgets/autocomplete_input.dart';
import '../../core/data/countries.dart';
import 'countdown_overlay.dart';
import 'result_overlay.dart';

/// Capital Clash gameplay screen.
class CapitalClashScreen extends ConsumerStatefulWidget {
  const CapitalClashScreen({super.key});

  @override
  ConsumerState<CapitalClashScreen> createState() => _CapitalClashScreenState();
}

class _CapitalClashScreenState extends ConsumerState<CapitalClashScreen> {
  bool _showFlash = false;
  Color _flashColor = Colors.transparent;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final difficulty = ref.read(difficultyProvider);
      final continent = ref.read(continentProvider);
      ref.read(capitalClashProvider.notifier).startGame(difficulty, continent);
    });
  }

  void _onSubmit(String input) {
    if (input.trim().isEmpty) return;
    final notifier = ref.read(capitalClashProvider.notifier);
    final stateBefore = ref.read(capitalClashProvider);
    notifier.submitGuess(input);
    final stateAfter = ref.read(capitalClashProvider);

    if (stateAfter == null || stateBefore == null) return;

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
    final gameState = ref.watch(capitalClashProvider);
    if (gameState == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentQ = gameState.currentQuestion;

    // Determine hint text and suggestions based on direction
    final isCountryToCapital =
        currentQ?.direction == CapitalDirection.countryToCapital;
    final hintText = isCountryToCapital
        ? 'Type capital name...'
        : 'Type country name...';
    final suggestions = isCountryToCapital
        ? getAllCapitalNames()
        : getAllCountryNames();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0E1A).withValues(alpha: 0.85) : const Color(0xFFF8FAFC).withValues(alpha: 0.85),
      body: Stack(
        children: [
          // Main content
          Column(
            children: [
              GameTopBar(
                title: 'Capital Clash',
                score: gameState.score,
                streak: gameState.streak,
                accentColor: GameColors.capitalClash,
                onClose: () {
                  ref.read(capitalClashProvider.notifier).reset();
                  context.pop();
                },
              ),
              TimerBar(
                timeLeft: gameState.timeLeft,
                totalTime: gameState.totalTime,
                color: GameColors.capitalClash,
              ),

              // Question display
              Expanded(
                child: Center(
                  child: currentQ != null
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Direction indicator
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: GameColors.capitalClash.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isCountryToCapital
                                    ? '🏙️ What is the capital?'
                                    : '🌍 Which country?',
                                style: const TextStyle(
                                  color: GameColors.capitalClash,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Question text
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 40),
                              child: Text(
                                currentQ.question,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: isDark ? Colors.white : Colors.black87,
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                ),
                              ).animate(
                                key: ValueKey(currentQ.countryCode),
                              ).fadeIn(duration: 200.ms).slideY(
                                begin: 0.1,
                                end: 0,
                                duration: 300.ms,
                                curve: Curves.easeOut,
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Progress
                            Text(
                              '${gameState.currentIndex + 1} / ${gameState.questions.length}',
                              style: TextStyle(
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.3)
                                    : Colors.black.withValues(alpha: 0.3),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        )
                      : const SizedBox.shrink(),
                ),
              ),
            ],
          ),

          // Input bar
          if (gameState.phase == GamePhase.playing)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AutocompleteInput(
                    key: ValueKey(currentQ?.countryCode),
                    suggestions: suggestions,
                    hintText: hintText,
                    onSubmit: _onSubmit,
                    onSkip: () => ref.read(capitalClashProvider.notifier).skip(),
                    accentColor: GameColors.capitalClash,
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

          // Countdown
          if (gameState.phase == GamePhase.countdown)
            Positioned.fill(
              child: CountdownOverlay(
                onComplete: () {
                  ref.read(capitalClashProvider.notifier).beginPlaying();
                },
              ),
            ),

          // Results
          if (gameState.phase == GamePhase.resolution)
            Positioned.fill(
              child: ResultOverlay(
                score: gameState.score,
                correct: gameState.attempts.where((a) => a.correct).length,
                wrong: gameState.attempts.where((a) => !a.correct).length,
                bestStreak: gameState.bestStreak,
                accentColor: GameColors.capitalClash,
                onPlayAgain: () {
                  final difficulty = ref.read(difficultyProvider);
                  final continent = ref.read(continentProvider);
                  ref.read(capitalClashProvider.notifier).startGame(difficulty, continent);
                },
                onHome: () {
                  ref.read(capitalClashProvider.notifier).reset();
                  context.pop();
                },
              ),
            ),
        ],
      ),
    );
  }
}
