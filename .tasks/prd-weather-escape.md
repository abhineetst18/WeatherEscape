# PRD: WeatherEscape — Nordic Weather Destination Finder

**Version:** 1.0
**Date:** 2026-05-14
**Author:** Planner Agent (from user interview)
**Status:** Draft
**Project Location:** `/WeatherEscape/`

---

## 1. Introduction / Overview

**WeatherEscape** is a Progressive Web App (PWA) that helps users escape bad weather by finding nearby towns and destinations with better weather conditions within their driving radius. It targets Nordic users in Sweden, Norway, and Denmark, leveraging free weather APIs (SMHI, YR) and open mapping data to provide actionable travel suggestions.

The app answers the question: *"Where can I drive to right now for better weather?"*

**Reference Project:** ParkingFinder (same workspace) — a PWA with Leaflet maps, dark/light theme, service worker, and mobile-first design. WeatherEscape follows the same UX philosophy but with a Svelte 5 + Vite + TailwindCSS 4 stack for modern tooling and marketability.

---

## 2. Goals

| # | Goal | Measurable Outcome |
|---|------|--------------------|
| G1 | Help users find better weather destinations within driving distance | User can see ranked destinations with weather improvement deltas within 10 seconds |
| G2 | Provide accurate, multi-source weather comparisons | Display SMHI + YR data with confidence percentages |
| G3 | Support dynamic driving radius based on user preference | User can adjust 30 min – 4 hour driving radius; results update accordingly |
| G4 | Deliver installable PWA with offline capability | Lighthouse PWA score ≥ 90; app installable on mobile |
| G5 | Support Nordic languages from day one | EN, SE, NO, DK — all UI strings externalized |
| G6 | Deploy as static site to GitHub Pages | Zero server costs; `npm run build` produces deployable output |

---

## 3. User Stories

### Primary User: Nordic Resident ("Weather Escapee")

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a user, I want to set my current location (GPS or saved) so the app calculates weather from where I am | **Must Have** |
| US-02 | As a user, I want to see a map with destinations color-coded by weather quality so I can visually scan options | **Must Have** |
| US-03 | As a user, I want to see weather improvement deltas (not just absolute values) so I know how much better a destination is | **Must Have** |
| US-04 | As a user, I want to adjust my driving radius so I can expand search on holidays or limit it on workdays | **Must Have** |
| US-05 | As a user, I want to filter destinations by type (beach, hiking, town, tourist attraction) so I can match my activity | **Should Have** |
| US-06 | As a user, I want to save multiple base locations (home, work, cabin) so I can quickly switch context | **Should Have** |
| US-07 | As a user, I want to see forecast confidence percentages so I can judge how reliable the prediction is | **Should Have** |
| US-08 | As a user, I want the app to work offline with cached results so I can reference it while driving | **Should Have** |
| US-09 | As a user, I want to switch between EN/SE/NO/DK language so I can use the app in my preferred language | **Should Have** |
| US-10 | As a user, I want to install the app on my phone's home screen for quick access | **Must Have** |
| US-11 | As a user, I want to see both today's and tomorrow's weather comparison so I can plan ahead | **Must Have** |
| US-12 | As a user, I want to see driving time (not straight-line distance) to each destination so I can plan realistically | **Must Have** |
| US-13 | As a user, I want dark/light theme toggle for comfortable use in any lighting | **Could Have** |
| US-14 | As a user, I want to sort destinations by weather quality, drive time, or destination type | **Should Have** |

---

## 4. Functional Requirements

### FR-1: Base Location Management

| # | Requirement | Priority |
|---|-------------|----------|
| FR-1.1 | System MUST support GPS geolocation to detect user's current position | **M** |
| FR-1.2 | System MUST allow users to save multiple named locations (home, work, cabin, custom) | **M** |
| FR-1.3 | System MUST persist saved locations in localStorage | **M** |
| FR-1.4 | System MUST default to Gothenburg, Sweden (57.7089, 11.9746) when no location is set and GPS is unavailable | **M** |
| FR-1.5 | System SHOULD provide a search/geocoding input to set location by place name | **S** |

### FR-2: Driving Radius & Route Calculation

| # | Requirement | Priority |
|---|-------------|----------|
| FR-2.1 | System MUST allow user to set driving radius in time increments (30 min, 1 hr, 1.5 hr, 2 hr, 2.5 hr, 3 hr, 4 hr) | **M** |
| FR-2.2 | System MUST default to 1 hour driving time | **M** |
| FR-2.3 | System MUST use OpenRouteService API isochrone endpoint to calculate actual driving-time polygons | **M** |
| FR-2.4 | System MUST display the driving radius polygon on the map | **S** |
| FR-2.5 | System MUST calculate driving time from base to each destination via OpenRouteService directions API | **M** |
| FR-2.6 | System MUST cache isochrone results for the same location + radius for 1 hour to minimize API calls | **M** |

### FR-3: Destination Discovery

| # | Requirement | Priority |
|---|-------------|----------|
| FR-3.1 | System MUST discover towns/cities within the driving radius using OpenStreetMap Overpass API or GeoNames | **M** |
| FR-3.2 | System MUST categorize destinations: Town/City, Beach/Coastal, Hiking/Nature, Tourist Attraction | **S** |
| FR-3.3 | System MUST limit initial results to top 20-30 destinations (sorted by population or relevance) to manage API calls | **M** |
| FR-3.4 | System SHOULD allow users to save custom destination locations | **C** |
| FR-3.5 | System MUST cache discovered destinations per region for 24 hours | **M** |

### FR-4: Weather Comparison Engine

| # | Requirement | Priority |
|---|-------------|----------|
| FR-4.1 | System MUST fetch weather for base location from SMHI (Sweden) or YR (Norway/Denmark) | **M** |
| FR-4.2 | System MUST fetch weather for each destination from the appropriate regional API (SMHI for Swedish locations, YR for Norwegian/Danish) | **M** |
| FR-4.3 | System MUST compute weather deltas (destination minus base) for: temperature, precipitation, cloud cover, wind speed | **M** |
| FR-4.4 | System MUST display BOTH delta values and absolute values for each weather parameter | **M** |
| FR-4.5 | System MUST treat temperature improvement as RELATIVE — a +5° delta is equally valuable whether the base is 4°C or 14°C | **M** |
| FR-4.6 | System MUST define "bad weather" thresholds: precipitation > 4mm, single-digit temperatures (configurable) | **M** |
| FR-4.7 | System SHOULD distinguish between burst precipitation (heavy, short) vs spread precipitation (light, all day) when data is available | **S** |
| FR-4.8 | System MUST provide a composite "weather quality score" per destination combining: sunshine/cloud cover (primary), precipitation (primary), temperature delta (secondary), wind speed (secondary), UV index (secondary) | **M** |
| FR-4.9 | System MUST show forecast for today and tomorrow | **M** |
| FR-4.10 | System SHOULD display SMHI's forecast confidence percentage when available | **S** |
| FR-4.11 | System MUST allow users to adjust weather criteria weights (e.g., prioritize sunshine over temperature) | **S** |

### FR-5: Map Display

| # | Requirement | Priority |
|---|-------------|----------|
| FR-5.1 | System MUST display an interactive Leaflet map centered on user's base location | **M** |
| FR-5.2 | System MUST show destination markers color-coded by weather quality: green (great improvement), yellow (moderate), red (worse or equal) | **M** |
| FR-5.3 | System MUST show the base location with a distinct marker | **M** |
| FR-5.4 | System MUST show driving radius polygon/isochrone overlay on the map | **S** |
| FR-5.5 | Clicking a destination marker MUST show a popup with: destination name, weather summary, delta values, drive time, weather quality score | **M** |
| FR-5.6 | System MUST use OpenStreetMap tiles (free, no API key) | **M** |
| FR-5.7 | System SHOULD support satellite/terrain map style toggle (following ParkingFinder pattern) | **C** |

### FR-6: Destination List Panel

| # | Requirement | Priority |
|---|-------------|----------|
| FR-6.1 | System MUST show a collapsible bottom panel listing all destinations with weather cards | **M** |
| FR-6.2 | Each weather card MUST show: destination name, weather quality indicator (color), temperature (absolute + delta), precipitation, cloud cover, wind, drive time, confidence % | **M** |
| FR-6.3 | System MUST support sorting by: weather quality score (default), drive time, temperature improvement | **M** |
| FR-6.4 | System SHOULD support filtering by destination type (town, beach, hiking, attraction) | **S** |
| FR-6.5 | Tapping a card MUST center the map on that destination and open its popup | **M** |

### FR-7: Settings & Preferences

| # | Requirement | Priority |
|---|-------------|----------|
| FR-7.1 | System MUST provide dark/light theme toggle, persisted in localStorage | **M** |
| FR-7.2 | System MUST provide language selector (EN, SE, NO, DK), persisted in localStorage | **M** |
| FR-7.3 | System SHOULD allow users to configure weather scoring weights | **S** |
| FR-7.4 | System MUST store OpenRouteService API key in a user-configurable setting (not hardcoded) | **M** |
| FR-7.5 | System MUST provide a settings panel/modal for managing saved locations, API key, preferences | **M** |

### FR-8: Internationalization (i18n)

| # | Requirement | Priority |
|---|-------------|----------|
| FR-8.1 | ALL user-facing strings MUST be externalized into locale JSON files | **M** |
| FR-8.2 | System MUST support: English (en), Swedish (sv), Norwegian (no), Danish (da) | **M** |
| FR-8.3 | Locale MUST be switchable at runtime without page reload | **M** |
| FR-8.4 | System MUST use locale-aware number/date formatting | **S** |
| FR-8.5 | Default locale: English (en) | **M** |

---

## 5. Non-Goals (Out of Scope)

| # | Exclusion | Rationale |
|---|-----------|-----------|
| NG-1 | No backend server — all API calls from client | Keeps deployment simple (GitHub Pages) |
| NG-2 | No user accounts or authentication | No personalization beyond localStorage |
| NG-3 | No paid weather APIs | All APIs must be free tier |
| NG-4 | No real-time traffic data for drive times | OpenRouteService provides typical drive times, not live |
| NG-5 | No multi-day forecasts beyond today + tomorrow | API limitations; 2-day window is sufficient for quick decisions |
| NG-6 | No hotel/accommodation booking integration | Future consideration |
| NG-7 | No social features (sharing, reviews) | Keep scope focused |
| NG-8 | No push notifications | Future consideration |
| NG-9 | No Finnish language support (v1) | Can be added later |
| NG-10 | No weather history or trend analysis | Focus on current/near-future only |

---

## 6. Design Considerations (UI/UX)

### 6.1 Layout Architecture

```
┌─────────────────────────────────────┐
│ Header: Logo | Location | Radius |  │
│         Theme | Lang | Settings     │
├─────────────────────────────────────┤
│                                     │
│            Leaflet Map              │
│       (color-coded markers)         │
│       (isochrone overlay)           │
│                                     │
├─────────────────────────────────────┤
│ ▼ Destinations Panel (collapsible)  │
│ [Sort: Quality ▼] [Filter: All ▼]  │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 Varberg  +5° ☀ 0mm  52min  │ │
│ │ 🟡 Borås    +2° ⛅ 1mm  38min  │ │
│ │ 🔴 Uddevalla -1° 🌧 6mm  1h12  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6.2 Color System for Weather Quality

| Score Range | Color | Label | Meaning |
|-------------|-------|-------|---------|
| 80-100 | `#00b894` (green) | Great | Significant weather improvement |
| 50-79 | `#fdcb6e` (yellow) | Moderate | Some improvement |
| 20-49 | `#e17055` (orange) | Marginal | Slight or no improvement |
| 0-19 | `#d63031` (red) | Worse | Destination weather is worse |

### 6.3 Weather Card Design

Each destination card displays:
```
┌────────────────────────────────────┐
│ 🟢 Varberg           ★ 87/100     │
│ Beach / Coastal       52 min drive │
│──────────────────────────────────  │
│ 🌡 19°C (+5°)  ☀ Clear (Δ-40%)   │
│ 🌧 0mm (-4mm)  💨 3m/s (-2)      │
│ 📊 Confidence: 85%                │
└────────────────────────────────────┘
```

- **Delta values** shown in parentheses with +/- sign
- **Absolute values** shown prominently
- **Quality score** (0-100) with color indicator
- **Drive time** from base location

### 6.4 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Full-width map, bottom sheet panel, stacked cards |
| Tablet (640-1024px) | Map 60%, side panel 40% |
| Desktop (> 1024px) | Map 65%, side panel 35%, wider cards with more detail |

### 6.5 Theme

- **Dark mode** as default (matching ParkingFinder aesthetic)
- **Light mode** available via toggle
- CSS custom properties for all theme colors
- TailwindCSS 4 dark mode via class strategy

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Framework** | Svelte 5 (runes) | Modern, compiled, tiny bundles, trending in developer satisfaction |
| **Build Tool** | Vite 6+ | Fast dev server, optimized production builds |
| **Styling** | TailwindCSS 4 | Utility-first, responsive, professional UI with no CSS overhead |
| **Maps** | Leaflet 1.9+ | Proven OSS map library (same as ParkingFinder) |
| **PWA** | vite-plugin-pwa | Service worker generation, manifest, offline support |
| **i18n** | Custom Svelte store + JSON locale files | Lightweight, no heavy i18n library needed |
| **Deployment** | GitHub Pages (static) | Free, reliable, simple CI/CD |
| **Package Manager** | npm | Standard, universal |

### 7.2 Project Structure

```
WeatherEscape/
├── .tasks/
│   ├── prd-weather-escape.md          # This PRD
│   └── tasks-prd-weather-escape.md    # Generated task list
├── .github/
│   └── Prompts/                       # Executor prompts (generated by Planner)
│       ├── plans/
│       └── README.md
├── public/
│   ├── favicon.svg
│   └── locales/
│       ├── en.json
│       ├── sv.json
│       ├── no.json
│       └── da.json
├── src/
│   ├── app.html                       # HTML template
│   ├── App.svelte                     # Root component
│   ├── main.js                        # Entry point
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Map.svelte             # Leaflet map wrapper
│   │   │   ├── Header.svelte          # App header with controls
│   │   │   ├── DestinationPanel.svelte # Bottom panel with destination list
│   │   │   ├── WeatherCard.svelte     # Individual destination card
│   │   │   ├── SettingsModal.svelte   # Settings/preferences
│   │   │   ├── LocationPicker.svelte  # Location selection/search
│   │   │   └── RadiusSlider.svelte    # Driving radius control
│   │   ├── services/
│   │   │   ├── weatherService.js      # SMHI + YR API integration
│   │   │   ├── routingService.js      # OpenRouteService integration
│   │   │   ├── destinationService.js  # OSM/GeoNames destination discovery
│   │   │   ├── locationService.js     # GPS + saved locations management
│   │   │   ├── scoringService.js      # Weather quality scoring engine
│   │   │   └── cacheService.js        # localStorage caching layer
│   │   ├── stores/
│   │   │   ├── locationStore.js       # Base location state
│   │   │   ├── weatherStore.js        # Weather data state
│   │   │   ├── settingsStore.js       # User preferences state
│   │   │   └── i18nStore.js           # Internationalization state
│   │   ├── utils/
│   │   │   ├── constants.js           # App constants, defaults, thresholds
│   │   │   ├── weatherHelpers.js      # Weather data parsing, formatting
│   │   │   └── mapHelpers.js          # Map utility functions
│   │   └── types/
│   │       └── index.js               # JSDoc type definitions
│   └── styles/
│       └── app.css                    # Global styles + Tailwind imports
├── index.html                         # Vite entry HTML
├── vite.config.js                     # Vite + PWA config
├── tailwind.config.js                 # TailwindCSS config
├── package.json
├── README.md
└── .gitignore
```

### 7.3 Data Flow Architecture

```
User Action (set location / adjust radius)
    │
    ▼
┌──────────────┐     ┌───────────────────┐
│ Location     │────▶│ Destination       │
│ Store        │     │ Service           │
└──────────────┘     │ (OSM/GeoNames)    │
    │                └────────┬──────────┘
    │                         │
    ▼                         ▼
┌──────────────┐     ┌───────────────────┐
│ Routing      │     │ Weather           │
│ Service      │     │ Service           │
│ (ORS)        │     │ (SMHI/YR)         │
└──────┬───────┘     └────────┬──────────┘
       │                      │
       ▼                      ▼
┌─────────────────────────────────────────┐
│        Scoring Service                  │
│  (combines weather deltas + drive time) │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        Weather Store (reactive)         │
│  (sorted, filtered destination list)    │
└──────────────────┬──────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
    ┌──────────┐    ┌──────────────────┐
    │ Map      │    │ Destination      │
    │ Component│    │ Panel Component  │
    └──────────┘    └──────────────────┘
```

### 7.4 Caching Strategy

| Data | Cache Duration | Storage | Invalidation |
|------|---------------|---------|--------------|
| Weather data | 30 minutes | localStorage | Time-based |
| Isochrone polygons | 1 hour | localStorage | Location/radius change |
| Destination lists | 24 hours | localStorage | Region change |
| User preferences | Indefinite | localStorage | Manual change |
| Locale strings | Service worker | Cache API | App version update |
| Map tiles | Service worker | Cache API | Stale-while-revalidate |

### 7.5 API Rate Limit Management

| API | Free Tier Limit | Strategy |
|-----|-----------------|----------|
| SMHI | Unlimited (fair use) | Cache 30 min, batch requests |
| YR | 20 req/s | Queue requests, cache 30 min |
| OpenRouteService | 500 req/day (free) | Cache aggressively, batch isochrones, limit to top 20 destinations |
| Overpass/OSM | Fair use | Cache 24h, query once per region |

**Critical:** OpenRouteService has the tightest limit (500/day). The app MUST:
- Use isochrone endpoint (1 call) instead of per-destination routing where possible
- Cache all ORS responses for minimum 1 hour
- Show user a warning if nearing daily limit
- Provide fallback to straight-line distance estimation when API unavailable

---

## 8. API Specifications

### 8.1 SMHI Open Data API (Meteorological Forecasts)

- **Base URL:** `https://opendata-download-metfcst.smhi.se/api`
- **Endpoint:** `/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json`
- **Auth:** None required
- **Coverage:** Sweden + nearby Nordic areas
- **Data Points Used:**
  - `t` — Temperature (°C)
  - `pcat` — Precipitation category (0-6)
  - `pmean` — Mean precipitation (mm/h)
  - `tcc_mean` — Total cloud cover (octas, 0-8)
  - `ws` — Wind speed (m/s)
  - `Wsymb2` — Weather symbol (1-27, maps to conditions)
- **Attribution:** "Source: SMHI Open Data"

### 8.2 YR (MET Norway) API

- **Base URL:** `https://api.met.no/weatherapi/locationforecast/2.0`
- **Endpoint:** `/compact?lat={lat}&lon={lon}`
- **Auth:** None, but MUST set `User-Agent` header (e.g., `WeatherEscape/1.0 github.com/user/repo`)
- **Coverage:** Global (primary for Norway, Denmark)
- **Data Points Used:**
  - `air_temperature` — Temperature (°C)
  - `precipitation_amount` — Precipitation (mm)
  - `cloud_area_fraction` — Cloud cover (%)
  - `wind_speed` — Wind speed (m/s)
  - `ultraviolet_index_clear_sky` — UV index
- **Attribution:** "Data from MET Norway" (required, link to yr.no)

### 8.3 OpenRouteService API

- **Base URL:** `https://api.openrouteservice.org`
- **Isochrone Endpoint:** `/v2/isochrones/driving-car`
  - Body: `{ "locations": [[lon, lat]], "range": [3600], "range_type": "time" }`
  - Returns GeoJSON polygon of reachable area
- **Directions Endpoint:** `/v2/directions/driving-car`
  - Query: `?start={lon},{lat}&end={lon},{lat}`
  - Returns route with `duration` in seconds
- **Auth:** API key in header `Authorization: {api_key}`
- **Free Tier:** 500 requests/day, 40 requests/minute
- **Setup:** User registers at openrouteservice.org for free key

### 8.4 Overpass API (OpenStreetMap)

- **Base URL:** `https://overpass-api.de/api/interpreter`
- **Method:** POST with Overpass QL query
- **Example Query (towns within bounding box):**
  ```
  [out:json][timeout:25];
  (
    node["place"~"city|town"]({{bbox}});
  );
  out body;
  ```
- **Auth:** None
- **Fair use:** Cache results, avoid repeated queries
- **Alternative:** GeoNames API (`api.geonames.org`) with free account (30K credits/day)

### 8.5 Leaflet + OpenStreetMap Tiles

- **Tile URL:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Auth:** None
- **Attribution:** "© OpenStreetMap contributors" (required)
- **Alternative tiles:** CartoDB dark/light (as used in ParkingFinder)

---

## 9. Data Models

### 9.1 Location

```javascript
/**
 * @typedef {Object} Location
 * @property {string} id - Unique identifier (crypto.randomUUID())
 * @property {string} name - Display name (e.g., "Home", "Gothenburg")
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {boolean} isDefault - Whether this is the default location
 * @property {'saved' | 'gps' | 'search'} source - How the location was set
 */
```

### 9.2 Destination

```javascript
/**
 * @typedef {Object} Destination
 * @property {string} id - Unique identifier
 * @property {string} name - Place name
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {'town' | 'beach' | 'hiking' | 'attraction' | 'custom'} type - Destination category
 * @property {number} population - Population (for sorting relevance)
 * @property {number | null} driveTimeMinutes - Driving time from base in minutes
 * @property {number | null} driveDistanceKm - Driving distance in km
 * @property {WeatherData | null} weather - Weather data for this destination
 * @property {WeatherDelta | null} delta - Weather comparison vs base
 * @property {number | null} qualityScore - Composite quality score (0-100)
 */
```

### 9.3 WeatherData

```javascript
/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Temperature in °C
 * @property {number} precipitation - Precipitation in mm (for forecast period)
 * @property {number} cloudCover - Cloud cover percentage (0-100)
 * @property {number} windSpeed - Wind speed in m/s
 * @property {number | null} uvIndex - UV index (if available)
 * @property {string} conditionCode - Weather condition symbol/code
 * @property {string} conditionText - Human-readable condition (localized)
 * @property {number | null} confidence - Forecast confidence percentage (SMHI)
 * @property {'smhi' | 'yr'} source - Which API provided this data
 * @property {string} fetchedAt - ISO timestamp of data fetch
 * @property {'burst' | 'spread' | 'none'} precipitationType - Precipitation pattern
 */
```

### 9.4 WeatherDelta

```javascript
/**
 * @typedef {Object} WeatherDelta
 * @property {number} temperature - Temperature difference (destination - base)
 * @property {number} precipitation - Precipitation difference (negative = less rain = better)
 * @property {number} cloudCover - Cloud cover difference (negative = clearer = better)
 * @property {number} windSpeed - Wind speed difference (negative = calmer = better)
 * @property {number | null} uvIndex - UV index difference
 */
```

### 9.5 UserSettings

```javascript
/**
 * @typedef {Object} UserSettings
 * @property {'dark' | 'light'} theme - Current theme
 * @property {'en' | 'sv' | 'no' | 'da'} locale - Current language
 * @property {number} drivingRadiusMinutes - Driving radius in minutes (default: 60)
 * @property {string} openRouteServiceKey - User's ORS API key
 * @property {WeatherWeights} weights - Weather scoring weights
 * @property {Location[]} savedLocations - Array of saved locations
 * @property {string | null} activeLocationId - Currently selected base location ID
 */
```

### 9.6 WeatherWeights

```javascript
/**
 * @typedef {Object} WeatherWeights
 * @property {number} sunshine - Weight for cloud cover improvement (default: 0.35)
 * @property {number} precipitation - Weight for precipitation reduction (default: 0.30)
 * @property {number} temperature - Weight for temperature improvement (default: 0.20)
 * @property {number} wind - Weight for wind reduction (default: 0.10)
 * @property {number} uv - Weight for UV improvement (default: 0.05)
 */
```

### 9.7 Weather Quality Score Calculation

```
qualityScore = (
    sunshine_weight × normalize(−Δcloud_cover, −100, 100) +
    precip_weight × normalize(−Δprecipitation, −20, 20) +
    temp_weight × normalize(Δtemperature, −15, 15) +
    wind_weight × normalize(−Δwind_speed, −20, 20) +
    uv_weight × normalize(Δuv_index, −5, 5)
) × 100

where normalize(value, min, max) → clamp to [0, 1]
```

- Negative deltas for cloud/precip/wind = IMPROVEMENT (less is better)
- Positive delta for temperature = IMPROVEMENT (warmer is better)
- All weights sum to 1.0
- Score range: 0 (worse) to 100 (maximum improvement)

---

## 10. Milestones / Phases

### Phase A: Foundation & Scaffolding (Complexity: Simple)
- Project setup: Svelte 5 + Vite + TailwindCSS 4
- PWA manifest + service worker (vite-plugin-pwa)
- Basic layout: Header, Map, Bottom Panel
- Dark/light theme toggle
- i18n framework + EN locale
- Leaflet map rendering with OpenStreetMap tiles
- Deploy to GitHub Pages

**Deliverable:** Empty app shell with working map, theme toggle, installable PWA

### Phase B: Location & Routing Core (Complexity: Medium)
- GPS geolocation
- Saved locations (localStorage CRUD)
- Location search/geocoding
- OpenRouteService integration (isochrone + directions)
- Driving radius slider + map overlay
- Caching layer for API responses
- API key configuration in settings

**Deliverable:** User can set location, adjust radius, see driving area on map

### Phase C: Weather Engine (Complexity: Medium-Complex)
- SMHI API integration
- YR API integration
- Weather data parsing and normalization
- Region-based API selection (SMHI for Sweden, YR for Norway/Denmark)
- Weather delta calculation
- Quality scoring engine
- Weather data caching

**Deliverable:** App fetches and compares weather for base + destinations

### Phase D: Destination Discovery & Display (Complexity: Medium)
- Overpass/GeoNames integration for town discovery
- Destination categorization (town, beach, hiking, attraction)
- Color-coded map markers
- Weather card components
- Destination panel (sort, filter)
- Map popup with weather details
- Destination caching

**Deliverable:** Full working app with destinations, weather cards, and map markers

### Phase E: Polish & Localization (Complexity: Simple-Medium)
- Swedish (sv) locale
- Norwegian (no) locale
- Danish (da) locale
- Settings modal (saved locations, API key, weights)
- Weather criteria weight adjustment UI
- Offline mode (service worker caching of last results)
- Performance optimization (lazy loading, request batching)
- Accessibility audit (WCAG 2.1 AA)
- README documentation

**Deliverable:** Production-ready v1.0 with all 4 languages, offline support, and accessibility

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s on 4G | Lighthouse |
| Lighthouse PWA Score | ≥ 90 | Lighthouse audit |
| Lighthouse Accessibility Score | ≥ 90 | Lighthouse audit |
| Time to first weather results | < 10s (warm cache < 3s) | Manual testing |
| Bundle size (gzipped) | < 100 KB (excluding map tiles) | Vite build output |
| Offline functionality | Last results viewable offline | Manual testing |
| API calls per session | < 50 (with caching) | Network tab monitoring |
| Mobile usability | Fully functional on 375px width | Manual testing on iPhone SE |

---

## 12. Risks & Mitigations

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| R1 | OpenRouteService 500/day limit exceeded | High — routing breaks | Medium | Aggressive caching (1h), fallback to straight-line distance × 1.3 factor, batch isochrone requests |
| R2 | SMHI/YR API changes or downtime | High — no weather data | Low | Abstract API behind service interface, graceful degradation with cached data |
| R3 | Overpass API rate limiting | Medium — no destinations | Low | Cache 24h, fallback to curated list of major Nordic towns |
| R4 | CORS issues with APIs | High — app non-functional | Medium | All listed APIs support CORS; test early in Phase B |
| R5 | Svelte 5 ecosystem immaturity | Medium — library compatibility | Low | Use vanilla Leaflet (not Svelte wrapper), minimal external deps |
| R6 | Large number of weather API calls for many destinations | Medium — slow UX | Medium | Limit to top 20-30 destinations, progressive loading, prioritize by population |
| R7 | Mobile battery drain from frequent GPS + API calls | Low — UX annoyance | Low | Debounce location updates, manual refresh only (no polling) |

---

## 13. Dependencies

| Dependency | Type | Required By | Notes |
|------------|------|-------------|-------|
| SMHI Open Data API | External API | Phase C | No key needed, free |
| YR/MET Norway API | External API | Phase C | No key, requires User-Agent header |
| OpenRouteService API | External API | Phase B | Free key required (user registers) |
| Overpass API (OSM) | External API | Phase D | No key, fair use policy |
| OpenStreetMap tiles | External API | Phase A | No key, attribution required |
| Svelte 5 | npm dependency | Phase A | Framework |
| Vite 6+ | npm dependency | Phase A | Build tool |
| TailwindCSS 4 | npm dependency | Phase A | Styling |
| Leaflet 1.9+ | npm dependency | Phase A | Maps |
| vite-plugin-pwa | npm dependency | Phase A | PWA support |

---

## 14. Priority Classification Summary

| Priority | Count | Items |
|----------|-------|-------|
| **Must Have (M)** | 28 | Core location, weather engine, map display, basic UI, PWA, i18n framework |
| **Should Have (S)** | 14 | Destination types, confidence %, sort/filter, isochrone overlay, weight adjustment, locale-aware formatting |
| **Could Have (C)** | 3 | Custom saved destinations, map style toggle, satellite tiles |
| **Won't Have (W)** | 10 | Backend server, user accounts, paid APIs, real-time traffic, push notifications, social features, hotel booking, weather history, Finnish language, multi-day forecasts |

---

## 15. Open Questions

| # | Question | Impact | Default Assumption |
|---|----------|--------|--------------------|
| OQ-1 | Should the app auto-refresh weather data or only on user action? | UX | Manual refresh only (save API calls, battery) |
| OQ-2 | How to handle destinations spanning Sweden/Norway border (which weather API)? | Data accuracy | Use geographic boundary: lat > 63° or lon < 12° → YR; else → SMHI; destinations near border get both |
| OQ-3 | Should curated "popular destination" lists be bundled for offline first use? | First-run UX | Yes — bundle top 50 Nordic towns with coords as JSON |
| OQ-4 | GeoNames vs Overpass API for destination discovery? | Architecture | Start with Overpass (no account needed), fallback to GeoNames |
| OQ-5 | Should weather scoring weights be per-user or also have seasonal presets? | UX | Start with per-user only; seasonal presets as v2 feature |

---

## Appendix A: Attribution Requirements

All of the following attributions MUST be visible in the app footer or About/Settings:

1. **"Source: SMHI Open Data"** — Required by SMHI terms
2. **"Data from MET Norway"** with link to yr.no — Required by YR terms
3. **"© OpenStreetMap contributors"** — Required by OSM license
4. **"Powered by OpenRouteService"** — Required by ORS terms
5. **"Maps: Leaflet"** — Leaflet attribution (auto-added by library)

## Appendix B: Reference Implementation Patterns (from ParkingFinder)

Patterns to carry forward from ParkingFinder:
- **Service worker:** Network-first for dynamic data, cache-first for static assets
- **Theme toggle:** CSS custom properties with `[data-theme]` attribute on `<html>`
- **Map style toggle:** Dark/light/satellite tile layers
- **Bottom panel:** Collapsible with drag handle, scrollable content
- **Header:** Compact, information-dense, responsive
- **Color palette:** Consistent with `--green`, `--yellow`, `--red` semantic colors

---

*End of PRD — WeatherEscape v1.0*
