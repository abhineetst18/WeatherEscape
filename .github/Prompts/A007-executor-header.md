# A007: Header Component

**Phase:** A — Foundation & Scaffolding
**Batch:** 4 (depends on A003, A004, A005)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD §6.1 header layout:
```
Header: Logo | Location | Radius | Theme | Lang | Settings
```

In Phase A, Location and Radius are **placeholder displays** (actual functionality added in Phase B). Theme toggle and Language selector are **functional** (wired to stores from A003/A004).

---

## Instructions

### 1. Create `src/lib/components/Header.svelte`

**Layout — responsive:**
- Mobile: Compact row, hamburger or icon-only for settings
- Desktop: Full row with labels

**Elements:**
1. **App logo/name:** "WeatherEscape" text or small icon + text
2. **Location display:** Placeholder showing default location name (e.g., "Gothenburg"). Static text for now — Phase B adds LocationPicker interaction.
3. **Radius display:** Placeholder showing "1 hr" default. Static text for now — Phase B adds RadiusSlider.
4. **Theme toggle:** Button/icon that calls `toggleTheme()` from settingsStore. Show sun/moon icon based on current theme.
5. **Language selector:** Dropdown/select with supported locales. Calls `setLocale()` from i18nStore. Options: EN, SV, NO, DA (only EN functional in Phase A, but all options visible).
6. **Settings button:** Icon button — placeholder, opens nothing in Phase A. Phase B adds SettingsModal.

**Use i18n:** All labels via `t()` function:
- `t('header.location')`, `t('header.radius')`, `t('header.settings')`, etc.

**Styling:**
- Dark background matching theme (use CSS custom properties)
- Compact height (~48-56px)
- TailwindCSS responsive utilities: `flex items-center gap-2 px-4 py-2`

---

## Acceptance Criteria

- [ ] Header renders with all 6 elements
- [ ] Theme toggle switches between dark/light (visually + persisted)
- [ ] Theme toggle shows appropriate icon (sun for dark mode, moon for light)
- [ ] Language selector dropdown shows EN, SV, NO, DA options
- [ ] Selecting EN reloads EN locale (other locales show key fallback until Phase E)
- [ ] All text labels use `t()` translations
- [ ] Header is responsive (compact on mobile, full on desktop)
- [ ] Settings button is present (non-functional placeholder)
- [ ] Location display shows "Gothenburg" (placeholder)
- [ ] Radius display shows "1 hr" (placeholder)

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/components/Header.svelte` | App header with controls |
