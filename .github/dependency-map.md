# WeatherEscape — Component & Data Dependency Map

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            App.svelte (Orchestrator)                            │
│   Owns: loadWeatherData() flow, keyboard shortcuts, $effect() on settings      │
├──────────────┬──────────────────────────────┬──────────────────────────────────┤
│  Header      │         Map.svelte           │      DestinationPanel            │
│  (controls)  │ (Leaflet, markers, iso)      │   (card list, sort/filter)       │
├──────────────┴──────────────────────────────┴──────────────────────────────────┤
│                        Stores (Svelte 5 $state runes)                          │
│  settingsStore ←→ weatherStore ←→ i18nStore ← locationStore                   │
├────────────────────────────────────────────────────────────────────────────────┤
│                        Services (pure logic + I/O)                             │
│  weatherService │ destinationService │ routingService │ scoringService │ cache  │
├────────────────────────────────────────────────────────────────────────────────┤
│                      Utils (pure functions, constants)                         │
│  constants.js │ weatherHelpers.js │ mapHelpers.js │ types/index.js             │
├────────────────────────────────────────────────────────────────────────────────┤
│                        External APIs                                           │
│  YR/MET Norway │ SMHI │ Overpass (OSM) │ OpenRouteService │ Nominatim/Photon  │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Module Dependencies (imports → exports)

### Entry Point
- `src/main.js` → imports `App.svelte`, mounts to `#app`

### App.svelte (Orchestrator)
- **Imports from stores:** `settings`, `applyTheme` (settingsStore); `weather`, `loadForecast`, `toggleDay`, `setTimePeriod` (weatherStore); `initI18n` (i18nStore)
- **Imports from services:** `discoverDestinations` (destinationService); `queueDriveTime`, `estimateDriveTime` (routingService)
- **Imports components:** Header, Map, DestinationPanel, SettingsModal
- **Owns:** `loadWeatherData()`, the location/radius snapshot, and load ownership via `activeLoadId`. The store applies results only while that load still owns state and its local dates still match.
- **Triggers:** `$effect.pre` on the active location and radius; refresh event / R shortcut; local midnight, with focus, page-show and visibility checks for resumed tabs.

### Components

| Component | Imports From | Props/Events |
|-----------|-------------|--------------|
| **Header** | settingsStore (`settings`, `toggleTheme`), i18nStore (`t`, `setLocale`), weatherStore (`weather`, `getSelectedBaseWeather`), weatherHelpers (`getWeatherEmoji`), constants (`SUPPORTED_LOCALES`), LocationPicker, RadiusSlider | dispatches `opensettings` / `refreshweather` CustomEvents |
| **Map** | settingsStore (`settings`), weatherStore (`weather`), constants (`MAP_DEFAULTS`, `MAP_ATTRIBUTION`), mapHelpers (`getTileUrl`, `getQualityColor`, `formatDriveTime`), weatherHelpers (`getWeatherEmoji`), routingService (`fetchIsochrone`) | exports `centerOnDestination()`, `getMap()`, `getLeaflet()` |
| **DestinationPanel** | i18nStore (`t`), weatherStore (`weather`, `getSelectedBaseWeather`, `toggleDay`, `setTimePeriod`), settingsStore (`settings` for locale), WeatherCard | props: `onSelectDestination` callback |
| **WeatherCard** | i18nStore (`t`), scoringService (`getQualityInfo`), mapHelpers (`formatDriveTime`) | props: `destination`, `loading`, `onclick` |
| **LocationPicker** | settingsStore (`settings`), i18nStore (`t`), locationService (`geocodePlace`, `useGpsLocation`, `setActiveLocation`, `addSavedLocation`, `removeSavedLocation`), constants (`DEFAULT_LOCATION`) | props: `onclose` |
| **RadiusSlider** | settingsStore (`settings`, `updateSetting`), i18nStore (`t`), constants (`RADIUS_OPTIONS`) | — |
| **SettingsModal** | settingsStore (`settings`, `updateSetting`), i18nStore (`t`), locationService (`removeSavedLocation`), weatherStore (`recalculateScores`), constants (`DEFAULT_LOCATION`, `DEFAULT_WEIGHTS`) | props: `onclose` |

### Stores

| Store | State Shape | Imports | Exports |
|-------|-------------|---------|---------|
| **settingsStore** | `{ theme, locale, drivingRadiusMinutes, openRouteServiceKey, weights, savedLocations, activeLocationId }` | constants (`DEFAULT_*`) | `settings`, `applyTheme`, `toggleTheme`, `updateSetting`, `getActiveLocation` |
| **weatherStore** | `{ base, dates, destinations, loading, error, day, timePeriod, lastFetched }` | settingsStore, weatherService, weatherHelpers, scoringService | `weather`, `loadForecast`, `getSelectedBaseWeather`, `toggleDay`, `setTimePeriod`, `recalculateScores` |
| **i18nStore** | `{ locale, translations, loading }` | constants, settingsStore (`updateSetting`) | `i18n`, `initI18n`, `setLocale`, `t` |
| **locationStore** | (stateless helper) | settingsStore, constants | `getActiveLocation` |

### Services

| Service | Imports | External I/O | Exports |
|---------|---------|-------------|---------|
| **weatherService** | constants (`API_URLS`, `APP_INFO`, `CACHE_DURATIONS`), cacheService, weatherHelpers (`getForecastDates`, `parseSMHI`, `parseYR`) | YR API, SMHI API | `detectRegion`, `fetchWeather`, `fetchWeatherBatch` |
| **destinationService** | constants (`API_URLS`, `CACHE_DURATIONS`, `DESTINATION_LIMITS`), cacheService, routingService (`haversineDistance`) | Overpass API | `discoverDestinations` |
| **routingService** | settingsStore, constants (`API_URLS`, `CACHE_DURATIONS`), cacheService | OpenRouteService API | `fetchIsochrone`, `fetchDriveTime`, `estimateDriveTime`, `haversineDistance`, `queueDriveTime` |
| **scoringService** | constants (`DEFAULT_WEIGHTS`, `QUALITY_COLORS`) | — (pure) | `calculateQualityScore`, `getQualityInfo` |
| **cacheService** | constants (`CACHE_DURATIONS`) | localStorage | `cacheGet`, `cacheSet`, `cacheInvalidate`, `clearExpiredCache`, `buildCacheKey` |
| **locationService** | settingsStore (`settings`, `updateSetting`), constants (`DEFAULT_LOCATION`) | navigator.geolocation, Nominatim API | `getCurrentPosition`, `addSavedLocation`, `removeSavedLocation`, `setActiveLocation`, `useGpsLocation`, `geocodePlace` |

### Utils

| Module | Exports | Used By |
|--------|---------|---------|
| **constants.js** | `DEFAULT_LOCATION`, `RADIUS_OPTIONS`, `DEFAULT_RADIUS_MINUTES`, `WEATHER_THRESHOLDS`, `DEFAULT_WEIGHTS`, `QUALITY_COLORS`, `API_URLS`, `MAP_TILES`, `MAP_ATTRIBUTION`, `CACHE_DURATIONS`, `MAP_DEFAULTS`, `APP_INFO`, `DESTINATION_LIMITS`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `THEMES`, `DEFAULT_THEME` | ALL stores, ALL services, some components |
| **weatherHelpers.js** | `getForecastDates`, `parseSMHI`, `parseYR`, `calculateDelta`, `isBadWeather`, `getWeatherEmoji` | App, weatherStore, weatherService, Map, Header |
| **mapHelpers.js** | `getTileUrl`, `getQualityColor`, `createMarkerIcon`, `formatDriveTime` | Map, WeatherCard |
| **types/index.js** | JSDoc typedefs only (Location, Destination, WeatherData, WeatherDelta, UserSettings, WeatherWeights) | Referenced via JSDoc `@param` / `@returns` annotations |

## Data Flow

### Primary Pipeline: Location → Weather → Scores → UI

```
1. User selects location / radius
   └─→ settingsStore.activeLocationId / drivingRadiusMinutes changes
       └─→ App.svelte $effect.pre() triggers loadWeatherData()

2. loadWeatherData():
   a) loadForecast() clears previous base, dates/age, and destinations; stops if there is no location
      └─→ weatherService.fetchWeather(lat, lon, dates, isCurrent)
          └─→ Valid cache hit retains fetchedAt; otherwise fetch the provider with no-store
          └─→ parseSMHI() or parseYR() → nullable exact-date/period aggregates
          └─→ Cache under provider-rounded coordinates with the exact date pair (30min TTL)
      └─→ Publish base and retrieval timestamp only for the current load
      └─→ Stop if base fetch failed or neither date has usable samples

   b) discoverDestinations(lat, lon, radiusKm)
      └─→ Overpass API POST (towns, beaches, nature reserves, attractions)
      └─→ fallback: curated FALLBACK_TOWNS list (30 Nordic towns)
      └─→ cacheService stores (24h TTL)

   c) estimateDriveTime() (haversine × 1.3 road factor, 70km/h)
      └─→ filter destinations within drivingRadiusMinutes

   d) Fetch destination weather for withinRadius
      └─→ fetchWeatherBatch() — 5 concurrent workers
          └─→ For each: fetchWeather() → onResult callback
              └─→ Match the selected date and period at callback time, then calculateDelta()
              └─→ calculateQualityScore(delta, settings.weights)
      └─→ Sort destinations by qualityScore DESC

   e) [Optional] queueDriveTime() via ORS API (rate-limited 40 req/min)
      └─→ Updates a destination only if this load still owns state
```

### Secondary Pipeline: Day/Period Toggle → Recalculate

```
User toggles day (t key) or changes period (1-4 keys / dropdown)
└─→ weatherStore.toggleDay() or setTimePeriod()
    └─→ recalculateScores()
        └─→ Use the same date/period and score helper as progressive results
        └─→ Resort by score
```

### Tertiary Pipeline: Weight Change → Recalculate

```
User adjusts weights in SettingsModal
└─→ updateSetting('weights', normalized)
    └─→ recalculateScores() — recomputes qualityScore with new weights
```

### Map Rendering Pipeline

```
weather.destinations changes ($effect in Map.svelte)
└─→ Clear old marker layer group
└─→ For each destination with qualityScore:
    - getQualityColor(score) → colored dot marker
    - L.marker with popup showing: name, score, temp, precip, wind, drive time
└─→ Add layer group to map

settings.activeLocationId changes ($effect)
└─→ map.setView(newCoords), baseMarker.setLatLng()

settings.drivingRadiusMinutes + location changes ($effect)
└─→ fetchIsochrone(lat, lon, radius*60) → GeoJSON polygon overlay
```

### i18n Flow

```
App.svelte onMount → initI18n(settings.locale)
└─→ fetch /locales/{locale}.json → cache in memory
└─→ i18n.translations = loaded data

setLocale(newLocale) → fetch new JSON → updateSetting('locale', ...)
t('key.path', {params}) → dot-notation lookup + string interpolation
```

## Key Schemas/Contracts

### UserSettings (localStorage: 'weatherescape-settings')
```js
{
  theme: 'dark' | 'light',
  locale: 'en' | 'sv' | 'no' | 'da',
  drivingRadiusMinutes: number (30|60|90|120|150|180|240),
  openRouteServiceKey: string,
  weights: { sunshine, precipitation, temperature, wind, uv }, // sum = 1.0
  savedLocations: Location[],
  activeLocationId: string
}
```

### WeatherData (normalized from both APIs)
```js
{
  temperature: number (°C),
  precipitation: number (mm),
  cloudCover: number (0-100%),
  windSpeed: number (m/s),
  uvIndex: number | null,
  conditionCode: string,
  conditionText: string,
  confidence: number | null,
  source: 'smhi' | 'yr',
  fetchedAt: ISO string,
  precipitationType: 'burst' | 'spread' | 'none'
}
```

### PeriodWeather (per-day structure)
```js
{
  allDay: WeatherData,
  morning: WeatherData | null,   // 06:00-12:00
  afternoon: WeatherData | null, // 12:00-18:00
  evening: WeatherData | null    // 18:00-24:00
}
```

### weather.base state shape
```js
{ dates: { today: string, tomorrow: string }, today: PeriodWeather | null,
  tomorrow: PeriodWeather | null, fetchedAt: number }
```

### Destination (enriched during pipeline)
```js
{
  id: string,
  name: string,
  lat: number, lon: number,
  type: 'town' | 'beach' | 'hiking' | 'attraction' | 'custom',
  population: number,
  driveTimeMinutes: number | null,
  driveDistanceKm: number | null,
  isEstimate: boolean,
  forecast: Forecast | null,
  weather: WeatherData | null,   // current selected period
  delta: WeatherDelta | null,
  qualityScore: number | null (0-100)
}
```

### Cache Key Format (localStorage, prefix: 'we-cache-')
```
weather:{lat4dec}:{lon4dec}  → {dates, fetchedAt, today, tomorrow} (30min TTL, exact local date pair)
dest:{lat2dec}:{lon2dec}:{radiusKm2dec} → Destination[] (24h TTL)
iso:{lat2dec}:{lon2dec}:{rangeSeconds2dec} → GeoJSON Feature (1h TTL)
route:v2:{fromLat}:{fromLon}:{toLat}:{toLon} → {durationMinutes, distanceKm, isEstimate} (1h TTL; exact coordinate strings as sent to ORS)
Legacy rounded route keys are not read by routing requests; normal expiry cleanup is unchanged.
```

### Quality Score Formula
```
score = round(clamp(weighted_sum / valid_weight_sum * 100, 0, 100))
Only available factors with finite positive weights count; no valid weights yields 50.
where:
  sunshineScore  = normalize(-delta.cloudCover, -100, 100)  * weights.sunshine
  precipScore    = normalize(-delta.precipitation, -20, 20) * weights.precipitation
  tempScore      = normalize(delta.temperature, -15, 15)    * weights.temperature
  windScore      = normalize(-delta.windSpeed, -20, 20)     * weights.wind
  uvScore        = normalize(delta.uvIndex, -5, 5)          * weights.uv
```

### Quality Color Bands
| Band | Score Range | Color |
|------|-------------|-------|
| Much better | 65-100 | #00b894 |
| Better | 56-64 | #55a630 |
| Similar | 45-55 | #fdcb6e |
| Worse | 0-44 | #d63031 |

## External API Contracts

| API | URL | Method | Cache Strategy | Rate Limit |
|-----|-----|--------|----------------|------------|
| **YR (MET Norway)** | `api.met.no/weatherapi/locationforecast/2.0/compact?lat=X&lon=Y` | GET (User-Agent required) | App-level 30min; fetch `no-store` | None stated |
| **SMHI** | `opendata-download-metfcst.smhi.se/.../lon/X/lat/Y/data.json` | GET | App-level 30min; fetch `no-store` | None (currently 404) |
| **Overpass** | `overpass-api.de/api/interpreter` | POST (form body) | App-level 24h | Fair use |
| **OpenRouteService** | `api.openrouteservice.org/v2/...` | GET/POST (Auth header) | App-level 1h | 40 req/min, 500/day free |
| **Nominatim** | `nominatim.openstreetmap.org/search` | GET | None (app-level debounce) | 1 req/sec |

## Dependency Rules (Change Impact Matrix)

### If you change constants.js:
- `DEFAULT_WEIGHTS` → settingsStore defaults, scoringService defaults, SettingsModal reset
- `API_URLS` → weatherService, destinationService, routingService
- `CACHE_DURATIONS` → cacheService, all services that cache
- `QUALITY_COLORS` → scoringService, mapHelpers
- `MAP_DEFAULTS` → Map.svelte
- `MAP_TILES` → mapHelpers.getTileUrl → Map.svelte initial layer and theme swaps; CARTO URLs require build-time `VITE_CARTO_API_KEY`
- `RADIUS_OPTIONS` → RadiusSlider
- `SUPPORTED_LOCALES` → i18nStore, Header

### If you change settingsStore:
- `settings.activeLocationId` → App.svelte $effect (full reload), Map location $effect, Header display
- `settings.drivingRadiusMinutes` → App.svelte $effect (full reload), Map isochrone $effect
- `settings.weights` → recalculateScores() must be called, SettingsModal display
- `settings.theme` → Map tile layer swap, document data-theme attribute
- `settings.locale` → i18nStore, all `t()` calls re-render
- `settings.openRouteServiceKey` → routingService (enables ORS calls), Map isochrone

### If you change weatherStore:
- `weather.base` → Header base weather display, destination scoring prerequisite
- `weather.destinations` → DestinationPanel list, Map markers $effect
- `weather.day` → recalculateScores, DestinationPanel dayLabel
- `weather.timePeriod` → recalculateScores, DestinationPanel period select
- `weather.loading` → DestinationPanel loading state

### If you change weatherHelpers:
- `parseSMHI` / `parseYR` → weatherService (response parsing), affects ALL downstream weather data
- `calculateDelta` → weatherStore (score pipeline), MUST match WeatherDelta typedef
- `getWeatherEmoji` → Header and Map popup

### If you change scoringService:
- `calculateQualityScore` → weatherStore (destinations scoring), Map marker colors
- `getQualityInfo` → WeatherCard (quality dot + translated label) and `mapHelpers.getQualityColor`

### If you change routingService:
- `haversineDistance` → destinationService (distance filter), routingService (estimate)
- `estimateDriveTime` → App.svelte (initial estimates), routingService fallback
- `fetchIsochrone` → Map.svelte (polygon overlay)
- `queueDriveTime` → App.svelte (progressive refinement)

### If you change destinationService:
- `discoverDestinations` → App.svelte (step 2 of pipeline)
- `FALLBACK_TOWNS` → affects offline/error behavior

### If you change cacheService:
- `buildCacheKey` → ALL services using cache (weather, dest, iso, route keys must stay consistent)
- Weather envelope validation is in `weatherService`; refresh clears old and current weather keys.

### If you change types/index.js:
- WeatherData shape → parseSMHI, parseYR, calculateDelta, UI display
- Destination shape → destinationService, weatherStore, WeatherCard, Map markers
- UserSettings shape → settingsStore, localStorage schema

### If you change locales/*.json:
- All `t('key')` calls that reference changed keys
- i18nStore parameterized string format: `{param}` placeholders

## PWA / Build Config

- **CARTO key:** Local builds read `VITE_CARTO_API_KEY`; `.github/workflows/deploy-pages.yml` maps the `CARTO_API_KEY` repository secret into that Vite variable
- **Vite PWA plugin** with `autoUpdate` registration
- **Service worker caching:**
  - Map tiles (CacheFirst, 500 entries, 7 days)
  - No weather provider routes; an older installed worker may intercept until the new worker controls the page.
- **Test gate:** `npm test` (Node built-in runner) after `npm ci` and before the Pages build; also before local deploy-helper build.
- **Base URL:** `./` (relative, for GitHub Pages)
- **Leaflet:** loaded dynamically via `import('leaflet')` in Map.svelte
- **Tailwind CSS v4** via Vite plugin
- **CSP:** Strict policy in index.html meta tag

## Technology Stack
- **Framework:** Svelte 5 (runes: $state, $derived, $effect, $props)
- **Build:** Vite 6 + @sveltejs/vite-plugin-svelte 5
- **Styling:** Tailwind CSS 4 + CSS custom properties (design tokens)
- **Map:** Leaflet 1.9 (dynamically imported)
- **PWA:** vite-plugin-pwa + Workbox
- **State:** Svelte 5 module-level $state (no external state library)
- **Persistence:** localStorage (settings + API cache)
- **i18n:** Custom JSON-based with 4 locales (en, sv, no, da)
