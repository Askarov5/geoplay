import 'package:go_router/go_router.dart';
import 'screens/home/home_screen.dart';
import 'screens/game/flag_sprint_overlay.dart';
import 'screens/game/capital_clash_overlay.dart';
import 'screens/game/connect_countries_overlay.dart';
import 'screens/game/game_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    // All game routes share the GameShell (persistent globe background)
    ShellRoute(
      builder: (context, state, child) => GameShell(child: child),
      routes: [
        GoRoute(
          path: '/game/flag-sprint',
          name: 'flagSprint',
          builder: (context, state) => const FlagSprintScreen(),
        ),
        GoRoute(
          path: '/game/capital-clash',
          name: 'capitalClash',
          builder: (context, state) => const CapitalClashScreen(),
        ),
        GoRoute(
          path: '/game/connect-countries',
          name: 'connectCountries',
          builder: (context, state) => const ConnectCountriesScreen(),
        ),
      ],
    ),
  ],
);
