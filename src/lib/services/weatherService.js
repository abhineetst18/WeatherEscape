import { API_URLS, APP_INFO, CACHE_DURATIONS } from '../utils/constants.js';
import { cacheGet, cacheSet, cacheInvalidate, buildCacheKey } from './cacheService.js';
import { getForecastDates, parseSMHI, parseYR } from '../utils/weatherHelpers.js';

function sameDates(a, b) {
  return a?.today === b.today && a?.tomorrow === b.tomorrow;
}

function validDay(day) {
  function validPeriod(period) {
    return period &&
      [period.temperature, period.precipitation, period.cloudCover, period.windSpeed].every(Number.isFinite) &&
      (period.uvIndex === null || Number.isFinite(period.uvIndex)) &&
      typeof period.conditionCode === 'string';
  }
  return day === null || (validPeriod(day?.allDay) &&
    [day.morning, day.afternoon, day.evening].every(p => p === null || validPeriod(p)));
}

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
 * @returns {Promise<import('../types/index.js').Forecast | null>}
 */
export async function fetchWeather(lat, lon, dates = getForecastDates(), isCurrent = () => true) {
  const canUseResult = () => isCurrent() && sameDates(dates, getForecastDates());
  if (!canUseResult()) return null;
  const cacheKey = buildCacheKey('weather', lat.toFixed(4), lon.toFixed(4));
  const cached = cacheGet(cacheKey);
  const age = Date.now() - cached?.fetchedAt;
  if (sameDates(cached?.dates, dates) && Number.isFinite(cached.fetchedAt) &&
      age >= 0 && age < CACHE_DURATIONS.weather && (cached.today || cached.tomorrow) &&
      validDay(cached.today) && validDay(cached.tomorrow)) {
    return cached;
  }
  cacheInvalidate(cacheKey);

  const region = detectRegion(lat, lon);
  let result;

  try {
    if (region === 'smhi') {
      // Try SMHI first for Sweden, fall back to YR if unavailable
      try {
        result = await fetchSMHI(lat, lon, dates);
      } catch (smhiError) {
        if (!canUseResult()) return null;
        console.warn(`SMHI failed for ${lat},${lon}, falling back to YR:`, smhiError.message);
        result = await fetchYR(lat, lon, dates);
      }
    } else {
      result = await fetchYR(lat, lon, dates);
    }
    if (!canUseResult()) return null;
    const forecast = { ...result, dates, fetchedAt: Date.now() };
    // Let the UI distinguish an unavailable date from a request failure.
    if (forecast.today || forecast.tomorrow) cacheSet(cacheKey, forecast, CACHE_DURATIONS.weather);
    return forecast;
  } catch (e) {
    if (canUseResult()) console.warn(`Weather fetch failed for ${lat},${lon}:`, e.message);
    return null;
  }
}

/**
 * Fetch from SMHI API.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<import('../types/index.js').ForecastDays>}
 */
async function fetchSMHI(lat, lon, dates) {
  // SMHI requires lon/lat in URL path with max 6 decimals
  const url = `${API_URLS.smhi}/lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`SMHI ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return parseSMHI(data, dates);
}

/**
 * Fetch from YR (MET Norway) API.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<import('../types/index.js').ForecastDays>}
 */
async function fetchYR(lat, lon, dates) {
  const url = `${API_URLS.yr}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': APP_INFO.userAgent }
  });
  if (!res.ok) throw new Error(`YR ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return parseYR(data, dates);
}

/**
 * Fetch weather for multiple destinations in batch.
 * Uses progressive loading pattern — calls onResult for each completed fetch.
 * @param {Array<{lat: number, lon: number, id: string}>} destinations
 * @param {(id: string, weather: import('../types/index.js').Forecast | null) => void} onResult
 * @returns {Promise<void>}
 */
export async function fetchWeatherBatch(destinations, onResult, dates, isCurrent) {
  // Fetch in parallel with concurrency limit of 5
  const concurrency = 5;
  let i = 0;

  async function next() {
    while (i < destinations.length && isCurrent()) {
      const dest = destinations[i++];
      const result = await fetchWeather(dest.lat, dest.lon, dates, isCurrent);
      if (isCurrent()) onResult(dest.id, result);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, destinations.length) }, () => next());
  await Promise.all(workers);
}
