import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../config/mapbox_config.dart';
import '../data/countries.dart';
import '../../providers/explore_provider.dart';
import 'map_controller.dart';

/// Full 3D globe view powered by Mapbox.
/// Now interactive: tap to select countries.
class MapboxGlobeView extends ConsumerStatefulWidget {
  final bool darkMode;
  final bool idleRotation;

  const MapboxGlobeView({
    super.key,
    this.darkMode = true,
    this.idleRotation = true,
  });

  @override
  ConsumerState<MapboxGlobeView> createState() => _MapboxGlobeViewState();
}

class _MapboxGlobeViewState extends ConsumerState<MapboxGlobeView> {
  MapboxMap? _mapboxMap;

  @override
  void initState() {
    super.initState();
    MapboxOptions.setAccessToken(MapboxConfig.publicToken);
  }

  @override
  void didUpdateWidget(covariant MapboxGlobeView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.darkMode != widget.darkMode) {
      _updateStyle();
    }
  }

  void _onMapCreated(MapboxMap mapboxMap) {
    _mapboxMap = mapboxMap;
    ref.read(mapControllerProvider).initialize(mapboxMap);
    _configureGlobe();
  }


  Future<void> _configureGlobe() async {
    final map = _mapboxMap;
    if (map == null) return;

    // Set globe projection
    try {
      await map.style.setProjection(StyleProjection(name: StyleProjectionName.globe));
    } catch (_) {
      // Projection API may vary by version; continue gracefully
    }

    // Disable compass & scale bar for a cleaner look
    try {
      await map.compass.updateSettings(CompassSettings(enabled: false));
      await map.scaleBar.updateSettings(ScaleBarSettings(enabled: false));
    } catch (_) {}

    // Set initial camera — zoomed out to see the whole globe
    await map.setCamera(
      CameraOptions(
        center: Point(coordinates: Position(42, 35)),
        zoom: 1.5,
        pitch: 15,
      ),
    );
  }

  Future<void> _updateStyle() async {
    final map = _mapboxMap;
    if (map == null) return;

    final styleUri = widget.darkMode
        ? MapboxStyles.DARK
        : MapboxStyles.LIGHT;
    await map.loadStyleURI(styleUri);

    // Re-apply globe projection after style change
    try {
      await map.style.setProjection(StyleProjection(name: StyleProjectionName.globe));
    } catch (_) {}
  }

  /// Handle map taps to select the nearest country.
  void _onMapTap(MapContentGestureContext context) {
    final coords = context.point.coordinates;
    final tapLat = coords.lat.toDouble();
    final tapLng = coords.lng.toDouble();

    Country? nearest;
    double minDistance = double.infinity;

    // Simple Euclidean distance for selection (sufficient for this scale)
    for (final country in countries) {
      final countryLat = country.coordinates[0];
      final countryLng = country.coordinates[1];

      // Handle longitude wrapping
      double dLng = (countryLng - tapLng).abs();
      if (dLng > 180) dLng = 360 - dLng;

      final distance = math.sqrt(
        math.pow(countryLat - tapLat, 2) + math.pow(dLng, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = country;
      }
    }

    // Only select if within a reasonable threshold (e.g. 8 degrees)
    if (nearest != null && minDistance < 8) {
      ref.read(selectedCountryProvider.notifier).state = nearest;
      _focusOnCountry(nearest);
    }
  }

  /// Animate camera to focus on a country.
  Future<void> _focusOnCountry(Country country) async {
    final map = _mapboxMap;
    if (map == null) return;

    await map.flyTo(
      CameraOptions(
        center: Point(
          coordinates: Position(
            country.coordinates[1], // Lng
            country.coordinates[0], // Lat
          ),
        ),
        zoom: 3.5,
        pitch: 30,
      ),
      MapAnimationOptions(duration: 1000),
    );
  }

  void _onStyleLoaded(StyleLoadedEventData data) {
    if (!mounted) return;
    final ctrl = ref.read(mapControllerProvider);
    if (!ctrl.labelsVisible) {
      // Re-apply the hidden labels property since style just loaded and reset it
      ctrl.setBuiltInLabelsVisible(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final styleUri = widget.darkMode
        ? MapboxStyles.DARK
        : MapboxStyles.LIGHT;

    // Listen for external selection changes (e.g. from Search)
    ref.listen(selectedCountryProvider, (previous, next) {
      if (next != null && next != previous) {
        _focusOnCountry(next);
      }
    });

    return MapWidget(
      key: ValueKey('mapbox_globe_${widget.darkMode}'),
      styleUri: styleUri,
      cameraOptions: CameraOptions(
        center: Point(coordinates: Position(42, 35)),
        zoom: 1.5,
        pitch: 15,
      ),
      onMapCreated: _onMapCreated,
      onTapListener: _onMapTap,
      onStyleLoadedListener: _onStyleLoaded,
    );
  }
}
