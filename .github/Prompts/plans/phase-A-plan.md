# Phase A Plan — Foundation & Scaffolding

**Project:** WeatherEscape
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`
**Complexity Score:** 18 (Medium — 10 prompts)
**Phase Deliverable:** Empty app shell with working map, theme toggle, i18n framework, installable PWA

---

## Validation Checklist (for Judge)

- [ ] `npm install` succeeds without errors
- [ ] `npm run dev` starts Vite dev server on localhost
- [ ] `npm run build` produces `dist/` with no errors
- [ ] App renders in browser with Header, Map, and DestinationPanel areas
- [ ] Leaflet map displays with OpenStreetMap tiles centered on Gothenburg
- [ ] Dark/light theme toggle works and persists across refresh
- [ ] Language selector switches between EN (only locale in Phase A)
- [ ] Destination panel collapses/expands
- [ ] PWA manifest present, app installable on mobile
- [ ] Service worker registers
- [ ] All JSDoc types from PRD §9 present in `types/index.js`
- [ ] Constants file has all defaults, thresholds, API URLs, color system
- [ ] No console errors in dev mode
- [ ] TailwindCSS utility classes work in all components

---

## Prompts

### P1: A001 — Project Initialization
- **Context:** Green-field Svelte 5 + Vite 6 + TailwindCSS 4 project. No existing code.
- **Instructions:** Create package.json, vite.config.js, index.html, src/app.html, src/main.js, src/styles/app.css, .gitignore. Run npm install.
- **Acceptance:** `npm install` + `npm run dev` + `npm run build` all succeed.
- **Files:** `package.json`, `vite.config.js`, `index.html`, `src/app.html`, `src/main.js`, `src/styles/app.css`, `.gitignore`
- **Risks:** TailwindCSS 4 + Svelte 5 integration may need specific PostCSS config. Vite 6 Svelte plugin version compatibility.
- **Prevention:** Pin exact dependency versions. Use `@sveltejs/vite-plugin-svelte` compatible with Svelte 5.

### P2: A002 — Constants & Type Definitions
- **Context:** PRD §9 defines 6 data models. PRD §6.2 defines color system. PRD §7.4 defines cache durations. PRD §8 defines API URLs.
- **Instructions:** Create all JSDoc typedefs and app constants.
- **Acceptance:** Types importable, constants cover all PRD-defined values.
- **Files:** `src/lib/types/index.js`, `src/lib/utils/constants.js`
- **Risks:** None — pure data definitions.

### P3: A003 — Theme System
- **Context:** PRD FR-7.1 requires dark/light toggle persisted in localStorage. TailwindCSS 4 dark mode via class strategy.
- **Instructions:** Create settingsStore with theme state, CSS custom properties for both themes.
- **Acceptance:** Theme toggle switches class on `<html>`, persists in localStorage.
- **Files:** `src/lib/stores/settingsStore.js`, `src/styles/app.css` (modify)
- **Risks:** None.

### P4: A004 — i18n Framework + EN Locale
- **Context:** PRD FR-8 requires all strings externalized, runtime locale switching, 4 locales. Phase A sets up framework + EN only.
- **Instructions:** Create i18n store with translate function and locale loader. Create EN locale JSON.
- **Acceptance:** `t('key')` works, locale loadable, EN covers all planned UI strings.
- **Files:** `src/lib/stores/i18nStore.js`, `public/locales/en.json`
- **Risks:** Svelte 5 runes may require specific reactive patterns for stores.
- **Prevention:** Use `$state` runes for Svelte 5, not legacy `writable()`.

### P5: A005 — App Shell (Root Component)
- **Context:** PRD §6.1 defines layout: Header, Map, Bottom Panel. Depends on theme + i18n stores.
- **Instructions:** Create App.svelte with 3-zone layout, wire theme class to root, init i18n.
- **Acceptance:** App renders all 3 zones, theme class applied, i18n initialized.
- **Files:** `src/App.svelte`
- **Risks:** None.
- **Dependencies:** A001, A003, A004

### P6: A006 — Leaflet Map Component
- **Context:** PRD FR-5.1, FR-5.6. Leaflet with OpenStreetMap tiles. Default center: Gothenburg (57.7089, 11.9746).
- **Instructions:** Create Map.svelte with Leaflet init, tile layer, responsive resize. Create mapHelpers.
- **Acceptance:** Map renders, tiles load, responsive to container resize.
- **Files:** `src/lib/components/Map.svelte`, `src/lib/utils/mapHelpers.js`
- **Risks:** Leaflet CSS must be imported. Svelte 5 lifecycle (onMount) for DOM-dependent init.
- **Prevention:** Import Leaflet CSS in app.css or component. Use `onMount` for Leaflet initialization.

### P7: A007 — Header Component
- **Context:** PRD §6.1 header row: Logo, Location (placeholder), Radius (placeholder), Theme toggle, Language selector, Settings button.
- **Instructions:** Create Header.svelte with responsive layout, theme toggle connected to settingsStore, language selector connected to i18nStore.
- **Acceptance:** Header renders all elements, theme toggle works, language selector works.
- **Files:** `src/lib/components/Header.svelte`
- **Dependencies:** A003, A004, A005

### P8: A008 — Destination Panel Skeleton
- **Context:** PRD FR-6.1 collapsible bottom panel. Phase A: empty skeleton with expand/collapse, sort/filter placeholders.
- **Instructions:** Create DestinationPanel.svelte with collapsible container, empty state.
- **Acceptance:** Panel collapses/expands, shows empty state message, responsive.
- **Files:** `src/lib/components/DestinationPanel.svelte`
- **Dependencies:** A004, A005

### P9: A009 — PWA Setup
- **Context:** PRD G4 requires installable PWA with Lighthouse ≥ 90. Use vite-plugin-pwa.
- **Instructions:** Install and configure vite-plugin-pwa, create manifest, create/source icons.
- **Acceptance:** Service worker registers, manifest present, app installable.
- **Files:** `vite.config.js` (modify), `public/favicon.svg`, PWA icons
- **Dependencies:** A001

### P10: A010 — GitHub Pages Deployment
- **Context:** PRD G6 requires static deployment to GitHub Pages.
- **Instructions:** Configure Vite base path, document deployment steps.
- **Acceptance:** `npm run build` output deployable to GitHub Pages.
- **Files:** `vite.config.js` (modify)
- **Dependencies:** A001, A009

---

## Judge Hand-off Template

After all Phase A prompts are complete:

```
## Judge Validation Request — Phase A

**Project:** WeatherEscape
**Phase:** A — Foundation & Scaffolding
**Plan:** WeatherEscape/.github/Prompts/plans/phase-A-plan.md

**Validation steps:**
1. Run `cd WeatherEscape && npm install && npm run build`
2. Run `npm run dev` and open in browser
3. Verify all items in Validation Checklist above
4. Check each prompt's acceptance criteria in phase-A-reference.md

**Key files to review:**
- package.json (dependencies correct)
- vite.config.js (Svelte + TailwindCSS + PWA configured)
- src/App.svelte (layout structure)
- src/lib/stores/ (settingsStore, i18nStore)
- src/lib/components/ (Map, Header, DestinationPanel)
```
