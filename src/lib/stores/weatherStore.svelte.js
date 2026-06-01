import { settings } from './settingsStore.svelte.js';
import { fetchWeather, fetchWeatherBatch } from '../services/weatherService.js';
import { calculateDelta } from '../utils/weatherHelpers.js';
import { calculateQualityScore } from '../services/scoringService.js';

/** @type {{ base: {today: any, tomorrow: any} | null, destinations: any[], loading: boolean, error: string | null, day: 'today' | 'tomorrow', timePeriod: 'allDay' | 'morning' | 'afternoon' | 'evening', lastFetched: number | null }} */
export const weather = $state({
  base: null,
  destinations: [],
  loading: false,
  error: null,
  day: 'today',
  timePeriod: 'allDay',
  lastFetched: null
});

/**
 * Get weather data for a specific day + time period.
 * @param {{ today: any, tomorrow: any }} data
 * @param {'today'|'tomorrow'} day
 * @param {'allDay'|'morning'|'afternoon'|'evening'} period
 * @returns {any}
 */
function getPeriodWeather(data, day, period) {
  if (!data) return null;
  const dayData = day === 'today' ? data.today : data.tomorrow;
  return dayData?.[period] ?? null;
}

/**
 * Get weather data for the currently selected day + time period.
 * @param {{ today: any, tomorrow: any }} data
 * @returns {any}
 */
function getSelectedWeather(data) {
  return getPeriodWeather(data, weather.day, weather.timePeriod);
}

/**
 * Fetch weather for the active base location.
 * @param {number} [loadId] - If provided, aborts state write if a newer load has started.
 * @param {() => number} [getActiveLoadId] - Callback to get the current active load id.
 */
export async function fetchBaseWeather(loadId, getActiveLoadId) {
  const loc = settings.savedLocations.find(l => l.id === settings.activeLocationId);
  if (!loc) return;

  weather.loading = true;
  weather.error = null;

  try {
    const result = await fetchWeather(loc.lat, loc.lon);
    // WHY: bail if a newer load superseded this one during the await
    if (loadId !== undefined && getActiveLoadId?.() !== loadId) return;
    if (!result) {
      weather.error = 'Weather data unavailable. Check your connection.';
      return;
    }
    weather.base = result;
    weather.lastFetched = Date.now();
  } catch (e) {
    weather.error = e.message;
  } finally {
    // Only clear loading flag if we are still the active load
    if (loadId === undefined || getActiveLoadId?.() === loadId) {
      weather.loading = false;
    }
  }
}

/**
 * Fetch weather for all destinations and calculate scores.
 * @param {Array<import('../types/index.js').Destination>} destinations
 * @param {number} [loadId] - If provided, aborts state writes if a newer load has started.
 * @param {() => number} [getActiveLoadId] - Callback to get the current active load id.
 */
export async function fetchDestinationWeather(destinations, loadId, getActiveLoadId) {
  if (!weather.base) return;

  weather.loading = true;
  weather.destinations = destinations.map(d => ({
    ...d, weather: null, weatherToday: null, weatherTomorrow: null, delta: null, qualityScore: null
  }));

  // WHY: snapshot day+period at batch start so mid-flight toggles don't mix
  // a stale base snapshot with a new period for destination callbacks.
  const snapshotDay = weather.day;
  const snapshotPeriod = weather.timePeriod;
  const baseWeather = getPeriodWeather(weather.base, snapshotDay, snapshotPeriod);

  await fetchWeatherBatch(
    destinations.map(d => ({ lat: d.lat, lon: d.lon, id: d.id })),
    (id, result) => {
      // WHY: drop callback if a newer load superseded this one
      if (loadId !== undefined && getActiveLoadId?.() !== loadId) return;
      const idx = weather.destinations.findIndex(d => d.id === id);
      if (idx === -1 || !result) return;

      const destWeather = getPeriodWeather(result, snapshotDay, snapshotPeriod);
      const delta = baseWeather && destWeather ? calculateDelta(baseWeather, destWeather) : null;
      const qualityScore = delta ? calculateQualityScore(delta, settings.weights) : null;

      weather.destinations[idx] = {
        ...weather.destinations[idx],
        weatherToday: result.today,
        weatherTomorrow: result.tomorrow,
        weather: destWeather,
        delta,
        qualityScore
      };
    }
  );

  if (loadId === undefined || getActiveLoadId?.() === loadId) {
    // Sort by quality score descending
    weather.destinations.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    weather.loading = false;
  }
}

/**
 * Toggle between today and tomorrow forecasts.
 * Recalculates all deltas and scores.
 */
export function toggleDay() {
  weather.day = weather.day === 'today' ? 'tomorrow' : 'today';
  recalculateScores();
}

/**
 * Set the time period and recalculate scores.
 * @param {'allDay' | 'morning' | 'afternoon' | 'evening'} period
 */
export function setTimePeriod(period) {
  weather.timePeriod = period;
  recalculateScores();
}

/**
 * Recalculate all deltas and scores (e.g., after weight, day, or period change).
 */
export function recalculateScores() {
  if (!weather.base) return;
  const baseWeather = getSelectedWeather(weather.base);

  // If base has no data for this period, clear all destination weather
  if (!baseWeather) {
    weather.destinations = weather.destinations.map(d => ({
      ...d, weather: null, delta: null, qualityScore: null
    }));
    return;
  }

  weather.destinations = weather.destinations.map(d => {
    const dayData = weather.day === 'today' ? d.weatherToday : d.weatherTomorrow;
    const destWeather = dayData?.[weather.timePeriod] ?? null;
    if (!destWeather) return { ...d, weather: null, delta: null, qualityScore: null };
    const delta = calculateDelta(baseWeather, destWeather);
    const qualityScore = calculateQualityScore(delta, settings.weights);
    return { ...d, weather: destWeather, delta, qualityScore };
  }).sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
}
