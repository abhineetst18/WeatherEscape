# A008: Destination Panel Skeleton

**Phase:** A — Foundation & Scaffolding
**Batch:** 4 (depends on A004, A005)
**Complexity:** S
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD FR-6.1 requires a collapsible bottom panel listing destinations with weather cards. In Phase A this is an **empty skeleton** — actual weather cards and data come in Phase D.

PRD §6.4 responsive breakpoints:
- Mobile (< 640px): Bottom sheet panel
- Tablet (640-1024px): Side panel 40%
- Desktop (> 1024px): Side panel 35%

---

## Instructions

### 1. Create `src/lib/components/DestinationPanel.svelte`

**Requirements:**
- Collapsible container with expand/collapse toggle (chevron icon or drag handle)
- Panel header showing `t('panel.title')` ("Destinations")
- Sort dropdown placeholder: `t('panel.sort')` with disabled options (Quality, Drive Time, Temperature)
- Filter dropdown placeholder: `t('panel.filter')` with disabled options (All, Towns, Beaches, Hiking, Attractions)
- Empty state message: `t('panel.empty')` when no destinations
- Slot or container for future WeatherCard list

**Collapse behavior:**
- Mobile: Bottom sheet that slides up/down. Default collapsed to ~60px (showing title + toggle).
- Desktop: Side panel that can collapse to a narrow strip.
- Use CSS transitions for smooth animation.

**Svelte 5 pattern:**
```svelte
<script>
  import { t } from '$lib/stores/i18nStore.js';
  
  let expanded = $state(false);
  
  function toggle() {
    expanded = !expanded;
  }
</script>

<div class="panel {expanded ? 'expanded' : 'collapsed'}">
  <div class="panel-header" onclick={toggle}>
    <h2>{t('panel.title')}</h2>
    <span class="chevron">{expanded ? '▼' : '▲'}</span>
  </div>
  
  {#if expanded}
    <div class="panel-controls">
      <!-- Sort and filter dropdowns (placeholder) -->
    </div>
    <div class="panel-content">
      <!-- Future: WeatherCard list -->
      <p class="empty-state">{t('panel.empty')}</p>
    </div>
  {/if}
</div>
```

**Styling:**
- Background using CSS custom properties (--bg-secondary)
- Rounded top corners on mobile bottom sheet
- Shadow/elevation for visual separation from map
- Smooth height transition

---

## Acceptance Criteria

- [ ] Panel renders below the map area
- [ ] Panel collapses and expands on toggle click
- [ ] Panel header shows "Destinations" (i18n)
- [ ] Empty state message displayed when collapsed content shown
- [ ] Sort/filter dropdown placeholders visible
- [ ] Smooth collapse/expand animation
- [ ] Responsive: bottom sheet on mobile, side panel concept on desktop
- [ ] All text uses `t()` translations

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/components/DestinationPanel.svelte` | Collapsible destination list panel |
