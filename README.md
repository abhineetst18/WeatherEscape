# WeatherEscape

Find destinations with better weather within your driving radius — a Progressive Web App built for Nordic travellers.

## Overview

WeatherEscape answers a simple question: *where should I drive to escape bad weather today?*

You set a home location and a driving-time radius. The app fetches live forecasts from SMHI (Sweden) and YR/MET Norway (Norway/Denmark), scores each reachable destination against your current weather, and plots the results on an interactive map. Green markers mean meaningfully better conditions; red means it's not worth the trip. Scores update in real time as you adjust the radius or weights.

The app runs entirely in the browser, requires no backend, and installs as a PWA for offline use.

## Features

- **Interactive Leaflet map** — colour-coded destination markers updated live as you change settings
- **Real weather data** — SMHI for Sweden, YR/MET Norway for Norway and Denmark; no proxy required
- **Flexible location input** — GPS detection, place-name search, or manually saved locations
- **Adjustable driving radius** — slider from 30 minutes to 4 hours; drive times use OpenRouteService when a key is provided, or a straight-line fallback otherwise
- **Weather quality scoring** — weighted 0–100 score comparing destination forecast to your base weather across cloud cover, precipitation, temperature, wind speed, and UV index
- **Delta display** — `WeatherCard` shows exact improvements (e.g. "−8 mm rain", "+4 °C") per destination
- **Configurable score weights** — adjust the relative importance of each weather factor in Settings
- **Multi-language** — English, Swedish, Norwegian, Danish (locale files in `public/locales/`)
- **Dark and light themes** — theme-aware CARTO map tiles switch automatically
- **Installable PWA** — service worker caches map tiles for 7 days and weather data for 30 minutes; app works offline after first load
- **WCAG 2.1 AA accessible** — keyboard-navigable, screen-reader compatible, sufficient colour contrast

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | Svelte 5 (runes API) |
| Build tool | Vite 6 |
| Styling | TailwindCSS 4 |
| Maps | Leaflet 1.9 |
| PWA | vite-plugin-pwa (Workbox) |
| Weather APIs | SMHI Open Data, MET Norway (YR) |
| Routing API | OpenRouteService (optional) |
| Tile provider | CARTO (light and dark variants) |

## Getting Started

**Prerequisites:** Node.js 18+ and npm.

```bash
# Clone and install
git clone <repo-url>
cd WeatherEscape
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Configuration

WeatherEscape has no `.env` file and no required configuration before running.

### OpenRouteService API key (optional)

Without a key, drive times are estimated using straight-line distance × 1.3. For accurate isochrones, get a free key at [openrouteservice.org](https://openrouteservice.org) and enter it in **Settings → API Key**. The key is stored in `localStorage` — it never leaves the browser.

### Free APIs (no key needed)

| API | Purpose |
|---|---|
| SMHI Open Data | Swedish weather forecasts |
| MET Norway (YR) | Norwegian and Danish forecasts |
| OpenStreetMap / Nominatim | Place-name search and geocoding |
| CARTO | Map tiles (light and dark) |

## Project Structure

```
WeatherEscape/
├── index.html              # App shell
├── vite.config.js          # Vite + Svelte + PWA configuration
├── public/
│   ├── favicon.svg
│   └── locales/            # Translation files (en, sv, no, da)
└── src/
    ├── main.js             # Entry point
    ├── App.svelte          # Root component
    └── lib/
        ├── components/     # UI components
        │   ├── Map.svelte
        │   ├── Header.svelte
        │   ├── DestinationPanel.svelte
        │   ├── LocationPicker.svelte
        │   ├── RadiusSlider.svelte
        │   ├── SettingsModal.svelte
        │   └── WeatherCard.svelte
        ├── services/       # Data-fetching and business logic
        │   ├── weatherService.js
        │   ├── scoringService.js
        │   ├── routingService.js
        │   ├── destinationService.js
        │   ├── locationService.js
        │   └── cacheService.js
        ├── stores/         # Svelte 5 rune-based state
        │   ├── weatherStore.svelte.js
        │   ├── locationStore.svelte.js
        │   ├── settingsStore.svelte.js
        │   └── i18nStore.svelte.js
        ├── types/          # JSDoc type definitions
        └── utils/          # Constants and helpers
```

### Scoring algorithm

`scoringService.js` converts a weather delta into a 0–100 score using a weighted sum of normalised deltas:

| Factor | Default weight | Direction |
|---|---|---|
| Sunshine (cloud cover) | 35% | Less cloud = higher score |
| Precipitation | 30% | Less rain = higher score |
| Temperature | 20% | Warmer = higher score |
| Wind speed | 10% | Calmer = higher score |
| UV index | 5% | Higher UV = higher score |

Weights are configurable per session in Settings.

| Score | Marker colour | Meaning |
|---|---|---|
| 80–100 | Green | Significant improvement |
| 50–79 | Yellow | Moderate improvement |
| 20–49 | Orange | Marginal improvement |
| 0–19 | Red | Worse or no improvement |

## Deployment

### GitHub Pages

```bash
# Build with relative asset paths (required for GitHub Pages subdirectory hosting)
npm run build:gh-pages

# Deploy the contents of dist/ to your gh-pages branch or Pages source folder
```

The `build:gh-pages` script passes `--base=./` to Vite, producing relative asset paths that work under any subdirectory URL.

For other static hosts (Netlify, Vercel, Cloudflare Pages), `npm run build` is sufficient — set the publish directory to `dist/`.

## Attribution

- Weather data: [SMHI Open Data](https://opendata.smhi.se) and [MET Norway / yr.no](https://yr.no)
- Map tiles: © CARTO
- Map library: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Routing: powered by [OpenRouteService](https://openrouteservice.org)

## License

MIT
