<script>
  import { settings, toggleTheme } from '../stores/settingsStore.svelte.js';
  import { t, setLocale } from '../stores/i18nStore.svelte.js';
  import { SUPPORTED_LOCALES } from '../utils/constants.js';
  import LocationPicker from './LocationPicker.svelte';
  import RadiusSlider from './RadiusSlider.svelte';
  import { weather } from '../stores/weatherStore.svelte.js';
  import { getWeatherEmoji } from '../utils/weatherHelpers.js';

  const localeLabels = { en: 'EN', sv: 'SV', no: 'NO', da: 'DA' };

  let showLocationPicker = $state(false);

  function handleLocaleChange(e) {
    setLocale(e.target.value);
  }

  function getActiveLocationName() {
    const loc = settings.savedLocations.find(l => l.id === settings.activeLocationId);
    return loc?.name ?? 'Gothenburg';
  }
</script>

<header class="header">
  <div class="header-row">
    <div class="header-left">
      <h1 class="title">⛅ {t('header.title')}</h1>
    </div>

    <div class="header-center">
      <!-- Location button -->
      <button class="location-btn" onclick={() => showLocationPicker = !showLocationPicker}>
        📍 {getActiveLocationName()}
      </button>

      <!-- Radius -->
      <div class="radius-inline">
        <RadiusSlider />
      </div>

      <!-- Base weather summary -->
      {#if weather.base}
        {@const dayData = weather.day === 'today' ? weather.base.today : weather.base.tomorrow}
        {@const w = dayData?.[weather.timePeriod] ?? dayData?.allDay}
        {#if w}
          <span class="base-weather">
            {getWeatherEmoji(w.conditionCode)} {w.temperature}°
            {#if w.precipitation > 0}
              <span class="base-detail">💧{w.precipitation}mm</span>
            {/if}
            {#if w.windSpeed != null}
              <span class="base-detail">💨{w.windSpeed}m/s</span>
            {/if}
          </span>
        {/if}
      {/if}
    </div>

    <div class="header-right">
      <button class="refresh-btn" onclick={() => window.dispatchEvent(new CustomEvent('refreshweather'))}
        aria-label="Refresh weather" title="Refresh weather data"
        class:spinning={weather.loading}>
        🔄
      </button>

      <select
        class="locale-select"
        value={settings.locale}
        onchange={handleLocaleChange}
        aria-label={t('settings.language')}
      >
        {#each SUPPORTED_LOCALES as loc}
          <option value={loc}>{localeLabels[loc]}</option>
        {/each}
      </select>

      <button class="theme-btn" onclick={toggleTheme} aria-label={t('settings.theme')}
        title={settings.theme === 'dark' ? t('settings.light') : t('settings.dark')}>
        {settings.theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <button class="settings-btn" aria-label={t('header.settings')} title={t('header.settings')}
        onclick={() => { const event = new CustomEvent('opensettings'); window.dispatchEvent(event); }}>
        ⚙️
      </button>
    </div>
  </div>

  <!-- Location Picker Dropdown -->
  {#if showLocationPicker}
    <div class="location-dropdown">
      <LocationPicker onclose={() => showLocationPicker = false} />
    </div>
  {/if}

  <!-- Mobile-only base weather pill -->
  {#if weather.base}
    {@const dayDataMobile = weather.day === 'today' ? weather.base.today : weather.base.tomorrow}
    {@const wm = dayDataMobile?.[weather.timePeriod] ?? dayDataMobile?.allDay}
    {#if wm}
      <div class="mobile-base-weather" aria-hidden="false">
        <span class="emoji">{getWeatherEmoji(wm.conditionCode)}</span>
        <span class="temp">{wm.temperature}°</span>
        {#if wm.precipitation > 0}
          <span class="detail">💧{wm.precipitation}mm</span>
        {/if}
        {#if wm.windSpeed != null}
          <span class="detail">💨{wm.windSpeed}m/s</span>
        {/if}
      </div>
    {/if}
  {/if}
</header>

<style>
  .header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    z-index: 1000;
    flex-shrink: 0;
    position: relative;
  }

  .header-row {
    display: flex;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    gap: var(--space-2);
  }
  .header-left { flex-shrink: 0; }
  .title { font-size: var(--text-md); font-weight: var(--font-semibold); margin: 0; white-space: nowrap; }

  .header-center {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .location-btn {
    background: var(--surface2);
    color: var(--text);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-base);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
    transition: background var(--duration-quick) var(--ease-move);
  }
  .location-btn:hover { background: var(--surface-pressed); }
  .location-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }

  .radius-inline {
    flex: 1;
    min-width: 100px;
    max-width: 220px;
  }

  .base-weather {
    font-size: var(--text-base);
    color: var(--text);
    white-space: nowrap;
    background: var(--surface2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  .base-detail {
    margin-left: var(--space-1);
    opacity: 0.85;
  }

  .refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--text-base);
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: background var(--duration-quick) var(--ease-move);
  }
  .refresh-btn:hover { background: var(--surface-hover); }
  .refresh-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  .refresh-btn.spinning { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .radius-inline { display: none; }
    .title { font-size: var(--text-base); }
    .mobile-base-weather { display: flex; gap: 8px; align-items: center; margin-left: 8px; }
  }

  .mobile-base-weather { display: none; position: relative; font-size: 14px; color: var(--text); background: var(--surface2); padding: 6px 10px; border-radius: 10px; margin: 8px; }
  .mobile-base-weather .temp { font-weight: 700; }
  .mobile-base-weather .detail { opacity: 0.9; margin-left: 6px; font-size: 13px; }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
  }
  .locale-select {
    background: var(--surface2);
    color: var(--text);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    cursor: pointer;
    outline: none;
    transition: background var(--duration-quick) var(--ease-move);
  }
  .locale-select:hover { background: var(--surface-pressed); }
  .locale-select:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  .theme-btn, .settings-btn {
    background: none;
    border: none;
    font-size: var(--text-md);
    cursor: pointer;
    padding: var(--space-1);
    line-height: 1;
    border-radius: var(--radius-sm);
    transition: background var(--duration-quick) var(--ease-move);
  }
  .theme-btn:hover, .settings-btn:hover { background: var(--surface-hover); }
  .theme-btn:focus-visible, .settings-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }

  .location-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    z-index: 1001;
    max-height: 320px;
    overflow-y: auto;
  }
</style>
