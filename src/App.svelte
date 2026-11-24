<script>
  import { onMount, untrack } from 'svelte';
  import { settings, applyTheme } from './lib/stores/settingsStore.svelte.js';
  import { initI18n } from './lib/stores/i18nStore.svelte.js';
  import { weather, loadForecast, toggleDay, setTimePeriod } from './lib/stores/weatherStore.svelte.js';
  import { clearWeatherCache } from './lib/services/cacheService.js';
  import { getForecastDates } from './lib/utils/weatherHelpers.js';
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
  let loadDate;

  function refreshWeather() {
    clearWeatherCache();
    loadWeatherData();
  }

  onMount(() => {
    applyTheme(settings.theme);
    initI18n(settings.locale).then(() => {
      mounted = true;
    });
    const handleOpenSettings = () => { showSettings = true; };
    let midnightTimer;
    function checkDate() {
      clearTimeout(midnightTimer);
      if (mounted && loadDate !== getForecastDates().today) loadWeatherData();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      midnightTimer = setTimeout(checkDate, Math.max(1, midnight.getTime() - Date.now()));
    }
    checkDate();
    window.addEventListener('opensettings', handleOpenSettings);
    window.addEventListener('refreshweather', refreshWeather);
    window.addEventListener('focus', checkDate);
    window.addEventListener('pageshow', checkDate);
    document.addEventListener('visibilitychange', checkDate);
    return () => {
      activeLoadId++;
      cancelQueuedRequests();
      clearTimeout(midnightTimer);
      window.removeEventListener('opensettings', handleOpenSettings);
      window.removeEventListener('refreshweather', refreshWeather);
      window.removeEventListener('focus', checkDate);
      window.removeEventListener('pageshow', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
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
        refreshWeather();
        break;
    }
  }

  function activeLocation() {
    return settings.savedLocations.find(l => l.id === settings.activeLocationId);
  }

  function loadWeatherData(loc = activeLocation(), radius = settings.drivingRadiusMinutes) {
    const loadId = ++activeLoadId;
    cancelQueuedRequests(); // Discard stale ORS requests from previous loads
    const location = loc ? { id: loc.id, lat: loc.lat, lon: loc.lon } : null;
    const dates = getForecastDates();
    loadDate = dates.today;
    const ownsLoad = () => {
      if (activeLoadId !== loadId || settings.drivingRadiusMinutes !== radius) return false;
      const current = activeLocation();
      return current?.id === location?.id && current?.lat === location?.lat && current?.lon === location?.lon;
    };
    return loadForecast({
      location, dates, ownsLoad,
      discover: isCurrent => findDestinations(location, radius, isCurrent),
      getDriveTime: settings.openRouteServiceKey
        ? dest => queueDriveTime(location.lat, location.lon, dest.lat, dest.lon)
        : null
    });
  }

  async function findDestinations(loc, radius, isCurrent) {
    const radiusKm = (radius / 60) * 70;
    let destinations = await discoverDestinations(loc.lat, loc.lon, radiusKm);
    if (!isCurrent()) return [];
    console.log('[loadWeatherData] radiusKm:', radiusKm, 'found:', destinations?.length);
    if ((!destinations || destinations.length === 0)) {
      console.warn('[loadWeatherData] discoverDestinations returned none, loading curated fallback');
      destinations = fallbackDestinationsFor(loc.lat, loc.lon, radiusKm);
      console.log('[loadWeatherData] fallback count:', destinations.length);
    }

    // 3. Estimate drive times
    for (const dest of destinations) {
      const est = estimateDriveTime(loc.lat, loc.lon, dest.lat, dest.lon);
      dest.driveTimeMinutes = est.durationMinutes;
      dest.driveDistanceKm = est.distanceKm;
      dest.isEstimate = est.isEstimate;
    }

    // 4. Filter by drive time — allow 20% tolerance. If filter removes everything
    // (can happen on mobile with different GPS location or tight radius), use all.
    let withinRadius = destinations.filter(d => d.driveTimeMinutes <= radius * 1.2);
    if (withinRadius.length === 0 && destinations.length > 0) {
      console.warn('[loadWeatherData] radius filter removed all destinations, using unfiltered list');
      withinRadius = destinations;
    }

    return withinRadius;
  }

  // React to location or radius changes (single trigger point for data loading)
  $effect.pre(() => {
    if (!mounted) return;
    const loc = activeLocation();
    const location = loc ? { id: loc.id, lat: loc.lat, lon: loc.lon } : null;
    const radius = settings.drivingRadiusMinutes;
    untrack(() => loadWeatherData(location, radius));
  });

  function handleSelectDestination(dest) {
    mapComponent?.centerOnDestination(dest);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app" data-theme={settings.theme}>
  {#if mounted}
    <Header />
    {#if weather.loading}
      <div class="loading-bar"><div class="loading-bar-inner"></div></div>
    {/if}
    <main class="app-map">
      <Map bind:this={mapComponent} />
      <BottomSheet ariaLabel="Destinations">
        {#snippet label()}
          Destinations
          {#if weather.destinations?.length > 0}
            <span style="font-weight:400;font-size:11px;color:var(--text-dim);margin-left:4px;">({weather.destinations.filter(d => d.qualityScore != null).length})</span>
          {/if}
        {/snippet}
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

  /* Reserve space so the fixed bottom sheet handle doesn't cover the map */
  @media (max-width: 767px) {
    .app-map { padding-bottom: 44px; }
  }

  .loading-bar {
    height: 3px;
    background: var(--surface2, rgba(255,255,255,0.08));
    flex-shrink: 0;
    overflow: hidden;
    z-index: 100;
  }
  .loading-bar-inner {
    height: 100%;
    width: 40%;
    background: var(--accent, #e94560);
    border-radius: 2px;
    animation: loadslide 1.2s ease-in-out infinite;
  }
  @keyframes loadslide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
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
