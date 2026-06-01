# A004: Internationalization Framework + EN Locale

**Phase:** A — Foundation & Scaffolding
**Batch:** 2 (depends on A001)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD FR-8 requires ALL user-facing strings externalized into locale JSON files, runtime locale switching without page reload, and support for EN, SV, NO, DA. Phase A builds the framework and EN locale only. Phases E adds SV/NO/DA.

PRD §7.1 recommends: "Custom Svelte store + JSON locale files — Lightweight, no heavy i18n library needed."

---

## Instructions

### 1. Create `src/lib/stores/i18nStore.js`

**Design:**
- Module-level Svelte 5 reactive state (`$state`)
- Active locale string (default: 'en')
- Loaded translations object (flat key-value map)
- `t(key, params?)` function that returns translated string with optional parameter interpolation
- `setLocale(locale)` function that loads new locale JSON and updates state
- Locale files loaded from `/locales/{locale}.json` via `fetch()`

**Translate function requirements:**
- `t('header.title')` → `"WeatherEscape"`
- `t('weather.temperature', { value: 19 })` → `"19°C"` (parameter interpolation with `{value}` placeholders)
- If key not found → return the key itself (graceful fallback)
- Nested dot-notation keys: `'header.title'` looks up `{ "header": { "title": "WeatherEscape" } }`

**Loading strategy:**
- Load EN eagerly on app start
- Other locales loaded on demand when `setLocale()` called
- Cache loaded locales in memory (don't re-fetch)

**Svelte 5 pattern:**
```js
let translations = $state({});
let locale = $state('en');
let loading = $state(false);

export function t(key, params = {}) {
  // Traverse nested keys via dot notation
  // Interpolate {param} placeholders
  // Return key if not found
}

export async function setLocale(newLocale) {
  // Fetch /locales/{newLocale}.json
  // Update translations state
  // Update locale state
  // Update settingsStore.locale
}

export function getLocale() { return locale; }
```

### 2. Create `public/locales/en.json`

Comprehensive EN locale covering all planned UI strings. Use nested structure:

```json
{
  "app": {
    "name": "WeatherEscape",
    "tagline": "Find better weather nearby"
  },
  "header": {
    "location": "Location",
    "radius": "Radius",
    "settings": "Settings",
    "theme": "Theme",
    "language": "Language"
  },
  "map": {
    "loading": "Loading map...",
    "attribution": "© OpenStreetMap contributors"
  },
  "panel": {
    "title": "Destinations",
    "empty": "Set your location and radius to discover destinations",
    "loading": "Fetching weather data...",
    "sort": "Sort by",
    "filter": "Filter",
    "sortOptions": {
      "quality": "Weather Quality",
      "driveTime": "Drive Time",
      "temperature": "Temperature"
    },
    "filterOptions": {
      "all": "All Types",
      "town": "Towns",
      "beach": "Beaches",
      "hiking": "Hiking",
      "attraction": "Attractions"
    }
  },
  "weather": {
    "temperature": "{value}°C",
    "precipitation": "{value}mm",
    "wind": "{value}m/s",
    "cloudCover": "{value}%",
    "confidence": "Confidence: {value}%",
    "score": "{value}/100",
    "today": "Today",
    "tomorrow": "Tomorrow",
    "noData": "No weather data",
    "conditions": {
      "clear": "Clear sky",
      "partlyCloudy": "Partly cloudy",
      "cloudy": "Cloudy",
      "rain": "Rain",
      "heavyRain": "Heavy rain",
      "snow": "Snow",
      "thunder": "Thunder"
    }
  },
  "location": {
    "gps": "Use my location",
    "search": "Search for a place...",
    "saved": "Saved Locations",
    "default": "Gothenburg",
    "add": "Save location",
    "remove": "Remove",
    "setDefault": "Set as default",
    "gpsError": "Could not detect your location",
    "gpsDenied": "Location access denied"
  },
  "radius": {
    "label": "Driving radius",
    "minutes": "{value} min",
    "hours": "{value} hr"
  },
  "settings": {
    "title": "Settings",
    "apiKey": "OpenRouteService API Key",
    "apiKeyPlaceholder": "Enter your API key",
    "apiKeyHelp": "Get a free key at openrouteservice.org",
    "locations": "Saved Locations",
    "weights": "Weather Scoring Weights",
    "weightsHelp": "Adjust how weather quality is calculated",
    "close": "Close"
  },
  "quality": {
    "great": "Great improvement",
    "moderate": "Moderate improvement",
    "marginal": "Marginal improvement",
    "worse": "Weather is worse"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "offline": "You are offline",
    "driveTime": "{value} min drive"
  },
  "attribution": {
    "smhi": "Source: SMHI Open Data",
    "yr": "Data from MET Norway",
    "osm": "© OpenStreetMap contributors",
    "ors": "Powered by OpenRouteService"
  }
}
```

---

## Acceptance Criteria

- [ ] `t('app.name')` returns `"WeatherEscape"`
- [ ] `t('weather.temperature', { value: 19 })` returns `"19°C"`
- [ ] `t('nonexistent.key')` returns `"nonexistent.key"` (graceful fallback)
- [ ] `setLocale('en')` loads EN and updates state
- [ ] Locale change does NOT require page reload
- [ ] EN locale JSON covers all sections: app, header, map, panel, weather, location, radius, settings, quality, common, attribution
- [ ] Loading state exposed for UI indicators

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/stores/i18nStore.js` | i18n state + translate function |
| `public/locales/en.json` | English locale strings |
