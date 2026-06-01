<script>
  import { t } from '../stores/i18nStore.svelte.js';
  import { weather, toggleDay, setTimePeriod, fetchDestinationWeather } from '../stores/weatherStore.svelte.js';
  import { settings, getActiveLocation, updateSetting } from '../stores/settingsStore.svelte.js';
  import { fallbackDestinationsFor } from '../services/destinationService.js';
  import WeatherCard from './WeatherCard.svelte';

  let { onSelectDestination = () => {} } = $props();
  let expanded = $state(true);
  let sortBy = $state('quality');
  let filterBy = $state('all');
  let weatherFilter = $state('none');

  const dayLabel = $derived(weather.day === 'today' ? t('time.today') : t('time.tomorrow'));
  const destinations = $derived(weather.destinations ?? []);
  const isLoading = $derived(weather.loading);
  const scoredCount = $derived(destinations.filter(d => d.qualityScore != null).length);
  const lastUpdatedLabel = $derived(weather.lastFetched ? formatTimeAgo(weather.lastFetched) : '');

  function formatTimeAgo(timestamp) {
    const diffSec = Math.round((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'just now';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  /** @type {Array<{value: string, label: string}>} */
  const periodOptions = $derived([
    { value: 'allDay', label: t('time.allDay') },
    { value: 'morning', label: t('time.morning') },
    { value: 'afternoon', label: t('time.afternoon') },
    { value: 'evening', label: t('time.evening') }
  ]);

  function handleToggleDay() {
    toggleDay();
  }

  function handlePeriodChange(e) {
    setTimePeriod(e.target.value);
  }

  function togglePanel() { expanded = !expanded; }

  function adjustRadius(delta) {
    const step = 15;
    const min = 15;
    const max = 300;
    const current = Number(settings.drivingRadiusMinutes) || 60;
    const next = Math.max(min, Math.min(max, current + delta * step));
    updateSetting('drivingRadiusMinutes', next);
  }

  const filteredDestinations = $derived.by(() => {
    let list = [...destinations];
    if (filterBy !== 'all') {
      list = list.filter(d => d.type === filterBy);
    }
    if (weatherFilter !== 'none') {
      list = list.filter(d => {
        if (!d.delta) return false;
        if (weatherFilter === 'warmer')      return d.delta.temperature > 0;
        if (weatherFilter === 'lessWind')    return d.delta.windSpeed < 0;
        if (weatherFilter === 'lessRain')    return d.delta.precipitation < 0;
        if (weatherFilter === 'lessCloud')   return d.delta.cloudCover < 0;
        return true;
      });
    }
    if (sortBy === 'quality') {
      list.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    } else if (sortBy === 'driveTime') {
      list.sort((a, b) => (a.driveTimeMinutes ?? 999) - (b.driveTimeMinutes ?? 999));
    } else if (sortBy === 'temp') {
      list.sort((a, b) => (b.delta?.temperature ?? 0) - (a.delta?.temperature ?? 0));
    }
    return list;
  });

  const hasWeatherData = $derived(filteredDestinations.some(d => d.weather != null));
</script>

<aside class="panel" class:collapsed={!expanded}>
  <button class="panel-toggle" onclick={togglePanel} aria-label={expanded ? 'Collapse panel' : 'Expand panel'}>
    <span class="toggle-handle"></span>
    <span class="panel-title">
      {t('destinations.title')}
      {#if scoredCount > 0}
        <span class="count">({scoredCount})</span>
      {/if}
      {#if lastUpdatedLabel}
        <span class="last-updated">· {lastUpdatedLabel}</span>
      {/if}
    </span>
    <span class="toggle-icon">{expanded ? '▼' : '▲'}</span>
  </button>

  {#if expanded}
    <div class="panel-content">
      <!-- Mobile radius row: visible on small screens with +/- buttons -->
      <div class="mobile-radius-row">
        <button class="radius-btn" onclick={() => adjustRadius(-1)} aria-label="Decrease radius">−</button>
        <div class="radius-label">{settings.drivingRadiusMinutes} min</div>
        <button class="radius-btn" onclick={() => adjustRadius(1)} aria-label="Increase radius">+</button>
      </div>
      <!-- Controls bar -->
      <div class="panel-controls">
        <!-- Day toggle -->
        <button class="day-toggle" onclick={handleToggleDay}>
          {dayLabel}
        </button>

        <select class="control-select period-select" value={weather.timePeriod} onchange={handlePeriodChange} aria-label={t('time.periodLabel')}>
          {#each periodOptions as opt (opt.value)}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>

        <select class="control-select" bind:value={sortBy} aria-label={t('destinations.sortBy')}>
          <option value="quality">{t('destinations.weatherQuality')}</option>
          <option value="driveTime">{t('destinations.driveTime')}</option>
          <option value="temp">{t('destinations.tempImprovement')}</option>
        </select>

        <select class="control-select" bind:value={filterBy} aria-label={t('destinations.filterBy')}>
          <option value="all">{t('destinations.all')}</option>
          <option value="town">{t('destinations.town')}</option>
          <option value="beach">{t('destinations.beach')}</option>
          <option value="hiking">{t('destinations.hiking')}</option>
          <option value="attraction">{t('destinations.attraction')}</option>
        </select>

        <select class="control-select" bind:value={weatherFilter} aria-label="Filter by weather condition">
          <option value="none">All weather</option>
          <option value="warmer">🌡 Warmer</option>
          <option value="lessRain">🌧 Less rain</option>
          <option value="lessWind">💨 Less wind</option>
          <option value="lessCloud">☁ Less cloud</option>
        </select>
      </div>

      <!-- Destination list -->
      {#if isLoading}
        <div class="loading-state">
          <p>⏳ {t('destinations.loading')}</p>
        </div>
      {:else if filteredDestinations.length > 0 && !hasWeatherData && weather.timePeriod !== 'allDay'}
        <div class="empty-state">
          <p class="empty-icon">🕐</p>
          <p class="empty-text">{t('time.noDataForPeriod')}</p>
        </div>
      {:else if filteredDestinations.length > 0}
        <div class="card-list">
          {#each filteredDestinations as dest (dest.id)}
            <WeatherCard destination={dest} onclick={onSelectDestination} />
          {/each}
        </div>
      {:else}
            <div class="empty-state">
              <p class="empty-icon">🌤️</p>
              <p class="empty-text">{t('destinations.empty')}</p>
              <div class="empty-actions">
                <button class="btn" onclick={async () => {
                  const loc = getActiveLocation();
                  const radiusKm = (settings.drivingRadiusMinutes / 60) * 70;
                  const list = await fallbackDestinationsFor(loc.lat, loc.lon, radiusKm);
                  if (list && list.length > 0) {
                    // fetch weather for the fallback list
                    await fetchDestinationWeather(list);
                  }
                }}>{t('destinations.loadFallback')}</button>
                <button class="btn" onclick={() => alert(t('destinations.adjustRadius'))}>{t('destinations.adjustRadius')}</button>
              </div>
            </div>
      {/if}
    </div>
  {/if}
</aside>

<style>
  .panel {
    background: var(--surface);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1000;
    flex-shrink: 0;
    transition: max-height 0.3s ease;
    max-height: 45vh;
    overflow: hidden;
  }
  :global([data-theme="light"]) .panel { border-top-color: rgba(0, 0, 0, 0.1); }
  .panel.collapsed { max-height: 44px; }

  .panel-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }
  .panel-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .toggle-handle { width: 32px; height: 4px; background: var(--text-dim); border-radius: 2px; opacity: 0.4; }
  .panel-title { flex: 1; text-align: left; }
  .count { font-weight: 400; color: var(--text-dim); font-size: 11px; }
  .last-updated { font-weight: 400; color: var(--text-dim); font-size: 10px; }
  .toggle-icon { font-size: 10px; color: var(--text-dim); }

  .panel-content { padding: 8px 12px 12px; overflow-y: auto; max-height: calc(45vh - 44px); }

  .mobile-radius-row { display: none; align-items: center; justify-content: center; gap: 8px; padding: 8px 0; }
  .radius-btn { background: var(--surface2); border: none; border-radius: 8px; padding: 6px 10px; font-size: 16px; cursor: pointer; }
  .radius-label { font-weight: 700; color: var(--text); }

  .panel-controls { display: flex; align-items: center; gap: 6px; padding-bottom: 10px; flex-wrap: wrap; }
  .day-toggle {
    background: var(--accent, #e94560);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .day-toggle:hover { opacity: 0.9; }
  .control-select {
    background: var(--surface2);
    color: var(--text);
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
    outline: none;
  }
  .control-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

  .card-list { display: flex; flex-direction: column; gap: 8px; }
  .loading-state, .empty-state { text-align: center; padding: 20px; color: var(--text-dim); font-size: 13px; }
  .empty-icon { font-size: 36px; margin-bottom: 8px; }
  .empty-text { font-size: 13px; }

  @media (min-width: 768px) {
    .panel {
      max-height: none;
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 360px;
      border-top: none;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
    }
    :global([data-theme="light"]) .panel { border-left-color: rgba(0, 0, 0, 0.1); }
    .panel-content { max-height: calc(100vh - 100px); }

    /* Collapsed desktop — clean vertical strip */
    .panel.collapsed { max-height: none; width: 28px; }
    .panel.collapsed .panel-toggle {
      flex-direction: column;
      height: 100%;
      padding: 16px 0;
      justify-content: flex-start;
      align-items: center;
      gap: 0;
    }
    .panel.collapsed .toggle-handle { width: 4px; height: 28px; opacity: 0.5; margin-bottom: 0; }
    .panel.collapsed .panel-title,
    .panel.collapsed .toggle-icon { display: none; }
  }

  /* Mobile-specific: show radius control at top */
  @media (max-width: 767px) {
    .mobile-radius-row { display: flex; }
  }
</style>
