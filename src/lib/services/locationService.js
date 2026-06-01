import { settings, updateSetting } from '../stores/settingsStore.svelte.js';
import { DEFAULT_LOCATION } from '../utils/constants.js';

/**
 * Get current GPS position.
 * @returns {Promise<{lat: number, lon: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/**
 * Add a saved location.
 * @param {import('../types/index.js').Location} location
 */
export function addSavedLocation(location) {
  const locations = [...settings.savedLocations, location];
  updateSetting('savedLocations', locations);
}

/**
 * Remove a saved location by ID.
 * @param {string} id
 */
export function removeSavedLocation(id) {
  // INVARIANT: Default location cannot be removed
  if (id === DEFAULT_LOCATION.id) return;
  const locations = settings.savedLocations.filter(l => l.id !== id);
  updateSetting('savedLocations', locations);
  if (settings.activeLocationId === id) {
    updateSetting('activeLocationId', locations[0]?.id ?? DEFAULT_LOCATION.id);
  }
}

/**
 * Set the active base location.
 * @param {string} id
 */
export function setActiveLocation(id) {
  updateSetting('activeLocationId', id);
}

/**
 * Set GPS as the active location.
 * @returns {Promise<import('../types/index.js').Location>}
 */
export async function useGpsLocation() {
  const pos = await getCurrentPosition();
  const gpsLocation = {
    id: 'gps-current',
    name: 'Current Location',
    lat: pos.lat,
    lon: pos.lon,
    isDefault: false,
    source: 'gps'
  };
  // WHY: Replace existing GPS location entry rather than duplicating
  const locations = settings.savedLocations.filter(l => l.id !== 'gps-current');
  locations.unshift(gpsLocation);
  updateSetting('savedLocations', locations);
  updateSetting('activeLocationId', 'gps-current');
  return gpsLocation;
}

/**
 * Geocode a place name using Nominatim (free).
 * @param {string} query
 * @returns {Promise<Array<{name: string, lat: number, lon: number}>>}
 */
export async function geocodePlace(query) {
  if (!query || query.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=se,no,dk`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WeatherEscape/0.1.0' }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(r => ({
    name: r.display_name.split(',').slice(0, 2).join(','),
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon)
  }));
}
