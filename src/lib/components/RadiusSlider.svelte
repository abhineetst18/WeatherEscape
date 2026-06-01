<script>
  import { settings, updateSetting } from '../stores/settingsStore.svelte.js';
  import { t } from '../stores/i18nStore.svelte.js';
  import { RADIUS_OPTIONS } from '../utils/constants.js';

  function handleChange(e) {
    const idx = parseInt(e.target.value);
    updateSetting('drivingRadiusMinutes', RADIUS_OPTIONS[idx]);
  }

  function formatRadius(minutes) {
    if (minutes < 60) return t('radius.minutes', { value: String(minutes) });
    const hrs = minutes / 60;
    return t('radius.hours', { value: hrs % 1 === 0 ? String(hrs) : hrs.toFixed(1) });
  }

  const currentIndex = $derived(RADIUS_OPTIONS.indexOf(settings.drivingRadiusMinutes));
</script>

<div class="radius-control">
  <label class="radius-label" for="radius-slider">
    {t('radius.label')}: <strong>{formatRadius(settings.drivingRadiusMinutes)}</strong>
  </label>
  <input
    id="radius-slider"
    type="range"
    min="0"
    max={RADIUS_OPTIONS.length - 1}
    value={currentIndex >= 0 ? currentIndex : 1}
    oninput={handleChange}
    class="radius-slider"
    aria-label={t('radius.label')}
  />
  <div class="radius-marks">
    {#each RADIUS_OPTIONS as opt}
      <span class="mark" class:active={opt === settings.drivingRadiusMinutes}>
        {opt < 60 ? `${opt}m` : `${opt / 60}h`}
      </span>
    {/each}
  </div>
</div>

<style>
  .radius-control {
    padding: var(--space-1) 0;
  }
  .radius-label {
    font-size: var(--text-sm);
    color: var(--text-dim);
    display: block;
    margin-bottom: var(--space-1);
  }
  .radius-label strong {
    color: var(--text);
  }
  .radius-slider {
    width: 100%;
    height: 4px;
    appearance: none;
    background: var(--surface2);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  .radius-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }
  .radius-slider:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
  .radius-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
  }
  .mark {
    font-size: 9px;
    color: var(--text-dim);
    opacity: 0.5;
  }
  .mark.active {
    opacity: 1;
    color: var(--accent);
    font-weight: var(--font-semibold);
  }
</style>
