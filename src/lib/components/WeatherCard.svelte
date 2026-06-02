<script>
  import { t } from '../stores/i18nStore.svelte.js';
  import { getWeatherEmoji } from '../utils/weatherHelpers.js';
  import { getQualityInfo } from '../services/scoringService.js';
  import { formatDriveTime } from '../utils/mapHelpers.js';

  let { destination, onclick = () => {} } = $props();

  const quality = $derived(destination.qualityScore != null ? getQualityInfo(destination.qualityScore) : null);
  const typeEmojis = { town: '🏘️', beach: '🏖️', hiking: '🥾', attraction: '🎯', custom: '📌' };
</script>

<button class="card" onclick={() => onclick(destination)} aria-label="{destination.name} — {quality?.label ?? 'loading'}">
  <!-- Header row -->
  <div class="card-header">
    <div class="card-left">
      {#if quality}
        <span class="quality-dot" style="background:{quality.color}" title={quality.label}></span>
      {/if}
      <span class="card-name">{destination.name}</span>
      <span class="card-type">{typeEmojis[destination.type] ?? '📌'}</span>
    </div>
    <div class="card-right">
      {#if destination.qualityScore != null}
        <span class="score" style="color:{quality?.color}" title="{quality?.label} ({destination.qualityScore}/100)">
          {destination.qualityScore}
        </span>
      {/if}
    </div>
  </div>

  <!-- Weather details -->
  {#if destination.weather}
    <div class="card-weather">
      <div class="wx-item wx-temp">
        <span class="wx-label">🌡 Temp</span>
        <span class="wx-value">
          {destination.weather.temperature}°
          {#if destination.delta}
            <span class="delta" class:positive={destination.delta.temperature > 0} class:negative={destination.delta.temperature < 0}>
              {destination.delta.temperature > 0 ? '+' : ''}{destination.delta.temperature}°
            </span>
          {/if}
        </span>
      </div>

      <div class="wx-item wx-rain">
        <span class="wx-label">🌧 Rain</span>
        <span class="wx-value">
          {destination.weather.precipitation}mm
          {#if destination.delta}
            <span class="delta" class:positive={destination.delta.precipitation < 0} class:negative={destination.delta.precipitation > 0}>
              {destination.delta.precipitation > 0 ? '+' : ''}{destination.delta.precipitation}mm
            </span>
          {/if}
        </span>
      </div>

      <div class="wx-item wx-wind">
        <span class="wx-label">💨 Wind</span>
        <span class="wx-value">
          {destination.weather.windSpeed}m/s
          {#if destination.delta}
            <span class="delta" class:positive={destination.delta.windSpeed < 0} class:negative={destination.delta.windSpeed > 0}>
              {destination.delta.windSpeed > 0 ? '+' : ''}{destination.delta.windSpeed}m/s
            </span>
          {/if}
        </span>
      </div>

      <div class="wx-item wx-cloud">
        <span class="wx-label">☁ Cloud</span>
        <span class="wx-value">
          {destination.weather.cloudCover}%
          {#if destination.delta}
            <span class="delta" class:positive={destination.delta.cloudCover < 0} class:negative={destination.delta.cloudCover > 0}>
              {destination.delta.cloudCover > 0 ? '+' : ''}{destination.delta.cloudCover}%
            </span>
          {/if}
        </span>
      </div>
    </div>
  {:else}
    <div class="card-loading">Loading weather...</div>
  {/if}

  <!-- Footer: drive time + type -->
  <div class="card-footer">
    <span class="drive-time">
      🚗 {destination.driveTimeMinutes ? formatDriveTime(destination.driveTimeMinutes) : '~'}
      {#if destination.isEstimate}
        <span class="estimate-badge">est.</span>
      {/if}
    </span>
    <span class="card-category">{t(`destinations.${destination.type}`)}</span>
  </div>
</button>

<style>
  .card {
    display: block;
    width: 100%;
    background: var(--surface2);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-3);
    cursor: pointer;
    text-align: left;
    color: var(--text);
    transition: transform var(--duration-quick) var(--ease-move), box-shadow var(--duration-standard) var(--ease-move);
  }
  .card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .card:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .card:active { transform: scale(0.99); }

  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
  .card-left { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
  .quality-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .card-name { font-size: var(--text-base); font-weight: var(--font-semibold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-type { font-size: var(--text-base); }
  .card-right { flex-shrink: 0; }
  .score { font-size: 14px; font-weight: var(--font-bold); }

  .card-weather { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-2); }
  .wx-item { display: flex; flex-direction: column; gap: 1px; font-size: var(--text-sm); }
  .wx-label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.03em; }
  .wx-value { font-size: var(--text-base); font-weight: var(--font-semibold); }

  /* Mobile: inline label + value on one row → smaller cards */
  @media (max-width: 767px) {
    .card-weather { grid-template-columns: 1fr 1fr; gap: 4px 8px; }
    .wx-item { flex-direction: row; align-items: baseline; gap: 4px; }
    .wx-label { font-size: 9px; white-space: nowrap; flex-shrink: 0; }
    .wx-value { font-size: 12px; }
    .delta { font-size: 10px; }
  }
  .delta { font-size: var(--text-xs); font-weight: var(--font-semibold); margin-left: 2px; }
  .delta.positive { color: var(--positive); }
  .delta.negative { color: var(--negative); }

  .card-loading { font-size: var(--text-sm); color: var(--text-dim); margin-bottom: var(--space-2); }

  .card-footer { display: flex; justify-content: space-between; align-items: center; }
  .drive-time { font-size: var(--text-sm); color: var(--text-dim); }
  .estimate-badge { font-size: 9px; background: var(--surface); padding: 1px var(--space-1); border-radius: var(--radius-xs); margin-left: 3px; }
  .card-category { font-size: var(--text-xs); color: var(--text-dim); text-transform: capitalize; }
</style>
