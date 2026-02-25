import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/data/countries.dart';
import '../../engines/connect_engine.dart';
import '../../engines/types.dart';
import '../../providers/settings_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/game_colors.dart';
import '../../widgets/autocomplete_input.dart';
import '../../widgets/game_top_bar.dart';
import '../../widgets/game_action_buttons.dart';
import '../../widgets/timer_bar.dart';
import 'countdown_overlay.dart';
import 'result_overlay.dart';

/// Full-screen Connect Countries game.
/// The globe background is provided by GameShell via ShellRoute.
class ConnectCountriesScreen extends ConsumerStatefulWidget {
  const ConnectCountriesScreen({super.key});

  @override
  ConsumerState<ConnectCountriesScreen> createState() => _ConnectCountriesScreenState();
}

class _ConnectCountriesScreenState extends ConsumerState<ConnectCountriesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final difficulty = ref.read(difficultyProvider);
      final continent = ref.read(continentProvider);
      ref.read(connectGameProvider.notifier).startGame(difficulty, continent);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(connectGameProvider);

    if (state == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      children: [
        // Main game content
        if (state.phase == GamePhase.playing)
          const ConnectPlayingOverlay(),

        // Countdown overlay — standard 3-2-1
        if (state.phase == GamePhase.countdown)
          Positioned.fill(
            child: CountdownOverlay(
              onComplete: () {
                ref.read(connectGameProvider.notifier).beginPlaying();
              },
            ),
          ),

        // Result overlay
        if (state.phase == GamePhase.resolution)
          Positioned.fill(
            child: ResultOverlay(
              score: state.score,
              correct: state.moves.length,
              wrong: state.wrongAttempts,
              bestStreak: state.optimalPath.length - 1,
              accentColor: GameColors.connect,
              onPlayAgain: () {
                final difficulty = ref.read(difficultyProvider);
                final continent = ref.read(continentProvider);
                ref.read(connectGameProvider.notifier).cleanup();
                ref.read(connectGameProvider.notifier).startGame(difficulty, continent);
              },
              onHome: () {
                ref.read(connectGameProvider.notifier).cleanup();
                context.pop();
              },
            ),
          ),
      ],
    );
  }
}

// Keep backward-compatible alias
typedef ConnectCountriesOverlay = ConnectCountriesScreen;

class ConnectPlayingOverlay extends ConsumerStatefulWidget {
  const ConnectPlayingOverlay({super.key});

  @override
  ConsumerState<ConnectPlayingOverlay> createState() => _ConnectPlayingOverlayState();
}

class _ConnectPlayingOverlayState extends ConsumerState<ConnectPlayingOverlay> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  
  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(connectGameProvider);
    if (state == null) return const SizedBox.shrink();

    final currentCountry = getCountryByCode(state.currentPosition);
    final targetCountry = getCountryByCode(state.endCountry);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final theme = isDark ? AppTheme.dark : AppTheme.light;

    return Column(
      children: [
        // Shared top bar with home button + confirmation
        GameTopBar(
          title: 'Connect Countries',
          score: state.score,
          accentColor: GameColors.connect,
          onClose: () {
            ref.read(connectGameProvider.notifier).cleanup();
            context.pop();
          },
        ),

        // Timer bar below top bar
        TimerBar(
          timeLeft: state.executionTimeLeft,
          totalTime: getTimeLimitForDifficulty(state.difficulty),
          color: GameColors.connect,
        ),
        
        const Spacer(),
        
        // Interaction Panel (Bottom)
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 20,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                 // From / To header
                 Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                       Expanded(
                         child: Column(
                           crossAxisAlignment: CrossAxisAlignment.start,
                           children: [
                             _countryRow(
                               color: const Color(0xFF1976D2),
                               name: currentCountry?.name ?? '?',
                               theme: theme,
                             ),
                             const SizedBox(height: 4),
                             _countryRow(
                               color: Colors.red,
                               name: targetCountry?.name ?? '?',
                               theme: theme,
                             ),
                           ],
                         ),
                       ),
                       // Shared hint button
                       GameHintButton(
                         onHint: () => ref.read(connectGameProvider.notifier).useHint(),
                         hintsUsed: state.hintsUsed,
                         maxHints: 2,
                         accentColor: GameColors.connect,
                       ),
                    ],
                 ),

                 // Visited path chips
                 if (state.playerPath.length > 1) ...[
                   const SizedBox(height: 10),
                   SizedBox(
                     height: 28,
                     child: ListView.separated(
                       scrollDirection: Axis.horizontal,
                       itemCount: state.playerPath.length,
                       separatorBuilder: (_, __) => Padding(
                         padding: const EdgeInsets.symmetric(horizontal: 2),
                         child: Icon(Icons.arrow_forward_ios, size: 10, color: theme.colorScheme.onSurfaceVariant),
                       ),
                       itemBuilder: (_, i) {
                         final code = state.playerPath[i];
                         final country = getCountryByCode(code);
                         final isStart = i == 0;
                         final isLatest = i == state.playerPath.length - 1;
                         return Container(
                           padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                           decoration: BoxDecoration(
                             color: isLatest
                                 ? const Color(0xFF4CAF50).withValues(alpha: 0.2)
                                 : isStart
                                     ? const Color(0xFF1976D2).withValues(alpha: 0.15)
                                     : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                             borderRadius: BorderRadius.circular(12),
                           ),
                           child: Text(
                             country?.name ?? code,
                             style: theme.textTheme.labelSmall?.copyWith(
                               fontWeight: isLatest ? FontWeight.bold : FontWeight.normal,
                               color: isLatest ? const Color(0xFF4CAF50) : theme.colorScheme.onSurface,
                             ),
                           ),
                         );
                       },
                     ),
                   ),
                 ],

                 const SizedBox(height: 12),
                 _buildInputArea(state),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _countryRow({required Color color, required String name, required ThemeData theme}) {
    return Row(
      children: [
        Container(
          width: 10, height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(name, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }
  Widget _buildInputArea(ConnectGameState state) {
     final allCountryNames = countries.map((c) => c.name).toList();
            
     return AutocompleteInput(
       suggestions: allCountryNames,
       hintText: 'Type next country...',
       accentColor: GameColors.connect,
       onSkip: () => ref.read(connectGameProvider.notifier).skip(),
       onSubmit: (value) {
         if (value.isNotEmpty) {
             final match = countries.where((c) => c.name.toLowerCase() == value.toLowerCase()).firstOrNull 
                           ?? countries.where((c) => c.name.toLowerCase().startsWith(value.toLowerCase())).firstOrNull;
             if (match != null) {
                 ref.read(connectGameProvider.notifier).submitMove(match.code);
             } else {
                 ref.read(connectGameProvider.notifier).submitMove(value);
             }
         }
       },
     );
  }
}
