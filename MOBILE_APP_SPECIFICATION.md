# GeoPlay — Mobile App Technical Specification

> Complete technical specification to recreate the GeoPlay web app as a native mobile application (iOS / Android / React Native / Flutter / etc.).

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Data Layer](#3-data-layer)
4. [Game Engine Layer](#4-game-engine-layer)
5. [Game 1 — Connect Countries](#5-game-1--connect-countries)
6. [Game 2 — Find the Country (Silhouette)](#6-game-2--find-the-country-silhouette)
7. [Game 3 — Flag Sprint](#7-game-3--flag-sprint)
8. [Game 4 — Capital Clash](#8-game-4--capital-clash)
9. [Game 5 — Border Blitz](#9-game-5--border-blitz)
10. [Game 6 — Find on Map](#10-game-6--find-on-map)
11. [World Map Rendering](#11-world-map-rendering)
12. [Country Silhouette Rendering](#12-country-silhouette-rendering)
13. [Internationalization (i18n)](#13-internationalization-i18n)
14. [Home Screen & Navigation](#14-home-screen--navigation)
15. [Design System & Theming](#15-design-system--theming)
16. [Shared UI Patterns](#16-shared-ui-patterns)
17. [External Dependencies & Assets](#17-external-dependencies--assets)
18. [Offline Considerations](#18-offline-considerations)

---

## 1. App Overview

**GeoPlay** is a competitive geography game app with 6 distinct game modes. All games are timed, single-player, with optional multiplayer via score comparison. The app supports 7 languages and features a dark theme.

### Game Modes

| # | Game | Input Type | Mechanic |
|---|------|-----------|----------|
| 1 | Connect Countries | Text autocomplete | Navigate between two countries via neighbors |
| 2 | Find the Country | Text autocomplete | Identify country from silhouette shape |
| 3 | Flag Sprint | Text autocomplete | Name country from flag image |
| 4 | Capital Clash | Text autocomplete | Match capitals to countries (bidirectional) |
| 5 | Border Blitz | Text autocomplete | Name all neighbors of a country |
| 6 | Find on Map | Map tap/click | Tap the correct country on a world map |

### Shared Game Parameters

- **Difficulty**: `easy`, `medium`, `hard` — affects time limits, scoring, and game-specific mechanics
- **Continent filter**: `All`, `Europe`, `Asia`, `Africa`, `North America`, `South America`
- **Languages**: English, Chinese, Spanish, Arabic, French, Portuguese, Russian

---

## 2. Architecture & Data Flow

### Layer Separation

```
┌─────────────────────────────┐
│        UI / Screens         │  ← Platform-specific (React Native, Flutter, SwiftUI, etc.)
├─────────────────────────────┤
│      Game Components        │  ← Game-specific UI (phases, timers, input, animations)
├─────────────────────────────┤
│       Game Engines          │  ← Pure functions, no side effects (portable to any platform)
├─────────────────────────────┤
│     Data & Utilities        │  ← Country data, adjacency graph, BFS, scoring, i18n
└─────────────────────────────┘
```

### Key Design Principle: Immutable State

All game engines use **pure functions**. Every function takes the current state and returns a new state object. No mutations. This pattern ports cleanly to any platform (Redux, BLoC, MVVM, etc.).

```
newState = submitGuess(currentState, userInput)
```

### State Machine Pattern

Every game follows a phase-based state machine:

```
[loading] → [countdown] → [playing] → [resolution]
                3-2-1       Game loop    Results screen
```

Connect Countries uses a slightly different flow:

```
[loading] → [reveal] → [execution] → [resolution]
              5s view     Game loop     Results screen
```

Timer management is handled at the UI layer. The engine only stores `timeLeft` and `totalDuration` values. The UI ticks the timer every second and calls the engine's timeout handler when it reaches zero.

---

## 3. Data Layer

### 3.1 Country Database

**213 countries** with the following schema:

```typescript
interface Country {
  code: string;        // ISO 3166-1 alpha-2 (e.g., "US", "DE", "JP")
  name: string;        // English name
  capital: string;     // English capital name
  continent: string;   // "Europe" | "Asia" | "Africa" | "North America" | "South America" | "Oceania"
  coordinates: [number, number]; // [latitude, longitude]
}
```

**Continents and country counts:**

| Continent | Count | Examples |
|-----------|-------|---------|
| Europe | ~46 | AL, AD, AT, BY, BE, BA, BG, HR, CZ, DK, ... |
| Asia | ~49 | AF, AM, AZ, BH, BD, BT, BN, KH, CN, CY, ... |
| Africa | ~54 | DZ, AO, BJ, BW, BF, BI, CM, CF, TD, KM, ... |
| North America | ~22 | AG, BS, BB, BZ, CA, CR, CU, DM, DO, SV, ... |
| South America | ~13 | AR, BO, BR, CL, CO, EC, GY, PY, PE, SR, ... |
| Oceania | ~8 | AU, FJ, NZ, PG, WS, SB, TO, VU |

**Derived lookup maps** (build at app startup):

- `countryByCode: Map<string, Country>` — O(1) lookup by ISO code
- `countryByName: Map<string, Country>` — O(1) lookup by lowercase English name
- `countryNameToCode: Map<string, string>` — Lowercase English name → ISO code

**Helper functions:**

- `resolveCountryCode(input: string, locale?: string): string | null`
  - Tries: direct 2-letter code match → English name (case-insensitive) → localized name
  - Used by all text-input games to convert user input to a country code
- `getAllCountryNames(locale?: string): string[]` — Returns all names for autocomplete
- `getAllCapitalNames(locale?: string): string[]` — Returns all capitals for autocomplete

### 3.2 Adjacency Graph (Land Borders)

A dictionary mapping each country code to its array of neighbor codes. **~130 countries** with land borders.

```typescript
adjacencyGraph: Record<string, string[]>
// Example:
// "DE" → ["DK", "PL", "CZ", "AT", "CH", "FR", "LU", "BE", "NL"]
// "US" → ["CA", "MX"]
// "BR" → ["UY", "AR", "PY", "BO", "PE", "CO", "VE", "GY", "SR", "GF"]
```

**Derived data:**

- `connectedCountryCodes: Set<string>` — All countries that have at least one land border
- `islandNations: string[]` — Countries with NO land borders (excluded from Connect Countries & Border Blitz). Includes: IS, MT, CY, BH, MV, SG, LK, JP, TW, PH, KM, MG, MU, SC, ST, CV, AG, BS, BB, CU, DM, GD, JM, KN, LC, VC, TT, AU, NZ, FJ, PG, WS, SB, TO, VU

### 3.3 Graph Algorithms

**BFS Shortest Path** — Core algorithm for Connect Countries:

```
findShortestPath(start: string, end: string, excludeCountries?: Set<string>): string[] | null
```
- Standard BFS on the adjacency graph
- Returns full path including start and end, or null if unreachable
- `excludeCountries` allows filtering certain nodes (not currently used in production)

**Supporting functions:**

- `getShortestDistance(start, end): number` — Edge count, -1 if unreachable
- `isValidNeighbor(current, candidate): boolean` — Direct adjacency check
- `getNeighbors(countryCode): string[]` — Returns adjacency list
- `hasLandBorders(countryCode): boolean` — Checks if country has borders
- `countriesAtDistance(start, distance, continent?): string[]` — BFS frontier at exact distance
- `getRandomConnectedCountry(continent?): string` — Random country with land borders

---

## 4. Game Engine Layer

### 4.1 Shared Types

```typescript
type Difficulty = "easy" | "medium" | "hard";

type Continent = "all" | "Europe" | "Asia" | "Africa" | "North America" | "South America";

// Continents list with display info:
CONTINENTS = [
  { id: "all",           label: "All",        emoji: "🌍" },
  { id: "Europe",        label: "Europe",     emoji: "🇪🇺" },
  { id: "Asia",          label: "Asia",       emoji: "🌏" },
  { id: "Africa",        label: "Africa",     emoji: "🌍" },
  { id: "North America", label: "N. America", emoji: "🌎" },
  { id: "South America", label: "S. America", emoji: "🌎" },
]
```

### 4.2 Streak Multiplier Formula (shared by 3 games)

Used by Flag Sprint, Capital Clash, and Find on Map:

```
multiplier = min(1 + floor(streak / streakMultiplierStep), maxMultiplier)
points = basePoints × multiplier
```

### 4.3 Score Floor

All games prevent negative scores:

```
score = max(0, score - penalty)
```

### 4.4 Country Pool Filtering

Most games filter the country pool by continent:

```
pool = countries.filter(c => continent === "all" || c.continent === continent)
```

Some games have additional filters (e.g., silhouette excludes tiny countries, border blitz filters by neighbor count).

### 4.5 Shuffle Algorithm

All games use Fisher-Yates shuffle for randomization:

```
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

---

## 5. Game 1 — Connect Countries

### Concept

Two countries are shown on a world map. The player must type neighboring countries step-by-step to create a path connecting them. **Lower score is better** (golf scoring).

### Phases

1. **Reveal (5 seconds)**: Shows start (green) and end (red) countries on the map. Player plans their route.
2. **Execution**: Player types country names to navigate from start toward end. Two concurrent timers run.
3. **Resolution**: Shows score breakdown, optimal path, efficiency rating.

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Min path length | 2 | 4 | 7 |
| Max path length | 3 | 6 | 12 |
| Execution time | 90s | 60s | 45s |
| Per-move time | 8s | 5s | 4s |

### State

```typescript
interface ConnectGameState {
  phase: "reveal" | "execution" | "resolution";
  difficulty: Difficulty;
  startCountry: string;      // ISO code
  endCountry: string;        // ISO code
  optimalPath: string[];     // Precomputed BFS shortest path
  playerPath: string[];      // Player's valid moves (starts with [startCountry])
  moves: GameMove[];         // Full history including wrong moves
  currentPosition: string;   // Where player currently is
  wrongAttempts: number;
  consecutiveWrongAttempts: number;
  hintsUsed: number;
  score: number;
  isComplete: boolean;
  isTimeout: boolean;
  revealTimeLeft: number;
  executionTimeLeft: number;
  moveTimeLeft: number;
  revealDuration: number;    // 5
  executionDuration: number;
  moveDuration: number;
}
```

### Game Creation

```
createGame(difficulty, continent) → ConnectGameState
```

1. Pick a random connected country as `start` (filtered by continent)
2. Find all countries at exactly `targetDistance` hops away (random between min/max path length)
3. Pick a random one as `end`
4. Verify a BFS path exists and has the correct length
5. Retry up to 100 times if no valid pair found
6. **Fallback pairs** by continent if all retries fail:
   - Europe: PT → GR
   - Asia: TR → CN
   - Africa: MA → ZA
   - North America: MX → CA
   - South America: CO → AR
   - Default: PT → CN

### Move Submission

```
submitMove(state, input, locale?) → { state, result: MoveResult }
```

Results:
- `"invalid_country"` — Input doesn't resolve to any known country
- `"destination_country"` — Player typed the end country directly (not allowed; must reach a neighbor)
- `"already_visited"` — Country already in playerPath
- `"not_neighbor"` — Country is not adjacent to currentPosition
- `"correct"` — Valid move. Adds to path, updates position, resets move timer

**Auto-completion rule**: After a correct move, if the new position **borders the destination country**, the game ends immediately with `isComplete = true`.

### Hint System

```
useHint(state) → { state, hintCountry: string | null }
```

- Computes BFS from current position to end
- Returns the next country on the shortest path
- Increments `hintsUsed`, recalculates score
- Returns null if already bordering the destination

### Skip

After 2 consecutive wrong guesses, the player can skip to generate a completely new country pair. The game restarts with a fresh pair but keeps the same difficulty/continent.

### Scoring (Lower = Better)

```
score = moveCost + (wrongAttempts × 3) + (hintsUsed × 2) + (isTimeout ? 5 : 0)
```

Where `moveCost = playerPath.length - 1` (excludes start position).

**Constants:** CORRECT_MOVE = 1, WRONG_MOVE = 3, HINT_USED = 2, TIMEOUT = 5

### Rating System

Based on `ratio = score / optimalPath.length`:

| Ratio | Rating | Color |
|-------|--------|-------|
| ≤ 1.0 | PERFECT | Green |
| ≤ 1.5 | GREAT | Blue |
| ≤ 2.5 | GOOD | Amber |
| ≤ 4.0 | OK | Orange |
| > 4.0 | KEEP TRYING | Red |

### Resolution Display

- Total score (large number)
- "lower is better" subtitle
- Moves taken vs. optimal path length
- Breakdown: wrong guesses penalty, hints penalty, timeout penalty
- Efficiency percentage: `round((optimalLength / score) × 100)`
- Optimal path shown on map (amber-colored countries)
- Star rating based on efficiency

### UI Specifics

- **World map** is rendered behind the game UI at all times
- Start country: green on map with label
- End country: red on map with label
- Player path: blue gradient (increasing intensity along the path)
- Current position: pulsing blue circle marker
- Wrong guess: country flashes red on map for 500ms
- **Input component** (`CountryInput`) has special neighbor prioritization — neighbors of current position appear first in autocomplete with a green "neighbor" badge

---

## 6. Game 2 — Find the Country (Silhouette)

### Concept

A country's silhouette (outline shape) is displayed. Player must type the country name. Progressive hints are available. Round-based game.

### Phases

1. **Playing**: Show silhouette, accept guesses, countdown timer per round
2. **Round Result**: Show correct answer (green silhouette) or failure (red), points earned
3. **Resolution**: Final score, percentage, round-by-round review

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Total rounds | 5 | 8 | 10 |
| Round time | 30s | 20s | 15s |
| Max points per round | 100 | 100 | 100 |
| Hint penalty | 15 | 20 | 25 |
| Wrong guess penalty | 10 | 15 | 20 |

### State

```typescript
interface SilhouetteGameState {
  phase: "playing" | "roundResult" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  rounds: SilhouetteRound[];   // Pre-generated for all rounds
  currentRound: number;        // 0-indexed
  totalRounds: number;
  totalScore: number;
  timeLeft: number;
  roundDuration: number;
}

interface SilhouetteRound {
  countryCode: string;
  guesses: string[];             // Wrong guess codes (deduped)
  hintsRevealed: SilhouetteHint[];
  hintsAvailable: SilhouetteHint[];
  solved: boolean;
  skipped: boolean;
  points: number;
}

interface SilhouetteHint {
  type: "continent" | "firstLetter" | "capital" | "neighbors";
  value: string;
}
```

### Country Pool

Excludes 34 tiny countries that are too small to render as recognizable silhouettes:
AD, MC, SM, VA, LI, MT, SG, BH, MV, KM, SC, CV, ST, AG, BB, DM, GD, KN, LC, VC, TT, WS, TO, MU, BS, JM, CY, BN, TL, QA, KW, PS, XK, LU

### Hint System (Progressive)

Hints are revealed one at a time in this order:

1. **Continent**: The country's continent name (e.g., "Europe")
2. **First Letter**: "Starts with G" (first letter of the English name)
3. **Capital**: The capital city name (stored as ISO code for i18n resolution)
4. **Neighbors**: Up to 3 neighboring countries (stored as ISO codes, comma-separated)

### Scoring Per Round

```
points = max(10, maxPoints - (wrongGuesses × guessPenalty) - (hintsRevealed × hintPenalty))
```

Minimum 10 points for a correct answer regardless of penalties. Zero points if skipped or timed out.

### Resolution Stats

```
{
  totalScore: number,
  maxPossible: totalRounds × maxPoints,
  percentage: round((totalScore / maxPossible) × 100),
  solved: number,          // rounds with solved=true
  skipped: number,         // rounds with skipped=true
  totalRounds: number,
  totalHints: number,      // sum of hintsRevealed across rounds
  totalWrong: number       // sum of guesses across rounds
}
```

### UI Specifics

- Silhouette displayed as centered SVG shape (default purple, green on correct, red on wrong)
- Silhouette max height: `35dvh`
- Hints shown as amber badges below the silhouette
- Wrong guesses shown as red strikethrough pills
- Round result screen shows the revealed green silhouette with the country name
- Resolution shows a round-by-round colored pill review (green = solved, red = unsolved)

---

## 7. Game 3 — Flag Sprint

### Concept

A flag image is displayed. Player types the country name as fast as possible. Streak multipliers reward consecutive correct answers. Time-based sprint format.

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Total time | 60s | 60s | 45s |
| Base points | 10 | 10 | 10 |
| Streak step | 3 | 3 | 5 |
| Max multiplier | ×3 | ×4 | ×5 |
| Wrong penalty | 0 | 5 | 10 |
| Skip penalty | 0 | 0 | 5 |

### State

```typescript
interface FlagSprintGameState {
  phase: "countdown" | "playing" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  flagQueue: string[];        // Shuffled country codes (padded to ≥80)
  currentIndex: number;
  attempts: FlagAttempt[];
  score: number;
  streak: number;
  bestStreak: number;
  timeLeft: number;
  totalDuration: number;
  countdownLeft: number;      // 3 → 2 → 1 → start
  flagShownAt: number;        // timestamp (ms)
}

interface FlagAttempt {
  countryCode: string;
  correct: boolean;
  timeMs: number;
}
```

### Flag Image Source

```
https://flagcdn.com/w{width}/{code_lowercase}.png
```

Default width: 320px. Example: `https://flagcdn.com/w320/de.png` for Germany.

### Game Flow

1. **Countdown** (3-2-1): Large number animation, then auto-starts
2. **Playing**: Show flag → player types name → correct/wrong → advance to next flag → repeat until time runs out
3. **Resolution**: Score, stats, answer review

### Scoring

```
On correct: points = basePoints × multiplier, streak += 1
On wrong:   score = max(0, score - wrongPenalty), streak = 0, advance to next
On skip:    score = max(0, score - skipPenalty), streak = 0, advance to next
```

Both wrong and skip advance to the next flag (the player doesn't stay on the same flag).

### Resolution Stats

```
{
  score, correct, wrong, total,
  bestStreak, avgTimeMs, accuracy (percentage)
}
```

### UI Specifics

- Flag image: `rounded-2xl border-4 shadow-2xl`, max height `30dvh`
- Border color flashes green (correct) or red (wrong) for 600ms
- Streak displayed with fire emoji and multiplier badge when > 1
- Answer flash banner shows country name after each answer (green ✓ or red ✗)
- Resolution shows small flag thumbnails next to each answer in the review list
- **Accent color**: Green (#22c55e)

---

## 8. Game 4 — Capital Clash

### Concept

Questions alternate between "What is the capital of [Country]?" and "Which country has the capital [Capital]?". Player types the answer. Streak multipliers apply.

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Total time | 90s | 60s | 45s |
| Base points | 10 | 10 | 10 |
| Streak step | 3 | 3 | 5 |
| Max multiplier | ×3 | ×4 | ×5 |
| Wrong penalty | 0 | 5 | 10 |
| Mix directions | No (capital→country only) | Yes | Yes |

### State

```typescript
interface CapitalClashGameState {
  phase: "countdown" | "playing" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  questions: CapitalQuestion[];  // Padded to ≥80
  currentIndex: number;
  attempts: CapitalAttempt[];
  score: number;
  streak: number;
  bestStreak: number;
  timeLeft: number;
  totalDuration: number;
  countdownLeft: number;
  questionShownAt: number;
}

interface CapitalQuestion {
  countryCode: string;
  countryName: string;
  capital: string;
  type: "countryToCapital" | "capitalToCountry";
}

interface CapitalAttempt {
  question: CapitalQuestion;
  answer: string;
  correct: boolean;
  timeMs: number;
}
```

### Question Generation

- When `mixDirections = false` (easy): All questions are `"capitalToCountry"` — player sees a capital, types the country
- When `mixDirections = true` (medium, hard): Random 50/50 split between both directions

### Answer Validation

For `countryToCapital`:
- Exact match on English capital name (case-insensitive, accent-stripped)
- Partial match if input is ≥4 characters and starts with correct capital
- Localized capital name match

For `capitalToCountry`:
- Uses `resolveCountryCode()` — matches ISO code, English name, or localized name

**Accent stripping**: `normalize("NFD").replace(/[\u0300-\u036f]/g, "")` — removes diacritical marks for lenient matching.

### Autocomplete Switching

The autocomplete source changes based on question type:
- `countryToCapital` → shows capital names
- `capitalToCountry` → shows country names

Placeholder text also changes dynamically.

### UI Specifics

- Question card with directional icon (capital → country or country → capital)
- Question type label above the question text
- Card border flashes green/red on answer
- Card background tints slightly on feedback
- **Accent color**: Amber (#f59e0b)

---

## 9. Game 5 — Border Blitz

### Concept

A country is shown (with its name and highlighted on a zoomed map). Player must type all of its neighboring countries. Each correct guess reveals the neighbor on the map. Hints and skips available.

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Total time | 90s | 60s | 45s |
| Points per neighbor | 10 | 10 | 15 |
| Wrong penalty | 0 | 2 | 5 |
| Hint penalty | 3 | 5 | 8 |
| Min neighbors (anchor) | 1 | 4 | 7 |
| Max neighbors (anchor) | 3 | 6 | 99 (any) |

### State

```typescript
interface BorderBlitzGameState {
  phase: "countdown" | "playing" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  anchorCode: string;
  foundNeighbors: string[];
  hintedNeighbors: string[];
  wrongAttempts: number;
  consecutiveWrongAttempts: number;
  hintsUsed: number;
  skipsUsed: number;
  score: number;
  timeLeft: number;
  totalDuration: number;
  countdownLeft: number;
}
```

### Anchor Selection

Countries are filtered by:
1. Must have land borders
2. Neighbor count within range (`minNeighbors` to `maxNeighbors`) for the difficulty
3. Continent filter

If no countries match the exact range (small continents), fallback relaxes to 1–99 neighbors. Ultimate fallback: Germany ("DE").

### Guess Submission

```
submitGuess(state, input, locale?) → { state, result: "correct" | "wrong" }
```

- **Correct**: Country IS a neighbor of the anchor AND not already found. Adds to `foundNeighbors`, resets `consecutiveWrongAttempts`, awards `pointsPerNeighbor`.
- **Wrong**: Country is not a neighbor, already found, or invalid. Increments `wrongAttempts` and `consecutiveWrongAttempts`, deducts `wrongPenalty`.
- **Auto-complete**: When ALL neighbors are found, phase transitions to "resolution".

### Hint System

```
useHint(state) → { state, hintCode: string | null }
```

- Reveals one random unfound neighbor
- Adds to BOTH `foundNeighbors` and `hintedNeighbors` (hinted neighbors shown in amber)
- No points awarded for hinted neighbors
- Deducts `hintPenalty` from score
- Auto-completes if all neighbors now found

### Skip (to new anchor)

```
skipAnchor(state) → BorderBlitzGameState
```

- Picks a new anchor country (excluding current one)
- Resets `foundNeighbors`, `hintedNeighbors`, `consecutiveWrongAttempts`
- Increments `skipsUsed`
- Enabled only after 2 consecutive wrong attempts

### Map Visualization

The world map zooms into the region containing the anchor + all neighbors:

- **Anchor**: Purple (#8b5cf6) highlight + label
- **Found neighbors**: Green (#22c55e) highlight + label
- **Hinted neighbors**: Amber (#f59e0b) highlight + label
- **Missed neighbors** (resolution only): Semi-transparent red (rgba(239, 68, 68, 0.5)) + label

The map uses a dynamically computed viewBox centered on the anchor country, encompassing all neighbors with 80px padding.

### Resolution Stats

```
{ score, found, total, allFound, wrongAttempts, hintsUsed, skipsUsed }
```

### UI Specifics

- Map takes up most of the screen (`max-h-[45dvh]`) with a `max-w-2xl` wrapper
- Color legend below the map in resolution
- Autocomplete lists ALL countries (doesn't reveal which are neighbors)
- Stats grid shows only non-zero stats (conditionally rendered)
- **Accent color**: Violet (#8b5cf6)

---

## 10. Game 6 — Find on Map

### Concept

A country name is displayed. Player must tap/click the correct country on an interactive world map. Features zoom/pan controls for finding small countries.

### Difficulty Configuration

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Total time | 90s | 60s | 45s |
| Base points | 10 | 10 | 10 |
| Streak step | 3 | 3 | 5 |
| Max multiplier | ×3 | ×4 | ×5 |
| Wrong penalty | 0 | 5 | 10 |
| Skip penalty | 0 | 0 | 5 |

### State

```typescript
interface MapQuizGameState {
  phase: "countdown" | "playing" | "resolution";
  difficulty: Difficulty;
  continent: Continent;
  countryQueue: string[];     // Shuffled codes, padded to ≥80
  currentIndex: number;
  attempts: MapQuizAttempt[];
  score: number;
  streak: number;
  bestStreak: number;
  timeLeft: number;
  totalDuration: number;
  countdownLeft: number;
  questionShownAt: number;
}

interface MapQuizAttempt {
  targetCode: string;
  clickedCode: string | null;  // null = skipped
  correct: boolean;
  timeMs: number;
}
```

### Click Submission

```
submitClick(state, clickedCode) → { state, result: "correct" | "wrong" }
```

**Critical difference from other games**: On wrong click, the player does NOT advance. They stay on the same target country and can try again (with penalty).

On correct: Advances to next country, awards points with streak multiplier.
On skip: Advances, records attempt with `clickedCode = null`.

### Map Interaction

- **Tap/click**: Selects a country. The tapped country flashes green (correct) or red (wrong) for 800ms.
- **Scroll/pinch zoom**: Zoom in to see small countries
- **Drag-to-pan**: Move around the map when zoomed in
- **Zoom buttons**: +/- buttons and reset button (bottom-right corner)
- **Continent initial zoom**: When a continent is selected, the map starts zoomed to that continent's bounding box
- **Hover**: Countries highlight on hover for visual feedback, but tooltip is hidden to avoid revealing the answer
- **No labels**: Country names are NOT shown on the map (that would defeat the purpose)

### Resolution Stats

```
{ score, correct, wrong, skipped, total, bestStreak, avgTimeMs, accuracy }
```

### UI Specifics

- Target country displayed in a prominent card above the map with "Find this country" label
- Card border/background flashes on feedback (green/red tint)
- Map takes up most of the screen (`max-h-[55dvh]`, `max-w-4xl`)
- Only a "Skip" button at the bottom (no text input needed)
- Answer review shows: time for correct, clicked country name for wrong, "Skipped" for skips
- **Accent color**: Cyan (#06b6d4)

---

## 11. World Map Rendering

### Data Source

**TopoJSON**: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`

This provides country boundaries at 110m resolution. For mobile, consider bundling this (~200KB) for offline play.

### Projection

**Natural Earth 1** projection:
- Scale: 160
- Translation: [480, 300]
- Default viewBox: `0 0 960 600`

### ISO Code Mapping

The TopoJSON uses **ISO numeric codes** as feature IDs. A mapping table converts these to **ISO alpha-2 codes**. Full mapping table (96 entries):

```
"004"→"AF", "008"→"AL", "012"→"DZ", "020"→"AD", "024"→"AO",
"031"→"AZ", "032"→"AR", "036"→"AU", "040"→"AT", "044"→"BS",
... (full table in source code)
"-99"→"XK" (Kosovo)
```

### Rendering

The map is an SVG with these layers (bottom to top):

1. **Ocean**: Large background rect, fill `#0a0e1a`
2. **Graticule**: Grid lines (every 10°), stroke `#1a1f2e`, width `0.3`
3. **Country shapes**: Individual paths for each country, stroke `#0f172a`, width `0.5`
4. **Country labels**: Circle + text at projected coordinates
5. **Position marker**: Pulsing animated circle (Connect Countries only)

### Country Color Priority

Colors are resolved in this priority order:

1. Wrong flash → `#ef4444` (red)
2. Start country → `#22c55e` (green)
3. End country → `#ef4444` (red)
4. Player path → Blue gradient (`rgba(59, 130, 246, 0.4–1.0)`)
5. Optimal path (resolution) → `rgba(245, 158, 11, 0.6)` (amber)
6. Custom highlight → custom color from props
7. Hovered → `#334155`
8. Default → `#1e293b`

### Zoom System (Find on Map game)

**ViewBox manipulation** is the zoom mechanism. The SVG's `viewBox` attribute controls what portion of the 960×600 coordinate space is visible.

- **Scroll zoom**: Factor `1.12` per scroll tick, centered on cursor/finger position
- **Button zoom**: Factor `0.7` (in) / `1.43` (out), centered on current view center
- **Pan**: Adjusts viewBox x/y based on drag delta
- **Zoom limits**: Width 60 (max zoom in) to 1400 (max zoom out)
- **Aspect ratio**: Maintained during zoom (height = width × original ratio)

**Continent initial zoom**: Computes bounding box from all countries in the selected continent using the projection, with 50px padding.

**Stroke scaling**: Border strokes thin proportionally when zoomed in:
- `strokeWidth = max(0.1, 0.5 × (currentWidth / 960))`

**Click vs. drag disambiguation**: A 3-pixel movement threshold distinguishes clicks (selecting a country) from drags (panning the map).

### Focus Region Zoom (Border Blitz)

When `focusRegion` is set, the viewBox is computed to center on the first country (anchor) and encompass all listed countries:

1. Project the anchor's coordinates to SVG space — this is the viewBox center
2. For each country in the region, find max distance from anchor in both x and y
3. ViewBox dimensions = 2 × (max_distance + 80px padding)
4. Minimum half-width: 80px, minimum half-height: 60px

---

## 12. Country Silhouette Rendering

### Data Source

Same TopoJSON as the world map: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`

### Rendering

Each silhouette is a single country feature extracted from the world TopoJSON and rendered with:

1. **Mercator projection** (not Natural Earth — Mercator works better for individual countries)
2. Centered on the country's geographic centroid
3. Auto-scaled to fit the container with 20px padding
4. SVG with explicit width/height from the `size` prop (default 320)

### Color States

| State | Fill | Stroke |
|-------|------|--------|
| Default (unrevealed) | `#a855f7` (purple) | `#7c3aed` |
| Revealed (correct) | `#22c55e` (green) | `#16a34a` |
| Wrong (flash) | `#ef4444` (red) | `#dc2626` |

### Caching

TopoJSON data is loaded once and cached at the module level. All `CountrySilhouette` instances share the same data.

---

## 13. Internationalization (i18n)

### Supported Languages

| Code | Label | Native Name |
|------|-------|-------------|
| `en` | EN | English |
| `zh` | ZH | 中文 |
| `es` | ES | Español |
| `ar` | AR | العربية |
| `fr` | FR | Français |
| `pt` | PT | Português |
| `ru` | RU | Русский |

### Three Translation Layers

#### Layer 1: UI Strings (181 keys)

Flat key-value dictionary. Categories:

- **Common** (7 keys): loadingGame, loadingMap, generatingRoute, playAgain, home, comingSoon, go
- **Home** (14 keys): subtitle, footer, game titles & descriptions (×7)
- **Difficulty** (6 keys): easy/medium/hard labels & descriptions
- **Continent** (6 keys): all, europe, asia, africa, northAmerica, southAmerica
- **Reveal phase** (4 keys): mode, start, end, planRoute
- **Execution phase** (11 keys): move, total, currentlyAt, hintTry, etc.
- **Resolution** (11 keys): timeUp, totalScore, lowerIsBetter, efficiency, etc.
- **Ratings** (5 keys): perfect, great, good, ok, keepTrying
- **Score** (3 keys): label, penalty, hints
- **History** (4 keys): title, notNeighbor, alreadyVisited, startTyping
- **Silhouette** (18 keys): round, points, hints, skip, etc.
- **Flag Sprint** (12 keys): getReady, placeholder, correct, wrong, etc.
- **Capital Clash** (7 keys): getReady, whatCapital, whatCountry, etc.
- **Border Blitz** (14 keys): title, findNeighborsOf, placeholder, hints, etc.
- **Map Quiz** (5 keys): title, getReady, find, skip, skipped

#### Layer 2: Country Names (~200 codes per language)

Maps ISO alpha-2 codes to localized country names:

```
// English:  "DE" → "Germany"
// Chinese:  "DE" → "德国"
// Spanish:  "DE" → "Alemania"
// Arabic:   "DE" → "ألمانيا"
// French:   "DE" → "Allemagne"
// Portuguese: "DE" → "Alemanha"
// Russian:  "DE" → "Германия"
```

#### Layer 3: Capital Names (~200 codes per language)

Maps ISO alpha-2 codes to localized capital names:

```
// English:  "DE" → "Berlin"
// Chinese:  "DE" → "柏林"
// etc.
```

### Translation Access API

```typescript
// Get UI string
t("common.playAgain") → "Play Again" (or localized equivalent)

// Get localized country name
countryName("DE") → "Germany" (or localized equivalent)

// Get localized capital name
capitalName("DE") → "Berlin" (or localized equivalent)
```

All functions fall back to English if a translation is missing, then to the raw key/code.

### Persistence

Language preference is stored in local storage under key `"geoplay-locale"`. Loaded on app startup.

### Autocomplete with i18n

When the locale is not English, `getAllCountryNames(locale)` and `getAllCapitalNames(locale)` return localized names. The autocomplete input shows these localized names, and `resolveCountryCode(input, locale)` can resolve them back to ISO codes.

---

## 14. Home Screen & Navigation

### Layout

```
┌──────────────────────────────────────┐
│                    [EN ZH ES AR FR PT RU]  ← Language picker (top-right)
│                                      │
│              GEO PLAY                │  ← Title (white + blue)
│    Competitive geography games...    │  ← Subtitle
│                                      │
│     [ Easy ]  [ Medium ]  [ Hard ]   │  ← Difficulty selector
│                                      │
│  [🌍All] [🇪🇺EU] [🌏AS] [🌍AF] [🌎NA] [🌎SA]  ← Continent filter
│                                      │
│  ┌─ 🔗 Connect Countries ──────────┐ │
│  │ Race to connect two countries... │ │  ← Game cards
│  │ [2-3 countries apart · 90s]     │ │     (difficulty-specific info)
│  └──────────────────────────────────┘ │
│  ┌─ 🗺️ Find the Country ──────────┐ │
│  │ Identify from silhouette...     │ │
│  └──────────────────────────────────┘ │
│  ┌─ 🏁 Flag Sprint ───────────────┐ │
│  │ 60 seconds. Name flags...       │ │
│  └──────────────────────────────────┘ │
│  ┌─ ⚡ Capital Clash ──────────────┐ │
│  │ Name capitals both ways...      │ │
│  └──────────────────────────────────┘ │
│  ┌─ ⚔️ Border Blitz ──────────────┐ │
│  │ Find all neighbors...           │ │
│  └──────────────────────────────────┘ │
│  ┌─ 📍 Find on Map ───────────────┐ │
│  │ Click country on world map...   │ │
│  └──────────────────────────────────┘ │
│                                      │
│   GeoPlay — Geography under pressure │  ← Footer
└──────────────────────────────────────┘
```

### Navigation

Each game card navigates to its game screen, passing `difficulty` and `continent` as parameters. Every game screen has a back button (chevron) to return home.

### Difficulty Info on Game Cards

Each card shows context-specific difficulty information:

| Game | Info Format |
|------|------------|
| Connect | "2-3 countries apart · 90s" |
| Silhouette | "5 rounds · 30s each" |
| Flag Sprint | "60s" (+ "wrong = -5" if penalty > 0) |
| Capital Clash | "90s · capital → country" (or "both ways") |
| Border Blitz | "1–3 neighbors · 90s" (+ "wrong = -2" if penalty > 0) |
| Map Quiz | "90s" (+ "wrong = -10" if penalty > 0) |

### Game Card Component

Each card contains:
- Icon (emoji) with accent-colored background
- Title and description
- Difficulty info badge with lightning icon
- Hover animation: scale 1.02, translate Y -2px
- Tap animation: scale 0.98
- Accent glow effect on hover

---

## 15. Design System & Theming

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0a0e1a` | App background, ocean on map |
| Surface | `#111827` | Cards, panels, inputs |
| Surface light | `#1e293b` | Borders, elevated surfaces, country default fill |
| Border | `#334155` | Active/hover borders |
| Text primary | `#f1f5f9` | Headings, main text |
| Text secondary | `#cbd5e1` | Secondary content |
| Text muted | `#94a3b8` | Labels, hints |
| Text dim | `#475569` | Very subtle text |
| Green | `#22c55e` | Correct, success, start country |
| Red | `#ef4444` | Wrong, error, end country |
| Blue | `#3b82f6` | Connect Countries accent, links |
| Amber | `#f59e0b` | Hints, Capital Clash accent, streaks |
| Purple | `#a855f7` | Silhouette accent |
| Violet | `#8b5cf6` | Border Blitz accent |
| Cyan | `#06b6d4` | Find on Map accent |

### Game-Specific Accent Colors

| Game | Accent | Used For |
|------|--------|----------|
| Connect Countries | `#3b82f6` (Blue) | Timer, buttons, path |
| Find the Country | `#a855f7` (Purple) | Timer, countdown, silhouette |
| Flag Sprint | `#22c55e` (Green) | Timer, buttons, countdown |
| Capital Clash | `#f59e0b` (Amber) | Timer, buttons, countdown |
| Border Blitz | `#8b5cf6` (Violet) | Timer, buttons, highlights |
| Find on Map | `#06b6d4` (Cyan) | Timer, buttons, countdown |

### Typography

- Headings: Font weight 900 (black), tight tracking
- Body: Font weight 400-600
- Score numbers: `tabular-nums` (monospace digits for alignment)
- Labels: Uppercase, letter-spacing `0.3em`, font weight 600

### Animations

- **Countdown numbers**: Spring animation (scale 0.5→1, opacity 0→1, stiffness 300)
- **Score reveal**: Spring scale from 0 to 1 (delay 0.2)
- **Card entrance**: Fade up (y: 20→0, opacity 0→1)
- **Resolution sections**: Staggered delays (0.15, 0.2, 0.3, 0.4, 0.5)
- **Silhouette rotation**: Y-axis rotation 90°→0° with spring
- **Wrong answer**: Shake animation on input
- **Timer pulse**: Red color + CSS pulse animation when ≤10s
- **Flag transition**: Scale 0.8→1 on enter, exit with scale down

### Responsive Design

- Mobile-first with `sm:` breakpoints for larger screens
- Dynamic viewport height (`dvh`) for mobile keyboard handling
- Bottom-anchored inputs scroll into view when focused
- `interactiveWidget: "resizes-content"` viewport meta for mobile keyboard

---

## 16. Shared UI Patterns

### Timer Bar

Present in all games during the playing phase:

```
Height: 4px (mobile) / 6px (desktop)
Background: #1e293b
Fill: accent color → amber → red (based on percentage remaining)
  > 30%: accent color
  > 10%: #ef4444 (red)
  ≤ 10%: #dc2626 (dark red)
Position: top of screen, full width
```

### Top Bar (Playing Phase)

```
Background: #111827 at 90% opacity + backdrop blur
Border: bottom, #1e293b
Layout: flex, space-between
Left: back button (chevron) + score
Right: game-specific stats + timer (animated, pulses when ≤10s)
```

### Autocomplete Input

Used by 5 of 6 games (all except Find on Map):

```
Container: bg-[#111827], border-2, rounded-xl, padding varies
Input: transparent background, text-lg
Submit button: accent color, "GO" text, disabled when empty
Dropdown: positioned above input (bottom-full), bg-[#111827], rounded-xl, shadow-xl, max 5-6 items
  - Selected item: bg-[#1e293b], white text
  - Non-selected: #cbd5e1 text, hover bg-[#1e293b]

Keyboard behavior:
  - ArrowDown: move selection down
  - ArrowUp: move selection up
  - Enter: submit selected OR first suggestion OR raw text
  - Escape: close dropdown

Border feedback:
  - Correct: green border, brief pulse
  - Wrong: red border, shake animation
  - Default: #334155, focus: accent color
```

### Resolution Screen Pattern

All games follow a consistent resolution layout:

```
1. Game title (small uppercase label)
2. Status text ("TIME UP" or completion message)
3. Score (large number in accent color)
4. Summary line (e.g., "12 / 15 correct")
5. Stats grid (2×2 or 3×1, colored numbers)
6. Answer review (scrollable list, color-coded)
7. Action buttons: "Play Again" (accent) + "Home" (gray)
```

### Countdown Animation

All games except Connect Countries use a 3-2-1 countdown:

```
Full-screen centered, dark background
Small game title label (uppercase, tracking)
Large number: text-9xl, font-black, accent color
  - Spring animation per digit (scale 0.5→1, opacity 0→1)
"Get ready!" subtitle
```

---

## 17. External Dependencies & Assets

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| d3-geo | ^3.1.1 | Map projections (NaturalEarth1, Mercator, geoPath) |
| topojson-client | ^3.1.0 | Convert TopoJSON to GeoJSON for rendering |
| framer-motion | ^11.15.0 | UI animations (can be replaced with native animations) |

### External URLs

| Asset | URL | Size | Can Cache |
|-------|-----|------|-----------|
| World map (TopoJSON) | `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | ~200KB | Yes |
| Flag images | `https://flagcdn.com/w320/{code}.png` | ~5-30KB each | Yes |

### Mobile Equivalents

| Web | Mobile Alternative |
|-----|--------------------|
| d3-geo | Native mapping libraries, or port d3-geo algorithms |
| SVG rendering | Canvas/native drawing, or MapKit/Google Maps with GeoJSON overlay |
| topojson-client | Bundle pre-converted GeoJSON instead |
| framer-motion | React Native Reanimated / Flutter animations / native UIView animations |
| Flag CDN | Bundle flag images as assets (~5MB for all 213) |

---

## 18. Offline Considerations

### What Can Work Offline

| Component | Current State | Offline Approach |
|-----------|---------------|-----------------|
| Country data | Bundled (in-app) | Already offline |
| Adjacency graph | Bundled (in-app) | Already offline |
| Translations | Bundled (in-app) | Already offline |
| Game engines | Pure functions | Already offline |
| World map (TopoJSON) | CDN fetch | Bundle as app asset (~200KB) |
| Country silhouettes | CDN fetch | Same TopoJSON, bundle it |
| Flag images | CDN fetch | Bundle all flags (~5MB total) |

### Total Offline Bundle Size Estimate

- Country data + adjacency + i18n: ~500KB
- World map TopoJSON: ~200KB
- Flag images (213 × ~20KB avg): ~4.3MB
- **Total: ~5MB** — very reasonable for a mobile app

### What Requires Internet

Nothing, once assets are bundled. The entire app can run fully offline.

---

## Appendix A: Complete Adjacency Graph Reference

The adjacency graph contains ~130 countries. A few examples:

```
// Europe
PT → ["ES"]
ES → ["PT", "FR", "AD", "MA"]
FR → ["BE", "LU", "DE", "CH", "IT", "ES", "AD", "MC"]
DE → ["DK", "PL", "CZ", "AT", "CH", "FR", "LU", "BE", "NL"]
RU → ["NO", "FI", "EE", "LV", "LT", "PL", "BY", "UA", "GE", "AZ", "KZ", "MN", "CN", "KP"]

// Asia
CN → ["RU", "MN", "KP", "VN", "LA", "MM", "IN", "BT", "NP", "PK", "AF", "TJ", "KG", "KZ"]
IN → ["PK", "CN", "NP", "BT", "BD", "MM"]

// Africa
EG → ["LY", "SD", "IL", "PS"]
ZA → ["NA", "BW", "ZW", "MZ", "SZ", "LS"]

// Americas
US → ["CA", "MX"]
BR → ["UY", "AR", "PY", "BO", "PE", "CO", "VE", "GY", "SR", "GF"]
```

(Full graph is in `data/adjacency.ts`)

---

## Appendix B: Country Coordinates Reference

Every country has `[latitude, longitude]` coordinates used for map projections and label placement. These are approximate geographic centers.

Examples:
```
US → [37.09, -95.71]
DE → [51.17, 10.45]
CN → [35.86, 104.2]
BR → [-14.24, -51.93]
AU → [-25.27, 133.78]
```

(Full list is in `data/countries.ts`)

---

## Appendix C: Scoring Quick Reference

| Game | Scoring Model | Higher/Lower Better |
|------|---------------|-------------------|
| Connect Countries | Moves + penalties (wrong×3 + hints×2 + timeout×5) | **Lower** |
| Find the Country | Points per round (max 100, reduced by hints/wrong) | **Higher** |
| Flag Sprint | Points per flag × streak multiplier | **Higher** |
| Capital Clash | Points per answer × streak multiplier | **Higher** |
| Border Blitz | Points per neighbor found - penalties | **Higher** |
| Find on Map | Points per correct click × streak multiplier | **Higher** |

---

## Appendix D: Translation Keys Reference

Complete list of all 181 UI translation keys organized by category:

### Common (7)
`common.loadingGame`, `common.loadingMap`, `common.generatingRoute`, `common.playAgain`, `common.home`, `common.comingSoon`, `common.go`

### Home (14)
`home.subtitle`, `home.footer`, `home.connectTitle`, `home.connectDesc`, `home.silhouetteTitle`, `home.silhouetteDesc`, `home.flagsTitle`, `home.flagsDesc`, `home.capitalsTitle`, `home.capitalsDesc`, `home.borderBlitzTitle`, `home.borderBlitzDesc`, `home.mapQuizTitle`, `home.mapQuizDesc`

### Difficulty (6)
`difficulty.easy`, `difficulty.easyDesc`, `difficulty.medium`, `difficulty.mediumDesc`, `difficulty.hard`, `difficulty.hardDesc`

### Continent (6)
`continent.all`, `continent.europe`, `continent.asia`, `continent.africa`, `continent.northAmerica`, `continent.southAmerica`

### Connect — Reveal (4)
`reveal.mode`, `reveal.start`, `reveal.end`, `reveal.planRoute`

### Connect — Execution (11)
`execution.move`, `execution.total`, `execution.currentlyAt`, `execution.reachNeighborOf`, `execution.toWin`, `execution.hintTry`, `execution.hintTooltip`, `execution.skipTooltip`, `execution.skipLocked`, `execution.typePlaceholder`, `execution.neighbor`

### Resolution (11)
`resolution.timeUp`, `resolution.totalScore`, `resolution.lowerIsBetter`, `resolution.movesTaken`, `resolution.optimalPath`, `resolution.wrongPenalty`, `resolution.hintsPenalty`, `resolution.timeoutPenalty`, `resolution.efficiency`, `resolution.moves`, `resolution.missed`

### Ratings (5)
`rating.perfect`, `rating.great`, `rating.good`, `rating.ok`, `rating.keepTrying`

### Score (3)
`score.label`, `score.penalty`, `score.hints`

### History (4)
`history.title`, `history.notNeighbor`, `history.alreadyVisited`, `history.startTyping`

### Silhouette (18)
`silhouette.round`, `silhouette.points`, `silhouette.finalScore`, `silhouette.roundsSolved`, `silhouette.roundsSkipped`, `silhouette.hintsUsed`, `silhouette.wrongGuesses`, `silhouette.roundReview`, `silhouette.nextRound`, `silhouette.seeResults`, `silhouette.skippedLabel`, `silhouette.timeUpLabel`, `silhouette.getHint`, `silhouette.skip`, `silhouette.hintContinent`, `silhouette.hintFirstLetter`, `silhouette.hintCapital`, `silhouette.hintNeighbors`

### Flag Sprint (12)
`flags.getReady`, `flags.placeholder`, `flags.skip`, `flags.correct`, `flags.wrong`, `flags.bestStreak`, `flags.accuracy`, `flags.answers`, `flags.diffCountries`, `flags.diffRounds`, `flags.diffEach`, `flags.diffWrong`

### Capital Clash (7)
`capitals.getReady`, `capitals.whatCapital`, `capitals.whatCountry`, `capitals.typeCapital`, `capitals.typeCountry`, `capitals.diffMixed`, `capitals.diffOneWay`

### Border Blitz (14)
`borderBlitz.title`, `borderBlitz.getReady`, `borderBlitz.findNeighborsOf`, `borderBlitz.revealed`, `borderBlitz.neighborsFound`, `borderBlitz.allFound`, `borderBlitz.placeholder`, `borderBlitz.hintRevealed`, `borderBlitz.hintTooltip`, `borderBlitz.skipTooltip`, `borderBlitz.skipLocked`, `borderBlitz.hintsLabel`, `borderBlitz.skipsLabel`, `borderBlitz.neighborsLabel`

### Map Quiz (5)
`mapQuiz.title`, `mapQuiz.getReady`, `mapQuiz.find`, `mapQuiz.skip`, `mapQuiz.skipped`
