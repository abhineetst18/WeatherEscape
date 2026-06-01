# WeatherEscape — Feature Development Plan

This task list is derived from the PRD: `WeatherEscape/.tasks/prd-weather-escape.md`.

## Definition of Done
A task is complete when:
- [ ] Code compiles/runs without errors (`npm run build` succeeds)
- [ ] Tests pass (new + existing)
- [ ] No new linting warnings
- [ ] Documentation updated (if user-facing)
- [ ] App runs in dev mode (`npm run dev`) without console errors

---

## Phase A: Foundation & Scaffolding

- [ ] **Task A1:** Project Initialization — Svelte 5 + Vite 6 + TailwindCSS 4 `[L]`
  - **Acceptance:** `npm install` succeeds, `npm run dev` starts Vite dev server, TailwindCSS compiles, `npm run build` produces `dist/`
  - **Dependencies:** None
  - [ ] A1.1 Create `package.json` with Svelte 5, Vite 6, TailwindCSS 4, Leaflet dependencies `[M]`
  - [ ] A1.2 Create `vite.config.js` with Svelte plugin `[S]`
  - [ ] A1.3 Create `index.html` Vite entry point `[S]`
  - [ ] A1.4 Create `src/app.html` Svelte HTML template `[S]`
  - [ ] A1.5 Create `src/main.js` entry point mounting App.svelte `[S]`
  - [ ] A1.6 Create `src/styles/app.css` with TailwindCSS 4 imports `[S]`
  - [ ] A1.7 Create `.gitignore` for node_modules, dist, .env `[S]`
  - [ ] A1.8 Run `npm install` and verify dev server starts `[S]`

- [ ] **Task A2:** Constants & Type Definitions `[S]`
  - **Acceptance:** All JSDoc types from PRD §9 defined, constants for defaults/thresholds present
  - **Dependencies:** A1
  - [ ] A2.1 Create `src/lib/types/index.js` with all JSDoc typedefs (Location, Destination, WeatherData, WeatherDelta, UserSettings, WeatherWeights) `[S]`
  - [ ] A2.2 Create `src/lib/utils/constants.js` with default values, thresholds, color system, API URLs `[S]`

- [ ] **Task A3:** Theme System (Dark/Light) `[M]`
  - **Acceptance:** Theme toggle switches between dark/light, persists in localStorage, CSS custom properties drive all colors
  - **Dependencies:** A1
  - [ ] A3.1 Create `src/lib/stores/settingsStore.js` with theme, locale, drivingRadius, weights state `[M]`
  - [ ] A3.2 Define CSS custom properties for dark/light themes in `app.css` `[S]`
  - [ ] A3.3 Implement TailwindCSS dark mode class strategy `[S]`

- [ ] **Task A4:** Internationalization Framework + EN Locale `[M]`
  - **Acceptance:** `t('key')` function returns localized string, EN locale covers all UI strings, locale switchable at runtime without reload
  - **Dependencies:** A1
  - [ ] A4.1 Create `src/lib/stores/i18nStore.js` with locale state, translate function, locale loader `[M]`
  - [ ] A4.2 Create `public/locales/en.json` with all UI strings (header, panel, settings, errors, map) `[S]`

- [ ] **Task A5:** App Shell — Root Component `[M]`
  - **Acceptance:** App.svelte renders Header, Map, and DestinationPanel areas; theme class applied to root; i18n initialized
  - **Dependencies:** A1, A3, A4
  - [ ] A5.1 Create `src/App.svelte` with layout structure (header, map area, bottom panel) `[M]`
  - [ ] A5.2 Wire up theme store to root element class `[S]`
  - [ ] A5.3 Initialize i18n store on app mount `[S]`

- [ ] **Task A6:** Leaflet Map Component `[M]`
  - **Acceptance:** Map renders with OSM tiles, centers on default location (Gothenburg), responsive sizing, dark-compatible tile layer
  - **Dependencies:** A1, A5
  - [ ] A6.1 Create `src/lib/components/Map.svelte` with Leaflet initialization, tile layer, responsive resize `[M]`
  - [ ] A6.2 Create `src/lib/utils/mapHelpers.js` with tile URL config, default center, zoom helpers `[S]`

- [ ] **Task A7:** Header Component `[M]`
  - **Acceptance:** Header displays app name, placeholder location display, placeholder radius display, theme toggle button, language selector dropdown
  - **Dependencies:** A3, A4, A5
  - [ ] A7.1 Create `src/lib/components/Header.svelte` with responsive layout, theme toggle, language selector `[M]`
  - [ ] A7.2 Connect theme toggle to settingsStore `[S]`
  - [ ] A7.3 Connect language selector to i18nStore `[S]`

- [ ] **Task A8:** Destination Panel Skeleton `[S]`
  - **Acceptance:** Collapsible bottom panel renders, expand/collapse toggle works, empty state message shown, responsive (bottom sheet on mobile, side panel on desktop)
  - **Dependencies:** A4, A5
  - [ ] A8.1 Create `src/lib/components/DestinationPanel.svelte` with collapsible container, sort/filter placeholders, empty state `[S]`

- [ ] **Task A9:** PWA Setup `[M]`
  - **Acceptance:** `vite-plugin-pwa` generates service worker + manifest, app installable on mobile, Lighthouse PWA score ≥ 80
  - **Dependencies:** A1
  - [ ] A9.1 Install `vite-plugin-pwa` and configure in `vite.config.js` `[S]`
  - [ ] A9.2 Create PWA manifest with app name, icons, theme colors `[S]`
  - [ ] A9.3 Create/source favicon.svg and PWA icons (192px, 512px) `[S]`

- [ ] **Task A10:** GitHub Pages Deployment Configuration `[S]`
  - **Acceptance:** `npm run build` produces deployable output, base path configured for GitHub Pages, deployment instructions documented
  - **Dependencies:** A1, A9
  - [ ] A10.1 Configure Vite `base` for GitHub Pages repo path `[S]`
  - [ ] A10.2 Create GitHub Actions workflow or document manual deployment steps `[S]`

---

## Phase B: Location & Routing Core

- [ ] **Task B1:** Cache Service `[M]`
  - **Acceptance:** Generic localStorage cache with TTL, get/set/invalidate operations, handles storage quota errors
  - **Dependencies:** A1
  - [ ] B1.1 Create `src/lib/services/cacheService.js` with TTL-based localStorage wrapper `[M]`
  - [ ] B1.2 Implement cache key namespacing, size management, quota error handling `[S]`

- [ ] **Task B2:** Location Store & Service `[M]`
  - **Acceptance:** Location CRUD in localStorage, default Gothenburg fallback, active location reactive state
  - **Dependencies:** A2, A3
  - [ ] B2.1 Create `src/lib/services/locationService.js` with save/load/delete location operations `[M]`
  - [ ] B2.2 Create `src/lib/stores/locationStore.js` with reactive base location, saved locations list `[S]`

- [ ] **Task B3:** GPS Geolocation Integration `[M]`
  - **Acceptance:** Browser geolocation API detects user position, handles denied permissions gracefully, falls back to default
  - **Dependencies:** B2
  - [ ] B3.1 Add GPS detection to `locationService.js` with permission handling `[M]`
  - [ ] B3.2 Add "Use my location" button trigger in Header or LocationPicker `[S]`

- [ ] **Task B4:** Location Picker Component `[M]`
  - **Acceptance:** User can search for a place by name, select from saved locations, add new saved location
  - **Dependencies:** B2, B3, A7
  - [ ] B4.1 Create `src/lib/components/LocationPicker.svelte` with search input, saved locations list, GPS button `[M]`
  - [ ] B4.2 Integrate Nominatim geocoding for place name search (free, no key) `[S]`

- [ ] **Task B5:** OpenRouteService — Isochrone Integration `[L]`
  - **Acceptance:** Isochrone polygon fetched for given location + radius, results cached 1 hour, API key from settings
  - **Dependencies:** B1, B2
  - [ ] B5.1 Create `src/lib/services/routingService.js` with isochrone endpoint integration `[M]`
  - [ ] B5.2 Implement isochrone caching (location + radius key, 1h TTL) `[S]`
  - [ ] B5.3 Handle API errors, rate limits, and missing API key gracefully `[S]`

- [ ] **Task B6:** OpenRouteService — Directions (Drive Time) `[M]`
  - **Acceptance:** Drive time calculated from base to destination, batch-friendly, results cached
  - **Dependencies:** B5
  - [ ] B6.1 Add directions endpoint to `routingService.js` for point-to-point drive time `[M]`
  - [ ] B6.2 Implement request queuing to respect 40 req/min limit `[S]`

- [ ] **Task B7:** Driving Radius Slider Component `[M]`
  - **Acceptance:** Slider with time increments (30 min – 4 hr), updates settingsStore, displays selected value
  - **Dependencies:** A3, A7
  - [ ] B7.1 Create `src/lib/components/RadiusSlider.svelte` with discrete time stops `[M]`

- [ ] **Task B8:** Isochrone Map Overlay `[M]`
  - **Acceptance:** Driving radius polygon displayed on map, updates when location/radius changes, styled with semi-transparent fill
  - **Dependencies:** A6, B5, B7
  - [ ] B8.1 Add isochrone GeoJSON layer to Map.svelte `[M]`
  - [ ] B8.2 React to location/radius changes to update overlay `[S]`

- [ ] **Task B9:** Settings Modal — API Key Configuration `[M]`
  - **Acceptance:** Modal with ORS API key input, key persisted in localStorage, validation feedback
  - **Dependencies:** A3, A4
  - [ ] B9.1 Create `src/lib/components/SettingsModal.svelte` with API key section `[M]`
  - [ ] B9.2 Wire settings to settingsStore, persist in localStorage `[S]`

- [ ] **Task B10:** Straight-Line Distance Fallback `[S]`
  - **Acceptance:** When ORS API unavailable, estimate drive time as straight-line distance × 1.3 factor, show indicator that estimate is approximate
  - **Dependencies:** B5, B6
  - [ ] B10.1 Add haversine distance calculation to `routingService.js` `[S]`
  - [ ] B10.2 Add `isEstimate` flag to drive time results `[S]`

---

## Phase C: Weather Engine

- [ ] **Task C1:** Weather Data Normalization Layer `[M]`
  - **Acceptance:** Common `WeatherData` structure regardless of source (SMHI/YR), parsing functions for both API response formats
  - **Dependencies:** A2
  - [ ] C1.1 Create `src/lib/utils/weatherHelpers.js` with SMHI response parser `[M]`
  - [ ] C1.2 Add YR response parser to `weatherHelpers.js` `[M]`
  - [ ] C1.3 Add condition code-to-text mapping for both APIs `[S]`

- [ ] **Task C2:** SMHI API Integration `[M]`
  - **Acceptance:** Fetch weather for any lat/lon in Sweden, parse into WeatherData, handle errors, respect fair use
  - **Dependencies:** C1, B1
  - [ ] C2.1 Create `src/lib/services/weatherService.js` with SMHI fetch function `[M]`
  - [ ] C2.2 Parse SMHI forecast for today + tomorrow time periods `[S]`
  - [ ] C2.3 Extract confidence percentage from SMHI response `[S]`

- [ ] **Task C3:** YR (MET Norway) API Integration `[M]`
  - **Acceptance:** Fetch weather for any lat/lon (Norway/Denmark focus), parse into WeatherData, correct User-Agent header set
  - **Dependencies:** C1, B1
  - [ ] C3.1 Add YR fetch function to `weatherService.js` with required User-Agent header `[M]`
  - [ ] C3.2 Parse YR compact forecast for today + tomorrow `[S]`

- [ ] **Task C4:** Region-Based API Router `[M]`
  - **Acceptance:** Given a lat/lon, automatically select SMHI (Sweden) or YR (Norway/Denmark), handle border regions per PRD OQ-2
  - **Dependencies:** C2, C3
  - [ ] C4.1 Add region detection to `weatherService.js` (geographic boundary logic) `[M]`
  - [ ] C4.2 Add unified `fetchWeather(lat, lon)` that routes to correct API `[S]`

- [ ] **Task C5:** Weather Delta Calculation `[M]`
  - **Acceptance:** Compute delta between base and destination WeatherData for all parameters, negative precip/cloud/wind = improvement
  - **Dependencies:** C1
  - [ ] C5.1 Add `calculateDelta(base, destination)` to `weatherHelpers.js` `[M]`

- [ ] **Task C6:** Weather Quality Scoring Engine `[M]`
  - **Acceptance:** Composite score (0-100) per destination using weighted formula from PRD §9.7, configurable weights
  - **Dependencies:** C5, A2
  - [ ] C6.1 Create `src/lib/services/scoringService.js` with normalize + weighted score calculation `[M]`
  - [ ] C6.2 Map score to color bucket (green/yellow/orange/red) per PRD §6.2 `[S]`

- [ ] **Task C7:** Weather Data Caching `[S]`
  - **Acceptance:** Weather responses cached 30 min in localStorage via cacheService, cache key = lat/lon rounded to 2 decimals
  - **Dependencies:** B1, C2, C3
  - [ ] C7.1 Integrate cacheService into weatherService fetch functions `[S]`

- [ ] **Task C8:** Weather Store (Reactive State) `[M]`
  - **Acceptance:** Svelte store holds base weather, destination weather array, loading state, error state; reactively updates on location/radius change
  - **Dependencies:** C4, C6, A3
  - [ ] C8.1 Create `src/lib/stores/weatherStore.js` with reactive weather state management `[M]`
  - [ ] C8.2 Add computed derived state: sorted destinations, filtered results `[S]`

- [ ] **Task C9:** Base Location Weather Fetch & Display `[M]`
  - **Acceptance:** On location set/change, fetch weather for base location, display in header or panel header area
  - **Dependencies:** C8, B2, A7
  - [ ] C9.1 Trigger weather fetch on base location change `[M]`
  - [ ] C9.2 Display base weather summary in Header component `[S]`

---

## Phase D: Destination Discovery & Display

- [ ] **Task D1:** Overpass API Integration — Town Discovery `[L]`
  - **Acceptance:** Query Overpass for towns/cities within bounding box derived from isochrone, parse results into Destination objects, limit to 20-30 results
  - **Dependencies:** B5, A2
  - [ ] D1.1 Create `src/lib/services/destinationService.js` with Overpass QL query builder `[M]`
  - [ ] D1.2 Implement bounding box calculation from isochrone polygon `[S]`
  - [ ] D1.3 Parse Overpass response into Destination array, sort by population `[S]`
  - [ ] D1.4 Add curated fallback list of top 50 Nordic towns (bundled JSON) `[S]`

- [ ] **Task D2:** Destination Categorization `[M]`
  - **Acceptance:** Destinations categorized as town/beach/hiking/attraction based on OSM tags, fallback to "town" if no tags
  - **Dependencies:** D1
  - [ ] D2.1 Add OSM tag → category mapping to `destinationService.js` `[M]`
  - [ ] D2.2 Extend Overpass query to include beaches, nature reserves, tourist attractions `[S]`

- [ ] **Task D3:** Batch Weather Fetch for Destinations `[M]`
  - **Acceptance:** Fetch weather for all destinations in discovered list, progressive loading (show results as they arrive), rate-limit-aware
  - **Dependencies:** D1, C4, C6
  - [ ] D3.1 Add batch fetch orchestration to weatherStore `[M]`
  - [ ] D3.2 Calculate deltas and scores as each destination weather arrives `[S]`

- [ ] **Task D4:** Color-Coded Map Markers `[M]`
  - **Acceptance:** Destination markers on map colored by quality score (green/yellow/orange/red per PRD §6.2), base location has distinct marker
  - **Dependencies:** D3, A6
  - [ ] D4.1 Create marker factory in `mapHelpers.js` with color-coded circle markers `[M]`
  - [ ] D4.2 Add destination marker layer to Map.svelte, update on data change `[S]`
  - [ ] D4.3 Add distinct base location marker `[S]`

- [ ] **Task D5:** Map Popup with Weather Details `[M]`
  - **Acceptance:** Clicking destination marker shows popup with name, weather summary, deltas, drive time, quality score
  - **Dependencies:** D4
  - [ ] D5.1 Create popup content template in `mapHelpers.js` `[M]`
  - [ ] D5.2 Bind popup to each destination marker `[S]`

- [ ] **Task D6:** WeatherCard Component `[M]`
  - **Acceptance:** Card displays all fields per PRD §6.3 design: name, type, score, drive time, temperature, precipitation, cloud, wind, confidence, delta values
  - **Dependencies:** A4, C6
  - [ ] D6.1 Create `src/lib/components/WeatherCard.svelte` matching PRD §6.3 layout `[M]`
  - [ ] D6.2 Add color indicator based on quality score `[S]`
  - [ ] D6.3 Add i18n for all card labels `[S]`

- [ ] **Task D7:** Destination Panel — Sorting `[M]`
  - **Acceptance:** Sort by weather quality score (default), drive time, temperature improvement; sort state persisted
  - **Dependencies:** D6, A8
  - [ ] D7.1 Add sort controls to `DestinationPanel.svelte` `[S]`
  - [ ] D7.2 Implement sort functions in weatherStore or panel logic `[M]`

- [ ] **Task D8:** Destination Panel — Filtering `[S]`
  - **Acceptance:** Filter destinations by type (town, beach, hiking, attraction, all), filter state persisted
  - **Dependencies:** D2, D7
  - [ ] D8.1 Add filter controls to `DestinationPanel.svelte` `[S]`
  - [ ] D8.2 Implement filter logic `[S]`

- [ ] **Task D9:** Card-to-Map Interaction `[S]`
  - **Acceptance:** Tapping a weather card centers map on that destination and opens its popup
  - **Dependencies:** D5, D7
  - [ ] D9.1 Add click handler on WeatherCard that dispatches map-center event `[S]`
  - [ ] D9.2 Map component listens for center event and opens popup `[S]`

- [ ] **Task D10:** Destination Caching `[S]`
  - **Acceptance:** Discovered destinations cached per region for 24 hours via cacheService
  - **Dependencies:** D1, B1
  - [ ] D10.1 Integrate cacheService into destinationService with 24h TTL `[S]`

---

## Phase E: Polish & Localization

- [ ] **Task E1:** Swedish (sv) Locale `[S]`
  - **Acceptance:** `public/locales/sv.json` covers all UI strings, switching to SV renders all text in Swedish
  - **Dependencies:** A4
  - [ ] E1.1 Create `public/locales/sv.json` with all translated strings `[S]`

- [ ] **Task E2:** Norwegian (no) Locale `[S]`
  - **Acceptance:** `public/locales/no.json` covers all UI strings, switching to NO renders all text in Norwegian
  - **Dependencies:** A4
  - [ ] E2.1 Create `public/locales/no.json` with all translated strings `[S]`

- [ ] **Task E3:** Danish (da) Locale `[S]`
  - **Acceptance:** `public/locales/da.json` covers all UI strings, switching to DA renders all text in Danish
  - **Dependencies:** A4
  - [ ] E3.1 Create `public/locales/da.json` with all translated strings `[S]`

- [ ] **Task E4:** Locale-Aware Formatting `[M]`
  - **Acceptance:** Numbers, dates, and temperatures formatted per active locale using `Intl` APIs
  - **Dependencies:** A4, E1
  - [ ] E4.1 Add `Intl.NumberFormat` / `Intl.DateTimeFormat` helpers to i18nStore or weatherHelpers `[M]`
  - [ ] E4.2 Apply locale-aware formatting to all weather values and dates in components `[S]`

- [ ] **Task E5:** Settings Modal — Saved Locations Management `[M]`
  - **Acceptance:** User can add, rename, delete, set default saved locations from settings modal
  - **Dependencies:** B9, B2
  - [ ] E5.1 Add saved locations CRUD UI to SettingsModal.svelte `[M]`

- [ ] **Task E6:** Settings Modal — Weather Weight Adjustment UI `[M]`
  - **Acceptance:** Sliders for sunshine/precipitation/temperature/wind/UV weights, weights sum validated to 1.0, persisted in localStorage
  - **Dependencies:** B9, C6
  - [ ] E6.1 Add weight adjustment sliders to SettingsModal.svelte `[M]`
  - [ ] E6.2 Validate weights sum to 1.0, normalize if needed `[S]`

- [ ] **Task E7:** Offline Mode `[M]`
  - **Acceptance:** Service worker caches last weather results and destinations, app shows cached data when offline with "offline" indicator
  - **Dependencies:** A9, C7, D10
  - [ ] E7.1 Configure service worker runtime caching for API responses `[M]`
  - [ ] E7.2 Add offline detection and UI indicator `[S]`

- [ ] **Task E8:** Performance Optimization `[M]`
  - **Acceptance:** Bundle size < 100 KB gzipped (excluding map tiles), First Contentful Paint < 1.5s, lazy loading for non-critical components
  - **Dependencies:** All Phase D
  - [ ] E8.1 Add lazy loading for SettingsModal, LocationPicker `[S]`
  - [ ] E8.2 Optimize request batching for weather fetches `[S]`
  - [ ] E8.3 Audit bundle size with `vite-bundle-visualizer` `[S]`

- [ ] **Task E9:** Accessibility Audit & Fixes `[M]`
  - **Acceptance:** Lighthouse Accessibility score ≥ 90, keyboard navigation for all interactive elements, ARIA labels, color contrast ≥ 4.5:1
  - **Dependencies:** All Phase D
  - [ ] E9.1 Add ARIA labels to all interactive components `[M]`
  - [ ] E9.2 Ensure keyboard navigation (tab order, focus management) `[S]`
  - [ ] E9.3 Verify color contrast meets WCAG 2.1 AA `[S]`
  - [ ] E9.4 Add `prefers-reduced-motion` respect for animations `[S]`

- [ ] **Task E10:** Attribution Footer `[S]`
  - **Acceptance:** Footer shows all required attributions: SMHI, MET Norway/YR, OpenStreetMap, OpenRouteService per PRD Appendix A
  - **Dependencies:** A5
  - [ ] E10.1 Add attribution footer component or section to App.svelte `[S]`

- [ ] **Task E11:** README Documentation `[M]`
  - **Acceptance:** README covers: overview, features, tech stack, setup instructions, API key setup, deployment, screenshots placeholder, license
  - **Dependencies:** A10
  - [ ] E11.1 Write comprehensive README.md `[M]`

- [ ] **Task E12:** Responsive Layout Polish `[M]`
  - **Acceptance:** App works on mobile (375px), tablet (640-1024px), desktop (>1024px) per PRD §6.4 breakpoints
  - **Dependencies:** All Phase D
  - [ ] E12.1 Test and fix mobile bottom sheet panel layout `[S]`
  - [ ] E12.2 Test and fix tablet side panel layout `[S]`
  - [ ] E12.3 Test and fix desktop wide layout `[S]`

---

## Relevant Files

| File | Purpose | Status | Phase |
|------|---------|--------|-------|
| `package.json` | Project dependencies and scripts | Create | A |
| `vite.config.js` | Vite + Svelte + PWA configuration | Create | A |
| `index.html` | Vite HTML entry point | Create | A |
| `.gitignore` | Git ignore rules | Create | A |
| `src/app.html` | Svelte HTML template | Create | A |
| `src/main.js` | App entry point | Create | A |
| `src/App.svelte` | Root component | Create | A |
| `src/styles/app.css` | Global styles + Tailwind | Create | A |
| `src/lib/types/index.js` | JSDoc type definitions | Create | A |
| `src/lib/utils/constants.js` | App constants, defaults, thresholds | Create | A |
| `src/lib/utils/mapHelpers.js` | Map utility functions | Create | A |
| `src/lib/utils/weatherHelpers.js` | Weather parsing, formatting | Create | C |
| `src/lib/stores/settingsStore.js` | Theme, locale, preferences state | Create | A |
| `src/lib/stores/i18nStore.js` | Internationalization state | Create | A |
| `src/lib/stores/locationStore.js` | Base location state | Create | B |
| `src/lib/stores/weatherStore.js` | Weather data state | Create | C |
| `src/lib/services/cacheService.js` | localStorage caching layer | Create | B |
| `src/lib/services/locationService.js` | GPS + saved locations | Create | B |
| `src/lib/services/routingService.js` | OpenRouteService integration | Create | B |
| `src/lib/services/weatherService.js` | SMHI + YR integration | Create | C |
| `src/lib/services/scoringService.js` | Weather quality scoring | Create | C |
| `src/lib/services/destinationService.js` | OSM destination discovery | Create | D |
| `src/lib/components/Map.svelte` | Leaflet map wrapper | Create | A |
| `src/lib/components/Header.svelte` | App header with controls | Create | A |
| `src/lib/components/DestinationPanel.svelte` | Bottom panel with destination list | Create | A |
| `src/lib/components/WeatherCard.svelte` | Individual destination card | Create | D |
| `src/lib/components/SettingsModal.svelte` | Settings/preferences | Create | B |
| `src/lib/components/LocationPicker.svelte` | Location selection/search | Create | B |
| `src/lib/components/RadiusSlider.svelte` | Driving radius control | Create | B |
| `public/locales/en.json` | English locale strings | Create | A |
| `public/locales/sv.json` | Swedish locale strings | Create | E |
| `public/locales/no.json` | Norwegian locale strings | Create | E |
| `public/locales/da.json` | Danish locale strings | Create | E |
| `public/favicon.svg` | App favicon | Create | A |
| `README.md` | Project documentation | Create | E |

---

## Progress Summary

| Phase | Tasks | Sub-Tasks | Completed | Status |
|-------|-------|-----------|-----------|--------|
| Phase A: Foundation & Scaffolding | 10 | 22 | 0 | ⬜ Not Started |
| Phase B: Location & Routing Core | 10 | 16 | 0 | ⬜ Not Started |
| Phase C: Weather Engine | 9 | 15 | 0 | ⬜ Not Started |
| Phase D: Destination Discovery & Display | 10 | 19 | 0 | ⬜ Not Started |
| Phase E: Polish & Localization | 12 | 19 | 0 | ⬜ Not Started |
| **Total** | **51** | **91** | **0** | **0%** |

---

## Estimated Effort by Phase

| Phase | S | M | L | XL | Est. Total |
|-------|---|---|---|----|----|
| A: Foundation | 3 | 5 | 1 | 0 | ~20 hrs |
| B: Location & Routing | 2 | 6 | 1 | 0 | ~24 hrs |
| C: Weather Engine | 1 | 7 | 0 | 0 | ~22 hrs |
| D: Destination Discovery | 3 | 5 | 1 | 0 | ~22 hrs |
| E: Polish & Localization | 5 | 5 | 0 | 0 | ~18 hrs |
| **Total** | **14** | **28** | **3** | **0** | **~106 hrs** |
