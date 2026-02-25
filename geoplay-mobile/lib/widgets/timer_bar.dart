import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Animated timer progress bar with color transitions and pulse on low time.
class TimerBar extends StatelessWidget {
  final int timeLeft;
  final int totalTime;
  final Color? color;

  const TimerBar({
    super.key,
    required this.timeLeft,
    required this.totalTime,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final progress = totalTime > 0 ? timeLeft / totalTime : 0.0;
    final isLow = timeLeft <= 10;
    final isCritical = timeLeft <= 5;

    Color barColor;
    if (isCritical) {
      barColor = const Color(0xFFEF4444);
    } else if (isLow) {
      barColor = const Color(0xFFF59E0B);
    } else {
      barColor = color ?? const Color(0xFF3B82F6);
    }

    return SizedBox(
      height: 4,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(2),
        child: Stack(
          children: [
            // Background track
            Container(
              color: Colors.white.withValues(alpha: 0.08),
            ),
            // Progress fill
            FractionallySizedBox(
              widthFactor: progress.clamp(0.0, 1.0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate(
      target: isCritical ? 1 : 0,
    ).shimmer(
      duration: const Duration(milliseconds: 800),
      color: Colors.white.withValues(alpha: 0.3),
    );
  }
}
