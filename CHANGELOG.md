# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-31

### Added

- Interactive Leaflet map with colour-coded destination markers (green/yellow/orange/red)
- Live weather data from SMHI (Sweden) and MET Norway / YR (Norway, Denmark)
- Adjustable driving radius (30 min to 4 hours) via slider
- Weather quality scoring (0–100) with configurable weights for cloud, rain, temperature, wind, UV
- Delta display per destination showing exact weather improvements
- Time period selector (morning, afternoon, evening) with day toggle
- GPS-based location detection and place-name search via Nominatim
- Saved locations with quick-switch in header
- OpenRouteService integration for accurate drive-time isochrones (optional; straight-line fallback)
- Dark and light themes with automatic map tile switching (CARTO basemaps)
- Multi-language support: English, Swedish, Norwegian, Danish
- Installable PWA with offline support (Workbox service worker)
- 7-day tile cache and 30-minute weather data cache
- Keyboard shortcuts: T (toggle day), 1–4 (set time period), Escape (close modal)
- Skeleton loading states for weather cards
- Responsive design for mobile and desktop
- WCAG 2.1 AA accessibility (keyboard navigation, ARIA labels, focus-visible rings, contrast compliance)
- Settings modal for score weights, API key, language, and theme
- CSS design token system (spacing, colour, typography, elevation, animation)

### Technical

- Svelte 5 with runes API ($state, $derived, $effect)
- Vite 6 build with PWA plugin
- Service-oriented architecture (weather, scoring, routing, destination, location, cache)
- Rune-based reactive stores (weather, location, settings, i18n)
- GitHub Pages deployment support (`npm run build:gh-pages`)
