# A006: Leaflet Map Component

**Phase:** A — Foundation & Scaffolding
**Batch:** 4 (depends on A001, A005)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD FR-5.1 requires an interactive Leaflet map centered on the user's base location. FR-5.6 mandates OpenStreetMap tiles. Default center is Gothenburg (57.7089, 11.9746) per FR-1.4.

ParkingFinder (same workspace) uses Leaflet with CartoDB dark/light tiles — follow similar pattern.

**Important:** Import Leaflet CSS! Without it, tiles render but the map layout is broken.

---

## Instructions

### 1. Create `src/lib/utils/mapHelpers.js`

Export helper functions and constants:

```js
// Tile layer configurations
export const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
  },
  cartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
  },
};

// Default map settings
export const DEFAULT_CENTER = [57.7089, 11.9746]; // Gothenburg
export const DEFAULT_ZOOM = 9;
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 16;
```

- `getTileLayer(theme)` → returns dark tiles for dark theme, light tiles for light theme
- `createMapInstance(container, options)` → wrapper for `L.map()` creation

### 2. Create `src/lib/components/Map.svelte`

**Requirements:**
- Initialize Leaflet map in `onMount` (needs DOM element)
- Use `bind:this` to get container div reference
- Set tile layer based on current theme (subscribe to settingsStore)
- Switch tile layer when theme changes (without recreating map)
- Responsive: listen for container resize, call `map.invalidateSize()`
- Center on DEFAULT_CENTER with DEFAULT_ZOOM
- Import Leaflet CSS: `import 'leaflet/dist/leaflet.css'`
- Clean up map in `onDestroy` (call `map.remove()`)

**Svelte 5 pattern:**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { DEFAULT_CENTER, DEFAULT_ZOOM, getTileLayer } from '$lib/utils/mapHelpers.js';
  
  let mapContainer;
  let map;
  let tileLayer;
  
  onMount(() => {
    map = L.map(mapContainer).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    tileLayer = L.tileLayer(/* ... */).addTo(map);
    
    // ResizeObserver for responsive sizing
    const observer = new ResizeObserver(() => map?.invalidateSize());
    observer.observe(mapContainer);
    
    return () => {
      observer.disconnect();
      map?.remove();
    };
  });
</script>

<div bind:this={mapContainer} class="w-full h-full"></div>
```

**Export the map instance** so parent components can interact with it (add markers, layers, etc.):
- Either via `bind:this` + component method pattern
- Or via a shared map store (preferred for Svelte 5)

---

## Acceptance Criteria

- [ ] Map renders with OpenStreetMap tiles
- [ ] Map centered on Gothenburg (57.7089, 11.9746)
- [ ] Map is interactive (pan, zoom)
- [ ] Map resizes correctly when window resizes
- [ ] Tile layer matches current theme (dark tiles for dark, light for light)
- [ ] Tile layer switches when theme toggles (no page reload)
- [ ] Map cleans up on component destroy (no memory leak)
- [ ] No "missing CSS" layout issues (Leaflet CSS imported)
- [ ] OSM attribution visible on map

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/components/Map.svelte` | Leaflet map component |
| `src/lib/utils/mapHelpers.js` | Map configuration helpers |
