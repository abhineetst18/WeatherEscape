# A002: Constants & Type Definitions

**Phase:** A — Foundation & Scaffolding
**Batch:** 2 (depends on A001)
**Complexity:** S
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

The PRD defines 6 data models (§9) and various constants (color system §6.2, cache durations §7.4, API URLs §8, weather thresholds §FR-4.6). These must be centralized before components and services reference them.

---

## Instructions

### 1. Create `src/lib/types/index.js`

Define ALL JSDoc typedefs from PRD §9:
- `Location` (§9.1) — id, name, lat, lon, isDefault, source
- `Destination` (§9.2) — id, name, lat, lon, type, population, driveTimeMinutes, driveDistanceKm, weather, delta, qualityScore
- `WeatherData` (§9.3) — temperature, precipitation, cloudCover, windSpeed, uvIndex, conditionCode, conditionText, confidence, source, fetchedAt, precipitationType
- `WeatherDelta` (§9.4) — temperature, precipitation, cloudCover, windSpeed, uvIndex
- `UserSettings` (§9.5) — theme, locale, drivingRadiusMinutes, openRouteServiceKey, weights, savedLocations, activeLocationId
- `WeatherWeights` (§9.6) — sunshine, precipitation, temperature, wind, uv

Export nothing at runtime (pure JSDoc types), but include `@typedef` and `@property` annotations so IDE IntelliSense works.

### 2. Create `src/lib/utils/constants.js`

Export named constants:

**Defaults:**
- `DEFAULT_LOCATION` — Gothenburg `{ lat: 57.7089, lon: 11.9746, name: 'Gothenburg' }`
- `DEFAULT_DRIVING_RADIUS_MINUTES` — `60`
- `DEFAULT_LOCALE` — `'en'`
- `DEFAULT_THEME` — `'dark'`
- `DEFAULT_WEIGHTS` — `{ sunshine: 0.35, precipitation: 0.30, temperature: 0.20, wind: 0.10, uv: 0.05 }`
- `MAX_DESTINATIONS` — `30`

**Driving radius options:**
- `DRIVING_RADIUS_OPTIONS` — `[30, 60, 90, 120, 150, 180, 240]` (minutes)

**Color system (PRD §6.2):**
- `QUALITY_COLORS` — `{ great: '#00b894', moderate: '#fdcb6e', marginal: '#e17055', worse: '#d63031' }`
- `QUALITY_THRESHOLDS` — `{ great: 80, moderate: 50, marginal: 20 }` (scores below 20 = worse)

**Cache durations (PRD §7.4):**
- `CACHE_WEATHER_MS` — 30 minutes in ms
- `CACHE_ISOCHRONE_MS` — 1 hour in ms
- `CACHE_DESTINATIONS_MS` — 24 hours in ms

**API URLs (PRD §8):**
- `SMHI_BASE_URL` — `'https://opendata-download-metfcst.smhi.se/api'`
- `YR_BASE_URL` — `'https://api.met.no/weatherapi/locationforecast/2.0'`
- `ORS_BASE_URL` — `'https://api.openrouteservice.org'`
- `OVERPASS_URL` — `'https://overpass-api.de/api/interpreter'`
- `OSM_TILE_URL` — `'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'`

**Weather thresholds (PRD FR-4.6):**
- `BAD_WEATHER_PRECIP_MM` — `4`
- `BAD_WEATHER_TEMP_THRESHOLD` — `10` (single-digit = below this)

**Supported locales:**
- `SUPPORTED_LOCALES` — `['en', 'sv', 'no', 'da']`

**Destination types:**
- `DESTINATION_TYPES` — `['town', 'beach', 'hiking', 'attraction', 'custom']`

---

## Acceptance Criteria

- [ ] All 6 JSDoc typedefs present in `types/index.js`
- [ ] All constants exported as named exports from `constants.js`
- [ ] Constants match PRD values exactly
- [ ] No runtime dependencies — pure data files
- [ ] Imports work: `import { DEFAULT_LOCATION, QUALITY_COLORS } from '$lib/utils/constants.js'`

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/types/index.js` | JSDoc type definitions for IDE support |
| `src/lib/utils/constants.js` | App-wide constants, defaults, thresholds |
