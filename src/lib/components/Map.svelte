<script>
  import { onMount } from 'svelte';
  import { settings, updateSetting } from '../stores/settingsStore.svelte.js';
  import { weather } from '../stores/weatherStore.svelte.js';
  import { MAP_DEFAULTS, MAP_ATTRIBUTION } from '../utils/constants.js';
  import { getTileUrl, getQualityColor, formatDriveTime } from '../utils/mapHelpers.js';
  import { getWeatherEmoji } from '../utils/weatherHelpers.js';
  import { fetchIsochrone } from '../services/routingService.js';

  /** Escape HTML to prevent XSS from external data (OSM names, user input). */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  let mapContainer;
  let map = $state(null);
  let tileLayer = $state(null);
  let baseMarker = $state(null);
  let isochroneLayer = $state(null);
  let isochroneRequestId = 0;

  /** @type {import('leaflet')} */
  let L;
  let resizeObserver = null;

  onMount(() => {
    // Start async init but return synchronous cleanup
    initMap();
    return () => {
      resizeObserver?.disconnect();
      map?.remove();
    };
  });

  async function initMap() {
    L = await import('leaflet');

    const loc = settings.savedLocations.find(l => l.id === settings.activeLocationId)
      ?? { lat: MAP_DEFAULTS.center[0], lon: MAP_DEFAULTS.center[1], name: 'Base' };

    map = L.map(mapContainer, {
      center: [loc.lat, loc.lon],
      zoom: MAP_DEFAULTS.zoom,
      minZoom: MAP_DEFAULTS.minZoom,
      maxZoom: MAP_DEFAULTS.maxZoom,
      zoomControl: true
    });

    tileLayer = L.tileLayer(getTileUrl(settings.theme), {
      attribution: MAP_ATTRIBUTION,
      maxZoom: MAP_DEFAULTS.maxZoom
    }).addTo(map);

    const baseIcon = L.divIcon({
      className: 'base-marker',
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#e94560;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    baseMarker = L.marker([loc.lat, loc.lon], { icon: baseIcon })
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(loc.name ?? 'Base')}</strong><br>Your base location`);

    resizeObserver = new ResizeObserver(() => {
      try { map?.invalidateSize(); } catch (e) { /* Leaflet timing */ }
    });
    resizeObserver.observe(mapContainer);

    buildRadiusControl();
  }

  // Theme tile switching
  $effect(() => {
    try {
      const theme = settings.theme;
      if (tileLayer && map) tileLayer.setUrl(getTileUrl(theme));
    } catch (e) { console.warn('Map theme effect error:', e.message); }
  });

  // React to location change
  $effect(() => {
    try {
      const locId = settings.activeLocationId;
      const loc = settings.savedLocations.find(l => l.id === locId);
      if (loc && map && baseMarker) {
        map.setView([loc.lat, loc.lon], MAP_DEFAULTS.zoom);
        baseMarker.setLatLng([loc.lat, loc.lon]);
        baseMarker.setPopupContent(`<strong>${escapeHtml(loc.name ?? 'Base')}</strong><br>Your base location`);
      }
    } catch (e) { console.warn('Map location effect error:', e.message); }
  });

  // Isochrone overlay
  $effect(() => {
    try {
      const locId = settings.activeLocationId;
      const radius = settings.drivingRadiusMinutes;
      const loc = settings.savedLocations.find(l => l.id === locId);
      if (loc && map && L) {
        loadIsochrone(loc.lat, loc.lon, radius * 60);
      }
    } catch (e) { console.warn('Map isochrone effect error:', e.message); }
  });

  async function loadIsochrone(lat, lon, rangeSeconds) {
    const requestId = ++isochroneRequestId;
    if (isochroneLayer && map) {
      map.removeLayer(isochroneLayer);
      isochroneLayer = null;
    }
    const feature = await fetchIsochrone(lat, lon, rangeSeconds);
    if (requestId !== isochroneRequestId) return; // Stale request
    if (feature && map && L) {
      isochroneLayer = L.geoJSON(feature, {
        style: { color: '#e94560', weight: 2, fillColor: '#e94560', fillOpacity: 0.08 }
      }).addTo(map);
    }
  }

  let radiusControl = null;
  let radiusLabel = null;

  function buildRadiusControl() {
    if (!L || !map) return;
    if (radiusControl) {
      map.removeControl(radiusControl);
    }
    const RadiusControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const wrap = L.DomUtil.create('div', 'leaflet-bar leaflet-control radius-control-mobile');
        L.DomEvent.disableClickPropagation(wrap);

        const btnPlus = L.DomUtil.create('a', '', wrap);
        btnPlus.innerHTML = '+';
        btnPlus.href = '#';
        btnPlus.title = 'Increase driving radius';
        btnPlus.setAttribute('role', 'button');
        btnPlus.setAttribute('aria-label', 'Increase driving radius');
        L.DomEvent.on(btnPlus, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          adjustRadius(1);
        });

        const lbl = L.DomUtil.create('a', 'radius-label-cell', wrap);
        lbl.style.cursor = 'default';
        lbl.style.pointerEvents = 'none';
        lbl.title = 'Driving radius (minutes)';
        lbl.innerHTML = `${settings.drivingRadiusMinutes}<br><span style="font-size:9px;line-height:1;">min</span>`;
        radiusLabel = lbl;

        const btnMinus = L.DomUtil.create('a', '', wrap);
        btnMinus.innerHTML = '&#8722;';
        btnMinus.href = '#';
        btnMinus.title = 'Decrease driving radius';
        btnMinus.setAttribute('role', 'button');
        btnMinus.setAttribute('aria-label', 'Decrease driving radius');
        L.DomEvent.on(btnMinus, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          adjustRadius(-1);
        });

        return wrap;
      }
    });
    radiusControl = new RadiusControl();
    radiusControl.addTo(map);
  }

  function adjustRadius(delta) {
    const step = 15;
    const next = Math.max(15, Math.min(300, Number(settings.drivingRadiusMinutes) + delta * step));
    updateSetting('drivingRadiusMinutes', next);
    if (radiusLabel) {
      radiusLabel.innerHTML = `${next}<br><span style="font-size:9px;line-height:1;">min</span>`;
    }
    try { window.dispatchEvent(new Event('refreshweather')); } catch {}
  }

  // Keep label in sync if settings change externally
  $effect(() => {
    const r = settings.drivingRadiusMinutes;
    if (radiusLabel) {
      radiusLabel.innerHTML = `${r}<br><span style="font-size:9px;line-height:1;">min</span>`;
    }
  });

  export function getLeaflet() { return L; }

  let destinationMarkers = null;

  // Destination markers
  $effect(() => {
    const dests = weather.destinations;
    if (!map || !L) return;

    try {
    if (destinationMarkers) {
      map.removeLayer(destinationMarkers);
    }

    if (!dests || dests.length === 0) return;

    destinationMarkers = L.layerGroup();

    for (const dest of dests) {
      if (dest.qualityScore == null) continue;
      const color = getQualityColor(dest.qualityScore);
      const icon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const popupContent = `
        <div style="min-width:160px;">
          <strong>${escapeHtml(dest.name)}</strong> <span style="color:${color}; font-weight:700;">${dest.qualityScore}/100</span>
          ${dest.weather ? `
            <div style="margin-top:4px;font-size:12px;">
              ${getWeatherEmoji(dest.weather.conditionCode)} ${dest.weather.temperature}°C
              ${dest.delta ? `<span style="color:${dest.delta.temperature > 0 ? '#00b894' : '#e17055'}">(${dest.delta.temperature > 0 ? '+' : ''}${dest.delta.temperature}°)</span>` : ''}
            </div>
            <div style="font-size:11px;color:#888;">
              💧 ${dest.weather.precipitation}mm · 💨 ${dest.weather.windSpeed}m/s · ☁ ${dest.weather.cloudCover}%
            </div>
          ` : ''}
          ${dest.driveTimeMinutes ? `<div style="font-size:11px;color:#888;margin-top:2px;">🚗 ${formatDriveTime(dest.driveTimeMinutes)}</div>` : ''}
        </div>
      `;

      L.marker([dest.lat, dest.lon], { icon })
        .bindPopup(popupContent)
        .addTo(destinationMarkers);
    }

    destinationMarkers.addTo(map);
    } catch (e) { console.warn('Map markers effect error:', e.message); }
  });

  export function centerOnDestination(dest) {
    if (!map) return;
    map.setView([dest.lat, dest.lon], 12);
    // Open popup for this marker
    if (destinationMarkers) {
      destinationMarkers.eachLayer(layer => {
        if (layer.getLatLng &&
            Math.abs(layer.getLatLng().lat - dest.lat) < 0.001 &&
            Math.abs(layer.getLatLng().lng - dest.lon) < 0.001) {
          layer.openPopup();
        }
      });
    }
  }
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
  }

  /* Radius control: matches Leaflet zoom button style, hidden on desktop */
  :global(.radius-control-mobile) {
    display: none;
  }
  :global(.radius-control-mobile a) {
    background: var(--surface) !important;
    color: var(--text) !important;
    border-color: rgba(255,255,255,0.1) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    text-decoration: none !important;
    width: 34px !important;
    height: 34px !important;
  }
  :global(.radius-control-mobile .radius-label-cell) {
    font-size: 13px !important;
    font-weight: 700 !important;
    height: auto !important;
    min-height: 44px !important;
    text-align: center !important;
    line-height: 1.3 !important;
    padding: 6px 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :global([data-theme="light"] .radius-control-mobile a) {
    border-color: rgba(0,0,0,0.2) !important;
  }
  /* Show only on mobile */
  @media (max-width: 767px) {
    :global(.radius-control-mobile) {
      display: block;
    }
  }
  :global(.leaflet-control-zoom a) {
    background: var(--surface) !important;
    color: var(--text) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }

  :global([data-theme="light"] .leaflet-control-zoom a) {
    border-color: rgba(0, 0, 0, 0.2) !important;
  }
  :global(.leaflet-control-attribution) {
    background: rgba(0, 0, 0, 0.5) !important;
    color: #aaa !important;
    font-size: 9px !important;
  }
  :global(.leaflet-control-attribution a) {
    color: #ccc !important;
  }
  :global([data-theme="light"] .leaflet-control-attribution) {
    background: rgba(255, 255, 255, 0.8) !important;
    color: #666 !important;
  }
  :global([data-theme="light"] .leaflet-control-attribution a) {
    color: #333 !important;
  }
</style>
