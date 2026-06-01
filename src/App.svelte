<script>
  import { onMount } from 'svelte';
  import { settings, applyTheme } from './lib/stores/settingsStore.svelte.js';
  import { initI18n } from './lib/stores/i18nStore.svelte.js';
  import { weather, fetchBaseWeather, fetchDestinationWeather, toggleDay, setTimePeriod } from './lib/stores/weatherStore.svelte.js';
  import { clearExpiredCache, clearWeatherCache } from './lib/services/cacheService.js';
  import { discoverDestinations, fallbackDestinationsFor } from './lib/services/destinationService.js';
  import { queueDriveTime, estimateDriveTime, cancelQueuedRequests } from './lib/services/routingService.js';
  import Header from './lib/components/Header.svelte';
  import Map from './lib/components/Map.svelte';
  import DestinationPanel from './lib/components/DestinationPanel.svelte';
  import BottomSheet from './lib/components/BottomSheet.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';

  let mounted = $state(false);
  let showSettings = $state(false);
  let mapComponent = $state(null);
  let activeLoadId = 0;

  onMount(() => {
    applyTheme(settings.theme);
    initI18n(settings.locale).then(() => {
      mounted = true;
    });
    const handleOpenSettings = () => { showSettings = true; };
    const handleRefresh = () => { clearWeatherCache(); loadWeatherData(); };
    window.addEventListener('opensettings', handleOpenSettings);
    window.addEventListener('refreshweather', handleRefresh);
    return () => {
      window.removeEventListener('opensettings', handleOpenSettings);
      window.removeEventListener('refreshweather', handleRefresh);
    };
  });

  /** Keyboard shortcuts — only fire when not in an input/select and no modifier held */
  function handleKeydown(e) {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 't':
      case 'T':
        e.preventDefault();
        toggleDay();
        break;
      case '1':
        e.preventDefault();
        setTimePeriod('allDay');
        break;
      case '2':
        e.preventDefault();
        setTimePeriod('morning');
        break;
      case '3':
        e.preventDefault();
        setTimePeriod('afternoon');
        break;
      case '4':
        e.preventDefault();
        setTimePeriod('evening');
        break;
      case 'Escape':
        if (showSettings) {
          e.preventDefault();
          showSettings = false;
        }
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        clearWeatherCache();
        loadWeatherData();
        break;
    }
  }

  async function loadWeatherData() {
    const loadId = ++activeLoadId;
    cancelQueuedRequests(); // Discard stale ORS requests from previous loads
    const loc = settings.savedLocations.find(l => l.id === settings.activeLocationId);
    if (!loc) return;

    // 1. Fetch base weather (passes loadId so it can abort stale writes)
    await fetchBaseWeather(loadId, () => activeLoadId);
    if (loadId !== activeLoadId) return; // Stale load — bail

    // Abort if base fetch failed
    if (!weather.base) return;

    // 2. Discover destinations
    const radiusKm = (settings.drivingRadiusMinutes / 60) * 70;
    let destinations = await discoverDestinations(loc.lat, loc.lon, radiusKm);
    console.log('[loadWeatherData] radiusKm:', radiusKm, 'found:', destinations?.length);
    if ((!destinations || destinations.length === 0)) {
      console.warn('[loadWeatherData] discoverDestinations returned none, loading curated fallback');
      destinations = fallbackDestinationsFor(loc.lat, loc.lon, radiusKm);
      console.log('[loadWeatherData] fallback count:', destinations.length);
    }
    if (loadId !== activeLoadId) return;

    // 3. Estimate drive times
    for (const dest of destinations) {
      const est = estimateDriveTime(loc.lat, loc.lon, dest.lat, dest.lon);
      dest.driveTimeMinutes = est.durationMinutes;
      dest.driveDistanceKm = est.distanceKm;
      dest.isEstimate = est.isEstimate;
    }

    // 4. Filter by actual drive time — allow 20% tolerance since haversine is an underestimate
    const withinRadius = destinations.filter(d => d.driveTimeMinutes <= settings.drivingRadiusMinutes * 1.2);

    // 5. Fetch weather for all destinations
    await fetchDestinationWeather(withinRadius, loadId, () => activeLoadId);
    if (loadId !== activeLoadId) return;

    // 6. Queue actual drive times via ORS (if key available)
    if (settings.openRouteServiceKey) {
      for (const dest of weather.destinations.slice(0, 10)) {
        queueDriveTime(loc.lat, loc.lon, dest.lat, dest.lon).then(result => {
          if (loadId !== activeLoadId) return; // Stale — ignore
          if (result) {
            const idx = weather.destinations.findIndex(d => d.id === dest.id);
            if (idx >= 0) {
              weather.destinations[idx] = {
                ...weather.destinations[idx],
                driveTimeMinutes: result.durationMinutes,
                driveDistanceKm: result.distanceKm,
                isEstimate: result.isEstimate
              };
            }
          }
        });
      }
    }
  }

  // React to location or radius changes (single trigger point for data loading)
  $effect(() => {
    const _locId = settings.activeLocationId;
    const _radius = settings.drivingRadiusMinutes;
    if (mounted) {
      loadWeatherData();
    }
  });

  function handleSelectDestination(dest) {
    mapComponent?.centerOnDestination(dest);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app" data-theme={settings.theme}>
  {#if mounted}
    <Header />
    <main class="app-map">
      <Map bind:this={mapComponent} />
      <BottomSheet ariaLabel="Destinations">
        <DestinationPanel onSelectDestination={handleSelectDestination} />
      </BottomSheet>
    </main>
    {#if showSettings}
      <SettingsModal onclose={() => showSettings = false} />
    {/if}
  {:else}
    <div class="loading">
      <p>Loading WeatherEscape...</p>
    </div>
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
  }

  .app-map {
    flex: 1;
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    font-size: 16px;
  }
</style>
