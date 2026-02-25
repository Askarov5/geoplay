# GeoPlay Mobile — Flutter + Mapbox Production Specification

> A map-first, globe-centric mobile app. The map IS the product. Every game happens on, around, or because of the map. This document specifies the architecture, implementation, and design for the smoothest possible user experience.

---

## Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Tech Stack](#2-tech-stack)
3. [Architecture — The Persistent Globe](#3-architecture--the-persistent-globe)
4. [Mapbox Integration Deep Dive](#4-mapbox-integration-deep-dive)
5. [Map Controller — The Brain](#5-map-controller--the-brain)
6. [Country Data & Wiki](#6-country-data--wiki)
7. [Game Engine Layer (Dart)](#7-game-engine-layer-dart)
8. [Game Blueprints — How Each Game Lives on the Map](#8-game-blueprints--how-each-game-lives-on-the-map)
8.5. [Game Resolution & State Transitions](#85-game-resolution--state-transitions)
9. [Home Screen — The Split-Screen Globe](#9-home-screen--the-split-screen-globe)
10. [Shared Widget Library](#10-shared-widget-library)
11. [Theming — Dark & Light Mode](#11-theming--dark--light-mode)
12. [Internationalization (i18n)](#12-internationalization-i18n)
13. [Input System — Mobile-First Multiple Choice](#13-input-system--mobile-first-multiple-choice)
14. [Animations & Haptics](#14-animations--haptics)
15. [Offline Mode (Premium)](#15-offline-mode-premium)
16. [Monetization & Premium Features](#16-monetization--premium-features)
17. [Sound Design](#17-sound-design)
18. [Performance Budget](#18-performance-budget)
19. [Project Structure](#19-project-structure)
20. [Dependencies (pubspec.yaml)](#20-dependencies-pubspecyaml)
21. [Deployment & Distribution](#21-deployment--distribution)
22. [Error Handling & Edge Cases](#22-error-handling--edge-cases)
23. [Implementation Validation Checklist](#23-implementation-validation-checklist)
24. [Future-Proofing — Adding New Games](#24-future-proofing--adding-new-games)


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

## 6. Country Data & Wiki

### The Learning Loop

GeoPlay is not just a game — it's a **learn → play → verify → remember** loop. The Country Wiki is the "learn" piece. It acts as both a reference for users and the **single source of truth** for all game content. Every game pulls data from the same country model.

### Extended Country Model

```dart
@freezed
class Country with _$Country {
  const factory Country({
    required String code,             // ISO 3166-1 alpha-2 ("DE")
    required String name,             // English name ("Germany")
    required String capital,          // English capital ("Berlin")
    required String continent,        // "Europe"
    required List<double> coordinates,// [lat, lng]
    required CountryTier tier,        // 1, 2, or 3

    // ── Wiki Fields (new) ──
    required int population,          // 83_200_000
    required int areaKm2,             // 357_022
    required List<String> languages,  // ["German"]
    required String currency,         // "Euro (€)"
    required String currencyCode,     // "EUR"
    required List<String> neighbors,  // ["DK","PL","CZ","AT","CH","FR","LU","BE","NL"]
    String? gdpBillions,              // "4260" (optional, updated less frequently)
    String? drivingSide,              // "right" or "left"
    String? callingCode,              // "+49"
  }) = _Country;
}
```

### Data Source Strategy

**Bundle a static snapshot** — Do NOT call an API at runtime. Source the data once from:
- [REST Countries API](https://restcountries.com/) — population, area, languages, currencies, calling codes, borders
- World Bank / CIA Factbook — GDP figures
- Existing `data/adjacency.ts` — neighbor relationships (already curated)
- Manual review for accuracy

The `neighbors` field consolidates the separate adjacency graph into the Country model itself. Island nations with no land borders have an empty list (`[]`). The adjacency graph helper functions (`getNeighbors`, `isValidNeighbor`, BFS, etc.) still exist but read from `country.neighbors` instead of a separate map.

Store as a single Dart file (`country_data.dart`) with all 213 entries. Update yearly with a script.

### Country Card — The Wiki UI

The Country Card is a **bottom sheet** that slides up over the globe. It appears in two contexts:

**Context 1: Tap any country on the home globe**
When the user is on the home screen and taps a country on the idle globe, the Country Card slides up. This turns the home screen from a menu into an explorable atlas.

**Context 2: Post-game answer review**
After any game, tapping a country in the results list opens its Country Card. "Got Nigeria wrong? Tap to learn about it." This closes the learning loop.

### Country Card Layout

```
┌──────────────────────────────────┐
│  ── drag handle ──               │  ← Bottom sheet
│                                  │
│  🇩🇪  Germany                     │  ← Flag + name (large)
│  Federal Republic of Germany      │  ← Official name
│                                  │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ 83.2M  │ │357K km²│ │ EU   │ │  ← Quick stats row
│  │  pop.  │ │  area  │ │cont. │ │
│  └────────┘ └────────┘ └──────┘ │
│                                  │
│  Capital       Berlin            │
│  Language      German            │
│  Currency      Euro (€)          │
│  GDP           $4.26 trillion    │
│  Calling       +49               │
│  Drives on     Right             │
│  Neighbors     9 countries       │  ← Tappable → shows list
│  Tier          ★ Well-known      │
│                                  │
│  ─────────────────────────────── │
│  📊 Your Progress                │  ← Personal stats (Phase 2)
│  Flag Sprint   ✅ 3/3 correct    │
│  Find on Map   ✅ Found in 2.1s  │
│  Capitals      ✅ Berlin          │
│  Border Blitz  ✅ Named as nbr   │
│  Silhouette    ❌ Not yet solved  │
│                                  │
│  [ 🗺️ Fly to Country ]           │  ← Camera flies to it
│  [ 🃏 Study Flashcards ]          │  ← Opens flashcard mode
└──────────────────────────────────┘
```

### Country Card Implementation

```dart
class CountryCard extends ConsumerWidget {
  final String countryCode;

  // Data comes from the single Country model
  // Flag image from bundled assets
  // Localized name from i18n layer
  // Neighbors from adjacency graph
  // Personal stats from local persistence (SharedPreferences or Hive)
}

/// Show the country card from anywhere
void showCountryCard(BuildContext context, String isoCode) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,        // Full height when needed
    backgroundColor: Colors.transparent,
    builder: (_) => DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      builder: (_, controller) => CountryCard(
        countryCode: isoCode,
        scrollController: controller,
      ),
    ),
  );
}
```

### Globe Tap → Country Card (Home Screen)

On the home screen, the globe is interactive. When the user taps a country:

1. Map controller queries `getCountryAtPoint(tapPosition)` → returns ISO code
2. Country highlights briefly on the globe (accent color flash)
3. Country Card bottom sheet slides up
4. Camera subtly adjusts to center the tapped country

This transforms the home screen from a static menu into a **living atlas** that invites exploration.

### Flashcard Mode — The Card Game

A dedicated learning mode where users study countries like flashcards. Accessible from:
- The home screen (as a game card alongside the 6 competitive games)
- The "Study Flashcards" button on any Country Card
- The post-game resolution (when the user wants to review what they got wrong)

#### Flashcard Mechanics

**The deck**: Filtered by continent + difficulty tier (same pool system as games).

**Card front**: Shows ONE piece of info. The user must guess the country (or vice versa).

**Card types** (randomized):
1. **Flag → Country**: Shows flag, tap to reveal country name
2. **Silhouette → Country**: Shows country border on map, tap to reveal name
3. **Capital → Country**: Shows "Berlin", tap to reveal "Germany"
4. **Country → Capital**: Shows "Germany", tap to reveal "Berlin"
5. **Country → Flag**: Shows "Germany", tap to reveal flag
6. **Shape on Map → Country**: Camera zooms to a country, borders highlighted, tap to reveal

**Interaction**:
- **Tap card** or **swipe up**: Reveal the answer
- After reveal: **Swipe right** = "I knew it" (card removed from deck), **Swipe left** = "Didn't know" (card goes back into rotation)
- Session ends when all cards are swiped right, or the user exits

**No timer, no score, no pressure.** This is the zen mode — purely for learning. The globe slowly rotates behind the flashcard as ambient decoration.

#### Flashcard State

```dart
@freezed
class FlashcardState with _$FlashcardState {
  const factory FlashcardState({
    required List<Flashcard> deck,           // Remaining cards
    required List<Flashcard> knownCards,     // Swiped right
    required List<Flashcard> reviewCards,    // Swiped left (re-enter deck)
    required int currentIndex,
    required bool isRevealed,
    required Continent continent,
    required Difficulty difficulty,          // Controls tier pool
  }) = _FlashcardState;
}

@freezed
class Flashcard with _$Flashcard {
  const factory Flashcard({
    required String countryCode,
    required FlashcardType type,            // flag, silhouette, capital, etc.
  }) = _Flashcard;
}

enum FlashcardType {
  flagToCountry,
  silhouetteToCountry,
  capitalToCountry,
  countryToCapital,
  countryToFlag,
  mapShapeToCountry,
}
```

#### Flashcard UI Layout

```
┌──────────────────────────────────┐
│  ← Back            12 / 45 left │  ← Progress
│                                  │
│         (globe rotates behind)   │
│                                  │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  │         🇩🇪               │    │  ← Front: Flag (large)
│  │                          │    │
│  │    Tap to reveal         │    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  ── after tap / swipe up: ──     │
│                                  │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  │    🇩🇪  Germany           │    │  ← Back: Answer revealed
│  │    Capital: Berlin       │    │     with key facts
│  │    Pop: 83.2M · Europe   │    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│   ← Didn't know    I knew it →  │  ← Swipe left / right
│      (review)        (done)      │
└──────────────────────────────────┘
```

#### Flashcard on the Map

For `mapShapeToCountry` type cards:
1. Globe camera flies to the target country's region (offset so it's not perfectly centered — that would be too easy)
2. Country border is highlighted (stroke only, no fill — same as the silhouette game)
3. User taps "Reveal" → country fills with green, name label appears, camera centers
4. Swipe right/left as usual

This makes the flashcard mode feel like it's part of the globe experience, not a separate flat-UI quiz.

### Wiki Data Used by Games

The extended country data directly enables current and future game mechanics:

| Data Field | Current Game Usage | Future Game Potential |
|---|---|---|
| `population` | — | Population Poker, Size comparisons |
| `areaKm2` | — | Size Showdown, "larger or smaller?" |
| `languages` | — | Language Match ("Which speak French?") |
| `currency` / `currencyCode` | — | Currency Sprint ("Who uses the Baht?") |
| `capital` | Capital Clash | Already in use |
| `coordinates` | Map camera, labels | Already in use |
| `neighbors` | Connect, Border Blitz, Country Card | Already in use (was separate adjacency graph, now part of Country model) |
| `tier` | All games (pool filter) | Already in use |
| `gdpBillions` | — | Economy Quiz |
| `drivingSide` | — | Trivia bonus rounds |
| `callingCode` | — | Trivia bonus rounds |

### Personal Progress Tracking

The Country Card's "Your Progress" section requires tracking per-country stats locally:

```dart
/// Persisted per-country stats
class CountryProgress {
  final String code;
  int flagSprintCorrect = 0;
  int flagSprintTotal = 0;
  int mapQuizCorrect = 0;
  int mapQuizTotal = 0;
  int capitalCorrect = 0;
  int capitalTotal = 0;
  int silhouetteCorrect = 0;
  int silhouetteTotal = 0;
  bool borderBlitzNamed = false;    // Ever correctly named as a neighbor
  int flashcardsKnown = 0;          // Times swiped "I knew it"
  int flashcardsReviewed = 0;       // Times swiped "Didn't know"
  DateTime? lastSeen;               // Last time this country appeared in any game
}
```

Store using **Hive** (lightweight, fast, no SQL overhead) or `shared_preferences` serialized as JSON. Updated at the end of each game session.

**Aggregate stats** (shown on a profile/stats screen):
- "You've identified 140 / 213 flags correctly"
- "You can locate 95 / 213 countries on the map"
- "You know 180 / 213 capitals"
- Continent completion percentages
- Weakest countries (most wrong answers)

---

## 7. Game Engine Layer (Dart)

### Country Tier System (Difficulty-Based Pool Filtering)

Every country is assigned a **tier** (1, 2, or 3) that controls whether it appears in a given difficulty level. This is the most impactful difficulty mechanic — it determines **what** the player faces, not just how much time they have.

```dart
/// Country recognition tiers
enum CountryTier { tier1, tier2, tier3 }

/// Tier 1 (~55 countries) — Well-known: large, distinctive shape, globally recognized
///   US, China, Brazil, France, Japan, Australia, India, Egypt, Mexico, Italy,
///   Germany, Russia, UK, Spain, Turkey, Thailand, South Korea, Argentina, etc.
///
/// Tier 2 (~65 countries) — Moderately known: regional significance, medium-sized
///   Croatia, Cambodia, Kazakhstan, Morocco, Jamaica, Austria, Bangladesh,
///   Israel, Mongolia, Philippines, Serbia, Chile equivalent nations, etc.
///
/// Tier 3 (~93 countries) — Obscure/micro: small, micro-states, easily confused
///   Liechtenstein, Comoros, Eswatini, Guyana, Kosovo, Tajikistan, Bhutan,
///   Djibouti, Gambia, Vatican City, Monaco, all small Caribbean islands, etc.

const countryTiers = <String, CountryTier>{
  'US': CountryTier.tier1, 'CN': CountryTier.tier1, 'BR': CountryTier.tier1,
  'FR': CountryTier.tier1, 'DE': CountryTier.tier1, 'JP': CountryTier.tier1,
  // ... all 213 countries classified (see data/country-tiers.ts for full list)
  'LI': CountryTier.tier3, 'KM': CountryTier.tier3, 'SZ': CountryTier.tier3,
};
```

**Difficulty → Tier mapping:**

| Difficulty | Max Tier | Pool Size | Experience |
|---|---|---|---|
| **Easy** | Tier 1 only | ~55 countries | Big, famous, easy-to-find countries |
| **Medium** | Tier 1 + 2 | ~120 countries | Adds regional/medium countries |
| **Hard** | All tiers | All 213 | Micro-states, obscure nations included |

**Helper functions (Dart):**

```dart
CountryTier getCountryTier(String code) => countryTiers[code] ?? CountryTier.tier3;

CountryTier getMaxTierForDifficulty(Difficulty difficulty) {
  switch (difficulty) {
    case Difficulty.easy:   return CountryTier.tier1;
    case Difficulty.medium: return CountryTier.tier2;
    case Difficulty.hard:   return CountryTier.tier3;
  }
}

/// Generic country pool filter — used by ALL game engines
List<String> getCountryPool(Difficulty difficulty, Continent continent) {
  final maxTier = getMaxTierForDifficulty(difficulty);
  return countries
    .where((c) => getCountryTier(c.code).index <= maxTier.index)
    .where((c) => continent == Continent.all || c.continent == continent.name)
    .map((c) => c.code)
    .toList();
}
```

**Per-game usage:**

| Game | How Tiers Apply |
|---|---|
| **Find on Map** | Easy = only big countries (easy to tap). Hard = micro-states included. |
| **Silhouette** | Easy = recognizable shapes only. Hard = all renderable countries. |
| **Flag Sprint** | Easy = well-known flags. Hard = all 213 flags. |
| **Capital Clash** | Easy = famous capitals (Paris, Tokyo). Hard = all (Thimphu, Vaduz). |
| **Border Blitz** | Anchor country filtered by tier. Easy = well-known anchors with 1-3 neighbors. |
| **Connect Countries** | Not tier-filtered (path length already controls difficulty; filtering would reduce graph connectivity). |

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
| `getCountryTier(code)` | `getCountryTier(code)` (same pattern) |
| `getMaxTierForDifficulty(diff)` | `getMaxTierForDifficulty(diff)` (same pattern) |

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

## 8. Game Blueprints — How Each Game Lives on the Map

### Summary: All Games at a Glance

| Game | Duration | Input Method | Map Role | Map Interaction | Tier Filtering | Difficulty |
|---|---|---|---|---|---|---|
| **1. Connect Countries** | 60-120s | Tap neighbors OR type | Primary | ✅ Disabled | None | Path length |
| **2. Find the Country** | 5 rounds × 20s | Tap 4 options OR type | Supplementary | ✅ Disabled | Yes (by shape) | Tier 1/2/3 |
| **3. Flag Sprint** | 60s | Tap 4 options OR type | Ambient | ✅ Disabled | Yes | Tier 1/2/3 |
| **4. Capital Clash** | 60s | Tap 4 options OR type | Ambient | ✅ Disabled | Yes | Tier 1/2/3 |
| **5. Border Blitz** | 60s per anchor | Tap neighbors OR type | Primary | ✅ Disabled | Yes (neighbor count) | Tier 1/2/3 |
| **6. Find on Map** | 90s | Tap on globe | Primary | ✅ ENABLED | Yes | Tier 1/2/3 |
| **7. Flashcards** | Variable | Tap/swipe reveal | Ambient | ✅ Disabled | Yes | Tier 1/2/3 |

### Game 1: Connect Countries

**Map role**: Primary — the game is played ON the map.
**Tier filtering**: None — path length controls difficulty. All connected countries remain in the graph.
**Map interaction**: Disabled during play (player interacts via input only, not globe tapping).

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Reveal** (5s) | Camera flies to show both countries. Start = green fill, End = red fill. Labels appear. | Countdown timer, country names, example move shown |
| **Execution** | Each correct move fills a country blue and camera adjusts. Path line draws between centroids. Wrong guess flashes red. Pulsing marker on current position. | **Input: Type 2-3 letters (e.g., "A" for Austria) → autocomplete filters eligible neighbors. Tap from list or press Enter to submit. Score + timers (top)** |
| **Resolution** | Optimal path fills amber. Full world view. All countries in path labeled. | Score card slides up from bottom |

**Interaction details**:
- **Input field shows**: "From Germany, go to: [neighbor 1] [neighbor 2] ..." (shows all eligible neighbors, filtered as user types)
- **User types "A"**: Austria, Azerbaijan both highlighted (if both are neighbors)
- **User types "Au"**: Only Austria shown
- **Submit**: Tap Austria OR press Enter OR press spacebar to cycle
- **Wrong taps**: -10 pts, red flash on incorrect country, hint revealed
- **Hints**: Limited (1-2 per game). Tap [?] to reveal one unfound step
- **Skip**: Available, -5 pts, shows new country pair

**Scoring mechanics**:
- Base: 10 pts per move
- Speed bonus: (timeLeft / totalTime) × 10
- Streak: Each move after first in correct path +2% bonus
- Wrong penalty: -10 pts
- Example: 3-move path with no errors: (10 + 10 + 10) × 1.06 streak = ~31 pts

**Camera behavior**:
- Reveal: `flyToShowCountries([start, end])` with 80px padding
- Each move: `flyToCountry(newPosition, zoom: currentZoom)` — gentle reframe
- Resolution: `flyToShowCountries(optimalPath)` — pull back to show everything

### Game 2: Find the Country (Silhouette / Border Shape)

**Map role**: Supplementary during play, cinematic on reveal.
**Tier filtering**: Easy = Tier 1 only (large, recognizable shapes). Medium = Tier 1+2. Hard = all renderable countries.
**Map interaction**: Disabled during play (input only, no globe tapping).
**Input type**: Type 1 (Visual-Matching) — Tap 4 country name buttons.

**Mobile adaptation**: Use the map to show the country silhouette:

**Implementation — Border Reveal (Recommended)**:
1. Camera zooms to a random region (not centered on the country — that would give it away)
2. The target country's **border is highlighted** with a colored stroke, but its **fill remains transparent** (same as ocean/background)
3. Only the border shape is visible as a clue — like a cutout
4. Player selects from 4 tap-able country name options
5. On correct answer: country fills with green, camera flies to center it, country name label appears
6. On wrong: border flashes red briefly, hint revealed (capital name or population)

**Tier impact**: On Easy, the player only sees countries like France, Brazil, Australia — instantly recognizable outlines. On Hard, they might get Lesotho, Bhutan, or Equatorial Guinea.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Round intro** | Camera zooms to random regional view, target country border highlighted with thin stroke | "Round 1/5", "Find the country:", timer starts at 20s |
| **Playing** | Border outline remains visible. No labels. | **Input: 4 tap-to-select country name buttons (A/B/C/D) displayed as large 52pt hittable boxes. OR: Type to search → autocomplete narrows options. Hints available [?]. Timer + score** |
| **Round result** | Country fills green (correct) or red (wrong). Camera smoothly centers on country. Country name + flag appear. | Points earned, geography fact displayed, "Next Round" link |
| **Resolution (after 5)** | All answered countries highlighted (green=solved, red=missed). World view. | Score card: total /250, accuracy %, round-by-round review |

**Interaction details**:

**Primary Input (Visual-Matching)**:
- Shows 4 countries as tab-able buttons:
  ```
  Which country has this border?
  ┌─────────────┬─────────────┐
  │  [A]        │  [B]        │
  │ Belgium     │ Bulgaria    │
  ├─────────────┼─────────────┤
  │  [C]        │  [D]        │
  │ Bangladesh  │ Bolivia     │
  └─────────────┴─────────────┘
  ```
- Tap one to submit instantly
- **Fallback**: Type first letters → autocomplete filters to the 4 options
  - Type "B" → highlights Belgium, Bulgaria, Bangladesh, Bolivia
  - Type "Be" → only Belgium highlighted
  - Enter submits the bolded option

**Hints System**:
- Tap [?] to reveal one of three hint types (cycles per tap):
  1. **Capital**: "Capital: Brussels"
  2. **Population**: "Population: ~11.5M"
  3. **Neighbors**: "Borders: France, Netherlands, Germany, Luxembourg"
- Cost: -50% points for that round (e.g., 10pts → 5pts max)
- Limit: 2 hints per round (global timer prevents spam)
- Hint reveals don't penalize until the round is scored

**Wrong Answer Feedback**:
```
❌ You selected: Bulgaria
Correct: Belgium

🗺️ Geography: Belgium is a small Western European country bordering France, 
    the Netherlands, and Germany. NOT in Eastern Europe.
    
💡 Hint: Look at the outline — it has a long coastline on the North Sea.
    Bulgaria is landlocked and much larger.

Try again with these shapes:
[France] [Bulgaria] [Belgium] [Iceland]
```

**Scoring**:
- Base: 10 pts per correct answer
- Speed bonus: (timeLeft / 20) × 5 (so at 20s remaining = +5pts, at 10s = +2pts)
- Hint penalty: -50% of round points (attempted hint costs points)
- Wrong penalty: -0 pts (allowed to tap multiple options per round)
- Round total: 10 + speed bonus = max ~15pts per round, up to 75 pts total

**Camera behavior**:
- Start: `flyToCountry(target, zoom: 4)` — close enough to see shape clearly but from a rotated angle
- Reveal: `flyToCountry(target, zoom: 3)` — center and label the country with green fill
- End round: `flyToWorld()` for next round

---

### Game 3: Flag Sprint

**Map role**: Ambient + celebratory.
**Tier filtering**: Easy = Tier 1 flags only (~55 well-known flags). Medium = Tier 1+2. Hard = all 213 flags.
**Map interaction**: Disabled during play (input only, no globe tapping).
**Input type**: Type 1 (Visual-Matching) — Tap 4 country name buttons.
**Map interaction**: Disabled (player focuses on options, not the globe).

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Globe slowly rotates. Camera at world view. | Large 3-2-1 numbers |
| **Playing** | On correct answer: target country briefly flashes green on globe. Accumulated correct answers stay highlighted (building a "map of knowledge"). | **Large flag image (center). Input: 4 tap-to-select country name options (A/B/C/D). Score + streak + timer (top)** |
| **Resolution** | All correct countries highlighted green, wrong ones red. Camera pulls to show relevant continent. | Full stats card |

**Interaction details**:
- **Primary input**: Tap one of 4 country name buttons (A, B, C, D) displayed below the flag
- Each option is clearly labeled:
  ```
  🇩🇪  A) Germany      B) Austria
        C) Slovakia     D) Bulgaria
  ```
- Scoring: Speed matters — correct answers reward based on reaction time. 1-3s = full points, 3-5s = 75%, 5s+ = 50%
- Wrong taps: -10 points + red flash on globe, new 4-option set shown immediately
- Streak system: 3+ correct in a row triggers visual/haptic celebration

**Camera**: Stays at continent/world zoom. No dramatic movements during sprint — speed is the priority. Quick 100ms green fill per correct answer, no camera animation.

**Tier impact**: Easy mode shows flags everyone recognizes (US, Japan, Brazil, UK). Hard mode includes flags like Comoros, Eswatini, and Palau.

---

### Game 4: Capital Clash

**Map role**: Ambient + educational fly-to.
**Tier filtering**: Easy = Tier 1 capitals only (Paris, Tokyo, Cairo). Medium = Tier 1+2. Hard = all capitals (Thimphu, Vaduz, Moroni).
**Map interaction**: Disabled (keyboard/tap options only).

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Globe slowly rotates | Large 3-2-1 |
| **Playing** (Variant A: Country→Capital) | On correct: camera does a quick fly-to the country (500ms), drops a pin on the capital city, then returns. Creates a "world tour" effect. On wrong: country flashes red. | **Question card shows country name/flag (center). Input: Tap 4 capital name buttons (A/B/C/D) OR type to search. Score + streak (top). Hints available [?]** |
| **Playing** (Variant B: Capital→Country, unlocked at Medium+) | Same camera behavior | **Question card shows capital name (center). Input: Type 2-3 letters → autocomplete filters countries, tap from list. Score + streak (top). Hints available [?]** |
| **Resolution** | All answered countries highlighted. Capital pins visible. | Stats card with variant breakdown, accuracy by difficulty |

**Interaction details**:

**Variant A (Visual-Matching, Default)**:
- Shows: "Which is the capital of Germany?"
- Buttons: A) Berlin  B) Munich  C) Hamburg  D) Frankfurt
- Tap option instantly submits
- Speed matters: <2s = 10pts, 2-5s = 8pts, 5s+ = 5pts
- Wrong: -5 pts + correct answer revealed (learning feedback)

**Variant B (Knowledge-Recall, Medium+ only)**:
- Shows: "Berlin is the capital of?"
- User types: "B" → autocomplete suggests: Belgium, Brazil, Botswana, Belize, ...
- User types: "Ge" → only Germany appears
- Tap Germany OR press Enter to submit
- Requires memory (not just recognition)

**Hints System** (both variants):
- Tap [?] to reveal one letter of answer: "___land" 
- Or reveal first letters: "B____  F____  H_____  F_______"
- Or reveal neighbors: "Borders: France, Belgium, …"
- Cost: -50% points for that round
- Limit: 2 hints per game (or 1 per 10 questions in medium mode)

**Wrong Answer Feedback**:
```
❌ You guessed: Munich
Correct: Berlin

🗺️  Did you know? Berlin has been the capital since 1990.
    It's also the largest city in Germany by population.

⚡ Neighbors: Often paired with "Which is the LARGEST city?"
```

**Camera**: Quick 500ms fly-to-and-back per correct answer. Optional settings toggle to disable if distracting.

**Scoring**:
- Variant A (recognition): 10 pts base + speed bonus
- Variant B (recall): 15 pts base + speed bonus (harder)
- Streak: Each 5 correct in a row +1 streak badge

---

### Game 5: Border Blitz

**Map role**: Primary — the game IS the map.
**Tier filtering**: Anchor country is filtered by tier AND neighbor count. Easy = Tier 1 anchors with 1-3 neighbors. Hard = all tiers with 7+ neighbors. Cascading fallback relaxes tier → neighbor count → ultimate fallback (Germany) if pool is empty.
**Map interaction**: Disabled during play (input via options only, not tapping on globe).

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Camera flies to anchor country region | 3-2-1 over the map, anchor name shown |
| **Playing** | Anchor = purple fill. Each correct neighbor fills green (or amber if hinted). Camera subtly widens as neighbors are found. Wrong guess: flash the guessed country red. | **Anchor name + X neighbors to find (top). Input: Type 2-3 letters → autocomplete filters neighbors, tap from list OR press Enter. Hints available [?]. Score + timer.** |
| **Resolution** | Found = green, hinted = amber, missed = semi-transparent red. All labeled. Camera shows full region. | Stats: neighbors found/missed/hinted, accuracy %, which neighbors were hardest |

**Interaction details**:

**Primary Input** (Knowledge-Recall):
- Shows: "Purple: [Germany] — 5 neighbors to find"
- User types: "P" → autocomplete suggests: Poland, Portugal, etc. (filtered to neighbors only)
- User types: "Po" → Poland (alias: "Pol") highlighted
- User taps Poland OR presses Enter
- Neighbor fills green + camera adjusts

**Fallback**: All neighbors shown as grid buttons (6-8 visible at once)
```
Purple: [Germany] — 5 neighbors to find

┌─────────────────────────────┐
│ [Austria] [Poland]          │
│ [France] [Switzerland]      │
│ [Belgium] [Denmark]         │
│                             │
│ [Show all 9] [Skip]         │
└─────────────────────────────┘
```

**Hints System**:
- Tap [?] to reveal one unfound neighbor (fills amber, worth 50% points)
- Shows hint: "Borders with [Germany]: Alpine country, south" = Austria
- Limit: 2 hints per anchor (or 1 per 60s)

**Wrong Answer Feedback**:
```
❌ You guessed: Spain

Spain doesn't border Germany!

💡 Hint types:
   - Direction (south, west of Germany)
   - Geography (Alpine, coastal, landlocked)
   - Population (over 80M, under 5M)
   - Facts (shares EU border with Germany)

Neighbors of Germany: Austria, Belgium, ... (8 total)
You found: 2/8
```

**Scoring**:
- Base: 20 pts per correct neighbor
- Speed bonus: (timeLeft / 60) × 5
- Hinted neighbors: 10 pts (50% penalty)
- Wrong penalty: -5 pts
- Anchor bonus: +10 pts if all neighbors found in <30s

**Skip Button**:
- Available (bottom)
- Skips current anchor, -0 pts (but 0 points for that anchor)
- New anchor selected, camera flies to it

**Camera**:
- Starts tight on anchor (`zoom: 5-6`)
- Gradually pulls back as neighbors are found (zoom -0.1 per neighbor found)
- On new anchor or skip, smooth fly-to (1200ms)

---

### Game 6: Find on Map

**Map role**: THE game. Player interacts directly with the globe.
**Tier filtering**: Easy = Tier 1 only (~55 big, easy-to-tap countries). Medium = Tier 1+2 (~120). Hard = all 213 including micro-states.
**Map interaction**: **FULLY ENABLED** — Player zooms, rotates, pans. Tapping a country submits the answer.

| Phase | Map Behavior | Overlay |
|---|---|---|
| **Countdown** | Camera flies to selected continent (or world view for "All") | 3-2-1 countdown |
| **Playing** | Full globe interaction enabled. Pinch-zoom, rotate, pan. On tap: query `getCountryAtPoint(tapPos)` → if correct = green fill + haptic + next target. If wrong = red flash + minus points. | Target country name card (top, large text), timer (top-right, red when ≤10s), skip button (bottom), score + streak (top-left) |
| **Resolution** | All attempted countries colored (green=correct, red=wrong, gray=skipped). Camera at world view. | Stats card: accuracy %, avg time per country, best/worst countries |

**Interaction details**:
- **Target instruction**: "Find: Germany" displayed prominently at top
- **Tap feedback**: On tap, quick haptic + visual feedback (flash) within 100ms
- **Correct**: Country fills green, +10pts base + speed bonus (10s = +5pts, 5s = +10pts, <5s = +15pts), instant next target
- **Wrong**: Country flashes red, -5pts, player continues searching
- **Skip**: Available (bottom button) — -2pts, moves to next target immediately
- **No keyboard** — Pure map interaction. If player gets stuck, they tap "Skip"

**Tier impact**:
- Easy: US, Brazil, India, Russia, Japan, Australia — large, distinctive shapes, obvious positions
- Medium: Adds ~65 medium countries (Croatia, Cambodia, Argentina, etc.) — requires more attention
- Hard: All 213 including Liechtenstein, Comoros, Eswatini — requires systematic zooming and precise tapping on small target countries

**Camera**: Player controls via gestures. On correct answer, a subtle zoom pulse (zoom in 0.3 then back) centered on the correct country. No forced camera movements during play — the player is navigating.

**Labels**: All Mapbox built-in country labels are HIDDEN during this game. The player must recognize countries by shape, position, and color alone.

**Accessibility**: Provides the purest test of geographical knowledge — no multiple choice, no hints, just you and the globe.

---

### Game 7: Flashcards (Study Mode)

**Map role**: Ambient + interactive for map-type cards.
**Tier filtering**: Same as all games — Easy = Tier 1, Medium = 1+2, Hard = all.

This is NOT a competitive game — it's a **relaxed learning mode** with no timer and no score. It completes the learn → play → verify → remember loop.

| Mode | Front | Back | Map Behavior |
|---|---|---|---|
| Flag → Country | Flag image | Country name + key facts | Globe slowly rotates |
| Silhouette → Country | Country border highlighted on map | Name + fill green + center camera | Camera zooms to region, border stroke only |
| Capital → Country | Capital name | Country name + flag | Globe slowly rotates |
| Country → Capital | Country name | Capital + pin on map | Camera flies to country, drops pin |
| Country → Flag | Country name | Flag image | Globe slowly rotates |
| Map Shape → Country | Camera zooms to country, border highlighted | Name + fill + label | Camera offset zoom, then centers on reveal |

**Interaction**: Tap to reveal → Swipe right ("I knew it") or Swipe left ("Didn't know"). Cards swiped left re-enter the deck. Session ends when all cards are mastered.

**Entry points**:
- Home screen game card (🃏 Flashcards)
- Country Card bottom sheet ("Study Flashcards" button)
- Post-game resolution ("Review what you missed")

**Accent color**: `#6366F1` (Indigo)

---

## 8.5 Game Resolution & State Transitions

### The Resolution Phase (Common to All Games)

After the game ends (timer expires, final round complete, or player quits), the app enters **Resolution**:

**Timeline**:
```
                    [Game Playing]
                          ↓
                   [Timer expires / Final round completes]
                          ↓
            ─────────────────────────────────
            │   1. Game UI fades out (200ms)
            │   2. Map resets (if needed)
            │   3. Final score calculated
            │   4. Country highlights updated to show results
            │   5. Result Card slides up from bottom (400ms)
            └─────────────────────────────────
                          ↓
                    [Result Card Shown]
                   (Score, stats, review)
                          ↓
            ─────────────────────────────────
            │  User taps:
            │  - "Play Again" → New game, same settings
            │  - "Home" → Back to home screen
            │  - Tap country in results → Country Card opens
            │  - "Review Full Stats" → Stats screen
            └─────────────────────────────────
                          ↓
                    [User chooses action]
```

### Result Card UI

Every game shows a unified result card with these sections:

```
┌──────────────────────────────┐
│  ✔️ YOU DID IT!               │  ← Win/lose message
│                              │
│  Score: 1250                 │  ← Large score number
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                              │
│  🎯 Streak:    12            │
│  ⏱️  Avg Time:   2.3s        │  ← Quick stats grid
│  ✅ Accuracy:   85%          │
│  🗺️  Countries: 15/15        │
│                              │
│  ─────────────────────────── │
│  Recent Answers              │
│  ─────────────────────────── │
│                              │
│  ✔️  Germany (2.1s)          │
│  ❌ France (timeout)         │  ← Scrollable answer review
│  ✔️  Italy (1.8s)            │  ← Tap country → opens Country Card
│  ⏭️  Spain (skipped)         │
│  ✔️  Poland (3.2s)           │
│                              │
│  [ 🔄 Play Again] [🏠 Home] │
└──────────────────────────────┘
```

### Country Card from Results

If a user taps a country in the result list, the Country Card opens over the Result Card:

```
┌─────────────────────────────────┐
│  Country Card (from results)    │
│                                 │
│  🇩🇪 Germany                    │
│  Capital: Berlin                │
│  Population: 83.2M              │
│  Your score: ✔️ Correct (2.1s) │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Your Progress               ││
│  │ Flag Sprint:    ✅ 10/10    ││
│  │ Silhouette:     ✅ 8/10     ││
│  │ Capital Clash:  ❌ 5/10     ││
│  │ Border Blitz:   ✅ Named    ││
│  │ Find on Map:    ⏱️  85s     ││
│  └─────────────────────────────┘│
│                                 │
│  [ 📚 Study Flashcards]       │
│  [ ← Back to Results]          │
└─────────────────────────────────┘
```

### Post-Resolution Transitions

**Option 1: Play Again**
- Same game, same difficulty, same continent selected
- Fresh random country pool (new countries, not repeats from last game)
- Camera pulls back to world view, then flies to game start position
- Countdown overlay appears → game phase begins immediately
- Result card dissolves (fade out 300ms)

**Option 2: Home**
- Result card slides down off-screen (400ms)
- Game overlay clears, map returns to idle state
- Camera pulls back to default home view
- Games panel slides up from bottom (300ms)
- Home screen snap-to default 50/50 state
- Globe maintains game highlights (countries colored by result) for 1-2 seconds, then fades to neutral state

**Option 3: Tap Country in Results**
- Country Card slides up from bottom (300ms)
- Extends over the Result Card
- Supplies personalized progress data for that specific country
- "Study Flashcards" button loads flashcard deck for that country's continent
- "← Back to Results" returns to the Result Card

### Scoring Formula (Universal)

Each game has its own mechanics, but scoring follows this pattern:

```
Base Points = 10
Speed Bonus = MIN(10, (timeLeft / totalTime) * 10)
Difficulty Multiplier = Easy: 1.0x, Medium: 1.5x, Hard: 2.0x
Accuracy Streak Bonus = (streakCount - 1) * 2  [e.g., 5-streak = +8 bonus]

Total = (Base + Speed) * Multiplier + Streak
```

Examples for a 10-point base:
- Correct in 2s (60s timer): 10 + 8 = 18pts. Hard mode: 18 * 2 = 36pts. 5-streak: +8 = 44pts
- Correct in 50s (60s timer): 10 + 2 = 12pts. Medium: 12 * 1.5 = 18pts
- Wrong or timeout: 0pts, -5pts penalty (some games)

### Persisting Results to Local Storage

After game resolution, store the stats:

```dart
class GameResult {
  final String gameType;        // 'connect', 'silhouette', 'flag_sprint', etc.
  final Difficulty difficulty;
  final Continent continent;
  final DateTime timestamp;
  final int score;
  final int roundCount;         // 15 for flag sprint, 1 for connect countries
  final int correctCount;
  final int accuracy;           // 0-100
  final List<String> answeredCountries;  // Countries guessed/found
  final int durationSeconds;
  final Map<String, int> countryStats;  // {'DE': score, 'FR': score, ...}
}

// Store in Hive or SharedPreferences
// Update per-country stats (for Country Card "Your Progress" section)
```

---

## 9. Home Screen — The Split-Screen Globe

### Core Concept

The home screen is a **two-panel split**: the 3D globe on top, the game launcher on the bottom, with a draggable divider between them. The divider snaps to three states — creating a smooth, spring-physics transition between "explore the world" and "play games."

### The Three States

```
 EXPLORE MODE            DEFAULT (50/50)            PLAY MODE
 (swipe down)                                       (swipe up)

┌────────────────┐    ┌────────────────────┐    ┌────────────────┐
│ [⚙️]      [👤] │    │ [⚙️]          [👤] │    │ ~~globe peek~~ │
│                │    │                    │    ├── drag handle ──┤
│     🌍         │    │      🌍            │    │                │
│   GLOBE        │    │    GLOBE           │    │  G E O P L A Y │
│  (full view)   │    │  (half view)       │    │                │
│  Labels ON     │    │  Slowly rotating   │    │  [Easy][Med]   │
│  Tap = Card    │    │                    │    │  [🌍][🇪🇺][🌏]  │
│  Spin / Zoom   │    ├── drag handle ─────┤    │                │
│                │    │                    │    │  🔗 Connect     │
│                │    │  G E O P L A Y    │    │  🗺️ Silhouette  │
│                │    │  [Easy][Med][Hard] │    │  🏁 Flags       │
│                │    │  [🌍][🇪🇺][🌏]...  │    │  ⚡ Capitals    │
│                │    │                    │    │  ⚔️ Border      │
│                │    │  🔗 Connect        │    │  📍 Map Quiz    │
│                │    │  🗺️ Silhouette     │    │  🃏 Flashcards  │
│                │    │  🏁 Flag Sprint    │    │                │
├── drag handle ─┤    │  ... (2-3 visible) │    │                │
│ ⬆ Swipe up     │    └────────────────────┘    └────────────────┘
└────────────────┘
  Globe ~90%           Globe ~50%                  Globe ~10%
  Games = pill         Games ~50%                  Games ~90%
```

### State Details

#### State 1: Default (50/50 Split)

The landing state when the app opens.

- **Globe (top half)**: Slowly rotating 3D globe. Country labels visible. Ambient and inviting.
- **Games panel (bottom half)**: Title, difficulty selector, continent filter, and 2-3 game cards visible (scrollable for more).
- **Drag handle**: Small pill-shaped indicator at the divider. Draggable up or down.

**Tap behavior in default state:**
- **Tap on the globe** → Transitions to **Explore Mode** (the globe expands to fill the screen). This is the key interaction: any touch on the globe half signals "I want to explore", so the panel smoothly slides down.
- **Tap on a game card** → Opens that specific game (camera flies, countdown begins).
- **Tap on title/difficulty/continent area** → Scrolls game list or changes selection. If user taps the games panel and only 2-3 cards are visible, they can also drag up to reveal all games.

#### State 2: Explore Mode (Globe ~90%)

Entered by: tapping the globe in default state, or dragging the handle down.

- **Globe (full screen)**: Interactive — spin, pinch-zoom, rotate. Country labels visible. Countries are tappable.
- **Country tap** → Country Card bottom sheet slides up over the globe with wiki data, personal stats, and "Fly to Country" / "Study Flashcards" actions.
- **Games panel**: Collapsed to a small frosted pill at the bottom showing "⬆ Swipe up for games". Just enough to remind the user games exist.
- **Return**: Swipe up on the pill, or tap the pill → transitions back to default or play mode.

This is the **atlas / learning mode**. No game UI, no timers. Pure exploration.

#### State 3: Play Mode (Games ~90%)

Entered by: dragging the handle up from default state.

- **Globe (top strip)**: Shrinks to a thin ambient strip (~10% of screen). Globe camera pulls back to show a wide view. Acts as visual branding — the globe is always present.
- **Games panel (full screen)**: All game cards visible without scrolling on most devices. Difficulty selector, continent filter, and the complete game list fully accessible.
- **Return**: Drag handle down, or tap the globe strip → transitions back to default.

This is the **competitive mode**. The user is here to pick a game and play.

### Responsive Split Ratios

The default ratio adapts to screen size:

| Screen Size | Default Split | Behavior |
|---|---|---|
| Small (<5.5") | 35/65 (globe/games) | Globe shows enough to be inviting, games get more room |
| Medium (5.5"–6.5") | 50/50 | Standard balanced view |
| Large (>6.5" / tablets) | 55/45 | Globe gets more room — more immersive |

In Explore mode, the globe always takes ~90%. In Play mode, the globe strip is always ~10% (enough for a narrow globe peek).

### Drag Handle & Physics

```dart
/// Home screen split controller
class HomeSplitController {
  /// Three snap points as fraction of screen height for the globe
  static const double exploreStop = 0.90;  // Globe 90%
  static const double defaultStop = 0.50;  // Globe 50% (adaptive)
  static const double playStop    = 0.10;  // Globe 10%

  /// Spring physics for snap animation
  static const spring = SpringDescription(
    mass: 1.0,
    stiffness: 500.0,
    damping: 30.0,
  );
}
```

**Drag behavior:**
- Dragging the handle smoothly resizes both panels in real-time
- On release, snaps to the nearest stop based on position + velocity
- If user flings fast, it skips to the next stop in the fling direction
- Globe camera dynamically adjusts zoom level as the globe panel resizes (smaller panel → wider zoom, so the globe always looks complete, never cropped)

**Globe tap → Explore transition:**
When the user taps anywhere on the globe in default state:
1. The tap is consumed (no country query yet — that happens only in Explore mode)
2. The split animates from 50/50 to Explore mode (spring physics, ~400ms)
3. Globe labels fade in, country tap listeners activate
4. Now tapping a country opens the Country Card

This is intentional: in 50/50 mode, the globe is too small to accurately tap individual countries, so any touch on it means "show me more globe."

### Layout Implementation

```dart
class HomeScreen extends ConsumerStatefulWidget { ... }

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _splitController;
  double _splitRatio = HomeSplitController.defaultStop;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Layer 0: Globe (always present) ──
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: MediaQuery.of(context).size.height * _splitRatio,
          child: GestureDetector(
            onTap: _expandToExploreMode,
            child: MapboxMapView(...),  // The persistent globe
          ),
        ),

        // ── Layer 1: Games Panel ──
        Positioned(
          top: MediaQuery.of(context).size.height * _splitRatio,
          left: 0,
          right: 0,
          bottom: 0,
          child: GamesPanel(
            onGameSelected: _launchGame,
            difficulty: selectedDifficulty,
            continent: selectedContinent,
          ),
        ),

        // ── Layer 2: Drag Handle ──
        Positioned(
          top: MediaQuery.of(context).size.height * _splitRatio - 16,
          left: 0,
          right: 0,
          child: GestureDetector(
            onVerticalDragUpdate: _onDragUpdate,
            onVerticalDragEnd: _onDragEnd,
            child: DragHandle(),
          ),
        ),

        // ── Layer 3: Top bar (always visible, translucent) ──
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: TopBar(
              onSettingsTap: _openSettings,
              onProfileTap: _openProfile,
            ),
          ),
        ),
      ],
    );
  }
}
```

### Games Panel Layout

The games panel is a frosted-glass surface containing all game selection UI:

```
┌──────────────────────────────────┐
│                                  │
│  ── drag handle pill ──          │  ← Visible at panel top
│                                  │
│    G E O P L A Y                │  ← Title (scales down in 50/50)
│    Master the globe.             │
│                                  │
│  [ Easy ] [ Medium ] [ Hard ]   │  ← Difficulty selector
│                                  │
│  [🌍All][🇪🇺][🌏][🌍][🌎][🌎]      │  ← Continent filter
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🔗 Connect Countries       │  │  ← Game cards (scrollable)
│  │    2-3 countries · 90s     │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🗺️ Find the Country        │  │
│  │    5 rounds · 30s · famous │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🏁 Flag Sprint             │  │
│  │    60s · well-known        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ ⚡ Capital Clash            │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ ⚔️ Border Blitz             │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 📍 Find on Map             │  │
│  │    90s · well-known        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🃏 Flashcards              │  │
│  │    Study · no timer        │  │
│  └────────────────────────────┘  │
│                                  │
│       GeoPlay — v1.0.0          │
└──────────────────────────────────┘
```

In default 50/50 state, only the title, selectors, and 2-3 game cards are visible. The user scrolls within the panel to see more, or drags up to Play mode for the full list.

### Game Launch Transition

When the user taps a game card:

1. **Games panel slides down** off screen (300ms ease-out)
2. **Globe expands** to full screen simultaneously
3. **Camera flies** to the relevant position (continent zoom or country pair)
4. **Countdown overlay** appears (3-2-1)
5. **Game UI overlays** slide in from bottom/top

When returning from a game:

1. **Game overlay fades out**
2. **Camera pulls back** to the default home view
3. **Games panel slides up** from the bottom, globe shrinks to the remembered split ratio
4. Home screen restored to the state before the game launched

### Explore Mode — Country Card Interaction

In Explore mode (globe ~90%), tapping a country triggers:

1. Map controller queries `getCountryAtPoint(tapPosition)` → ISO code
2. Country briefly highlights (accent flash, 200ms)
3. Camera subtly centers on the tapped country (300ms fly-to)
4. Country Card bottom sheet slides up (DraggableScrollableSheet)
5. Card shows: flag, name, all wiki data, personal progress, action buttons
6. Dismissing the card (swipe down) returns to explore mode
7. "Fly to Country" button centers camera + slight zoom
8. "Study Flashcards" button transitions to flashcard mode for that country's continent

### Difficulty-Aware Game Cards

Each game card shows a **pool label** that changes based on the selected difficulty, making the tier system visible and understandable to the player:

| Difficulty | Pool Label | Translations |
|---|---|---|
| Easy | "well-known" | EN: well-known, ZH: 知名, ES: conocidos, AR: المشهورة, FR: connus, PT: conhecidos, RU: известные |
| Medium | "most" | EN: most, ZH: 大部分, ES: mayoría, AR: معظم, FR: la plupart, PT: maioria, RU: большинство |
| Hard | "all" | EN: all, ZH: 全部, ES: todos, AR: الكل, FR: tous, PT: todos, RU: все |

**Example card info strings:**
- Flag Sprint + Easy: `"60s · well-known"`
- Flag Sprint + Hard: `"45s · all · wrong = -10 pts"`
- Find on Map + Easy: `"90s · well-known"`
- Silhouette + Medium: `"8 rounds · 20s each · most"`
- Capital Clash + Hard: `"45s · all · both ways · wrong = -10"`

### Frosted Glass Aesthetic

All overlay cards and the games panel use:
```dart
ClipRRect(
  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
    child: Container(
      color: theme.surface.withOpacity(0.85),  // 85% opacity for readability
      child: content,
    ),
  ),
)
```

### Drag Handle Widget

```dart
class DragHandle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 40,
        height: 5,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.3),
          borderRadius: BorderRadius.circular(2.5),
        ),
      ),
    );
  }
}
```

---

## 10. Shared Widget Library

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

## 11. Theming — Dark & Light Mode

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
| Flashcards | `#6366F1` (Indigo) |

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

## 12. Internationalization (i18n)

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

## 13. Input System — Hybrid & Adaptive

### Design Philosophy: Right Tool for Right Game

Instead of one-size-fits-all input, GeoPlay uses **adaptive input strategies** optimized per game type:
- **Visual-matching games** (identify from options) → tap-to-select buttons
- **Knowledge-recall games** (name from memory) → type + autocomplete
- **Spatial games** (locate on map) → direct tap on globe
- **Learning mode** (study) → gesture-first (swipe)

**Core principle**: All inputs in **thumb zone** (bottom of screen) for one-handed play on phones ≥4.7".

---

### Input Strategy by Game Type

#### Type 1: Visual-Matching (Fast Recognition)
**Games**: Flag Sprint, Find the Country (Silhouette), Capital Clash (Variant A)

**Why this strategy**: Visual decisions are instant. Player scans flag/clue → spots answer → taps. Reading 4 button labels faster than typing and remembering.

**Example Flow** (Flag Sprint):
```
┌─────────────────────────────────┐
│  🇩🇪  [Large flag, 40% screen]  │
│                                 │
│  Display "Name this flag"       │
│                                 │
│  ┌────────────────┬────────────┐│
│  │ A              │ B          ││
│  │ Germany        │ Austria    ││
│  ├────────────────┼────────────┤│
│  │ C              │ D          ││
│  │ Slovakia       │ Bulgaria   ││
│  └────────────────┴────────────┘│
│                                 │
│ ** Touch target: 52pt (12mm) ** │
│ ** Reaction time goal: <100ms** │
└─────────────────────────────────┘

User action:
1. Tap button A (or press A key)
2. Instant haptic (medium impact)
3. <100ms: Visual feedback (scale 1.0 → 1.05 → back)
4. Visual result (green fill on map, +10pts)
5. New flag appears immediately
```

**Controls**:
- **Touch**: Tap any button (A/B/C/D)
- **Keyboard** (accessibility): Press A/B/C/D key or arrow keys + Enter
- **Haptic**: Medium impact on tap, heavy on wrong

---

#### Type 2: Knowledge-Recall (Speed + Memory)
**Games**: Connect Countries, Border Blitz, Capital Clash (Variant B)

**Why this strategy**: Expert players type "B" for "Brazil" faster than reading through 4 buttons. Tests actual geographic knowledge (recall), not just recognition.

**Example Flow** (Connect Countries):
```
Current position: Germany
Find: Next neighbor to France

Input field shows:
┌──────────────────────────────────┐
│ Next: [neighbor search]   [GO]   │
│                                  │
│ User types: "F"                  │
│                                  │
│ Instantly filters:               │
│ [France] [Finland]               │
│ [Fiji] (also matches if global)  │
│                                  │
│ User presses spacebar to select  │
│ Or taps "France"                 │
│ Or finishes typing "Fr" + Enter  │
└──────────────────────────────────┘

Result:
1. Path draws: Germany → France
2. France fills blue
3. Score +15pts
4. Camera adjusts to France
5. New prompt: "From France, go to..."
```

**Controls**:
- **Type**: User types country name (first 2-3 letters enough)
- **Autocomplete**: Filters list in real-time as user types
- **Select**: Tap from list, press spacebar, or press Enter
- **Spacebar trick**: Cycles through matching options without touching
- **Backspace**: Clear line, shows full list again

**Scoring incentive**: Speed bonus for quick replies (typing "B" + Enter in <1s worth more than reading buttons)

---

#### Type 3: Spatial-Interaction (Direct & Immersive)
**Games**: Find on Map

**Why this strategy**: This is the ONLY game where the player directly interacts with the map. Forcing multiple-choice buttons would destroy the immersion and test guidance rather than pure knowledge.

**Example Flow**:
```
┌───────────────────────────────────┐
│ Target: Find Spain                │
│                                   │
│        [Interactive globe]        │
│       (User can zoom/rotate)      │
│                                   │
│  Player taps globe at Spain's     │
│  location                         │
│                                   │
│  ✅ Correct:                      │
│     • Green fill on Spain         │
│     • Haptic (medium)             │
│     • +15pts (speed bonus)        │
│     • Next target instantly       │
│                                   │
│  ❌ Wrong (taps Portugal):        │
│     • Red flash on Portugal       │
│     • Haptic (heavy/error)        │
│     • -5pts                       │
│     • Continue (player searches)  │
│                                   │
│  Fallback option:                 │
│  Type "Sp..." → Spain highlights  │
│  with border outline → Tap to     │
│  confirm                          │
└───────────────────────────────────┘
```

**Controls**:
- **Primary**: Tap/touch on map (direct interaction)
- **Gestures**: Pinch-zoom, two-finger rotate, pan
- **Fallback**: Type country name (accessibility, mobile keyboard)
- **Skip**: Button available (-2pts, next target)

**Input accessibility**:
- For visually impaired: Type country name, hear map highlight, tap to confirm
- For motor disabilities: Full keyboard support (Tab through countries)

---

#### Type 4: Gesture-First (Learning, Pressure-Free)
**Games**: Flashcards

**Why this strategy**: Study mode has no pressure, no timer, no score. Gesture interaction (swipe) is more zen than tapping buttons.

**Example Flow**:
```
┌──────────────────────────────┐
│ [No timer, no score]         │
│                              │
│   🇩🇪 [Large flag]           │
│                              │
│   "Tap to reveal"            │
│                              │
│ User taps card               │
│                              │
│ ✨ 3D flip animation (400ms) │
│ Card flips to reveal:        │
│   Germany                    │
│   Capital: Berlin            │
│   Pop: 83.2M · Europe       │
│                              │
│ After reveal:                │
│                              │
│ ← Swipe left (didn't know)   │
│   → Swipe right (I knew it)  │
│                              │
│ Card exits screen + animation│
│ Next card auto-appears       │
│                              │
│ Deck: 12/45 cards learned   │
└──────────────────────────────┘
```

**Controls**:
- **Tap**: Reveal answer
- **Swipe right**: "I knew it" (card mastered)
- **Swipe left**: "Didn't know" (card returns to deck)  
- **Exit button**: Leave session anytime (saves progress)

---

### Input Methods Summary

| Game | Primary Input | Input Type | Interaction | UI Complexity |
|---|---|---|---|---|
| **Flag Sprint** | Tap 4 buttons (A/B/C/D) | Visual | Fast decisions | Low |
| **Silhouette** | Tap 4 buttons (A/B/C/D) | Visual | Fast decisions | Low |
| **Capital Clash (A)** | Tap 4 buttons | Visual | Fast decisions | Low |
| **Capital Clash (B)** | Type + tap filtered list | Recall | Memory test | Medium |
| **Connect Countries** | Type + tap filtered neighbors | Recall | Pathfinding | Medium |
| **Border Blitz** | Type + tap filtered neighbors | Recall | Neighbor hunt | Medium |
| **Find on Map** | Tap on globe | Spatial | Map hunt | High |
| **Flashcards** | Swipe left/right | Gesture | Learning | Low |

### One-Handed Mobile UX Constraints

All inputs must work with **single hand** on phones ≤6": 
- Touch targets ≥52pt (12mm) wide
- Input field bottom-aligned (thumb reach)
- No UI elements above phone height (can't reach with thumb)
- Buttons in 2×2 grid on phones ≤5.5"
- No sideways swiping (conflicts with system gestures)
- All buttons reachable from thumb without hand shift

**Landscape orientation** (tested on iPad):
- Input always bottom-center (fixed during rotation)
- Globe resizes to fill remaining space
- 4-button grid scales to 4-in-a-row for thumb access

---

### Advanced Input Features

#### Spacebar Cycling (Keyboard Users)
When user types and matches multiple options:
```
Type "B" in Connect Countries:

Options shown: Brazil, Belgium, Benin, Bosnia

User presses SPACEBAR:
  • First press: Highlight Brazil
  • Second press: Highlight Belgium
  • Third press: Highlight Benin
  • Fourth press: Highlight Bosnia
  • Fifth press: Cycle back to Brazil

User presses ENTER: Submit highlighted option
```

#### Character Limits & Hints
- **Type mode**: Auto-complete after 1st character (but player can type full name)
- **Hint**: Shows first 2-3 letters if guessing wrong 3+ times
- **Autocorrect**: Only correct to country names in pool (not system autocorrect)

#### Implementation (Dart)
```dart
List<String> filterAndSort(String input, List<String> allOptions, List<String>? priority) {
  if (input.isEmpty) return priority ?? allOptions.take(6).toList();
  
  final lower = input.toLowerCase();
  final matches = allOptions
    .where((name) => name.toLowerCase().contains(lower))
    .sorted((a, b) {
      // Priority 1: Starts with input
      final aStarts = a.toLowerCase().startsWith(lower);
      final bStarts = b.toLowerCase().startsWith(lower);
      if (aStarts != bStarts) return aStarts ? -1 : 1;
      
      // Priority 2: In priority list (neighbors, available options)
      final aInPriority = priority?.contains(a) ?? false;
      final bInPriority = priority?.contains(b) ?? false;
      if (aInPriority != bInPriority) return aInPriority ? -1 : 1;
      
      // Priority 3: Alphabetical
      return a.compareTo(b);
    })
    .take(8)  // Show up to 8 matches
    .toList();
  
  return matches;
}
```

---

---

## 14. Animations & Haptics

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
| Flashcard reveal | 3D Y-axis flip (front → back) | 400ms | `Transform` with `Matrix4.rotationY` |
| Flashcard swipe right | Slide right + rotate + fade | 300ms | `flutter_animate` `.slideX().rotate().fadeOut()` |
| Flashcard swipe left | Slide left + rotate + fade | 300ms | Same, opposite direction |
| Country Card slide up | Bottom sheet spring | 400ms | `showModalBottomSheet` with spring curve |
| Home split drag | Globe + panel resize in real-time | Real-time | `GestureDetector` + animated positioned |
| Home split snap | Spring physics to snap stop | ~400ms (spring) | `SpringSimulation` with mass 1.0, stiffness 500, damping 30 |
| Globe tap → Explore | Split animates 50/50 → 90/10 | ~400ms (spring) | Same spring; globe labels fade in 200ms |
| Explore → Default | Split animates 90/10 → 50/50 | ~400ms (spring) | Pill tap or swipe up triggers snap |
| Globe resize zoom | Camera zoom adapts to panel size | Continuous | Smaller panel → wider zoom (never crops globe) |
| Home → Game transition | Games panel slides down + globe expands + camera fly | 300ms + 1200ms | Parallel: panel slide, globe expand, camera animate |
| Game → Home return | Game overlay fades + camera pulls back + panel slides up | 300ms + 800ms | Reverse of launch |
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
| Home split snap | Selection click | `HapticFeedback.selectionClick()` |
| Globe tap → Explore | Light impact | `HapticFeedback.lightImpact()` |
| Flashcard reveal | Light impact | `HapticFeedback.lightImpact()` |
| Flashcard swipe (known) | Selection click | `HapticFeedback.selectionClick()` |
| Flashcard swipe (review) | Light impact | `HapticFeedback.lightImpact()` |
| Country Card open | Light impact | `HapticFeedback.lightImpact()` |
| Button tap | Selection click | `HapticFeedback.selectionClick()` |

---

## 15. Offline Mode (Premium)

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

## 16. Monetization & Premium Features

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

- **One-time purchase**: $4.99 (simplest, highest conversion) enable offline mode (current)
- **OR Annual subscription**: $9.99/year (better for covering Mapbox costs at scale) enable offline + ad-free + compete with friends (future feature)

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

## 17. Sound Design

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

## 18. Performance Budget

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

5. **Pre-warm country data** — Load and index all country data, adjacency graph, country tiers, and translations during the splash screen, before the home screen appears.

6. **Image caching** — Flag images loaded via `CachedNetworkImage` or pre-bundled as assets.

7. **Lazy provider initialization** — Game engine providers are created on demand (when a game starts), not at app launch.

---

## 19. Project Structure

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
│   │   │   ├── countries.dart            # Country model (extended with wiki fields)
│   │   │   ├── country_data.dart         # All 213 entries with full wiki data
│   │   │   ├── country_tiers.dart        # Tier 1/2/3 per country + helpers
│   │   │   ├── adjacency.dart            # Border graph helpers (reads from Country.neighbors)
│   │   │   ├── graph.dart                # BFS pathfinding
│   │   │   ├── country_names.dart        # Localized country names (7 langs)
│   │   │   ├── capital_names.dart        # Localized capital names (7 langs)
│   │   │   └── country_progress.dart     # Per-country personal stats persistence
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
│   │   ├── flashcard_engine.dart         # Flashcard deck/swipe logic
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
│   │   │   ├── home_screen.dart          # Split-screen controller (3 states)
│   │   │   ├── home_split_controller.dart# Snap stops, spring physics, ratios
│   │   │   ├── games_panel.dart          # Bottom panel: games list + selectors
│   │   │   ├── drag_handle.dart          # Draggable divider pill widget
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
│   │   │   ├── map_quiz_overlay.dart
│   │   │   └── flashcard_overlay.dart    # Flashcard study mode
│   │   ├── wiki/
│   │   │   ├── country_card.dart         # Country Card bottom sheet
│   │   │   └── country_progress_view.dart# Per-country stats display
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
│   │   ├── flag_image.dart
│   │   └── swipe_card.dart              # Tinder-style swipe widget for flashcards
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

## 20. Dependencies (pubspec.yaml)

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
  hive_flutter: ^1.1.0             # Fast local DB for country progress stats
  
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

## 21. Deployment & Distribution

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

## 22. Error Handling & Edge Cases

### Network Errors

| Scenario | Behavior | Recovery |
|---|---|---|
| **No internet** (Offline mode) | Map tiles display cached/native tiles. Games work if not tier-heavy. | Graceful degradation — show "limited features" indicator |
| **Slow connection** | Tile loading shows progress. Game continues with lower-quality tiles. | Automatic retry every 5s for missing tiles |
| **Connection lost mid-game** | Game continues with cached map state. Results can still be saved locally. | On reconnect, upload pending stats to cloud (Phase 2) |
| **Mapbox token invalid** | Map fails to load. Show error card with "Update Mapbox token" action. | Dev-only error in debug builds; production error escalates to support |

### Input Validation

| Game | Input | Validation | On Invalid |
|---|---|---|---|
| **All games** | Country/capital selection | Must be a valid ISO-3166-1 or known capital name | Reject silently, shake animation, -5pts |
| **Connect Countries** | Neighbor submission | Must be adjacent to current position (check `Country.neighbors`) | Red flash, continue |
| **Border Blitz** | Neighbor submission | Must be adjacent to anchor (check `Country.neighbors`) | Red flash, continue |
| **Find on Map** | Tap coordinates | Must hit a valid country polygon (query Mapbox) | Haptic error, continue |

### Boundary Conditions

| Edge Case | Handling |
|---|---|
| **Tier 2 pool is empty** | Cascading fallback: if Medium difficulty has <10 countries, use Tier 1 + 2 + first 3 Tier 3 |
| **No valid path exists (Connect Countries)** | This should never happen (graph is fully connected), but if isolated country detected, exclude it from pool |
| **Micro-state with 0 neighbors (e.g., island nation)** | Skip from Border Blitz selection. Not reachable in pathfinding, excluded from pool. |
| **Player quits during game** | Show "Are you sure?" confirmation. If yes, result recorded as incomplete (0 points, but stats logged). |
| **Player closes app mid-game** | Game state persisted in Riverpod (ephemeral). On reopen, user returns to home screen (game lost). |
| **Very fast inputs** (multiple taps <100ms apart) | Debounce input handler, only first valid tap counts. |
| **Country appears twice in question options (bug)** | Filter duplicates before rendering options. Log error. |
| **Mapbox layer doesn't exist** | Graceful no-op, log warning, game continues. User sees map but no highlights. |

### Timeout Handling

| Game | Timeout Duration | On Timeout |
|---|---|---|
| **Connect Countries** | 120s execution phase | Auto-submit. Show reveal. -50pts. Move to next round. |
| **Find the Country** | 20s per round | Auto-submit wrong. Show correct answer. Next round immediate. |
| **Flag Sprint** | 60s total | Timer expires, result card shown. Can't continue. |
| **Capital Clash** | 60s / 60 rounds | Same as Flag Sprint. |
| **Border Blitz** | 60s per anchor | Auto-submit, reveal unfound neighbors. Move to next anchor. |
| **Find on Map** | 90s total | Timer expires, result card. |
| **Flashcards** | No timeout | Player controls session end. |

### Device-Specific Edge Cases

| Device | Edge Case | Handling |
|---|---|---|
| **Notch/Cutout (All models)** | Top bar UI occluded | Use `MediaQuery.padding.top` + `SafeArea` wrapping. Test on iPhone 13/14 simulator. |
| **Large screen tablets (>7")** | Game buttons too spread out | Constrain max width to 600px, center on screen. |
| **Small screen phones (4.7" iPhone SE)** | Text too small, buttons cramped | Scale down game difficulty card, use 2×2 button grid instead of 4 in a row. |
| **Low memory device** | BFS pathfinding lags | Run in Dart isolate background thread. Show "Computing..." overlay. |
| **GPU-poor device (old Android)** | Map rendering stutter | Reduce target FPS to 30fps. Disable map rotation animations. |

---

## 23. Implementation Validation Checklist

Use this checklist during development to ensure the app matches this specification and is bug-free:

### Core Architecture ✅

- [ ] Map never unmounts (MapboxMapView always rendered)
- [ ] Map can be tapped and interacted with (except during input-only games)
- [ ] Map highlights update in <100ms (performance budget check)
- [ ] Camera animations use proper `CameraOptions` and `AnimationOptions`
- [ ] Riverpod providers initialized before home screen appears
- [ ] No console warnings or errors on cold start
- [ ] App handles app lifecycle (pause/resume) without crashes

### Home Screen ✅

- [ ] Split screen loads in default 50/50 state
- [ ] Globe and games panel both visible on small screens (adaptive ratio)
- [ ] Drag handle snaps to 3 positions (Explore 90%, Default 50%, Play 10%)
- [ ] Spring physics feel responsive (mass 1.0, stiffness 500, damping 30)
- [ ] Tapping globe in 50/50 state transitions to Explore (90%) mode
- [ ] Difficulty selector changes all game difficulty pools correctly
- [ ] Continent selector filters all game pools correctly (or "All" removes filter)
- [ ] Game cards show correct pool label ("well-known" / "most" / "all")
- [ ] Tapping a game card launches that game without lag
- [ ] Country Card opens when tapping globe in Explore mode
- [ ] Country Card shows personal progress stats for each country

### Game: Connect Countries ✅

- [ ] Reveal phase shows both countries (start green, end red) with camera fly
- [ ] Countdown 3-2-1 displays correctly over map
- [ ] Player can select from 6-8 eligible neighbors (displayed as buttons or dropdown)
- [ ] Fallback: typing search filters neighbors correctly
- [ ] Each correct move: country fills blue, camera flies gently, path line draws, +points
- [ ] Wrong move: country flashes red, -points, continue
- [ ] Timer display shows time remaining (changes color at <10s)
- [ ] Hint system works (reveals 1 move)
- [ ] Skip button works (shows new start/end pair)
- [ ] Result shows: score, optimal vs player path, accuracy %
- [ ] All countries in path labeled on result card

### Game: Find the Country ✅

- [ ] Border clue shows map zoomed to region (not centered, harder)
- [ ] 4 multiple-choice options display below map (A/B/C/D buttons)
- [ ] Tap option instantly submits (no delay)
- [ ] Correct: country fills green, camera centers, +points, next round
- [ ] Wrong: border flashes red, hint revealed/shown, -points, continue
- [ ] Hints: capital name, population, or neighboring countries (limits 1-2 per round)
- [ ] Round counter shows progress (1/5, 2/5, etc.)
- [ ] Result card shows: rounds completed, accuracy %, countries solved/missed

### Game: Flag Sprint ✅

- [ ] Large flag image centered
- [ ] 4 country name options (A/B/C/D) arranged in 2×2 grid (or 4-in-a-row on tablets)
- [ ] Tap option submits instantly
- [ ] Correct: country flashes green on globe, score +points, next flag
- [ ] Wrong: -10pts, country flashes red, new options shown
- [ ] Timer counts down (color changes red at <10s, pulsing)
- [ ] Streak badge appears at 3+ correct in a row
- [ ] Speed matters: reaction time factors into points
- [ ] Result shows: total score, streak count, accuracy %, best/worst countries

### Game: Capital Clash ✅

- [ ] Variant A (default): Shows country, asks for capital
- [ ] Variant B (Medium+): Shows capital, asks for country
- [ ] 4 multiple-choice options (A/B/C/D)
- [ ] Tap option submits instantly
- [ ] Correct: country camera fly-to (500ms), pin drops on capital, camera returns, +points
- [ ] Wrong: country flashes red, correct answer revealed for learning, -points
- [ ] Option to disable camera fly-to in settings
- [ ] Result shows: accuracy %, avg time per round, variant breakdown

### Game: Border Blitz ✅

- [ ] Anchor country highlighted in purple on map
- [ ] Camera starts tight on anchor (`zoom: 5-6`)
- [ ] Shows 4-6 neighbor country names (tap to select)
- [ ] Fallback: typing search filters neighbors
- [ ] Each correct: neighbor fills green, camera widens slightly, +points
- [ ] Each wrong: guessed country flashes red, -points
- [ ] Hint reveals one unfound neighbor (-50% points for that neighbor)
- [ ] Skip button works (0 points for anchor, move to next)
- [ ] After all neighbors found, next anchor selected automatically
- [ ] Result shows: anchors completed, accuracy %, neighbors found/missed, hints used

### Game: Find on Map ✅

- [ ] Target country name displayed at top
- [ ] Globe fully interactive (pinch-zoom, rotate, pan)
- [ ] Tapping a country queries map (`getCountryAtPoint(tapPos)`)
- [ ] Correct tap: country fills green, +points (speed bonus factored), next target
- [ ] Wrong tap: country flashes red, -points, message "Try again", continue
- [ ] Skip button available, -2pts, next target
- [ ] Map labels HIDDEN (player recognizes by shape/position)
- [ ] Timer counts down (red/pulsing at <10s)
- [ ] Result shows: accuracy %, avg time per country, hardest countries

### Game: Flashcards ✅

- [ ] Deck loads with random mix of 6 card types
- [ ] Card front shows clue (flag, border, name, etc.)
- [ ] Tap to reveal back (country name + facts)
- [ ] Cards stay revealed until swiped
- [ ] Swipe right: "I knew it", removed from deck permanently
- [ ] Swipe left: "Didn't know", card re-enters deck for review
- [ ] Deck counter shows progress (12 / 45 left)
- [ ] On deck complete: "Great job!" message, session ends
- [ ] Map-type cards: camera flies to country, borders highlighted
- [ ] No timer, no score, pure learning mode
- [ ] Exit button available, session stats saved

### Input System ✅

- [ ] Multiple-choice buttons are large, tappable targets (>48pt / 11mm touch target)
- [ ] Button labels clear (A/B/C/D) + country name or capital name
- [ ] Tap registers instantly (<50ms latency)
- [ ] Text fallback (search field) works correctly
- [ ] Autocomplete filters options after each character typed
- [ ] Keyboard appears/dismisses automatically
- [ ] "Done" button on keyboard submits (first filtered option if multiple)
- [ ] Haptic feedback on correct/wrong (medium/heavy impact)
- [ ] No accessibility violations (buttons labeled, colors not sole differentiator)

### Country Data & Wiki ✅

- [ ] All 213 countries loaded from `country_data.dart` at startup
- [ ] Country tier system: ~55 Tier1, ~65 Tier2, ~93 Tier3 (total 213)
- [ ] Difficulty filters: Easy=Tier1 (~55), Medium=Tier1+2 (~120), Hard=all 213
- [ ] Country Card displays: flag, name, capital, population, area, languages, currency, neighbors, GDP
- [ ] Personal progress stats tracked: flags correct, map accuracy, capitals, silhouette, borders, time
- [ ] Neighbor list accurate (check against `Country.neighbors` field)
- [ ] Country names localized into 7 languages (en, zh, es, ar, fr, pt, ru)
- [ ] Capitals localized into 7 languages
- [ ] No crashes when looking up country data

### Map & Mapbox Integration ✅

- [ ] Map loads with correct style (dark vs light)
- [ ] Style includes custom `geoplay-highlight` fill layer (empty, dynamically styled)
- [ ] Style includes custom `geoplay-border` line layer (for silhouette game)
- [ ] Country highlighting works: `setCountryHighlights(Map<code, Color>)` updates instantly
- [ ] Border highlighting works: `showCountryBorder(iso, color)` shows only border stroke
- [ ] All camera methods work: `flyToCountry`, `flyToContinent`, `flyToShowCountries`, `flyToWorld`
- [ ] Camera animations smooth at 60fps (no dropped frames)
- [ ] `getCountryAtPoint(screenCoord)` correctly queries tapped country
- [ ] Map rotation / idle animation optional (settings toggle)
- [ ] Dark/Light theme switching updates map style instantly
- [ ] Mapbox attribution displayed somewhere (settings screen or map corner)

### Theming ✅

- [ ] Default theme determined by system (Settings → dark/light selector overrides)
- [ ] Dark theme: background #0A0E1A, surface #111827, all text readable
- [ ] Light theme: background #F8FAFC, surface #FFFFFF, all text readable
- [ ] Game accent colors are consistent: Connect=Blue, Silhouette=Purple, Flag=Green, Capital=Amber, Border=Violet, Map=Cyan, Flashcard=Indigo
- [ ] Transitions between themes smooth (no flicker)
- [ ] Settings screen has prominent theme selector

### Internationalization ✅

- [ ] 7 languages supported: en, zh, es, ar, fr, pt, ru
- [ ] UI strings translated (from ARB files)
- [ ] Country names translated
- [ ] Capital names translated
- [ ] Arabic RTL layout mirrors correctly (buttons, text, layout)
- [ ] Language selector in Settings saves selection to SharedPreferences
- [ ] On app restart, correct language loads
- [ ] No "???" fallback strings visible (all strings have translations)

### Sound Design ✅

- [ ] Sound effects enabled by default
- [ ] Correct answer plays uplifting sound + haptic
- [ ] Wrong answer plays error sound + haptic
- [ ] Timer warning ticks audio at <5s
- [ ] Streak milestone plays celebration sound
- [ ] Settings screen has sound toggle
- [ ] Sound plays even with device mute OFF (vibration still works if mute ON)
- [ ] Volume setting in range 0-100%

### Offline & Premium ✅

- [ ] Offline packs available: World, Europe, Asia, Africa, Americas
- [ ] Each pack shows estimated MB size
- [ ] Download progress shown (percentage)
- [ ] In-app purchase works (test with sandbox accounts)
- [ ] Premium status persistent across restarts
- [ ] Free tier: some games limited without offline maps
- [ ] Premium tier: all features unlocked, ad-free
- [ ] "No internet" state shows gracefully, games still playable

### Performance ✅

- [ ] Cold start: <3s to interactive home
- [ ] Game launch: <500ms from tap to countdown
- [ ] Highlight update: <100ms from engine result to visual
- [ ] Autocomplete filter: <16ms (one frame)
- [ ] 60fps during pan/zoom on any region
- [ ] No stuttering during camera animations
- [ ] BFS pathfinding runs in isolate (doesn't block UI)
- [ ] Memory usage: <150MB on 2GB RAM device
- [ ] Battery drain: acceptable (<5%/hour during gameplay)

### Accessibility ✅

- [ ] No text too small (<12pt)
- [ ] Buttons >48pt (11mm) minimum touch target
- [ ] Color not sole differentiator (use labels, text, patterns)
- [ ] Screen reader compatible (labels on all buttons/fields)
- [ ] Type-to-search works with voice input (test via accessibility settings)
- [ ] Arabic RTL mirrors all layouts correctly
- [ ] High contrast mode supported (test via system settings)
- [ ] No flashing animations >3Hz (seizure hazard)

### Device Compatibility ✅

- [ ] iOS: 15.0+ supported, tested on iPhone SE (4.7"), iPhone 13/12/11 (various sizes), iPad Pro
- [ ] Android: minSdk 23 (Android 6.0), tested on Pixel 3a, Pixel 6, Samsung Galaxy S10
- [ ] Notch handling: UI doesn't get cut off, uses `SafeArea`
- [ ] Landscape orientation supported (split screen resizes correctly)
- [ ] Tablet (>7"): UI scales properly, game buttons not too spread out
- [ ] Low-end phones: app launches without crashes (isolate usage helps)

### Analytics & Debugging ✅

- [ ] Game stats logged locally (SharedPreferences / Hive)
- [ ] Error logs recorded (crashes, network errors, timeouts)
- [ ] No console errors or warnings on normal gameplay
- [ ] Performance metrics tracked (FPS, load times)
- [ ] Debug mode: displays on-screen FPS meter (tap 5×to enable)
- [ ] Debug mode: displays tile load status on map

### Deployment ✅

- [ ] App signs correctly for iOS (provisioning profile, certificates)
- [ ] App signs correctly for Android (keystore, key alias)
- [ ] Store listings completed (screenshots, descriptions, rating categories)
- [ ] Privacy policy linked and available
- [ ] Mapbox attribution visible in-app
- [ ] Version number bumped correctly for each release
- [ ] Release notes summarize major changes
- [ ] Builds pass linting (flutter analyze with 0 errors)

---

## 24. Onboarding & Tutorial

### First Launch Experience

When a user opens GeoPlay for the first time:

```
┌──────────────────────────────┐
│                              │
│   Welcome to GeoPlay         │
│   Master the globe.          │
│   Play geography games       │
│   against friends.           │
│                              │
│   [Tutorial ON] [Skip]       │
│                              │
└──────────────────────────────┘
     ↓ (User selects Tutorial ON)
     
┌──────────────────────────────┐
│                              │
│  Master Flags in 30 seconds  │
│  Play Flag Sprint!           │
│                              │
│  Here's how:                 │
│  1. See flag                 │
│  2. Pick country (A/B/C/D)   │
│  3. Tap to guess             │
│  4. Rack up points           │
│                              │
│  This is a FREE practice     │
│  round. No scoring yet.      │
│                              │
│  [Play Free Round] [Next]    │
│                              │
└──────────────────────────────┘
```

### Tutorial Flow

**Duration**: ~60 seconds per game OR skip anytime

**Content**:
1. **Introduction** (15s)
   - Game name & goal
   - One-line rules
   - Example visual (flag, map, etc.)

2. **Mechanics Demo** (20s)
   - Show what correct/wrong looks like
   - Show scoring feedback
   - Explain hints/skip options

3. **Practice Round** (25s, optional)
   - Free sandbox game (no scoring)
   - Learning mode: hints always available, no time pressure
   - User plays one round to get feel
   - "Got it?" confirmation before ranked play

4. **Ready to Play** (confirmation)
   - Show difficulty/continent selectors
   - Confirm settings
   - "Let's go!" → Countdown starts

**Tutorial Availability**:
- Always accessible from Settings → Help
- Per-game tutorial: Available first time launching that game
- Skip anytime: Tapping "Skip" goes straight to ranked game setup

### Help System

**On-screen help** (always available):

```
[?] button in game top-right corner:
  
┌────────────────────────────────┐
│  How to Play [Game Name]       │
│                                │
│  [Video]  [Text]  [Tips]       │
│                                │
│  • Tap buttons to guess        │
│  • Speed = more points         │
│  • Hints cost 50% of points    │
│  • Neighbors highlight nearby  │
│                                │
│  [Close]                       │
└────────────────────────────────┘
```

### Settings → Game Guide

A full compendium available anytime:
- All 7 games explained with examples
- Scoring formulas broken down
- Strategy tips per game
- Tier system explained
- Video tutorials (if configured)

---

## 25. Landscape Orientation & Tablet Support

### Responsive Layout

GeoPlay must work seamlessly in **portrait and landscape** on all screen sizes:

#### iPhone (Portrait) - Standard Mode
```
┌────────────────────────────┐
│  [⚙️]     [👤]             │  ← Top bar (SafeArea)
├────────────────────────────┤
│                            │
│        GLOBE               │
│       (50% height)         │
│                            │
├── drag handle ──────────────┤
│                            │
│     Games Panel            │
│      (50% height)          │
│                            │
└────────────────────────────┘
```

#### iPhone (Landscape) - Horizontal Split
```
┌─────────────────┬──────────────────┐
│ [⚙️] [👤]       │                  │
├─────────────────┤                  │
│     GLOBE       │  Game UI /       │
│   (40% width)   │  Input / Options │
│                 │  (60% width)     │
└─────────────────┴──────────────────┘
```

#### iPad (Portrait) - Two-Column
```
┌────────────────────────────────────┐
│  [⚙️] [👤]                         │
├───────────────────┬────────────────┤
│                   │                │
│      GLOBE        │  Games List    │
│    (50% width)    │  (50% width)   │
│                   │                │
│                   │  [Easy/Med/Hard│
│                   │  [🌍 All / EU/ │
│                   │               │
│                   │  🔗 Connect   │
│                   │  🗺️ Find      │
│                   │  🏁 Flags     │
│                   │  ⚡ Capitals  │
│                   │  ⚔️ Border    │
│                   │  📍 Map Quiz  │
│                   │  🃏 Flashcard│
│                   │               │
└───────────────────┴────────────────┘
```

#### iPad (Landscape) - Expanded
```
┌──────────────────────┬────────────────────────────┐
│   [⚙️] [👤]          │                            │
├──────────────────────┤                            │
│                      │                            │
│      GLOBE           │  Games Panel               │
│    (30% width,       │  Difficulty selector       │
│     full height)     │  Continent selector        │
│                      │  [Easy] [Med] [Hard]       │
│                      │  [🌍] [🇪🇺] [🌏] ...      │
│                      │                            │
│                      │  ┌──────────────────────┐  │
│                      │  │ 🔗 Connect Countries │  │
│                      │  │  2-3 countries · 90s │  │
│                      │  └──────────────────────┘  │
│                      │                            │
│                      │  ┌──────────────────────┐  │
│                      │  │ 🗺️ Find the Country  │  │
│                      │  │ 5 rounds · 20s       │  │
│                      │  └──────────────────────┘  │
│                      │                            │
│                      │  [More games below...]     │
│                      │                            │
└──────────────────────┴────────────────────────────┘
```

### Implementation Details

**Responsive Constraints**:
- Min width: 320dp (iPhone SE)
- Max width (split): 600dp (constrain to this, center)
- Tablets: Use full width, leverage extra space

**Layout Helpers** (Dart):
```dart
bool isPortrait(BuildContext context) => 
  MediaQuery.of(context).orientation == Orientation.portrait;

bool isTablet(BuildContext context) =>
  MediaQuery.of(context).size.shortestSide > 600;

bool isLandscape(BuildContext context) =>
  MediaQuery.of(context).orientation == Orientation.landscape;
```

**Game Input During Rotation**:
- Game state persists during rotation
- Input field maintains focus (keyboard stays open)
- Camera preserves zoom/rotation
- No need to re-show countdown after rotation

---

## 26. Account Sync & Cloud Persistence

### Data Persistence Strategy

**Local-First Architecture**:
- All game data stored locally (Hive / SharedPreferences)
- Account optional (sign-in available in Settings)
- Works perfectly offline forever
- Cloud sync only for leaderboards / cross-device

### Account Structure

**Optional Sign-In** (Settings screen):
```
[ ] Create Account
    
Choose method:
[Google Sign-In]
[Apple Sign-In]
[Anonymous (skip)]
```

**What Syncs** (if signed in):
- ✅ Game stats (scores, accuracy per game)
- ✅ Personal progress per country (flags correct, map accuracy, capitals, etc.)
- ✅ Achievements unlocked (100% continent mastery, 1000-point streak)
- ✅ Settings (theme, language, difficulty preference)
- ❌ Leaderboards (Phase 2 - not in v1.0)

**Local Storage** (no account):
- Stats stored in Hive (encrypted if device supports it)
- Lost only if user uninstalls app
- No cloud backup (user should accept this)

### Data Structure (Hive)

```dart
@HiveType(typeId: 0)
class GameStats {
  @HiveField(0) final String gameType;  // 'flag_sprint', 'connect', etc.
  @HiveField(1) final int score;
  @HiveField(2) final int playCount;
  @HiveField(3) final int correctCount;
  @HiveField(4) final DateTime dateTime;
  @HiveField(5) final String continent;
  @HiveField(6) final String difficulty;
}

// Per-country stats
@HiveType(typeId: 1)
class CountryStats {
  @HiveField(0) final String code;  // ISO
  @HiveField(1) final int flagsCorrect;
  @HiveField(2) final int mapFinds;
  @HiveField(3) final int capitalsCorrect;
  @HiveField(4) final DateTime lastSeen;
  @HiveField(5) final int timesGuessed;
  @HiveField(6) final double accuracy;  // 0-1
}
```

### Cloud Sync (Future Phase 2)

```
When user signs in:
  1. Fetch cloud stats for this account
  2. Merge with local stats (keep higher scores)
  3. Background sync: After each game, send results to cloud (with backoff retry)
  4. On new device: Sign in → pull cloud stats → merge with local

Conflict resolution:
  • Keep highest score for each game/difficulty combo
  • Keep most recent country accuracy
  • Timestamps determine "which is newer"
```

---

## 27. Enhanced Accessibility Features

### Colorblind Accessibility

**Problem**: Red/green feedback alone is problematic for colorblind users.

**Solution**: Multi-Modal Feedback
```
Correct Answer:
  🟢 Green fill + ✅ Checkmark + "CORRECT!" text + Ascending tone

Wrong Answer:
  🔴 Red flash + ❌ X mark + "Try again" text + Low descending tone + Vibration

Neutral:
  🟡 Neutral/gray for "skipped" or "hinted"
```

**Colors Updated**:
- Use distinct colors: Green (#22c55e), Red (#ef4444), Blue (#3b82f6) — visually distinct for all colorblind types
- Via tool: Avoid red/green pair alone
-Add patterns/icons/text labels to everything colored
- Settings → Accessibility → "Colorblind mode" (test with Protanopia simulator)

### Font Scaling

**Respects System Settings**:
```dart
// Don't hardcode text sizes
Text(
  'Country name',
  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
    fontSize: 18,  // ← Default
  ),
)

// User's system text scale auto-applies (110%, 125%, 150%)
```

**Minimum Text Size**: 14pt at 100% scale (12pt minimum)

### High Contrast Mode

**When enabled** (iOS Accessibility setting):
- All backgrounds: Full black (#000000) or full white (#FFFFFF)
- All text: Max contrast (black on white, white on black)
- Borders: Highly visible (2pt width minimum)
- Transparency removed (alpha: 1.0)

### Motor Accessibility

**Full Keyboard Navigation**:
- Tab cycles through all interactive elements
- Enter / Spacebar confirms selections
- Arrow keys navigate lists (games, countries, options)
- Escape closes modals
- Numbers (1-4, A-D) quick-select options

**Large Touch Targets**: 52pt (12mm) minimum (already ensured in Section 13)

**No Complex Gestures**:
- ✅ Tap, double-tap OK
- ✅ Swipe left/right OK (but tappable alternatives exist)
- ❌ NO: 3-finger pinch, rotation gestures

### Screen Reader Compatible

**All Interactive Elements Labeled**:
```dart
Semantics(
  button: true,
  enabled: true,
  label: 'Select Germany',
  onTap: () => selectCountry('DE'),
  child: Button(...),
)
```

**Read Order Logical**:
1. Question/prompt (country name, flag image)
2. Options (A, B, C, D with country names)
3. Score/timer info
4. Buttons (Hint, Skip, Home)

**No Placeholder Only**: Every input field has a label, not just placeholder

---

##24. Future-Proofing — Adding New Games

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

1. **Engine**: Create `lib/engines/new_game_engine.dart` — pure Dart, no imports from Flutter. Use `getCountryPool(difficulty, continent)` from `country_tiers.dart` to filter the country pool by tier.
2. **Provider**: Add a `StateNotifierProvider` in `lib/providers/game_providers.dart`
3. **Overlay**: Create `lib/screens/game/new_game_overlay.dart` — extends `GameOverlay`
4. **Registration**: Add to the game list in `games_panel.dart` — one entry with title, description, icon, accent color, route, and difficulty-aware info string (include `poolLabel`)
5. **i18n**: Add translation keys to all 7 ARB files
6. **Config**: Add difficulty configuration constants

That's 5 files to create and 2 files to modify. The map controller, shared widgets, theming, tier system, and navigation all work automatically.

### Potential Future Games

#### Data-Driven Games (enabled by the Country Wiki data)

These games require NO new external data — they pull directly from the extended Country model:

- **Population Poker** — Two countries highlighted on globe; tap which has more population. Uses `population` field. Fast rounds, streak-based scoring.
- **Size Showdown** — Two country silhouettes shown side by side; tap the larger one. Uses `areaKm2` field. Camera flies between the two countries on the globe.
- **Language Match** — "Which of these 4 countries speaks French?" Uses `languages` field. Multiple choice, map highlights all correct answers on reveal.
- **Currency Sprint** — "Which country uses the Baht?" Uses `currency`/`currencyCode` field. Sprint format like Flag Sprint.
- **Economy Quiz** — "Rank these 3 countries by GDP." Uses `gdpBillions` field. Drag-to-order mechanic.

#### Map-Native Games (use globe interaction)

- **Capital Pin Drop** — A pin appears at a capital city location; name the city
- **Continent Speed Run** — Name all countries in a continent as fast as possible. Globe highlights each one as named.
- **Trade Routes** — Draw historical trade paths (Silk Road, Spice Route) by naming waypoint countries
- **River Run** — Name countries a river flows through (Danube, Nile, Amazon)

Each of these is: one engine file, one overlay file, one provider, a few i18n keys, and a card on the home screen. The globe and the country data handle the rest.

---

## Summary

This specification describes a **globe-first mobile app** where:

- The **3D Mapbox globe is always visible** and acts as the canvas for all games
- **Split-screen home** puts the globe and games side by side — tap the globe to enter Explore mode (atlas + wiki), drag up to enter Play mode (full game list), with spring-physics transitions between three states
- **Any tap on the globe** in default 50/50 mode expands to Explore mode — the globe is too small in half view for precise country taps, so every touch means "show me more"
- **Small screen adaptive** — default split shifts to 35/65 (globe/games) on phones <5.5", giving games more room while keeping the globe inviting
- **Flutter** provides pixel-perfect cross-platform UI with GPU-composited overlays
- **7 modes** (6 competitive games + Flashcard study mode), each with a unique relationship with the map
- **Country Wiki** with extended data (population, area, language, currency, GDP) acts as the single source of truth — powering games, the Country Card, and future data-driven game modes
- **Country Card** appears in Explore mode when tapping a country — transforms the home screen into an explorable atlas. Also appears in post-game review to close the learn → play → verify → remember loop
- **Flashcard study mode** provides pressure-free learning with Tinder-style swipe mechanics, 6 card types (flag, silhouette, capital, map shape), and globe integration
- **Country tier system** makes difficulty meaningful — Easy shows well-known countries (~55), Medium adds regional ones (~120), Hard includes all 213 down to micro-states
- **Personal progress tracking** per country — "You've identified 140/213 flags" — drives completionism and retention
- **Dark and light themes** switch both the UI and the map style
- **7 languages** with full support for country names, capital names, and UI strings (including RTL for Arabic)
- **Offline premium** lets users download map tiles for airplane-mode play
- **Data-driven future games** (Population Poker, Size Showdown, Language Match, Currency Sprint) require zero new external data — they pull from the Country model
- **New games** can be added with 5 files and a game card — the architecture scales indefinitely

The result is an app that feels like a polished, cinematic geography experience — not a quiz app with a map bolted on, but a **living globe that teaches you the world while you play**.
