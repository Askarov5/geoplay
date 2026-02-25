import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../engines/types.dart';
import '../../providers/settings_provider.dart';

/// Easy / Medium / Hard toggle pills.
class DifficultySelector extends ConsumerWidget {
  const DifficultySelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(difficultyProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      children: Difficulty.values.map((d) {
        final isSelected = d == selected;
        final label = switch (d) {
          Difficulty.easy => 'Easy',
          Difficulty.medium => 'Medium',
          Difficulty.hard => 'Hard',
        };
        final color = switch (d) {
          Difficulty.easy => const Color(0xFF22C55E),
          Difficulty.medium => const Color(0xFFF59E0B),
          Difficulty.hard => const Color(0xFFEF4444),
        };

        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => ref.read(difficultyProvider.notifier).state = d,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? color.withValues(alpha: 0.15)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? color.withValues(alpha: 0.4)
                      : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08)),
                  width: 1,
                ),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? color
                      : (isDark ? Colors.white.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.5)),
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
