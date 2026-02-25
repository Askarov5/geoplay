import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/game_colors.dart';
import 'game_card.dart';
import 'difficulty_selector.dart';
import 'continent_selector.dart';

/// Game list panel with difficulty selector, continent filter, and game cards.
class GamesPanel extends StatelessWidget {
  const GamesPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section title
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'GAMES',
            style: TextStyle(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.4)
                  : Colors.black.withValues(alpha: 0.4),
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Difficulty selector
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: DifficultySelector(),
        ),
        const SizedBox(height: 10),

        // Continent selector
        const Padding(
          padding: EdgeInsets.only(left: 20),
          child: ContinentSelector(),
        ),
        const SizedBox(height: 16),

        // Game Cards
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              GameCard(
                title: 'Flag Sprint',
                description: 'Identify as many flags as possible',
                icon: Icons.flag_outlined,
                accentColor: GameColors.flagSprint,
                onTap: () => context.pushNamed('flagSprint'),
              ),
              const SizedBox(height: 10),
              GameCard(
                title: 'Capital Clash',
                description: 'Match capitals to countries',
                icon: Icons.location_city_outlined,
                accentColor: GameColors.capitalClash,
                onTap: () => context.pushNamed('capitalClash'),
              ),
              const SizedBox(height: 10),
              GameCard(
                title: 'Connect Countries',
                description: 'Find a path between two countries',
                icon: Icons.route_outlined,
                accentColor: GameColors.connect,
                onTap: () => context.pushNamed('connectCountries'),
              ),
              const SizedBox(height: 10),
              const GameCard(
                title: 'Find the Country',
                description: 'Identify countries by their shape',
                icon: Icons.public_outlined,
                accentColor: GameColors.silhouette,
                locked: true,
              ),
              const SizedBox(height: 10),
              const GameCard(
                title: 'Border Blitz',
                description: 'Name all neighboring countries',
                icon: Icons.grid_on_outlined,
                accentColor: GameColors.borderBlitz,
                locked: true,
              ),
              const SizedBox(height: 10),
              const GameCard(
                title: 'Find on Map',
                description: 'Tap the correct country on the globe',
                icon: Icons.map_outlined,
                accentColor: GameColors.findOnMap,
                locked: true,
              ),
              const SizedBox(height: 10),
              const GameCard(
                title: 'Flashcards',
                description: 'Study countries at your own pace',
                icon: Icons.style_outlined,
                accentColor: GameColors.flashcards,
                locked: true,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ],
    );
  }
}
