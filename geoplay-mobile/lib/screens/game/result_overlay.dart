import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../widgets/frosted_card.dart';

/// Post-game results card.
class ResultOverlay extends StatelessWidget {
  final int score;
  final int correct;
  final int wrong;
  final int bestStreak;
  final Color accentColor;
  final VoidCallback onPlayAgain;
  final VoidCallback onHome;

  const ResultOverlay({
    super.key,
    required this.score,
    required this.correct,
    required this.wrong,
    required this.bestStreak,
    required this.accentColor,
    required this.onPlayAgain,
    required this.onHome,
  });

  String get _emoji {
    if (wrong == 0 && correct > 0) return '🏆';
    final accuracy = correct / (correct + wrong);
    if (accuracy > 0.9) return '🌟';
    if (accuracy > 0.7) return '👏';
    if (accuracy > 0.5) return '👍';
    return '💪';
  }

  String get _message {
    if (wrong == 0 && correct > 0) return 'PERFECT!';
    final accuracy = correct / (correct + wrong);
    if (accuracy > 0.9) return 'AMAZING!';
    if (accuracy > 0.7) return 'GREAT!';
    if (accuracy > 0.5) return 'Good!';
    return 'Nice try!';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      color: Colors.black.withValues(alpha: 0.5),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: FrostedCard(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Emoji + Message
                Text(_emoji, style: const TextStyle(fontSize: 56))
                    .animate()
                    .scale(
                      begin: const Offset(0, 0),
                      end: const Offset(1, 1),
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                    ),
                const SizedBox(height: 8),
                Text(
                  _message,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 24),

                // Score
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        accentColor.withValues(alpha: 0.15),
                        accentColor.withValues(alpha: 0.05),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: accentColor.withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Score',
                        style: TextStyle(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.5)
                              : Colors.black.withValues(alpha: 0.5),
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        '$score',
                        style: TextStyle(
                          color: accentColor,
                          fontSize: 40,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _statCol('Correct', '$correct', const Color(0xFF22C55E), isDark),
                    _statCol('Wrong', '$wrong', const Color(0xFFEF4444), isDark),
                    _statCol('Streak', '$bestStreak', const Color(0xFFF59E0B), isDark),
                  ],
                ),
                const SizedBox(height: 28),

                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: _button(
                        'Home',
                        Icons.home_outlined,
                        isDark
                            ? Colors.white.withValues(alpha: 0.06)
                            : Colors.black.withValues(alpha: 0.04),
                        isDark ? Colors.white70 : Colors.black54,
                        onHome,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _button(
                        'Play Again',
                        Icons.refresh_rounded,
                        accentColor,
                        Colors.white,
                        onPlayAgain,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _statCol(String label, String value, Color color, bool isDark) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 24,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            color: isDark ? Colors.white.withValues(alpha: 0.4) : Colors.black.withValues(alpha: 0.4),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _button(String label, IconData icon, Color bg, Color fg, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: fg, size: 20),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: fg,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
