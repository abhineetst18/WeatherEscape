import { API_URLS, APP_INFO, CACHE_DURATIONS } from '../utils/constants.js';
import { cacheGet, cacheSet, buildCacheKey } from './cacheService.js';
import { parseSMHI, parseYR } from '../utils/weatherHelpers.js';

/**
 * Determine which weather API to use based on coordinates.
 * Currently using YR for all Nordic locations since SMHI API is unavailable.
 * @param {number} lat
 * @param {number} lon
 * @returns {'smhi' | 'yr'}
 */
export function detectRegion(lat, lon) {
  // WHY: SMHI API (opendata-download-metfcst.smhi.se) is currently returning 404s.
  // YR/MET Norway covers all of Scandinavia with CORS support, so use it universally.
  // When SMHI comes back, restore the region detection below:
  // if (lon >= 11.5 && !(lat < 56.5 && lon > 8 && lon < 15.5)) return 'smhi';
  return 'yr';
}

/**
 * Fetch weather for a location — auto-routes to correct API.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{today: import('../types/index.js').WeatherData, tomorrow: import('../types/index.js').WeatherData} | null>}
 */
export async function fetchWeather(lat, lon) {
  const cacheKey = buildCacheKey('weather', lat, lon);
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const region = detectRegion(lat, lon);
  let result;

  try {
    if (region === 'smhi') {
      // Try SMHI first for Sweden, fall back to YR if unavailable
      try {
        result = await fetchSMHI(lat, lon);
      } catch (smhiError) {
        console.warn(`SMHI failed for ${lat},${lon}, falling back to YR:`, smhiError.message);
        result = await fetchYR(lat, lon);
      }
    } else {
      result = await fetchYR(lat, lon);
    }
    if (result) {
      cacheSet(cacheKey, result, CACHE_DURATIONS.weather);
    }
    return result;
  } catch (e) {
    console.warn(`Weather fetch failed for ${lat},${lon}:`, e.message);
    return null;
  }
}

/**
 * Fetch from SMHI API.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{today: import('../types/index.js').WeatherData, tomorrow: import('../types/index.js').WeatherData}>}
 */
async function fetchSMHI(lat, lon) {
  // SMHI requires lon/lat in URL path with max 6 decimals
  const url = `${API_URLS.smhi}/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SMHI ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return parseSMHI(data);
}

/**
 * Fetch from YR (MET Norway) API.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{today: import('../types/index.js').WeatherData, tomorrow: import('../types/index.js').WeatherData}>}
 */
async function fetchYR(lat, lon) {
  const url = `${API_URLS.yr}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': APP_INFO.userAgent }
  });
  if (!res.ok) throw new Error(`YR ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return parseYR(data);
}

/**
 * Fetch weather for multiple destinations in batch.
 * Uses progressive loading pattern — calls onResult for each completed fetch.
 * @param {Array<{lat: number, lon: number, id: string}>} destinations
 * @param {(id: string, weather: {today: any, tomorrow: any} | null) => void} onResult
 * @returns {Promise<void>}
 */
export async function fetchWeatherBatch(destinations, onResult) {
  // Fetch in parallel with concurrency limit of 5
  const concurrency = 5;
  let i = 0;

  async function next() {
    while (i < destinations.length) {
      const dest = destinations[i++];
      const result = await fetchWeather(dest.lat, dest.lon);
      onResult(dest.id, result);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, destinations.length) }, () => next());
  await Promise.all(workers);
}
