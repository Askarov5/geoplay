# GeoPlay Mobile — Flutter + Mapbox Production Specification

> A map-first, globe-centric mobile app. The map IS the product. Every game happens on, around, or because of the map. This document specifies the architecture, implementation, and design for the smoothest possible user experience.

---

## Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Tech Stack](#2-tech-stack)
3. [Architecture — The Persistent Globe](#3-architecture--the-persistent-globe)
4. [Mapbox Integration Deep Dive](#4-mapbox-integration-deep-dive)
5. [Map Controller — The Brain](#5-map-controller--the-brain)
6. [Game Engine Layer (Dart)](#6-game-engine-layer-dart)
7. [Game Blueprints — How Each Game Lives on the Map](#7-game-blueprints--how-each-game-lives-on-the-map)
8. [Home Screen — The Living Globe](#8-home-screen--the-living-globe)
9. [Shared Widget Library](#9-shared-widget-library)
10. [Theming — Dark & Light Mode](#10-theming--dark--light-mode)
11. [Internationalization (i18n)](#11-internationalization-i18n)
12. [Autocomplete Input — Mobile Optimized](#12-autocomplete-input--mobile-optimized)
13. [Animations & Haptics](#13-animations--haptics)
14. [Offline Mode (Premium)](#14-offline-mode-premium)
15. [Monetization & Premium Features](#15-monetization--premium-features)
16. [Sound Design](#16-sound-design)
17. [Performance Budget](#17-performance-budget)
18. [Project Structure](#18-project-structure)
19. [Dependencies (pubspec.yaml)](#19-dependencies-pubspecyaml)
20. [Deployment & Distribution](#20-deployment--distribution)
21. [Future-Proofing — Adding New Games](#21-future-proofing--adding-new-games)

---

## 1. Vision & Principles

### The Core Idea

The app opens to a **slowly rotating 3D globe**. That globe never leaves. Games are experiences that happen ON the globe — countries light up, the camera flies across continents, borders reveal themselves. The UI is a translucent overlay floating above the map.

### Design Principles

1. **Map first, UI second** — The globe occupies 100% of the screen. All UI elements are overlays with translucent backgrounds. The map is always visible, always interactive.

2. **Camera is storytelling** — Every game transition involves a camera movement. Starting a game? Fly to the continent. Correct answer? Quick zoom pulse to the country. Game over? Pull back to show the full world with your results painted on it.

3. **Every country exists** — Unlike SVG rendering, Mapbox vector tiles include every country down to Vatican City. No more excluding micro-states. Every country is tappable, highlightable, and zoomable.

4. **60fps or nothing** — Mapbox GL renders on the GPU. Flutter composites widgets on the GPU. There should never be a frame drop during gameplay. If an animation can't run at 60fps, simplify it.

5. **Offline is a feature, not an afterthought** — The architecture assumes offline from day one. Premium unlocks downloaded map tiles; everything else is already bundled.

6. **One codebase, two platforms** — Flutter ships to iOS and Android from the same Dart codebase. Pixel-perfect consistency.

---

## 2. Tech Stack

### Core Framework

| Technology | Version | Role |
|---|---|---|
| **Flutter** | 3.x (latest stable) | Cross-platform UI framework |
| **Dart** | 3.x | Application language |
| **Mapbox Maps Flutter** | ^2.x | 3D globe, vector tiles, country interaction |
| **Riverpod** | ^2.x | State management (providers, notifiers) |
| **go_router** | ^14.x | Navigation with deep links |
| **flutter_animate** | ^4.x | Declarative animations |
| **shared_preferences** | ^2.x | Local settings persistence |
| **just_audio** | ^0.9.x | Sound effects |
| **haptic_feedback** | (Flutter built-in) | Tactile response |
| **in_app_purchase** | ^6.x | Premium / subscription |
| **flutter_localizations** | (Flutter SDK) | i18n infrastructure |

### Why Each Choice

- **Mapbox over Google Maps**: 3D globe projection, runtime vector styling (change country colors dynamically), dark style built-in, better offline tile management, more aesthetic for a game context.
- **Riverpod over BLoC**: Less boilerplate, better testability, auto-dispose, excellent for the "many small providers" pattern that games need (one provider per game engine, shared map controller provider).
- **flutter_animate over raw AnimationController**: Declarative chaining (`fadeIn().slideY().scale()`), stagger support, much less code for the 20+ animations we need.

---

## 3. Architecture — The Persistent Globe

### The Golden Rule: The Map Never Unmounts

```
┌──────────────────────────────────────────────┐
│                  App Shell                    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │          MapboxMapView               │    │  ← ALWAYS present
│  │     (Full-screen, 3D globe)          │    │     Never rebuilds
│  │                                      │    │     GPU-rendered
│  │  ┌──────────────────────────────┐    │    │
│  │  │      Overlay Stack           │    │    │  ← Changes per screen
│  │  │                              │    │    │
│  │  │  ┌────────────────────────┐  │    │    │
│  │  │  │   Home / Game UI      │  │    │    │  ← Translucent widgets
│  │  │  │   (Flutter widgets)    │  │    │    │     floating over map
│  │  │  └────────────────────────┘  │    │    │
│  │  └──────────────────────────────┘    │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │    Providers (Riverpod)               │    │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐  │    │
│  │  │ Map    │ │ Game   │ │ Settings │  │    │
│  │  │ Ctrl   │ │ Engine │ │ / i18n   │  │    │
│  │  └────────┘ └────────┘ └──────────┘  │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Widget Tree

```dart
MaterialApp
 └── ProviderScope
      └── AppShell (Scaffold, no AppBar)
           └── Stack
                ├── MapboxMapView(...)          // Layer 0: The globe (never rebuilds)
                ├── MapOverlayController(...)   // Layer 1: Manages highlight layers
                └── Router/Navigator            // Layer 2: Overlay screens
                     ├── HomeOverlay            // Translucent game selection
                     ├── CountdownOverlay       // 3-2-1 animation
                     ├── GamePlayingOverlay     // Timer, input, score
                     └── ResolutionOverlay      // Results, stats
```

### State Flow

```
User taps "Connect Countries"
  → HomeOverlay fades out
  → MapController.flyTo(startCountry, endCountry)   // Camera animates
  → MapController.highlight(start: green, end: red)  // Countries light up
  → CountdownOverlay appears (3... 2... 1...)
  → GameEngine creates initial state
  → GamePlayingOverlay appears with timer + input
  → User types a country
    → GameEngine.submitMove(state, input) → newState
    → MapController.highlight(newCountry: blue)       // Country fills
    → MapController.flyTo(newPosition)                // Camera adjusts
    → HapticFeedback.mediumImpact()
  → Timer expires
    → GameEngine.handleTimeout(state) → finalState
    → GamePlayingOverlay fades out
    → MapController.showOptimalPath(amber)
    → ResolutionOverlay slides up
```

---

## 4. Mapbox Integration Deep Dive

### Map Initialization

```dart
MapboxMap(
  // Mapbox dark style — no labels, dark water, subtle borders
  styleUri: 'mapbox://styles/mapbox/dark-v11',

  // 3D globe projection (not flat Mercator)
  mapOptions: MapOptions(
    projection: ProjectionType.globe,
    // Start centered on Atlantic, showing Europe + Africa + Americas
    center: Point(coordinates: Position(-20.0, 20.0)),
    zoom: 1.5,
    pitch: 20.0,        // Slight tilt for 3D depth
    bearing: 0.0,
  ),

  // Performance
  textureView: true,     // Better for overlay compositing on Android
  
  onMapCreated: (MapboxMap controller) {
    // Store in Riverpod provider for global access
    ref.read(mapControllerProvider.notifier).initialize(controller);
    
    // Configure interaction
    controller.gestures.updateSettings(GesturesSettings(
      rotateEnabled: true,
      pitchEnabled: true,
      scrollEnabled: true,
      doubleTapToZoomInEnabled: true,
    ));
  },
)
```

### Custom Map Style (Mapbox Studio)

Create a custom style derived from `dark-v11` with these modifications:

1. **Remove all text labels** — Country names must never show during gameplay
2. **Simplify road/city layers** — Remove everything except country fills and borders
3. **Darken water** — Match app background `#0a0e1a`
4. **Mute country fills** — Default `#1e293b`, borders `#0f172a`
5. **Add a `geoplay-highlight` layer** — Empty fill layer for dynamic country coloring

This creates two styles:
- `geoplay-dark` — For dark mode
- `geoplay-light` — For light mode (light ocean, lighter country fills)

### Country Feature Querying

Mapbox vector tiles contain country features in the `country-boundaries` source layer with properties including `iso_3166_1_alpha_2` (the ISO code we need).

```dart
/// Query which country the user tapped
Future<String?> getCountryAtPoint(ScreenCoordinate point) async {
  final features = await _map.queryRenderedFeatures(
    RenderedQueryGeometry.fromScreenCoordinate(point),
    RenderedQueryOptions(
      layerIds: ['country-fill'],   // Our custom fill layer
    ),
  );
  
  if (features.isEmpty) return null;
  
  final props = features.first.queriedFeature.feature.properties;
  return props?['iso_3166_1_alpha_2'] as String?;
}
```

### Dynamic Country Highlighting

The key technique: use Mapbox's data-driven styling with `match` expressions to color countries dynamically.

```dart
/// Highlight multiple countries with different colors
Future<void> setCountryHighlights(Map<String, Color> highlights) async {
  if (highlights.isEmpty) {
    // Reset to default
    await _map.style.setLayerProperty('geoplay-highlight', 'fill-color', '#1e293b');
    await _map.style.setLayerProperty('geoplay-highlight', 'fill-opacity', 0.0);
    return;
  }

  // Build Mapbox expression: ["match", ["get", "iso_3166_1_alpha_2"], "DE", "#22c55e", "FR", "#8b5cf6", "transparent"]
  final expression = [
    'match',
    ['get', 'iso_3166_1_alpha_2'],
    ...highlights.entries.expand((e) => [e.key, e.value.toHexString()]),
    'transparent',  // Default: transparent (show base style)
  ];

  await _map.style.setLayerProperty('geoplay-highlight', 'fill-color', expression);
  await _map.style.setLayerProperty('geoplay-highlight', 'fill-opacity', 0.7);
}
```

### Country Border Highlighting (for Silhouette game)

To show only a country's border shape without filling it:

```dart
/// Show only the border of a country (silhouette clue)
Future<void> showCountryBorder(String isoCode, {Color color = purple}) async {
  final expression = [
    'match',
    ['get', 'iso_3166_1_alpha_2'],
    isoCode, color.toHexString(),
    'transparent',
  ];

  await _map.style.setLayerProperty('geoplay-border', 'line-color', expression);
  await _map.style.setLayerProperty('geoplay-border', 'line-width', 3.0);
  await _map.style.setLayerProperty('geoplay-border', 'line-opacity', 0.9);
  
  // Keep fill transparent — only border visible
  await _map.style.setLayerProperty('geoplay-highlight', 'fill-opacity', 0.0);
}
```

---

## 5. Map Controller — The Brain

A singleton service (Riverpod provider) that wraps all map operations. Every game talks to the map through this controller — never directly to the Mapbox SDK.

```dart
/// Central map controller — single source of truth for all map operations
class GeoPlayMapController extends StateNotifier<MapState> {
  MapboxMap? _map;
  
  // ── Initialization ──
  void initialize(MapboxMap map);
  void dispose();
  
  // ── Camera ──
  Future<void> flyToCountry(String isoCode, {double zoom = 4.0, int durationMs = 1200});
  Future<void> flyToContinent(String continent, {int durationMs = 1500});
  Future<void> flyToShowCountries(List<String> isoCodes, {double padding = 80, int durationMs = 1200});
  Future<void> flyToWorld({int durationMs = 1500});
  Future<void> setIdleRotation(bool enabled);  // Slow spin on home screen
  
  // ── Country Interaction ──
  Future<String?> getCountryAtPoint(ScreenCoordinate point);
  void onCountryTap(Function(String isoCode) callback);
  void removeCountryTapListener();
  
  // ── Highlighting ──
  Future<void> highlightCountries(Map<String, Color> fills);
  Future<void> highlightCountryBorder(String isoCode, Color color);
  Future<void> flashCountry(String isoCode, Color color, {int durationMs = 600});
  Future<void> clearAllHighlights();
  
  // ── Labels ──
  Future<void> showCountryLabels(Map<String, String> labels);  // ISO → display name
  Future<void> hideAllLabels();
  Future<void> setBuiltInLabelsVisible(bool visible);  // Toggle Mapbox's own labels
  
  // ── Lines (for Connect Countries path) ──
  Future<void> drawPath(List<String> countryCodes, Color color);
  Future<void> clearPath();
  
  // ── Markers ──
  Future<void> addPulsingMarker(String isoCode, Color color);  // Current position
  Future<void> addPinMarker(String isoCode, Color color);       // Capital city
  Future<void> clearMarkers();
  
  // ── Style ──
  Future<void> setDarkMode(bool dark);
  
  // ── Interaction Control ──
  void setInteractionEnabled(bool enabled);  // Disable during countdown
  void setTapEnabled(bool enabled);          // Enable only for Find on Map
}
```

### Camera Presets

```dart
/// Continent camera positions (center point + zoom level)
static const continentCameras = {
  'Europe':        CameraOptions(center: Position(15.0, 50.0),  zoom: 3.5, pitch: 25),
  'Asia':          CameraOptions(center: Position(80.0, 35.0),  zoom: 2.8, pitch: 20),
  'Africa':        CameraOptions(center: Position(20.0, 5.0),   zoom: 3.0, pitch: 20),
  'North America': CameraOptions(center: Position(-100.0, 45.0), zoom: 3.0, pitch: 20),
  'South America': CameraOptions(center: Position(-60.0, -15.0), zoom: 3.2, pitch: 20),
  'all':           CameraOptions(center: Position(-20.0, 20.0),  zoom: 1.5, pitch: 20),
};
```

### Country Coordinates

For camera fly-to targets, use the same coordinate database from the web app (213 countries with `[lat, lng]`). These are bundled as Dart constants.

---

## 6. Game Engine Layer (Dart)

### Porting Strategy

Every game engine from the web app is a set of pure functions. Port them to Dart with identical logic:

```
TypeScript:  submitGuess(state: GameState, input: string): { state: GameState, result: string }
Dart:        SubmitResult submitGuess(GameState state, String input)
```

### Dart Equivalents

| TypeScript | Dart |
|---|---|
| `interface GameState { ... }` | `class GameState` (immutable, with `copyWith`) |
| `Record<string, string[]>` | `Map<String, List<String>>` |
| `Set<string>` | `Set<String>` |
| `Math.floor(Math.random() * n)` | `Random().nextInt(n)` |
| `Date.now()` | `DateTime.now().millisecondsSinceEpoch` |
| `string \| null` | `String?` |
| `function shuffle<T>(arr: T[]): T[]` | `List<T> shuffle<T>(List<T> arr)` (use `..shuffle()`) |

### Immutable State with Freezed (Optional but Recommended)

```dart
@freezed
class ConnectGameState with _$ConnectGameState {
  const factory ConnectGameState({
    required GamePhase phase,
    required Difficulty difficulty,
    required String startCountry,
    required String endCountry,
    required List<String> optimalPath,
    required List<String> playerPath,
    required List<GameMove> moves,
    required String currentPosition,
    required int wrongAttempts,
    required int consecutiveWrongAttempts,
    required int hintsUsed,
    required int score,
    required bool isComplete,
    required bool isTimeout,
    required int revealTimeLeft,
    required int executionTimeLeft,
    required int moveTimeLeft,
  }) = _ConnectGameState;
}
```

Using `freezed` gives you `copyWith`, `==` equality, `toString`, and immutability for free. But plain classes with manual `copyWith` work fine too.

### Riverpod Integration

Each game gets its own `StateNotifier` provider:

```dart
/// Provider for the active game engine
final connectGameProvider = StateNotifierProvider<ConnectGameNotifier, ConnectGameState?>((ref) {
  return ConnectGameNotifier(ref);
});

class ConnectGameNotifier extends StateNotifier<ConnectGameState?> {
  final Ref _ref;
  Timer? _timer;
  
  ConnectGameNotifier(this._ref) : super(null);
  
  void startGame(Difficulty difficulty, Continent continent) {
    state = createGame(difficulty, continent);  // Pure function from engine
    _startRevealTimer();
    // Tell map controller to fly to the countries
    _ref.read(mapControllerProvider.notifier).flyToShowCountries(
      [state!.startCountry, state!.endCountry],
    );
  }
  
  void submitMove(String input) {
    if (state == null) return;
    final result = connectSubmitMove(state!, input, _ref.read(localeProvider));
    state = result.state;
    
    // Tell map controller to update
    final mapCtrl = _ref.read(mapControllerProvider.notifier);
    if (result.result == 'correct') {
      mapCtrl.highlightCountries(_buildHighlightMap());
      mapCtrl.flyToCountry(state!.currentPosition);
      HapticFeedback.mediumImpact();
    } else {
      mapCtrl.flashCountry(input, Colors.red);
      HapticFeedback.heavyImpact();
    }
  }
  
  // ... timer management, hints, skip, cleanup
}
```

---

## 7. Game Blueprints — How Each Game Lives on the Map

### Game 1: Connect Countries

**Map role**: Primary — the game is played ON the map.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Reveal** (5s) | Camera flies to show both countries. Start = green fill, End = red fill. Labels appear. | Countdown timer, country names |
| **Execution** | Each correct move fills a country blue and camera adjusts. Path line draws between centroids. Wrong guess flashes red. Pulsing marker on current position. | Input bar (bottom), score + timers (top) |
| **Resolution** | Optimal path fills amber. Full world view. All countries in path labeled. | Score card slides up from bottom |

**Camera behavior**:
- Reveal: `flyToShowCountries([start, end])` with 80px padding
- Each move: `flyToCountry(newPosition, zoom: currentZoom)` — gentle reframe
- Resolution: `flyToShowCountries(optimalPath)` — pull back to show everything

---

### Game 2: Find the Country (Silhouette / Border Shape)

**Map role**: Supplementary during play, cinematic on reveal.

**Mobile adaptation**: Instead of SVG silhouettes, use the map itself:

**Option A — Border Reveal (Recommended)**:
1. Camera zooms to a random region (not centered on the country — that would give it away)
2. The target country's **border is highlighted** with a colored stroke, but its **fill remains transparent** (same as ocean/background)
3. Only the border shape is visible as a clue — like a cutout
4. On correct answer: country fills with green, camera flies to center it, country name label appears
5. On wrong: border flashes red briefly

**Option B — Floating Card**:
1. Extract the country polygon from Mapbox and render it as a flat 2D shape in a Flutter `CustomPainter` card floating above the globe
2. Globe slowly rotates behind as ambient decoration
3. On correct: card flips to reveal green country name, camera flies to the country on the globe

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Playing** | Shows border outline of target country, zoomed to a regional view. No labels. | Input bar, hints, timer, round counter |
| **Round Result** | Country fills green/red, camera centers on it, name label appears | Points earned, "Next Round" button |
| **Resolution** | All answered countries highlighted (green=solved, red=missed). World view. | Score card, round-by-round review |

---

### Game 3: Flag Sprint

**Map role**: Ambient + celebratory.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Globe slowly rotates. Camera at world view. | Large 3-2-1 numbers |
| **Playing** | On correct answer: target country briefly flashes green on globe. Accumulated correct answers stay highlighted (building a "map of knowledge"). | Flag image card (center), input bar (bottom), score + streak (top) |
| **Resolution** | All correct countries highlighted green, wrong ones red. Camera pulls to show relevant continent. | Full stats card |

**Camera**: Stays at continent/world zoom. No dramatic movements during sprint — speed is the priority. Quick 100ms green fill per correct answer, no camera animation.

---

### Game 4: Capital Clash

**Map role**: Ambient + educational fly-to.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Globe slowly rotates | Large 3-2-1 |
| **Playing** | On correct: camera does a quick fly-to the country (500ms), drops a pin on the capital city, then returns. Creates a "world tour" effect. On wrong: country flashes red. | Question card (center), input bar (bottom), score + streak (top) |
| **Resolution** | All answered countries highlighted. Capital pins visible. | Stats card |

**Camera**: Quick 500ms fly-to-and-back per answer. If too distracting at high speed, make the fly-to optional (settings toggle) or only trigger every 3rd correct answer.

---

### Game 5: Border Blitz

**Map role**: Primary — the game IS the map.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Camera flies to anchor country region | 3-2-1 over the map |
| **Playing** | Anchor = purple fill. Each correct neighbor fills green (or amber if hinted). Camera subtly widens as neighbors are found. Wrong guess: flash the guessed country red. | Input bar (bottom), anchor name + progress (top) |
| **Resolution** | Found = green, hinted = amber, missed = semi-transparent red. All labeled. Camera shows full region. | Stats card, legend |

**Camera**: Starts tight on anchor (`zoom: 5-6`), gradually pulls back as neighbors are found. On skip (new anchor), smooth fly-to the new country.

---

### Game 6: Find on Map

**Map role**: THE game. Player interacts directly with the globe.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Camera flies to selected continent (or world view for "All") | 3-2-1 |
| **Playing** | Full globe interaction enabled. Pinch-zoom, rotate, pan. On tap: query country → correct = green fill + haptic + advance. Wrong = red flash + haptic. | Target country name card (top), skip button (bottom), score + timer (top-right) |
| **Resolution** | All attempted countries colored (green/red). Camera at world view. | Stats card |

**Camera**: Player controls the camera. On correct answer, a subtle zoom pulse (zoom in 0.5 then back) centered on the correct country. No forced camera movements during play — the player is navigating.

**Labels**: All Mapbox built-in country labels are HIDDEN during this game. The player must recognize countries by shape and position alone.

---

## 8. Home Screen — The Living Globe

### Layout

The home screen is an overlay on the rotating globe:

```
┌──────────────────────────────────┐
│ [🌐]                    [⚙️] [👤] │  ← Top bar (translucent)
│                                  │     Language, Settings, Profile
│                                  │
│     ╭─────────────────────╮      │
│     │    G E O P L A Y    │      │  ← App title (frosted glass card)
│     │  Master the globe.  │      │
│     ╰─────────────────────╯      │
│                                  │
│                                  │  ← Globe visible in the gap
│                                  │
│ ┌──────────────────────────────┐ │
│ │  [ Easy ] [Medium] [ Hard ] │ │  ← Difficulty pills
│ │                              │ │
│ │ [🌍All][🇪🇺][🌏][🌍][🌎][🌎]    │ │  ← Continent chips
│ │                              │ │
│ │ ┌───────────────────────────┐│ │
│ │ │ 🔗 Connect Countries      ││ │  ← Scrollable game list
│ │ │    2-3 countries · 90s    ││ │     (frosted glass cards)
│ │ └───────────────────────────┘│ │
│ │ ┌───────────────────────────┐│ │
│ │ │ 🗺️ Find the Country       ││ │
│ │ │    5 rounds · 30s each    ││ │
│ │ └───────────────────────────┘│ │
│ │ ┌───────────────────────────┐│ │
│ │ │ 🏁 Flag Sprint            ││ │
│ │ └───────────────────────────┘│ │
│ │         ... more games       │ │
│ └──────────────────────────────┘ │
│                                  │
│       GeoPlay — v1.0.0          │
└──────────────────────────────────┘
```

### Globe Behavior on Home

- **Idle rotation**: Globe slowly rotates (~2° per second, bearing only)
- **Touch**: User can freely spin/zoom the globe behind the overlay
- **Continent selection**: Tapping a continent chip → camera smoothly flies to that continent. The globe shows the selected region prominently behind the semi-transparent game list.
- **Game selection**: Tapping a game card → home overlay fades out (300ms) → camera flies to relevant position → countdown begins

### Frosted Glass Aesthetic

All overlay cards use:
```dart
ClipRRect(
  borderRadius: BorderRadius.circular(16),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
    child: Container(
      color: theme.surface.withOpacity(0.75),  // 75% opacity
      child: content,
    ),
  ),
)
```

---

## 9. Shared Widget Library

### TimerBar

```dart
/// Animated progress bar at the top of the screen
class TimerBar extends StatelessWidget {
  final int timeLeft;
  final int totalTime;
  final Color accentColor;
  
  // Renders:
  // - Full width, 4px tall
  // - Fill color: accentColor when >30%, red when >10%, dark red when ≤10%
  // - Smooth width animation (implicit)
  // - Pulsing glow effect when ≤10s
}
```

### GameTopBar

```dart
/// Score, stats, timer display — floats at top
class GameTopBar extends StatelessWidget {
  final VoidCallback onBack;
  final int score;
  final int timeLeft;
  final Color accentColor;
  final List<Widget> centerWidgets;  // Game-specific (streak badge, progress, etc.)
  
  // Renders:
  // - Frosted glass background
  // - Left: back chevron + score
  // - Center: game-specific widgets
  // - Right: time (pulses red when ≤10s)
}
```

### CountdownOverlay

```dart
/// Full-screen 3-2-1 countdown
class CountdownOverlay extends StatelessWidget {
  final String gameTitle;
  final Color accentColor;
  final VoidCallback onComplete;
  
  // Renders:
  // - Semi-transparent dark background
  // - Game title (small, uppercase, tracking)
  // - Large number (accent color) with spring scale animation
  // - "Get ready!" subtitle
  // - Auto-calls onComplete after 3 seconds
}
```

### ResultCard

```dart
/// Slides up from bottom with game results
class ResultCard extends StatelessWidget {
  final String title;
  final int score;
  final Color accentColor;
  final List<StatItem> stats;       // [{label, value, color}]
  final List<AnswerReview> answers;  // Scrollable review list
  final VoidCallback onPlayAgain;
  final VoidCallback onGoHome;
  
  // Renders (frosted glass card):
  // - Title + status
  // - Large score number with scale-in animation
  // - Stats grid (2×2)
  // - Scrollable answer review
  // - "Play Again" (accent) + "Home" (gray) buttons
  // Enters with slideUp animation from bottom
}
```

### AutocompleteInput

See [Section 12](#12-autocomplete-input--mobile-optimized) for full specification.

---

## 10. Theming — Dark & Light Mode

### Dual Theme Support

The app ships with both dark and light themes. The map style switches to match.

### Dark Theme (Default)

```dart
static final dark = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF0A0E1A),
  colorScheme: const ColorScheme.dark(
    surface: Color(0xFF111827),
    primary: Color(0xFF3B82F6),
    secondary: Color(0xFF22C55E),
    error: Color(0xFFEF4444),
    onSurface: Color(0xFFF1F5F9),
    onSurfaceVariant: Color(0xFF94A3B8),
    outline: Color(0xFF334155),
    outlineVariant: Color(0xFF1E293B),
  ),
);

// Mapbox style: 'mapbox://styles/{username}/geoplay-dark'
// Ocean: #0A0E1A, Country fill: #1E293B, Borders: #0F172A
```

### Light Theme

```dart
static final light = ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: const Color(0xFFF8FAFC),
  colorScheme: const ColorScheme.light(
    surface: Color(0xFFFFFFFF),
    primary: Color(0xFF3B82F6),
    secondary: Color(0xFF22C55E),
    error: Color(0xFFEF4444),
    onSurface: Color(0xFF0F172A),
    onSurfaceVariant: Color(0xFF64748B),
    outline: Color(0xFFCBD5E1),
    outlineVariant: Color(0xFFE2E8F0),
  ),
);

// Mapbox style: 'mapbox://styles/{username}/geoplay-light'
// Ocean: #DBEAFE (soft blue), Country fill: #E2E8F0, Borders: #CBD5E1
```

### Game Accent Colors (Unchanged Across Themes)

| Game | Accent |
|------|--------|
| Connect Countries | `#3B82F6` (Blue) |
| Find the Country | `#A855F7` (Purple) |
| Flag Sprint | `#22C55E` (Green) |
| Capital Clash | `#F59E0B` (Amber) |
| Border Blitz | `#8B5CF6` (Violet) |
| Find on Map | `#06B6D4` (Cyan) |

### Theme Switching

```dart
final themeModeProvider = StateProvider<ThemeMode>((ref) {
  // Load from SharedPreferences, default to system
  return ThemeMode.system;
});

// In settings:
// - System (follows device)
// - Dark
// - Light

// When theme changes, also swap Mapbox style:
ref.listen(themeModeProvider, (prev, next) {
  final isDark = next == ThemeMode.dark || 
    (next == ThemeMode.system && MediaQuery.platformBrightnessOf(context) == Brightness.dark);
  ref.read(mapControllerProvider.notifier).setDarkMode(isDark);
});
```

---

## 11. Internationalization (i18n)

### Flutter's Built-in i18n with ARB Files

```yaml
# pubspec.yaml
flutter:
  generate: true

# l10n.yaml
arb-dir: l10n
template-arb-file: app_en.arb
output-localization-file: app_localizations.dart
```

### Three Translation Layers (Same as Web)

#### Layer 1: UI Strings — ARB Files

`l10n/app_en.arb`:
```json
{
  "commonPlayAgain": "Play Again",
  "commonHome": "Home",
  "commonGo": "GO",
  "homeSubtitle": "Competitive geography games. Race friends. Master the globe.",
  "difficultyEasy": "Easy",
  "difficultyMedium": "Medium",
  "difficultyHard": "Hard",
  "mapQuizFind": "Find this country",
  "mapQuizSkip": "Skip",
  "flagsCorrect": "Correct",
  "flagsWrong": "Wrong / Skipped",
  "resolutionTimeUp": "TIME UP"
}
```

One ARB file per locale: `app_en.arb`, `app_zh.arb`, `app_es.arb`, `app_ar.arb`, `app_fr.arb`, `app_pt.arb`, `app_ru.arb`

#### Layer 2: Country Names — Dart Maps

```dart
// lib/data/country_names.dart
const countryNames = <String, Map<String, String>>{
  'en': { 'DE': 'Germany', 'FR': 'France', 'JP': 'Japan', ... },
  'zh': { 'DE': '德国', 'FR': '法国', 'JP': '日本', ... },
  'es': { 'DE': 'Alemania', 'FR': 'Francia', 'JP': 'Japón', ... },
  'ar': { 'DE': 'ألمانيا', 'FR': 'فرنسا', 'JP': 'اليابان', ... },
  'fr': { 'DE': 'Allemagne', 'FR': 'France', 'JP': 'Japon', ... },
  'pt': { 'DE': 'Alemanha', 'FR': 'França', 'JP': 'Japão', ... },
  'ru': { 'DE': 'Германия', 'FR': 'Франция', 'JP': 'Япония', ... },
};
```

#### Layer 3: Capital Names — Same pattern

```dart
const capitalNames = <String, Map<String, String>>{
  'en': { 'DE': 'Berlin', 'FR': 'Paris', 'JP': 'Tokyo', ... },
  // ... per locale
};
```

### Translation Provider

```dart
final localeProvider = StateProvider<Locale>((ref) => const Locale('en'));

String countryName(String code, Locale locale) {
  return countryNames[locale.languageCode]?[code] 
      ?? countryNames['en']![code] 
      ?? code;
}

String capitalName(String code, Locale locale) {
  return capitalNames[locale.languageCode]?[code]
      ?? capitalNames['en']![code]
      ?? code;
}
```

### Supported Locales

| Code | Native Name | Direction |
|------|-------------|-----------|
| `en` | English | LTR |
| `zh` | 中文 | LTR |
| `es` | Español | LTR |
| `ar` | العربية | **RTL** |
| `fr` | Français | LTR |
| `pt` | Português | LTR |
| `ru` | Русский | LTR |

**Arabic RTL**: Flutter handles this automatically with `Directionality`. The autocomplete dropdown, game UI, and home screen will mirror for Arabic. The map itself is unaffected.

---

## 12. Autocomplete Input — Mobile Optimized

### Design for Thumbs

The input lives at the bottom of the screen (thumb zone). Suggestions appear ABOVE the input (not below, which would be hidden by the keyboard).

```
┌──────────────────────────────┐
│                              │
│         (map / game)         │
│                              │
│  ┌────────────────────────┐  │
│  │  Germany        ← tap  │  │  ← Suggestion 3
│  │  Georgia        ← tap  │  │  ← Suggestion 2
│  │  Georgia (US)   ← tap  │  │  ← Suggestion 1
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔍 Ger...        [GO]  │  │  ← Input field
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │      KEYBOARD           │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Implementation

```dart
class GameAutocompleteInput extends ConsumerStatefulWidget {
  final Function(String) onSubmit;
  final Color accentColor;
  final String placeholder;
  final List<String> Function() getSuggestionSource;  // Country names or capital names
  
  // Optional: prioritize neighbors (for Connect Countries)
  final List<String>? priorityCodes;
}
```

### Filtering Logic

```dart
List<String> filterSuggestions(String input, List<String> allNames) {
  if (input.length < 1) return [];
  
  final lower = input.toLowerCase();
  return allNames
    .where((name) => name.toLowerCase().contains(lower))
    .sorted((a, b) {
      // Priority 1: starts with input
      final aStarts = a.toLowerCase().startsWith(lower);
      final bStarts = b.toLowerCase().startsWith(lower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      // Priority 2: alphabetical
      return a.compareTo(b);
    })
    .take(5)
    .toList();
}
```

### Keyboard Handling

- **Submit on "Done"** button (soft keyboard): Submit first suggestion if available, else raw text
- **Tap suggestion**: Submit immediately, clear input, refocus
- **Auto-focus**: Input auto-focuses when game phase is "playing"
- **Dismiss keyboard**: Tapping the map area dismisses the keyboard

---

## 13. Animations & Haptics

### Animation Catalog

| Trigger | Animation | Duration | Implementation |
|---|---|---|---|
| Countdown digit | Scale 0.3→1 + fade in | 300ms (spring) | `flutter_animate` `.scale().fadeIn()` |
| Correct answer | Country fill green + zoom pulse | 200ms | Map highlight + camera zoom ±0.3 |
| Wrong answer | Country flash red + input shake | 400ms | Map flash + `flutter_animate` `.shake()` |
| Score increment | Number scale bounce | 200ms | `.scale(begin: 1.3, end: 1.0)` |
| Streak badge appear | Slide in + scale | 300ms | `.slideX().scale()` |
| Result card | Slide up from bottom + fade | 400ms | `.slideY(begin: 1).fadeIn()` |
| Result sub-sections | Staggered fade in | 150ms each, 100ms delay | `.fadeIn().slideY()` with interval |
| Game card tap | Scale to 0.96 then back | 100ms | `GestureDetector` + `AnimatedScale` |
| Home → Game transition | Overlay fade out + camera fly | 300ms + 1200ms | Parallel: widget fade, camera animate |
| Flag image swap | Cross-fade with slight scale | 200ms | `AnimatedSwitcher` |
| Timer warning | Pulse scale + color shift | Continuous when ≤10s | `AnimationController` repeat |

### Haptic Feedback

| Event | Haptic Type | Flutter API |
|---|---|---|
| Correct answer | Medium impact | `HapticFeedback.mediumImpact()` |
| Wrong answer | Heavy impact (error feel) | `HapticFeedback.heavyImpact()` |
| Country tap (Find on Map) | Light impact | `HapticFeedback.lightImpact()` |
| Streak milestone (×2, ×3...) | Success pattern | `HapticFeedback.mediumImpact()` × 2 |
| Timer warning (≤5s) | Tick per second | `HapticFeedback.selectionClick()` |
| Game complete | Success notification | `HapticFeedback.heavyImpact()` + delay + `lightImpact()` |
| Button tap | Selection click | `HapticFeedback.selectionClick()` |

---

## 14. Offline Mode (Premium)

### Architecture

```
┌──────────────────────────────────────┐
│         App (always works)            │
│                                      │
│  ┌──────────────┐  ┌──────────────┐  │
│  │ Game Engines  │  │  Country     │  │  ← Bundled in app binary
│  │ (Dart code)   │  │  Data + i18n │  │     Always offline
│  └──────────────┘  └──────────────┘  │
│                                      │
│  ┌──────────────┐  ┌──────────────┐  │
│  │ Flag Images   │  │  Map Tiles   │  │  ← Asset strategy differs
│  │ (bundled)     │  │  (see below) │  │
│  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────┘
```

### Map Tile Strategy

| User Type | Online | Offline |
|---|---|---|
| **Free** | Map tiles stream from Mapbox CDN. Automatic caching keeps recently viewed areas. | Games without heavy map interaction work (Flag Sprint, Capital Clash). Map-heavy games require connection. |
| **Premium** | Same streaming + cache | Mapbox Offline Regions downloaded permanently. Full offline play for all 6 games. |

### Offline Download Manager

```dart
class OfflineMapManager {
  /// Available download packs
  static const packs = [
    OfflinePack(id: 'world',   label: 'World Overview',  zoom: 0-5,  estimatedMB: 60),
    OfflinePack(id: 'europe',  label: 'Europe HD',       zoom: 0-7,  estimatedMB: 40),
    OfflinePack(id: 'asia',    label: 'Asia HD',         zoom: 0-7,  estimatedMB: 45),
    OfflinePack(id: 'africa',  label: 'Africa HD',       zoom: 0-7,  estimatedMB: 35),
    OfflinePack(id: 'americas',label: 'Americas HD',     zoom: 0-7,  estimatedMB: 40),
  ];

  /// Download a pack with progress tracking
  Stream<double> downloadPack(String packId);
  
  /// Check download status
  OfflinePackStatus getPackStatus(String packId);
  
  /// Delete a downloaded pack
  Future<void> deletePack(String packId);
  
  /// Total storage used
  Future<int> getTotalStorageBytes();
}
```

### Settings UI for Offline

```
┌──────────────────────────────────────┐
│  ⬇️  Offline Maps            [PRO]   │
│                                      │
│  Download maps for offline play.     │
│                                      │
│  ☑ World Overview (60 MB)    [✓ ✓]  │
│  ☐ Europe HD (40 MB)        [    ]  │
│  ☐ Asia HD (45 MB)          [    ]  │
│  ☐ Africa HD (35 MB)        [    ]  │
│  ☐ Americas HD (40 MB)      [    ]  │
│                                      │
│  Storage: 60 MB / 220 MB used        │
│  ━━━━━━━━━░░░░░░░░░░ 27%            │
│                                      │
│  [ ⬇️ Download All (220 MB) ]        │
└──────────────────────────────────────┘
```

---

## 15. Monetization & Premium Features

### Free Tier

- All 6 games playable (with internet for map-heavy games)
- All difficulty levels and continents
- All 7 languages
- Automatic map tile caching (recent areas stay offline temporarily)
- Ads between games (interstitial, not during gameplay — never interrupt the experience)

### Premium Tier

- **Offline map downloads** — Play anywhere, airplane mode, no internet needed
- **Ad-free** — Zero interruptions
- **Detailed statistics** — History of all games, personal records, progress tracking
- **Custom map themes** — Additional Mapbox styles (satellite, terrain, vintage)
- **Priority support + future games** — Early access to new game modes

### Pricing

- **One-time purchase**: $4.99 (simplest, highest conversion)
- **OR Annual subscription**: $9.99/year (better for covering Mapbox costs at scale)

### Implementation

```dart
final premiumProvider = StateNotifierProvider<PremiumNotifier, PremiumState>((ref) {
  return PremiumNotifier();
});

class PremiumState {
  final bool isPremium;
  final DateTime? expiresAt;  // For subscription model
  final Set<String> downloadedPacks;
}
```

Use `in_app_purchase` package for App Store / Google Play integration.

---

## 16. Sound Design

### Sound Effects (Optional but Impactful)

| Event | Sound | Description |
|---|---|---|
| Correct answer | `correct.wav` | Short bright chime, ascending |
| Wrong answer | `wrong.wav` | Soft low thud |
| Streak milestone | `streak.wav` | Quick ascending arpeggio |
| Countdown tick | `tick.wav` | Subtle clock tick |
| Countdown "Go!" | `go.wav` | Energetic start sound |
| Game complete | `complete.wav` | Triumphant short fanfare |
| Timer warning | `warning.wav` | Soft urgent pulse |
| Country tap (map) | `tap.wav` | Subtle map pin sound |
| Skip | `skip.wav` | Soft whoosh |

### Audio Manager

```dart
class AudioManager {
  bool soundEnabled = true;   // User setting
  double volume = 0.7;        // User setting
  
  Future<void> play(SoundEffect effect);
  void setSoundEnabled(bool enabled);
  void setVolume(double volume);
}
```

Bundle sounds as small WAV/OGG files (~50KB total). Use `just_audio` for low-latency playback.

---

## 17. Performance Budget

### Targets

| Metric | Target |
|---|---|
| Map frame rate | 60fps during pan/zoom |
| Widget frame rate | 60fps during animations |
| Game start (cold) | < 2s from tap to countdown |
| Game start (warm) | < 500ms from tap to countdown |
| Map tile load | < 1s for visible area |
| Autocomplete filter | < 16ms (within single frame) |
| Country highlight | < 100ms from engine result to visual |
| App cold start | < 3s to interactive home screen |

### Optimization Strategies

1. **Map is never disposed** — `MapboxMapView` stays in the widget tree permanently. No re-initialization cost.

2. **const widgets everywhere** — All static UI elements (icons, labels, colors) are `const`.

3. **RepaintBoundary** — Wrap the autocomplete dropdown, timer bar, and score display to isolate repaints from the map.

4. **Isolate for BFS** — The `findShortestPath` BFS algorithm runs in a Dart isolate to avoid blocking the UI thread during game creation (especially for hard difficulty with long paths).

5. **Pre-warm country data** — Load and index all country data, adjacency graph, and translations during the splash screen, before the home screen appears.

6. **Image caching** — Flag images loaded via `CachedNetworkImage` or pre-bundled as assets.

7. **Lazy provider initialization** — Game engine providers are created on demand (when a game starts), not at app launch.

---

## 18. Project Structure

```
geoplay_mobile/
├── android/                         # Android platform files
├── ios/                             # iOS platform files
├── l10n/                            # ARB translation files
│   ├── app_en.arb
│   ├── app_zh.arb
│   ├── app_es.arb
│   ├── app_ar.arb
│   ├── app_fr.arb
│   ├── app_pt.arb
│   └── app_ru.arb
├── assets/
│   ├── flags/                       # Bundled flag PNGs (213 files)
│   │   ├── de.png
│   │   ├── fr.png
│   │   └── ...
│   └── sounds/                      # Sound effects
│       ├── correct.wav
│       ├── wrong.wav
│       └── ...
├── lib/
│   ├── main.dart                    # Entry point
│   ├── app.dart                     # MaterialApp + ProviderScope + Router
│   │
│   ├── core/
│   │   ├── map/
│   │   │   ├── map_controller.dart       # GeoPlayMapController (singleton provider)
│   │   │   ├── map_styles.dart           # Dark/light Mapbox style URIs
│   │   │   ├── map_camera_presets.dart   # Continent camera positions
│   │   │   └── map_highlight.dart        # Country highlighting logic
│   │   ├── data/
│   │   │   ├── countries.dart            # Country model + 213 entries
│   │   │   ├── adjacency.dart            # Border graph
│   │   │   ├── graph.dart                # BFS pathfinding
│   │   │   ├── country_names.dart        # Localized country names (7 langs)
│   │   │   └── capital_names.dart        # Localized capital names (7 langs)
│   │   ├── audio/
│   │   │   └── audio_manager.dart        # Sound effects
│   │   └── premium/
│   │       ├── premium_manager.dart      # In-app purchase logic
│   │       └── offline_map_manager.dart  # Mapbox offline downloads
│   │
│   ├── engines/                          # Pure game logic (no UI, no map)
│   │   ├── connect_engine.dart
│   │   ├── silhouette_engine.dart
│   │   ├── flag_sprint_engine.dart
│   │   ├── capital_clash_engine.dart
│   │   ├── border_blitz_engine.dart
│   │   ├── map_quiz_engine.dart
│   │   └── scoring.dart                  # Connect Countries scoring
│   │
│   ├── providers/                        # Riverpod providers
│   │   ├── map_provider.dart             # Map controller provider
│   │   ├── game_providers.dart           # One StateNotifier per game
│   │   ├── settings_provider.dart        # Theme, locale, sound, premium
│   │   └── timer_provider.dart           # Shared timer logic
│   │
│   ├── screens/                          # Overlay screens (over the map)
│   │   ├── home/
│   │   │   ├── home_overlay.dart         # Game selection
│   │   │   ├── game_card.dart            # Individual game card
│   │   │   ├── difficulty_selector.dart
│   │   │   └── continent_selector.dart
│   │   ├── game/
│   │   │   ├── game_shell.dart           # Wraps any game with timer/topbar
│   │   │   ├── countdown_overlay.dart
│   │   │   ├── result_overlay.dart
│   │   │   ├── connect_overlay.dart
│   │   │   ├── silhouette_overlay.dart
│   │   │   ├── flag_sprint_overlay.dart
│   │   │   ├── capital_clash_overlay.dart
│   │   │   ├── border_blitz_overlay.dart
│   │   │   └── map_quiz_overlay.dart
│   │   └── settings/
│   │       ├── settings_screen.dart
│   │       ├── language_picker.dart
│   │       ├── theme_picker.dart
│   │       └── offline_downloads.dart
│   │
│   ├── widgets/                          # Reusable UI components
│   │   ├── timer_bar.dart
│   │   ├── game_top_bar.dart
│   │   ├── autocomplete_input.dart
│   │   ├── frosted_card.dart
│   │   ├── stat_grid.dart
│   │   ├── answer_review_list.dart
│   │   └── flag_image.dart
│   │
│   └── theme/
│       ├── app_theme.dart                # Dark + Light ThemeData
│       ├── colors.dart                   # Color constants
│       └── game_colors.dart              # Per-game accent colors
│
├── pubspec.yaml
├── l10n.yaml                            # i18n config
└── analysis_options.yaml
```

---

## 19. Dependencies (pubspec.yaml)

```yaml
name: geoplay
description: Competitive geography games on a 3D globe.
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.16.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  
  # Map
  mapbox_maps_flutter: ^2.3.0
  
  # State management
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0
  
  # Navigation
  go_router: ^14.0.0
  
  # Animations
  flutter_animate: ^4.5.0
  
  # Storage
  shared_preferences: ^2.3.0
  
  # Audio
  just_audio: ^0.9.40
  
  # In-app purchase
  in_app_purchase: ^6.0.0
  
  # Utilities
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0
  collection: ^1.18.0
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  build_runner: ^2.4.0
  freezed: ^2.5.0
  riverpod_generator: ^2.4.0
  json_serializable: ^6.8.0

flutter:
  generate: true    # Enable i18n code generation
  uses-material-design: true
  assets:
    - assets/flags/
    - assets/sounds/
```

---

## 20. Deployment & Distribution

### Mapbox Token Management

- **Public token** (for map display): Embedded in the app, restricted to your app's bundle ID
- **Secret token** (for tile downloads): Stored server-side, used only during offline pack generation
- **Android**: Token in `res/values/mapbox_access_token.xml`
- **iOS**: Token in `Info.plist` under `MBXAccessToken`
- **Never commit tokens to Git** — Use environment variables in CI/CD

### App Store Requirements

| Platform | Requirement |
|---|---|
| **iOS** | Xcode 15+, iOS 15.0 minimum, App Store screenshots (6.7", 6.5", 5.5"), privacy labels, Mapbox attribution |
| **Android** | Target SDK 34, minSdk 23 (Android 6.0), Play Store screenshots, privacy policy, Mapbox attribution |
| **Both** | Mapbox ToS requires "Powered by Mapbox" attribution visible somewhere (settings screen or map corner) |

### CI/CD

- **Codemagic** or **GitHub Actions** with Flutter
- Build → Test → Sign → Deploy to TestFlight / Play Console
- Environment variables for Mapbox token, signing keys

---

## 21. Future-Proofing — Adding New Games

### The Game Plugin Pattern

Every game follows an identical contract:

```dart
/// Interface every game engine implements
abstract class GameEngine<TState, TConfig> {
  TState createGame(Difficulty difficulty, Continent continent);
  TState handleTimeout(TState state);
  Map<String, dynamic> getStats(TState state);
}

/// Interface every game overlay implements
abstract class GameOverlay extends ConsumerWidget {
  final Difficulty difficulty;
  final Continent continent;
  final Color accentColor;
  
  /// What the map should do when this game starts
  void onGameStart(GeoPlayMapController map);
  
  /// What the map should do when this game ends
  void onGameEnd(GeoPlayMapController map);
}
```

### Adding a New Game (Checklist)

1. **Engine**: Create `lib/engines/new_game_engine.dart` — pure Dart, no imports from Flutter
2. **Provider**: Add a `StateNotifierProvider` in `lib/providers/game_providers.dart`
3. **Overlay**: Create `lib/screens/game/new_game_overlay.dart` — extends `GameOverlay`
4. **Registration**: Add to the game list in `home_overlay.dart` — one entry with title, description, icon, accent color, route
5. **i18n**: Add translation keys to all 7 ARB files
6. **Config**: Add difficulty configuration constants

That's 5 files to create and 2 files to modify. The map controller, shared widgets, theming, and navigation all work automatically.

### Potential Future Games

All of these fit naturally on the globe:

- **Trade Routes** — Draw historical trade paths (Silk Road, Spice Route) by naming waypoint countries
- **Time Zone Sprint** — A clock shows a time; tap the country where that time zone exists
- **Population Poker** — Two countries shown; tap which has more population
- **Capital Pin Drop** — A pin appears at a capital city location; name the city
- **River Run** — Name countries a river flows through (Danube, Nile, Amazon)
- **Continent Speed Run** — Name all countries in a continent as fast as possible

Each of these is: one engine file, one overlay file, one provider, a few i18n keys, and a card on the home screen. The globe handles the rest.

---

## Summary

This specification describes a **globe-first mobile app** where:

- The **3D Mapbox globe is always visible** and acts as the canvas for all games
- **Flutter** provides pixel-perfect cross-platform UI with GPU-composited overlays
- **6 games** each have a unique relationship with the map (from primary interaction to ambient decoration)
- **Dark and light themes** switch both the UI and the map style
- **7 languages** with full support for country names, capital names, and UI strings (including RTL for Arabic)
- **Offline premium** lets users download map tiles for airplane-mode play
- **New games** can be added with 5 files and a game card — the architecture scales indefinitely

The result is an app that feels like a polished, cinematic geography experience — not a quiz app with a map bolted on, but a living globe that happens to host games.
