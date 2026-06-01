# A003: Theme System (Dark/Light)

**Phase:** A — Foundation & Scaffolding
**Batch:** 2 (depends on A001)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD FR-7.1 requires dark/light theme toggle persisted in localStorage. PRD §6.5 specifies dark mode as default (matching ParkingFinder aesthetic). TailwindCSS 4 dark mode via class strategy.

The settingsStore is the central store for all user preferences (theme, locale, radius, weights, API key, saved locations). Phase A initializes it with theme + locale; later phases add more fields.

---

## Instructions

### 1. Create `src/lib/stores/settingsStore.js`

Use **Svelte 5 runes** (`$state`, `$derived`, `$effect`):

```js
// State shape (matching PRD §9.5 UserSettings):
// - theme: 'dark' | 'light'
// - locale: 'en' | 'sv' | 'no' | 'da'  
// - drivingRadiusMinutes: number
// - openRouteServiceKey: string
// - weights: WeatherWeights
// - savedLocations: Location[]
// - activeLocationId: string | null
```

**Requirements:**
- Initialize from localStorage on load (key: `'weatherescape-settings'`)
- Fall back to defaults from constants.js if nothing stored
- Persist to localStorage on every change (use `$effect`)
- Export functions: `toggleTheme()`, `setLocale(locale)`, `setDrivingRadius(minutes)`, `getSettings()`
- Export reactive state that components can subscribe to

**Svelte 5 pattern — use a class with runes or a module-level `$state`:**

```js
import { DEFAULT_THEME, DEFAULT_LOCALE, DEFAULT_DRIVING_RADIUS_MINUTES, DEFAULT_WEIGHTS } from '$lib/utils/constants.js';

const STORAGE_KEY = 'weatherescape-settings';

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

// ... export reactive state and mutation functions
```

### 2. Add theme CSS custom properties to `src/styles/app.css`

After the TailwindCSS import, add CSS custom properties for both themes:

```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0b0;
  --accent: #00b894;
  /* ... more as needed */
}

.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #1a1a2e;
  --text-secondary: #555555;
  --accent: #00b894;
}
```

### 3. Configure TailwindCSS dark mode

TailwindCSS 4 may handle dark mode differently than v3. Use CSS custom properties approach (more reliable than class-based dark: prefix for this use case), OR use TailwindCSS 4 `@custom-variant` for dark mode class.

The `<html>` element should get class `dark` or `light` based on theme state.

---

## Acceptance Criteria

- [ ] settingsStore initializes with defaults when no localStorage data
- [ ] settingsStore loads from localStorage when data exists
- [ ] `toggleTheme()` switches between dark/light
- [ ] Theme persists across page refresh (check localStorage)
- [ ] CSS custom properties change when theme changes
- [ ] `<html>` element gets `dark` or `light` class
- [ ] All color values use CSS custom properties (not hardcoded)

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/stores/settingsStore.js` | Create | Settings state management |
| `src/styles/app.css` | Modify | Add CSS custom properties for themes |
