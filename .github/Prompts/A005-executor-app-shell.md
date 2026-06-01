# A005: App Shell — Root Component

**Phase:** A — Foundation & Scaffolding
**Batch:** 3 (depends on A001, A003, A004)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD §6.1 defines the 3-zone layout: Header, Map, Bottom Panel. This prompt creates the root `App.svelte` that wires everything together.

**Dependencies available:**
- A001: Project builds and runs
- A003: `settingsStore.js` provides theme state
- A004: `i18nStore.js` provides translate function and locale loading

---

## Instructions

### 1. Update `src/App.svelte`

Replace the placeholder from A001 with the full app shell:

**Layout (matching PRD §6.1):**
```
┌─────────────────────────────────────┐
│ <Header />                          │
├─────────────────────────────────────┤
│ <Map /> (flex-grow, fills space)    │
├─────────────────────────────────────┤
│ <DestinationPanel /> (collapsible)  │
└─────────────────────────────────────┘
```

**Requirements:**
- Import and render Header, Map, and DestinationPanel components (use placeholder `<div>` if component files don't exist yet — they'll be created in A006-A008)
- Apply theme class to root element: `<div class="{theme}">` where theme comes from settingsStore
- Initialize i18n on mount (call `setLocale(settings.locale)`)
- Use TailwindCSS classes for layout: `flex flex-col h-screen`
- Map section should `flex-grow` to fill available space
- Responsive: full height, no scroll on body

**Svelte 5 pattern:**
```svelte
<script>
  import { onMount } from 'svelte';
  // Import stores
  // Import components (or placeholder divs)
  
  onMount(() => {
    // Initialize i18n with saved locale
  });
</script>

<div class="{theme} flex flex-col h-screen">
  <!-- Header -->
  <!-- Map (flex-grow) -->
  <!-- DestinationPanel -->
</div>
```

### 2. Update `src/main.js` (if needed)

Ensure Svelte 5 `mount()` is used correctly with the updated App.svelte.

---

## Acceptance Criteria

- [ ] App renders with 3-zone layout (header, map area, panel area)
- [ ] Theme class applied to root element from settingsStore
- [ ] i18n initialized on app mount
- [ ] Map area fills available vertical space
- [ ] No body scroll — layout is full-viewport
- [ ] No console errors

---

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/App.svelte` | Modify | Full layout shell with theme + i18n wiring |
| `src/main.js` | Modify (if needed) | Ensure Svelte 5 mount API |
