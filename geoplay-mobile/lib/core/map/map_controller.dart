import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../data/countries.dart';

final mapControllerProvider = ChangeNotifierProvider((ref) => GeoPlayMapController());

/// Real map controller that interacts with MapboxMap instance
class GeoPlayMapController extends ChangeNotifier {
  bool _isInitialized = false;
  bool _idleRotation = true;
  bool _darkMode = true;
  bool _labelsVisible = true;
  MapboxMap? _map;

  PointAnnotationManager? _pointAnnotationManager;
  CircleAnnotationManager? _circleAnnotationManager;
  PolylineAnnotationManager? _polylineAnnotationManager;

  bool get isInitialized => _isInitialized;
  bool get idleRotation => _idleRotation;
  bool get darkMode => _darkMode;
  bool get labelsVisible => _labelsVisible;

  Future<void> initialize(MapboxMap map) async {
    _map = map;
    _pointAnnotationManager = await map.annotations.createPointAnnotationManager();
    _circleAnnotationManager = await map.annotations.createCircleAnnotationManager();
    _polylineAnnotationManager = await map.annotations.createPolylineAnnotationManager();
    
    _isInitialized = true;
    notifyListeners();
  }

  // ── Camera ──
  Future<void> flyToCountry(String isoCode, {double zoom = 4.0, int durationMs = 1200}) async {
    if (_map == null) return;
    final country = getCountryByCode(isoCode);
    if (country == null) return;
    
    await _map!.flyTo(
      CameraOptions(
        center: Point(coordinates: Position(country.coordinates[1], country.coordinates[0])),
        zoom: zoom,
      ),
      MapAnimationOptions(duration: durationMs),
    );
  }

  Future<void> flyToContinent(String continent, {int durationMs = 1500}) async {}

  Future<void> flyToShowCountries(List<String> isoCodes, {double padding = 80, int durationMs = 1200}) async {
    if (_map == null || isoCodes.isEmpty) return;
    double minLat = 90.0, maxLat = -90.0, minLng = 180.0, maxLng = -180.0;
    
    for (final code in isoCodes) {
       final country = getCountryByCode(code);
       if (country != null) {
          final lat = country.coordinates[0];
          final lng = country.coordinates[1];
          // Buffer ~3° around each centroid to account for country area
          const buffer = 3.0;
          if (lat - buffer < minLat) minLat = lat - buffer;
          if (lat + buffer > maxLat) maxLat = lat + buffer;
          if (lng - buffer < minLng) minLng = lng - buffer;
          if (lng + buffer > maxLng) maxLng = lng + buffer;
       }
    }
    

    try {
      final camera = await _map!.cameraForCoordinateBounds(
        CoordinateBounds(
          southwest: Point(coordinates: Position(minLng, minLat)),
          northeast: Point(coordinates: Position(maxLng, maxLat)),
          infiniteBounds: true,
        ),
        MbxEdgeInsets(top: padding, left: padding, bottom: padding, right: padding),
        null, // bearing
        null, // pitch
        null, // maxZoom
        null, // offset
      );
      await _map!.flyTo(camera, MapAnimationOptions(duration: durationMs));
    } catch (_) {
      // Simplistic bounding box fallback
      final centerLat = (minLat + maxLat) / 2;
      var centerLng = (minLng + maxLng) / 2;
      
      final latDelta = (maxLat - minLat).abs();
      double lngDelta = (maxLng - minLng).abs();
      if (lngDelta > 180) {
          centerLng = (centerLng + 180) % 360; 
          if (centerLng > 180) centerLng -= 360;
      }
      
      final maxDelta = math.max(latDelta, lngDelta);
      double zoom = 2.0;
      if (maxDelta > 0) {
          zoom = (math.log(360.0 / (maxDelta * 1.5)) / math.ln2); 
          zoom = zoom.clamp(0.0, 5.0).toDouble();
      }
      
      await _map!.flyTo(
        CameraOptions(
          center: Point(coordinates: Position(centerLng, centerLat)),
          zoom: zoom,
        ),
        MapAnimationOptions(duration: durationMs),
      );
    }
  }

  Future<void> flyToWorld({int durationMs = 1500}) async {
      if (_map == null) return;
      await _map!.flyTo(
          CameraOptions(
             center: Point(coordinates: Position(0, 0)),
             zoom: 1.5,
          ),
          MapAnimationOptions(duration: durationMs),
      );
  }

  Future<void> setIdleRotation(bool enabled) async {
    _idleRotation = enabled;
    notifyListeners();
  }

  // ── Country Interaction ──
  Future<String?> getCountryAtPoint(Offset point) async => null;

  // ── Highlighting ──
  Future<void> highlightCountries(Map<String, Color> fills) async {
     if (_circleAnnotationManager == null) return;
     // To avoid accumulating overlapping circles, clear first
     await _circleAnnotationManager!.deleteAll();
     
     final circles = <CircleAnnotationOptions>[];
     for (final entry in fills.entries) {
        final country = getCountryByCode(entry.key);
        if (country != null) {
           circles.add(CircleAnnotationOptions(
              geometry: Point(coordinates: Position(country.coordinates[1], country.coordinates[0])),
              circleRadius: 15.0,
              circleColor: entry.value.toARGB32(),
              circleOpacity: 0.8,
              circleStrokeWidth: 2.0,
              circleStrokeColor: Colors.white.toARGB32(),
           ));
        }
     }
     
     if (circles.isNotEmpty) {
        await _circleAnnotationManager!.createMulti(circles);
     }
  }

  Future<void> highlightCountryBorder(String isoCode, Color color) async {}

  Future<void> flashCountry(String isoCode, Color color, {int durationMs = 600}) async {
  }

  Future<void> clearAllHighlights() async {
     await _circleAnnotationManager?.deleteAll();
  }

  // ── Labels ──
  Future<void> showCountryLabels(Map<String, String> labels) async {
      if (_pointAnnotationManager == null) return;
      await _pointAnnotationManager!.deleteAll();
      
      final annotations = <PointAnnotationOptions>[];
      for (final entry in labels.entries) {
          final country = getCountryByCode(entry.key);
          if (country != null) {
              annotations.add(PointAnnotationOptions(
                  geometry: Point(coordinates: Position(country.coordinates[1], country.coordinates[0])),
                  textField: entry.value,
                  textColor: Colors.white.toARGB32(),
                  textHaloColor: Colors.black.toARGB32(),
                  textHaloWidth: 1.0,
                  textSize: 14.0,
              ));
          }
      }
      
      if (annotations.isNotEmpty) {
          await _pointAnnotationManager!.createMulti(annotations);
      }
  }

  Future<void> hideAllLabels() async {
      await _pointAnnotationManager?.deleteAll();
  }

  Future<void> setBuiltInLabelsVisible(bool visible) async {
      _labelsVisible = visible;
      notifyListeners();
      if (_map == null) return;
      final visibility = visible ? 'visible' : 'none';
      try {
         // Dynamically find and hide ALL label layers in the current style
         final layerList = await _map!.style.getStyleLayers();
         for (final layer in layerList) {
           final id = layer?.id;
           if (id != null && id.contains('label')) {
             try {
               await _map!.style.setStyleLayerProperty(id, 'visibility', visibility);
             } catch (_) {
               // Some layers may not support visibility; skip silently
             }
           }
         }
      } catch (e) {
         debugPrint('Error toggling label visibility: $e');
      }
  }

  // ── Lines ──
  Future<void> drawPath(List<String> countryCodes, Color color) async {
      if (_polylineAnnotationManager == null || countryCodes.length < 2) return;
      await _polylineAnnotationManager!.deleteAll();
      
      final points = <Position>[];
      for (final code in countryCodes) {
          final country = getCountryByCode(code);
          if (country != null) {
              points.add(Position(country.coordinates[1], country.coordinates[0]));
          }
      }
      
      if (points.length >= 2) {
          await _polylineAnnotationManager!.create(PolylineAnnotationOptions(
              geometry: LineString(coordinates: points),
              lineColor: color.toARGB32(),
              lineWidth: 3.0,
              lineOpacity: 0.8,
          ));
      }
  }

  Future<void> clearPath() async {
      await _polylineAnnotationManager?.deleteAll();
  }

  // ── Markers ──
  Future<void> addPulsingMarker(String isoCode, Color color) async {
       // Using circle manager as simple marker for now
  }

  Future<void> addPinMarker(String isoCode, Color color) async {}

  Future<void> clearMarkers() async {}

  // ── Style ──
  Future<void> setDarkMode(bool dark) async {
    _darkMode = dark;
    notifyListeners();
  }

  // ── Interaction Control ──
  void setInteractionEnabled(bool enabled) {
     if (_map == null) return;
     _map!.gestures.updateSettings(GesturesSettings(
         scrollEnabled: enabled,
         pitchEnabled: enabled,
         rotateEnabled: enabled,
         doubleTapToZoomInEnabled: enabled,
     ));
  }

  void setTapEnabled(bool enabled) {}
}

