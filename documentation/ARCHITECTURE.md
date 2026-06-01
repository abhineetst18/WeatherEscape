# Architecture

Technical reference for contributors.

---

## System Overview

WeatherEscape is a client-side SPA with no backend. All data fetching, scoring, and rendering happens in the browser.

```
┌─────────────────────────────────────────────────────────┐
│                    App Shell (App.svelte)                │
├─────────────────────────────────────────────────────────┤
│                 Component Layer (Svelte 5)               │
│  Header · DestinationPanel · WeatherCard · Map          │
│  LocationPicker · RadiusSlider · SettingsModal           │
├─────────────────────────────────────────────────────────┤
│               State Layer (Rune Stores)                  │
│  weatherStore · locationStore · settingsStore · i18nStore│
├─────────────────────────────────────────────────────────┤
│                 Service Layer                            │
│  weatherService · scoringService · routingService        │
│  destinationService · locationService · cacheService     │
├─────────────────────────────────────────────────────────┤
│                External APIs (no auth)                   │
│  SMHI · MET Norway · Nominatim · CARTO · ORS (optional) │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Components (`src/lib/components/`)

| Component | Responsibility |
|-----------|---------------|
| `Header.svelte` | Location display, base weather summary, day/period controls |
| `DestinationPanel.svelte` | Destination list, sort/filter controls, loading skeletons |
| `WeatherCard.svelte` | Individual destination: score, delta display, weather details |
| `Map.svelte` | Leaflet map, markers, radius circle, click handling |
| `LocationPicker.svelte` | GPS detection, Nominatim search, saved location management |
| `RadiusSlider.svelte` | Drive-time radius input (30 min – 4 hr) |
| `SettingsModal.svelte` | Weight config, theme, language, API key entry |

### Stores (`src/lib/stores/`)

Svelte 5 rune-based reactive state. Stores are module-level `$state` objects exporting both state and mutator functions.

| Store | State Owned |
|-------|-------------|
| `weatherStore.svelte.js` | `base`, `destinations[]`, `loading`, `error`, `day`, `timePeriod` |
| `locationStore.svelte.js` | `current`, `saved[]`, `radius` |
| `settingsStore.svelte.js` | `weights`, `theme`, `language`, `orsApiKey` |
| `i18nStore.svelte.js` | `locale`, `t()` translation function |

### Services (`src/lib/services/`)

Pure functions and async fetchers. No UI coupling.

| Service | Role |
|---------|------|
| `weatherService.js` | Fetch + normalize forecasts from SMHI and MET Norway |
| `scoringService.js` | Calculate quality score (0–100) from weather deltas |
| `routingService.js` | Drive-time calculation (ORS isochrone or straight-line fallback) |
| `destinationService.js` | Filter destinations by radius, manage destination lists |
| `locationService.js` | GPS geolocation, Nominatim search, localStorage persistence |
| `cacheService.js` | In-memory + localStorage caching with TTL |

### Utils (`src/lib/utils/`)

| File | Contents |
|------|----------|
| `constants.js` | Default weights, theme definitions, supported formats, time boundaries |
| `weatherHelpers.js` | `toLocalDateStr()`, `aggregateYRDay()`, delta calculation helpers |

---

## Data Flow

### 1. App Initialization

```
App.svelte mount
  → locationStore: load saved locations from localStorage
  → settingsStore: load preferences from localStorage
  → i18nStore: load locale file
  → if location available: trigger weather fetch
```

### 2. Weather Fetch Cycle

```
User sets location or radius changes
  → weatherStore.fetchBaseWeather()
    → weatherService.fetchWeather(lat, lon)
      → SMHI API (if Sweden) or MET Norway API
      → normalize to common WeatherData format
      → aggregateYRDay() → { allDay, morning, afternoon, evening }
  → weatherStore.fetchDestinations()
    → destinationService.getDestinationsInRadius(location, radius)
    → routingService.calculateDriveTimes(destinations)
    → weatherService.fetchWeatherBatch(destinations)
    → scoringService.calculateQualityScore(delta) per destination
    → store updates → components re-render
```

### 3. Score Calculation

```
calculateQualityScore(delta, weights)
  → normalize each delta factor to [0, 1]
  → weighted sum: Σ(weight_i × score_i)
  → clamp to [0, 100]
  → return score + quality tier (green/yellow/orange/red)
```

### 4. User Changes Time Period

```
User presses 1/2/3/4 or clicks period button
  → weatherStore.timePeriod = 'morning' | 'afternoon' | 'evening' | 'allDay'
  → getSelectedWeather() returns data for that period
  → all cards and map markers re-render with period-specific scores
```

---

## Caching Strategy

| Data Type | TTL | Storage |
|-----------|-----|---------|
| Weather forecasts | 30 minutes | Memory + localStorage |
| Map tiles | 7 days | Service worker (Workbox) |
| App shell | Until new deploy | Service worker (precache) |
| User preferences | Permanent | localStorage |
| Saved locations | Permanent | localStorage |

The service worker is generated by `vite-plugin-pwa` with Workbox. It uses:
- **Precache** for app shell assets (HTML, JS, CSS)
- **StaleWhileRevalidate** for API responses
- **CacheFirst** for map tiles (with 7-day expiry)

---

## API Integration

### SMHI (Sweden)

- Endpoint: `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json`
- Rate limit: None published (be respectful)
- Returns: Hourly forecasts for 10 days

### MET Norway (Norway/Denmark)

- Endpoint: `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat={lat}&lon={lon}`
- Rate limit: Requires User-Agent header
- Returns: Hourly forecasts for 9 days

### OpenRouteService (optional)

- Endpoint: `https://api.openrouteservice.org/v2/isochrones/driving-car`
- Rate limit: 40 req/min (free tier)
- Returns: Isochrone polygon for drive-time radius

---

## Build and Tooling

| Tool | Purpose |
|------|---------|
| Vite 6 | Build, dev server, HMR |
| Svelte 5 | Component compiler |
| vite-plugin-pwa | Service worker generation |
| PostCSS / CSS | Styling (design tokens in `app.css`) |

### Build Commands

```bash
npm run dev          # Development server (port 5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build (port 4173)
npm run build:gh-pages  # Build with relative base for GitHub Pages
```

---

## Design Tokens

All visual values are defined as CSS custom properties in `src/styles/app.css`:

- Spacing: 4px/8px grid (`--space-xs` through `--space-3xl`)
- Colours: semantic tokens (`--bg`, `--surface`, `--text`, `--primary`, etc.)
- Typography: modular scale (`--text-xs` through `--text-3xl`)
- Elevation: `--shadow-sm` through `--shadow-xl`
- Border radius: `--radius-sm` through `--radius-full`
- Animation: `--duration-fast`, `--duration-normal`, `--ease-out`

Themes switch by toggling the `[data-theme]` attribute on `<html>`.

---

## Threading Model

Single-threaded (browser main thread). Weather fetches are async but non-blocking. Thumbnail/tile rendering is handled by the browser's compositor. No Web Workers are currently used.

For large destination lists (50+), batch fetching is used to avoid overwhelming APIs.
