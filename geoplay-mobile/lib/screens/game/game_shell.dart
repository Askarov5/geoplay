import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/map/mapbox_globe_view.dart';
import '../../core/map/map_view.dart';

/// Persistent globe background shell for all game routes.
/// The Mapbox globe is rendered once here and stays alive across game transitions.
class GameShell extends ConsumerWidget {
  final Widget child;

  const GameShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Persistent globe background
          Positioned.fill(
            child: kIsWeb
                ? PlaceholderGlobeView(darkMode: isDark)
                : MapboxGlobeView(darkMode: isDark),
          ),
          // Game overlay on top
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}
