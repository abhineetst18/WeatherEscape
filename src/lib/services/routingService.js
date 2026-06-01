import { settings } from '../stores/settingsStore.svelte.js';
import { API_URLS, CACHE_DURATIONS } from '../utils/constants.js';
import { cacheGet, cacheSet, buildCacheKey } from './cacheService.js';

/**
 * Fetch isochrone polygon for driving time from a location.
 * @param {number} lat
 * @param {number} lon
 * @param {number} rangeSeconds - Driving time in seconds
 * @returns {Promise<GeoJSON.Feature | null>}
 */
export async function fetchIsochrone(lat, lon, rangeSeconds) {
  const cacheKey = buildCacheKey('iso', lat, lon, rangeSeconds);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const apiKey = settings.openRouteServiceKey;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${API_URLS.ors}/v2/isochrones/driving-car`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [[lon, lat]],
        range: [rangeSeconds],
        range_type: 'time'
      })
    });
    if (!res.ok) throw new Error(`ORS isochrone: ${res.status}`);
    const data = await res.json();
    const feature = data.features?.[0] ?? null;
    if (feature) cacheSet(cacheKey, feature, CACHE_DURATIONS.isochrone);
    return feature;
  } catch (e) {
    console.warn('Isochrone fetch failed:', e.message);
    return null;
  }
}

/**
 * Fetch driving time and distance between two points.
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @returns {Promise<{durationMinutes: number, distanceKm: number, isEstimate: boolean}>}
 */
export async function fetchDriveTime(fromLat, fromLon, toLat, toLon) {
  const cacheKey = buildCacheKey('route', fromLat, fromLon, toLat, toLon);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const apiKey = settings.openRouteServiceKey;
  if (!apiKey) {
    return estimateDriveTime(fromLat, fromLon, toLat, toLon);
  }

  try {
    const res = await fetch(
      `${API_URLS.ors}/v2/directions/driving-car?start=${fromLon},${fromLat}&end=${toLon},${toLat}`,
      { headers: { 'Authorization': apiKey } }
    );
    if (!res.ok) throw new Error(`ORS directions: ${res.status}`);
    const data = await res.json();
    const segment = data.features?.[0]?.properties?.segments?.[0];
    const result = {
      durationMinutes: segment ? Math.round(segment.duration / 60) : 0,
      distanceKm: segment ? Math.round(segment.distance / 100) / 10 : 0,
      isEstimate: false
    };
    cacheSet(cacheKey, result, CACHE_DURATIONS.isochrone);
    return result;
  } catch (e) {
    console.warn('Drive time fetch failed, using estimate:', e.message);
    return estimateDriveTime(fromLat, fromLon, toLat, toLon);
  }
}

/**
 * Estimate drive time using haversine distance × 1.3 factor.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {{durationMinutes: number, distanceKm: number, isEstimate: boolean}}
 */
export function estimateDriveTime(lat1, lon1, lat2, lon2) {
  const km = haversineDistance(lat1, lon1, lat2, lon2);
  // WHY: 1.5 road factor for coastal/archipelago regions (Gothenburg west coast)
  // where roads detour around fjords and inlets — 1.3 was too aggressive
  const driveKm = km * 1.5;
  const avgSpeedKmh = 70;
  const minutes = Math.round((driveKm / avgSpeedKmh) * 60);
  return { durationMinutes: minutes, distanceKm: Math.round(driveKm * 10) / 10, isEstimate: true };
}

/**
 * Calculate haversine distance between two lat/lon points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in km
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ORS request queue to respect rate limits (40 req/min).
 * @type {Array<{resolve: Function, fn: Function}>}
 */
const requestQueue = [];
let processingQueue = false;
let queueGeneration = 0;
// NOTE: ~40 req/min ORS free tier limit
const MIN_INTERVAL = 1500;

/**
 * Cancel all pending queued requests (e.g., on location change).
 * In-flight request completes but result is discarded.
 */
export function cancelQueuedRequests() {
  queueGeneration++;
  // Resolve all pending with null so callers don't hang
  while (requestQueue.length > 0) {
    const { resolve } = requestQueue.shift();
    resolve(null);
  }
}

async function processQueue() {
  if (processingQueue) return;
  processingQueue = true;
  while (requestQueue.length > 0) {
    const { resolve, fn, generation } = requestQueue.shift();
    if (generation !== queueGeneration) {
      resolve(null); // stale — skip
      continue;
    }
    try {
      const result = await fn();
      resolve(result);
    } catch {
      resolve(null);
    }
    if (requestQueue.length > 0) {
      await new Promise(r => setTimeout(r, MIN_INTERVAL));
    }
  }
  processingQueue = false;
}

/**
 * Queue a drive time request to respect rate limits.
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @returns {Promise<{durationMinutes: number, distanceKm: number, isEstimate: boolean}>}
 */
export function queueDriveTime(fromLat, fromLon, toLat, toLon) {
  return new Promise(resolve => {
    requestQueue.push({
      resolve,
      fn: () => fetchDriveTime(fromLat, fromLon, toLat, toLon),
      generation: queueGeneration
    });
    processQueue();
  });
}
