# GeoPlay

Competitive geography games. Race friends. Master the globe.

GeoPlay is a timed, single-player geography game app with 6 game modes, 7 languages, and a difficulty system that scales from well-known countries to micro-states. Multiplayer works by comparing scores.

## Game Modes

| Game | Mechanic | Scoring |
|------|----------|---------|
| **Connect Countries** | Type neighboring countries to build a path between two nations on the map | Lower is better (golf) |
| **Find the Country** | Identify a country from its silhouette shape | Points per round |
| **Flag Sprint** | Name countries from their flags as fast as possible | Points x streak multiplier |
| **Capital Clash** | Match capitals to countries (bidirectional) | Points x streak multiplier |
| **Border Blitz** | Name all neighbors of a displayed country | Points per neighbor found |
| **Find on Map** | Click the correct country on an interactive world map | Points x streak multiplier |

## Difficulty & Country Tiers

Difficulty controls both time pressure and **which countries appear**:

- **Easy** — Tier 1 only (~55 well-known countries like US, France, Japan, Brazil)
- **Medium** — Tier 1 + 2 (~120 countries, adds Croatia, Morocco, Kazakhstan, etc.)
- **Hard** — All tiers (213 countries including micro-states like Liechtenstein, Comoros, Eswatini)

## Languages

English, Chinese (中文), Spanish (Español), Arabic (العربية), French (Français), Portuguese (Português), Russian (Русский)

All country names, capital names, and UI strings are fully translated.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Map**: [d3-geo](https://d3js.org/d3-geo) + [TopoJSON](https://github.com/topojson/topojson-client) (SVG world map)
- **Data**: 213 countries, adjacency graph, BFS pathfinding, 3-tier classification

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
geoplay/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home screen (game selection)
│   ├── layout.tsx                # Root layout with i18n provider
│   └── games/
│       ├── connect/page.tsx      # Connect Countries
│       ├── silhouette/page.tsx   # Find the Country
│       ├── flags/page.tsx        # Flag Sprint
│       ├── capitals/page.tsx     # Capital Clash
│       ├── border-blitz/page.tsx # Border Blitz
│       └── map-quiz/page.tsx     # Find on Map
├── components/
│   ├── game/                     # Game-specific UI components
│   │   ├── ConnectGame.tsx
│   │   ├── SilhouetteGame.tsx
│   │   ├── FlagSprintGame.tsx
│   │   ├── CapitalClashGame.tsx
│   │   ├── BorderBlitzGame.tsx
│   │   ├── MapQuizGame.tsx
│   │   ├── CountryInput.tsx      # Autocomplete input (shared)
│   │   ├── Timer.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── ...
│   ├── map/
│   │   ├── WorldMap.tsx          # Interactive SVG world map
│   │   └── CountrySilhouette.tsx # Single country shape renderer
│   └── ui/
│       └── GameCard.tsx          # Home screen game card
├── data/
│   ├── countries.ts              # 213 countries (code, name, capital, continent, coordinates)
│   ├── country-tiers.ts          # Tier 1/2/3 classification for all countries
│   └── adjacency.ts              # Land border graph (~130 connected countries)
├── lib/
│   ├── game-engine/              # Pure game logic (no UI dependencies)
│   │   ├── types.ts              # Shared types & difficulty configs
│   │   ├── connect.ts            # Connect Countries engine
│   │   ├── silhouette.ts         # Silhouette engine
│   │   ├── flags.ts              # Flag Sprint engine
│   │   ├── capitals.ts           # Capital Clash engine
│   │   ├── border-blitz.ts       # Border Blitz engine
│   │   └── map-quiz.ts           # Find on Map engine
│   └── i18n/                     # Internationalization
│       ├── types.ts              # Translation keys & locale types
│       ├── context.tsx           # React context provider
│       ├── countries/            # Localized country names (7 languages)
│       ├── capitals/             # Localized capital names (7 languages)
│       └── translations/         # UI string translations (7 languages)
└── package.json
```

## Architecture

### Game Engine Pattern

All game engines are **pure functions** with immutable state. No side effects, no DOM, no React. This makes them portable and testable:

```typescript
// Every engine function takes state in, returns new state out
const result = submitGuess(currentState, userInput);
// result.state = new game state
// result.result = "correct" | "wrong" | "invalid"
```

### State Machine

Every game follows a phase-based flow:

```
[countdown] → [playing] → [resolution]
   3-2-1       Game loop    Results
```

Connect Countries uses a variant: `[reveal] → [execution] → [resolution]`

### Map Rendering

The world map is rendered as SVG using d3-geo (Natural Earth projection) with TopoJSON country boundaries. Features:

- Country highlighting with custom colors per game
- Dynamic zoom/pan (viewBox manipulation) for Find on Map
- Focus region zoom for Border Blitz
- Click-to-select for Find on Map
- Hover effects and tooltips

## Mobile App

Two specification documents exist for a planned Flutter + Mapbox GL mobile version:

- `MOBILE_APP_SPECIFICATION.md` — Platform-agnostic game spec (data, engines, UI patterns)
- `MOBILE_APP_SPEC_FLUTTER.md` — Flutter-specific spec (Mapbox 3D globe, architecture, wiki, flashcards)

## License

Private project.
