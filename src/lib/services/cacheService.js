import { CACHE_DURATIONS } from '../utils/constants.js';

const CACHE_PREFIX = 'we-cache-';

/**
 * Get cached value if not expired.
 * @param {string} key
 * @returns {any | null}
 */
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    const { data, expiry } = parsed;
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    // Invalidate stale weather cache that lacks period structure
    if (key.startsWith('weather:') && data && !data.today?.allDay) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
}

/**
 * Set cached value with TTL.
 * @param {string} key
 * @param {any} data
 * @param {number} ttlMs - Time to live in ms
 */
export function cacheSet(key, data, ttlMs) {
  try {
    const expiry = ttlMs === Infinity ? null : Date.now() + ttlMs;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiry }));
  } catch (e) {
    // WHY: Storage quota exceeded — clear old cache entries and retry once
    if (e.name === 'QuotaExceededError') {
      clearExpiredCache();
      try {
        const expiry = ttlMs === Infinity ? null : Date.now() + ttlMs;
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiry }));
      } catch {
        console.warn('Cache storage full, cannot cache:', key);
      }
    }
  }
}

/**
 * Invalidate a specific cache key.
 * @param {string} key
 */
export function cacheInvalidate(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * Clear all expired cache entries.
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(CACHE_PREFIX)) {
      try {
        const { expiry } = JSON.parse(localStorage.getItem(k));
        if (expiry && now > expiry) localStorage.removeItem(k);
      } catch {
        localStorage.removeItem(k);
      }
    }
  }
}

/**
 * Clear all weather and destination cache entries (force re-fetch).
 * WHY: destination cache is also cleared so changes to Overpass query logic
 * immediately take effect rather than waiting for the 24h TTL.
 */
export function clearWeatherCache() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(CACHE_PREFIX + 'weather:') || k?.startsWith(CACHE_PREFIX + 'dest')) {
      localStorage.removeItem(k);
    }
  }
}

/**
 * Build a cache key from components, rounding lat/lon to 2 decimals.
 * @param {string} prefix
 * @param  {...any} parts
 * @returns {string}
 */
export function buildCacheKey(prefix, ...parts) {
  const normalized = parts.map(p =>
    typeof p === 'number' ? p.toFixed(2) : String(p)
  );
  return `${prefix}:${normalized.join(':')}`;
}
