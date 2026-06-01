<script>
  import { settings, updateSetting } from '../stores/settingsStore.svelte.js';
  import { t } from '../stores/i18nStore.svelte.js';
  import { removeSavedLocation } from '../services/locationService.js';
  import { DEFAULT_LOCATION, DEFAULT_WEIGHTS } from '../utils/constants.js';
  import { recalculateScores } from '../stores/weatherStore.svelte.js';

  let { onclose = () => {} } = $props();
  let apiKey = $state(settings.openRouteServiceKey);
  let weights = $state({ ...settings.weights });

  function handleSaveKey() {
    updateSetting('openRouteServiceKey', apiKey.trim());
  }

  function handleWeightChange(key, value) {
    weights[key] = parseFloat(value);
    // WHY: Normalize weights so they always sum to 1.0
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    if (total > 0) {
      const normalized = {};
      for (const [k, v] of Object.entries(weights)) {
        normalized[k] = Math.round((v / total) * 100) / 100;
      }
      weights = normalized;
      updateSetting('weights', { ...normalized });
      recalculateScores();
    }
  }

  function resetWeights() {
    weights = { ...DEFAULT_WEIGHTS };
    updateSetting('weights', { ...DEFAULT_WEIGHTS });
    recalculateScores();
  }

  function handleRemoveLocation(id) {
    removeSavedLocation(id);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') onclose();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onclose();
  }

  const weightLabels = {
    sunshine: '☀️ Sunshine',
    precipitation: '🌧️ Precipitation',
    temperature: '🌡️ Temperature',
    wind: '💨 Wind',
    uv: '🔆 UV'
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
  <div class="modal" role="dialog" aria-label={t('settings.title')}>
    <div class="modal-header">
      <h2>{t('settings.title')}</h2>
      <button class="close-btn" onclick={onclose} aria-label={t('settings.close')}>✕</button>
    </div>

    <div class="modal-body">
      <!-- API Key -->
      <section class="section">
        <h3 class="section-title">{t('settings.apiKey')}</h3>
        <input type="text" class="api-input" bind:value={apiKey} placeholder={t('settings.apiKeyPlaceholder')} onblur={handleSaveKey} />
        <p class="help-text">{t('settings.apiKeyHelp')}</p>
      </section>

      <!-- Saved Locations -->
      <section class="section">
        <h3 class="section-title">{t('settings.savedLocations')}</h3>
        <ul class="loc-list">
          {#each settings.savedLocations as loc}
            <li class="loc-item">
              <span class="loc-name">{loc.id === settings.activeLocationId ? '📍' : '📌'} {loc.name}</span>
              {#if loc.id !== DEFAULT_LOCATION.id}
                <button class="loc-remove" onclick={() => handleRemoveLocation(loc.id)} aria-label="Remove {loc.name}">✕</button>
              {/if}
            </li>
          {/each}
        </ul>
      </section>

      <!-- Weather Weights -->
      <section class="section">
        <h3 class="section-title">{t('settings.weights')}</h3>
        {#each Object.entries(weights) as [key, value]}
          <div class="weight-row">
            <label class="weight-label" for="weight-{key}">{weightLabels[key] ?? key}</label>
            <input
              id="weight-{key}"
              type="range"
              min="0" max="100"
              value={Math.round(value * 100)}
              oninput={(e) => handleWeightChange(key, e.target.value / 100)}
              class="weight-slider"
            />
            <span class="weight-value">{Math.round(value * 100)}%</span>
          </div>
        {/each}
        <button class="reset-btn" onclick={resetWeights}>Reset to defaults</button>
      </section>

      <!-- Attribution -->
      <section class="section">
        <h3 class="section-title">Attribution</h3>
        <p class="attribution">{t('attribution.smhi')}</p>
        <p class="attribution">{t('attribution.yr')} — <a href="https://yr.no" target="_blank" rel="noopener">yr.no</a></p>
        <p class="attribution">{t('attribution.osm')}</p>
        <p class="attribution">{t('attribution.ors')}</p>
      </section>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed; inset: 0; background: var(--scrim); z-index: 2000;
    display: flex; align-items: center; justify-content: center; padding: var(--space-5);
  }
  .modal {
    background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 420px;
    max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg);
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between; padding: var(--space-4);
    border-bottom: 1px solid var(--border); position: sticky; top: 0;
    background: var(--surface); z-index: 1;
  }
  .modal-header h2 { margin: 0; font-size: var(--text-lg); }
  .close-btn {
    background: none; border: none; color: var(--text-dim); font-size: var(--text-lg); cursor: pointer;
    padding: var(--space-1); border-radius: var(--radius-sm);
    transition: background var(--duration-quick) var(--ease-move), color var(--duration-quick);
  }
  .close-btn:hover { color: var(--text); background: var(--surface-hover); }
  .close-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  .modal-body { padding: var(--space-4); }
  .section { margin-bottom: var(--space-5); }
  .section-title { font-size: var(--text-base); color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 var(--space-2); }
  .api-input {
    width: 100%; background: var(--surface2); color: var(--text); border: none;
    border-radius: var(--radius-sm); padding: var(--space-3); font-size: var(--text-base); outline: none; font-family: monospace; box-sizing: border-box;
    transition: outline-color var(--duration-quick);
  }
  .api-input:focus { outline: 2px solid var(--focus-ring); outline-offset: -1px; }
  .help-text { font-size: var(--text-sm); color: var(--text-dim); margin: var(--space-2) 0 0; }

  .loc-list { list-style: none; padding: 0; margin: 0; }
  .loc-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) 0; }
  .loc-name { font-size: var(--text-base); }
  .loc-remove {
    background: none; border: none; color: var(--text-dim); cursor: pointer;
    font-size: var(--text-base); padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm); transition: color var(--duration-quick), background var(--duration-quick);
  }
  .loc-remove:hover { color: var(--destructive); background: var(--surface-hover); }
  .loc-remove:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }

  .weight-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
  .weight-label { font-size: var(--text-base); width: 120px; flex-shrink: 0; }
  .weight-slider {
    flex: 1; height: 4px; appearance: none; background: var(--surface2); border-radius: 2px; outline: none; cursor: pointer;
  }
  .weight-slider::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); cursor: pointer; }
  .weight-value { font-size: var(--text-sm); color: var(--text-dim); width: 35px; text-align: right; }
  .reset-btn {
    background: var(--surface2); color: var(--text-dim); border: none; border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3); font-size: var(--text-sm); cursor: pointer; margin-top: var(--space-1);
    transition: color var(--duration-quick), background var(--duration-quick);
  }
  .reset-btn:hover { color: var(--text); background: var(--surface-pressed); }
  .reset-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }

  .attribution { font-size: var(--text-sm); color: var(--text-dim); margin: var(--space-1) 0; }
  .attribution a { color: var(--accent); text-decoration: none; }
  .attribution a:hover { color: var(--accent-hover); text-decoration: underline; }
</style>
