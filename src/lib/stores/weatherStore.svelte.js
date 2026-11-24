import { settings } from './settingsStore.svelte.js';
import { fetchWeather, fetchWeatherBatch } from '../services/weatherService.js';
import { calculateDelta, getForecastDates } from '../utils/weatherHelpers.js';
import { calculateQualityScore } from '../services/scoringService.js';

/** @type {{ base: import('../types/index.js').Forecast | null, dates: import('../types/index.js').ForecastDates | null, destinations: any[], loading: boolean, error: string | null, day: 'today' | 'tomorrow', timePeriod: 'allDay' | 'morning' | 'afternoon' | 'evening', lastFetched: number | null }} */
export const weather = $state({
  base: null,
  dates: null,
  destinations: [],
  loading: false,
  error: null,
  day: 'today',
  timePeriod: 'allDay',
  lastFetched: null
});

export function getSelectedBaseWeather() {
  return weather.base?.[weather.day]?.[weather.timePeriod] ?? null;
}

function scoreDestination(destination) {
  const base = getSelectedBaseWeather();
  const forecast = destination.forecast;
  const day = weather.day;
  const selected = forecast?.dates[day] === weather.base?.dates[day]
    ? forecast?.[day]?.[weather.timePeriod] ?? null
    : null;
  const delta = calculateDelta(base, selected);
  return {
    ...destination,
    weather: delta ? selected : null,
    delta,
    qualityScore: delta ? calculateQualityScore(delta, settings.weights) : null
  };
}

function scoreOrder(a, b) {
  return (b.qualityScore ?? -1) - (a.qualityScore ?? -1);
}

/**
 * Replace the previous forecast immediately. App supplies the load owner and
 * the discovery/routing functions bound to the same location and radius.
 */
export async function loadForecast({ location, dates, ownsLoad, discover, getDriveTime }) {
  const isCurrent = () => {
    if (!ownsLoad()) return false;
    const current = getForecastDates();
    return dates.today === current.today && dates.tomorrow === current.tomorrow;
  };
  if (!isCurrent()) return;

  weather.base = null;
  weather.dates = dates;
  weather.destinations = [];
  weather.error = null;
  weather.lastFetched = null;
  weather.loading = Boolean(location);
  if (!location) return;

  function updateDestination(id, update) {
    if (!isCurrent()) return;
    const index = weather.destinations.findIndex(d => d.id === id);
    if (index >= 0) weather.destinations[index] = update(weather.destinations[index]);
  }

  try {
    const base = await fetchWeather(location.lat, location.lon, dates, isCurrent);
    if (!isCurrent()) return;
    if (!base) {
      weather.error = 'errors.noWeatherData';
      return;
    }
    weather.base = base;
    weather.lastFetched = base.fetchedAt;
    if (!base.today && !base.tomorrow) return;

    const destinations = await discover(isCurrent);
    if (!isCurrent()) return;
    weather.destinations = destinations.map(d => scoreDestination({ ...d, forecast: null }));
    await fetchWeatherBatch(destinations, (id, forecast) => {
      updateDestination(id, d => scoreDestination({ ...d, forecast }));
    }, dates, isCurrent);
    if (!isCurrent()) return;
    weather.destinations.sort(scoreOrder);

    if (getDriveTime) {
      for (const dest of weather.destinations.slice(0, 10)) {
        getDriveTime(dest).then(result => {
          if (!result) return;
          updateDestination(dest.id, d => ({
            ...d,
            driveTimeMinutes: result.durationMinutes,
            driveDistanceKm: result.distanceKm,
            isEstimate: result.isEstimate
          }));
        }).catch(() => { /* Keep the estimate if routing fails. */ });
      }
    }
  } catch {
    if (isCurrent()) weather.error = 'errors.networkError';
  } finally {
    if (isCurrent()) weather.loading = false;
  }
}

export function toggleDay() {
  weather.day = weather.day === 'today' ? 'tomorrow' : 'today';
  recalculateScores();
}

/** @param {'allDay' | 'morning' | 'afternoon' | 'evening'} period */
export function setTimePeriod(period) {
  weather.timePeriod = period;
  recalculateScores();
}

export function recalculateScores() {
  weather.destinations = weather.destinations.map(scoreDestination).sort(scoreOrder);
}
