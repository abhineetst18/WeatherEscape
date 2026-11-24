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
- **Installable PWA** — the service worker caches the app shell and map tiles. Forecasts are cached separately by the app for up to 30 minutes, only for the same local date pair and provider-rounded coordinates.
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

The light and dark maps require a free [CARTO basemap API key](https://carto.com/basemaps/apikey).
For local development, copy `.env.example` to `.env.local` and set:

```dotenv
VITE_CARTO_API_KEY=your_key_here
```

Vite embeds this browser key in the built site. Do not commit `.env.local`; restrict the key to your deployed domain in CARTO.

### OpenRouteService API key (optional)

Without a key, drive times are estimated using straight-line distance × 1.3. For accurate isochrones, get a free key at [openrouteservice.org](https://openrouteservice.org) and enter it in **Settings → API Key**. The key is stored in `localStorage` — it never leaves the browser.

### External APIs

| API | Purpose |
|---|---|
| SMHI Open Data | Swedish weather forecasts |
| MET Norway (YR) | Norwegian and Danish forecasts |
| OpenStreetMap / Nominatim | Place-name search and geocoding |
| CARTO | Map tiles (light and dark); free API key required |

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

Weights are configurable in Settings. Available factors with positive weights are normalized; missing UV is omitted. Identical forecasts and comparisons with no valid weights score 50.

| Score | Marker colour | Meaning |
|---|---|---|
| 65–100 | Green | Much better |
| 56–64 | Light green | Better |
| 45–55 | Yellow | Similar |
| 0–44 | Red | Worse |

Today and tomorrow use the browser's local dates. All Day aggregates available samples on the selected date, not necessarily a full 24 hours. Specific periods are shown only when there are usable samples for that date and period. The app does not invent missing observations or normalize uneven provider sampling, so totals can reflect different coverage. The retrieval timestamp is when the app received the base forecast, not when the provider issued it. A cache hit retains that timestamp.

Provider fetches bypass the browser HTTP cache, and the current service worker does not cache provider responses. Offline, the app may still show a valid app-cached forecast; without one it reports a fetch failure. A previously installed service worker can still intercept provider requests until the new worker controls the page.

## Deployment

### GitHub Pages

Add `CARTO_API_KEY` under **Settings → Secrets and variables → Actions**, then set
**Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
Run `npm test` for the offline Node regression suite. The Pages workflow and local `npm run deploy` helper both gate the build on these tests.
Pushes to `main` build and deploy automatically. The workflow passes `--base=./`
to Vite so assets work under the GitHub Pages repository path.

For other static hosts (Netlify, Vercel, Cloudflare Pages), set
`VITE_CARTO_API_KEY`, run `npm run build`, and publish `dist/`.

### Troubleshooting map tiles

| Tile text | Cause | Fix |
|-----------|-------|-----|
| `API KEY REQUIRED` | No key was embedded at build time | Check the secret exists (`gh secret list`), Pages source is **GitHub Actions**, and the latest deploy run succeeded |
| `API key not found` | Key is invalid, revoked, or not allowed for this domain | Create a new key in CARTO, update the secret (`gh secret set CARTO_API_KEY`), and re-run the deploy workflow |

### Alternative tile providers

If CARTO changes its terms, pricing, or key requirements, these are the fallbacks:

| Provider | Key | Dark/light | Effort | Notes |
|----------|-----|------------|--------|-------|
| **Esri World Dark/Light Gray Canvas** | None | Yes (labels are a separate reference layer) | Small | Best keyless option; closest look to CARTO. `server.arcgisonline.com` is already allowed by the CSP. Fine for personal, non-commercial use. |
| **Stadia Maps (Alidade Smooth / Smooth Dark)** | Account + domain registration (no key in code) | Yes | Small | Very good look; free for non-commercial use. |
| **OpenStreetMap standard** | None | Light only | Small | OSM's tile usage policy discourages heavy app use; no dark style. |
| **OpenFreeMap / MapTiler** | None / free key | Yes | Large | Vector tiles; requires switching from Leaflet raster layers to MapLibre GL. |

Esri URLs (append a labels layer from
`.../Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}` or `World_Light_Gray_Reference`):

```text
https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}
https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}
```

To switch providers, update:

- `MAP_TILES` and `MAP_ATTRIBUTION` in `src/lib/utils/constants.js`
- `img-src` in the Content-Security-Policy `<meta>` tag in `index.html`
- The tile `runtimeCaching` `urlPattern` in `vite.config.js`
- The key check and `VITE_CARTO_API_KEY` env in `.github/workflows/deploy-pages.yml` (remove them if the provider is keyless)

## Attribution

- Weather data: [SMHI Open Data](https://opendata.smhi.se) and [MET Norway / yr.no](https://yr.no)
- Map tiles: © CARTO
- Map library: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Routing: powered by [OpenRouteService](https://openrouteservice.org)

## License

MIT
