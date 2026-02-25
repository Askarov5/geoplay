import 'package:flutter/material.dart';

/// Standardized skip button for all games.
class GameSkipButton extends StatelessWidget {
  final VoidCallback onSkip;
  final Color? textColor;

  const GameSkipButton({
    super.key,
    required this.onSkip,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = textColor ??
        (isDark ? Colors.white.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.5));

    return TextButton.icon(
      onPressed: onSkip,
      icon: Icon(Icons.skip_next_rounded, color: color, size: 18),
      label: Text(
        'Skip',
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: color.withValues(alpha: 0.2)),
        ),
      ),
    );
  }
}

/// Standardized hint button for all games.
class GameHintButton extends StatelessWidget {
  final VoidCallback? onHint;
  final int hintsUsed;
  final int maxHints;
  final Color accentColor;

  const GameHintButton({
    super.key,
    required this.onHint,
    this.hintsUsed = 0,
    this.maxHints = 2,
    this.accentColor = const Color(0xFFF59E0B),
  });

  @override
  Widget build(BuildContext context) {
    final isAvailable = hintsUsed < maxHints;
    final color = isAvailable ? accentColor : Colors.grey;

    return IconButton(
      onPressed: isAvailable ? onHint : null,
      tooltip: isAvailable
          ? 'Hint (${maxHints - hintsUsed} left)'
          : 'No hints left',
      icon: Badge(
        isLabelVisible: isAvailable,
        label: Text(
          '${maxHints - hintsUsed}',
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
        ),
        backgroundColor: accentColor,
        child: Icon(Icons.lightbulb_outline, color: color, size: 22),
      ),
      style: IconButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
