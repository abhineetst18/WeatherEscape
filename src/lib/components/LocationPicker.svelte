<script>
  import { settings } from '../stores/settingsStore.svelte.js';
  import { t } from '../stores/i18nStore.svelte.js';
  import { geocodePlace, useGpsLocation, setActiveLocation, addSavedLocation, removeSavedLocation } from '../services/locationService.js';
  import { DEFAULT_LOCATION } from '../utils/constants.js';

  let { onclose = () => {} } = $props();

  let searchQuery = $state('');
  let searchResults = $state([]);
  let searching = $state(false);
  let gpsLoading = $state(false);
  let gpsError = $state('');

  let searchTimeout;

  function handleSearchInput(e) {
    searchQuery = e.target.value;
    clearTimeout(searchTimeout);
    if (searchQuery.length >= 2) {
      searchTimeout = setTimeout(doSearch, 400);
    } else {
      searchResults = [];
    }
  }

  async function doSearch() {
    searching = true;
    searchResults = await geocodePlace(searchQuery);
    searching = false;
  }

  function selectSearchResult(result) {
    const newLoc = {
      id: crypto.randomUUID(),
      name: result.name,
      lat: result.lat,
      lon: result.lon,
      isDefault: false,
      source: 'search'
    };
    addSavedLocation(newLoc);
    setActiveLocation(newLoc.id);
    searchQuery = '';
    searchResults = [];
    onclose();
  }

  function selectSaved(id) {
    setActiveLocation(id);
    onclose();
  }

  async function handleGps() {
    gpsLoading = true;
    gpsError = '';
    try {
      await useGpsLocation();
      onclose();
    } catch {
      gpsError = t('location.gpsError');
    } finally {
      gpsLoading = false;
    }
  }

  function handleRemove(id) {
    removeSavedLocation(id);
  }
</script>

<div class="location-picker">
  <!-- GPS Button -->
  <button class="gps-btn" onclick={handleGps} disabled={gpsLoading}>
    {gpsLoading ? '📡' : '📍'} {t('location.useGps')}
  </button>
  {#if gpsError}
    <p class="error">{gpsError}</p>
  {/if}

  <!-- Search -->
  <div class="search-box">
    <input
      type="text"
      placeholder={t('location.search')}
      value={searchQuery}
      oninput={handleSearchInput}
      class="search-input"
    />
    {#if searching}
      <span class="search-spinner">⏳</span>
    {/if}
  </div>

  {#if searchResults.length > 0}
    <ul class="search-results">
      {#each searchResults as result}
        <li>
          <button class="result-btn" onclick={() => selectSearchResult(result)}>
            📌 {result.name}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Saved Locations -->
  <div class="saved-section">
    <h3 class="section-title">{t('location.saved')}</h3>
    <ul class="saved-list">
      {#each settings.savedLocations as loc}
        <li class="saved-item" class:active={loc.id === settings.activeLocationId}>
          <button class="saved-btn" onclick={() => selectSaved(loc.id)}>
            {loc.id === settings.activeLocationId ? '📍' : '📌'} {loc.name}
          </button>
          {#if loc.id !== DEFAULT_LOCATION.id && loc.id !== 'gps-current'}
            <button class="remove-btn" onclick={() => handleRemove(loc.id)} aria-label="Remove">✕</button>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .location-picker {
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .gps-btn {
    background: var(--surface2);
    color: var(--text);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    font-size: var(--text-base);
    cursor: pointer;
    text-align: center;
    transition: background var(--duration-quick) var(--ease-move);
  }
  .gps-btn:hover { background: var(--surface-pressed); }
  .gps-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
  .gps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .error { color: var(--destructive); font-size: var(--text-sm); margin: 0; }
  .search-box { position: relative; }
  .search-input {
    width: 100%;
    background: var(--surface2);
    color: var(--text);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    font-size: var(--text-base);
    outline: none;
    box-sizing: border-box;
  }
  .search-input:focus { outline: 2px solid var(--focus-ring); outline-offset: -1px; }
  .search-spinner { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); }
  .search-results {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--surface2);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .result-btn {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: var(--text);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
    cursor: pointer;
    transition: background var(--duration-quick) var(--ease-move);
  }
  .result-btn:hover { background: var(--surface-hover); }
  .result-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -1px; }
  .section-title { font-size: var(--text-base); color: var(--text-dim); margin: var(--space-1) 0; font-weight: var(--font-semibold); }
  .saved-list { list-style: none; padding: 0; margin: 0; }
  .saved-item {
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
  }
  .saved-item.active { background: var(--surface2); }
  .saved-btn {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    color: var(--text);
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-base);
    cursor: pointer;
    transition: background var(--duration-quick) var(--ease-move);
  }
  .saved-btn:hover { background: var(--surface-hover); }
  .saved-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -1px; }
  .remove-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-base);
    border-radius: var(--radius-sm);
    transition: color var(--duration-quick), background var(--duration-quick);
  }
  .remove-btn:hover { color: var(--destructive); background: var(--surface-hover); }
  .remove-btn:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 1px; }
</style>
