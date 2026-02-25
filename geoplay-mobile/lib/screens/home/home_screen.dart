import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/map/mapbox_globe_view.dart';
import '../../core/map/map_view.dart';
import '../../core/data/countries.dart';
import '../../providers/explore_provider.dart';
import '../../widgets/country_info_card.dart';
import 'games_panel.dart';

/// Home screen with globe + games panel.
/// Tapping a country on the globe auto-switches to explore mode,
/// showing a country flashcard. Swiping up returns to games.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  // Split ratio: 0.0 = full globe (explore), 1.0 = full panel
  double _splitRatio = 0.5;

  // Snap points
  static const double _exploreSnap = 0.15; // 15% panel, 85% globe (explore mode)
  static const double _defaultSnap = 0.55; // 55% panel, 45% globe (games mode)

  /// Threshold: below this ratio we're in explore mode.
  static const double _exploreThreshold = 0.35;

  bool get _isExploreMode => _splitRatio <= _exploreThreshold;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
    _animation = _controller.drive(Tween<double>(begin: _splitRatio, end: _splitRatio));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Animate to a specific snap point.
  void _animateToSnap(double target, {double velocity = 0}) {
    _animation = _controller.drive(
      Tween<double>(begin: _splitRatio, end: target),
    );
    const spring = SpringDescription(mass: 1, stiffness: 300, damping: 25);
    final simulation = SpringSimulation(spring, 0, 1, -velocity / 1000);
    _controller.reset();
    _controller.addListener(_onAnimationUpdate);
    _controller.animateWith(simulation);
  }

  void _onAnimationUpdate() {
    setState(() {
      _splitRatio = _animation.value;
    });
  }

  void _snapToNearest(double velocity) {
    final snaps = [_exploreSnap, _defaultSnap];

    double target = _splitRatio;
    if (velocity.abs() > 300) {
      // Fling — go to next snap in the direction of velocity
      if (velocity > 0) {
        target = snaps.firstWhere((s) => s > _splitRatio + 0.05, orElse: () => _defaultSnap);
      } else {
        target = snaps.lastWhere((s) => s < _splitRatio - 0.05, orElse: () => _exploreSnap);
      }
    } else {
      // Snap to closest
      double minDist = double.infinity;
      for (final snap in snaps) {
        final dist = (_splitRatio - snap).abs();
        if (dist < minDist) {
          minDist = dist;
          target = snap;
        }
      }
    }

    _animateToSnap(target, velocity: velocity);
  }

  /// Called when a country is selected on the globe — auto-enter explore mode.
  void _onCountrySelected(Country? previous, Country? next) {
    if (next != null && !_isExploreMode) {
      _animateToSnap(_exploreSnap);
    }
  }

  /// Switch back to games mode.
  void _switchToGames() {
    ref.read(selectedCountryProvider.notifier).state = null;
    _animateToSnap(_defaultSnap);
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedCountry = ref.watch(selectedCountryProvider);

    final globeHeight = screenHeight * (1 - _splitRatio);
    final panelHeight = screenHeight * _splitRatio;

    // Listen for globe taps → auto-switch to explore mode
    ref.listen<Country?>(selectedCountryProvider, (previous, next) {
      _onCountrySelected(previous, next);
    });

    return Scaffold(
      body: Stack(
        children: [
          // Globe (top section)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: globeHeight,
            child: kIsWeb
                ? PlaceholderGlobeView(darkMode: isDark)
                : MapboxGlobeView(darkMode: isDark),
          ),

          // Panel (bottom section)
          Positioned(
            top: globeHeight,
            left: 0,
            right: 0,
            height: panelHeight,
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0A0E1A) : const Color(0xFFF8FAFC),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Drag handle
                  GestureDetector(
                    onVerticalDragStart: (details) {
                      _controller.stop();
                      _controller.removeListener(_onAnimationUpdate);
                    },
                    onVerticalDragUpdate: (details) {
                      setState(() {
                        final delta = details.primaryDelta ?? 0.0;
                        _splitRatio = (_splitRatio - delta / screenHeight)
                            .clamp(0.05, 0.85);
                      });
                    },
                    onVerticalDragEnd: (details) {
                      _snapToNearest(-(details.primaryVelocity ?? 0));
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      color: Colors.transparent,
                      child: Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.2)
                                : Colors.black.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Title bar
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'GeoPlay',
                              style: TextStyle(
                                color: isDark ? Colors.white : Colors.black87,
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              child: Text(
                                _isExploreMode
                                    ? 'Explore the world.'
                                    : 'Master the globe.',
                                key: ValueKey(_isExploreMode),
                                style: TextStyle(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.4)
                                      : Colors.black.withValues(alpha: 0.4),
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        // Mode toggle button
                        if (_isExploreMode)
                          GestureDetector(
                            onTap: _switchToGames,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.3)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.sports_esports_rounded, color: Color(0xFF3B82F6), size: 16),
                                  SizedBox(width: 6),
                                  Text(
                                    'Games',
                                    style: TextStyle(
                                      color: Color(0xFF3B82F6),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.06)
                                  : Colors.black.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.settings_outlined,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.5)
                                  : Colors.black.withValues(alpha: 0.5),
                              size: 22,
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Panel content — games or explore hint
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 400),
                      switchInCurve: Curves.easeOut,
                      switchOutCurve: Curves.easeIn,
                      child: _isExploreMode
                          ? Center(
                              key: const ValueKey('explore_hint'),
                              child: Text(
                                'Tap a country on the globe',
                                style: TextStyle(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.3)
                                      : Colors.black.withValues(alpha: 0.3),
                                  fontSize: 14,
                                ),
                              ),
                            )
                          : const SingleChildScrollView(
                              key: ValueKey('games'),
                              physics: BouncingScrollPhysics(),
                              child: GamesPanel(),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Country flashcard overlay (shown when a country is selected)
          if (selectedCountry != null)
            Positioned(
              bottom: panelHeight + 16,
              left: 0,
              right: 0,
              child: AnimatedOpacity(
                opacity: 1.0,
                duration: const Duration(milliseconds: 300),
                child: CountryInfoCard(
                  key: ValueKey(selectedCountry.code),
                  country: selectedCountry,
                  onClose: () {
                    ref.read(selectedCountryProvider.notifier).state = null;
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }
}
