import { WEATHER_THRESHOLDS } from './constants.js';

/** Convert a Date to local YYYY-MM-DD string (avoids UTC/local mismatch). */
function toLocalDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// === SMHI Condition Symbol Mapping (Wsymb2: 1-27) ===
const SMHI_SYMBOLS = {
  1: 'clear', 2: 'nearly_clear', 3: 'partly_cloudy', 4: 'partly_cloudy',
  5: 'overcast', 6: 'overcast', 7: 'fog', 8: 'rain_showers_light',
  9: 'rain_showers_moderate', 10: 'rain_showers_heavy', 11: 'thunderstorm',
  12: 'sleet_showers_light', 13: 'sleet_showers_moderate', 14: 'sleet_showers_heavy',
  15: 'snow_showers_light', 16: 'snow_showers_moderate', 17: 'snow_showers_heavy',
  18: 'rain_light', 19: 'rain_moderate', 20: 'rain_heavy',
  21: 'thunder', 22: 'sleet_light', 23: 'sleet_moderate', 24: 'sleet_heavy',
  25: 'snow_light', 26: 'snow_moderate', 27: 'snow_heavy'
};

const SMHI_TEXT = {
  clear: 'Clear sky', nearly_clear: 'Nearly clear', partly_cloudy: 'Partly cloudy',
  overcast: 'Overcast', fog: 'Fog', rain_showers_light: 'Light rain showers',
  rain_showers_moderate: 'Rain showers', rain_showers_heavy: 'Heavy rain showers',
  thunderstorm: 'Thunderstorm', sleet_showers_light: 'Light sleet',
  sleet_showers_moderate: 'Sleet', sleet_showers_heavy: 'Heavy sleet',
  snow_showers_light: 'Light snow showers', snow_showers_moderate: 'Snow showers',
  snow_showers_heavy: 'Heavy snow', rain_light: 'Light rain',
  rain_moderate: 'Rain', rain_heavy: 'Heavy rain', thunder: 'Thunder',
  sleet_light: 'Light sleet', sleet_moderate: 'Sleet', sleet_heavy: 'Heavy sleet',
  snow_light: 'Light snow', snow_moderate: 'Snow', snow_heavy: 'Heavy snow'
};

/**
 * Parse SMHI forecast response into normalized WeatherData for today & tomorrow.
 * SMHI timeSeries has hourly data. We aggregate per day with period breakdowns.
 * @param {object} data - Raw SMHI API response
 * @returns {{ today: import('../types/index.js').PeriodWeather, tomorrow: import('../types/index.js').PeriodWeather }}
 */
export function parseSMHI(data) {
  const timeSeries = data?.timeSeries ?? [];
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrowDate);

  const todayEntries = timeSeries.filter(ts => toLocalDateStr(new Date(ts.validTime)) === todayStr);
  const tomorrowEntries = timeSeries.filter(ts => toLocalDateStr(new Date(ts.validTime)) === tomorrowStr);

  return {
    today: aggregateSMHIDay(todayEntries.length ? todayEntries : timeSeries.slice(0, 8)),
    tomorrow: aggregateSMHIDay(tomorrowEntries.length ? tomorrowEntries : timeSeries.slice(8, 16))
  };
}

/**
 * Aggregate a day's SMHI entries into allDay + morning/afternoon/evening periods.
 */
function aggregateSMHIDay(entries) {
  const morning = entries.filter(ts => { const h = new Date(ts.validTime).getHours(); return h >= 6 && h < 12; });
  const afternoon = entries.filter(ts => { const h = new Date(ts.validTime).getHours(); return h >= 12 && h < 18; });
  const evening = entries.filter(ts => { const h = new Date(ts.validTime).getHours(); return h >= 18 && h < 24; });

  return {
    allDay: aggregateSMHIPeriod(entries),
    morning: morning.length ? aggregateSMHIPeriod(morning) : null,
    afternoon: afternoon.length ? aggregateSMHIPeriod(afternoon) : null,
    evening: evening.length ? aggregateSMHIPeriod(evening) : null
  };
}

function aggregateSMHIPeriod(entries) {
  if (!entries.length) return createEmptyWeather('smhi');

  let tempSum = 0, precipSum = 0, cloudSum = 0, windSum = 0;
  let symbol = 1;

  for (const entry of entries) {
    const params = Object.fromEntries(entry.parameters.map(p => [p.name, p.values[0]]));
    tempSum += params.t ?? 0;
    precipSum += params.pmean ?? 0;
    cloudSum += params.tcc_mean ?? 0;
    windSum += params.ws ?? 0;
    if (params.Wsymb2) symbol = params.Wsymb2;
  }

  const n = entries.length;
  const conditionCode = SMHI_SYMBOLS[symbol] ?? 'unknown';
  const precipitation = Math.round(precipSum * 10) / 10;

  return {
    temperature: Math.round((tempSum / n) * 10) / 10,
    precipitation,
    cloudCover: Math.round((cloudSum / n) * 12.5), // octas (0-8) → percentage (0-100)
    windSpeed: Math.round((windSum / n) * 10) / 10,
    uvIndex: null,
    conditionCode,
    conditionText: SMHI_TEXT[conditionCode] ?? conditionCode,
    confidence: null,
    source: 'smhi',
    fetchedAt: new Date().toISOString(),
    precipitationType: categorizePrecipitation(precipitation, n)
  };
}

/**
 * Parse YR compact forecast response into normalized WeatherData.
 * Returns allDay average plus morning/afternoon/evening breakdowns.
 * @param {object} data - Raw YR API response
 * @returns {{ today: import('../types/index.js').PeriodWeather, tomorrow: import('../types/index.js').PeriodWeather }}
 */
export function parseYR(data) {
  const timeseries = data?.properties?.timeseries ?? [];
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrowDate);

  const todayEntries = timeseries.filter(ts => toLocalDateStr(new Date(ts.time)) === todayStr);
  const tomorrowEntries = timeseries.filter(ts => toLocalDateStr(new Date(ts.time)) === tomorrowStr);

  return {
    today: aggregateYRDay(todayEntries.length ? todayEntries : timeseries.slice(0, 8)),
    tomorrow: aggregateYRDay(tomorrowEntries.length ? tomorrowEntries : timeseries.slice(8, 16))
  };
}

/**
 * Aggregate a day's YR entries into allDay + morning/afternoon/evening periods.
 * Morning: 06-12, Afternoon: 12-18, Evening: 18-24.
 * @param {Array} entries - YR timeseries entries for a single day
 * @returns {{ allDay: object, morning: object, afternoon: object, evening: object }}
 */
function aggregateYRDay(entries) {
  const morning = entries.filter(ts => { const h = new Date(ts.time).getHours(); return h >= 6 && h < 12; });
  const afternoon = entries.filter(ts => { const h = new Date(ts.time).getHours(); return h >= 12 && h < 18; });
  const evening = entries.filter(ts => { const h = new Date(ts.time).getHours(); return h >= 18 && h < 24; });

  return {
    allDay: aggregateYRPeriod(entries),
    morning: morning.length ? aggregateYRPeriod(morning) : null,
    afternoon: afternoon.length ? aggregateYRPeriod(afternoon) : null,
    evening: evening.length ? aggregateYRPeriod(evening) : null
  };
}

function aggregateYRPeriod(entries) {
  if (!entries.length) return createEmptyWeather('yr');

  let tempSum = 0, precipSum = 0, cloudSum = 0, windSum = 0, uvSum = 0, uvCount = 0;
  let symbol = 'clearsky_day';

  for (const entry of entries) {
    const instant = entry.data?.instant?.details ?? {};
    const next1h = entry.data?.next_1_hours ?? entry.data?.next_6_hours ?? {};

    tempSum += instant.air_temperature ?? 0;
    precipSum += next1h?.details?.precipitation_amount ?? 0;
    cloudSum += instant.cloud_area_fraction ?? 0;
    windSum += instant.wind_speed ?? 0;
    if (instant.ultraviolet_index_clear_sky != null) {
      uvSum += instant.ultraviolet_index_clear_sky;
      uvCount++;
    }
    if (next1h?.summary?.symbol_code) symbol = next1h.summary.symbol_code;
  }

  const n = entries.length;
  const precipitation = Math.round(precipSum * 10) / 10;

  return {
    temperature: Math.round((tempSum / n) * 10) / 10,
    precipitation,
    cloudCover: Math.round(cloudSum / n),
    windSpeed: Math.round((windSum / n) * 10) / 10,
    uvIndex: uvCount > 0 ? Math.round((uvSum / uvCount) * 10) / 10 : null,
    conditionCode: symbol,
    conditionText: yrSymbolToText(symbol),
    confidence: null,
    source: 'yr',
    fetchedAt: new Date().toISOString(),
    precipitationType: categorizePrecipitation(precipitation, n)
  };
}

function yrSymbolToText(symbol) {
  if (!symbol) return 'Unknown';
  const base = symbol.replace(/_day|_night|_polartwilight/g, '');
  const map = {
    clearsky: 'Clear sky', fair: 'Fair', partlycloudy: 'Partly cloudy',
    cloudy: 'Cloudy', fog: 'Fog', lightrainshowers: 'Light rain showers',
    rainshowers: 'Rain showers', heavyrainshowers: 'Heavy rain showers',
    lightrain: 'Light rain', rain: 'Rain', heavyrain: 'Heavy rain',
    lightsleet: 'Light sleet', sleet: 'Sleet', heavysleet: 'Heavy sleet',
    lightsnow: 'Light snow', snow: 'Snow', heavysnow: 'Heavy snow',
    lightrainandthunder: 'Rain and thunder', rainandthunder: 'Rain and thunder'
  };
  return map[base] ?? symbol.replace(/_/g, ' ');
}

/**
 * Categorize precipitation pattern.
 * @param {number} totalMm - Total precipitation in mm
 * @param {number} periodHours - Number of hours in period
 * @returns {'burst' | 'spread' | 'none'}
 */
function categorizePrecipitation(totalMm, periodHours) {
  if (totalMm <= 0.5) return 'none';
  const rate = totalMm / periodHours;
  return rate > 2 ? 'burst' : 'spread';
}

/**
 * Calculate weather delta between destination and base.
 * @param {import('../types/index.js').WeatherData} base
 * @param {import('../types/index.js').WeatherData} destination
 * @returns {import('../types/index.js').WeatherDelta}
 */
export function calculateDelta(base, destination) {
  if (!base || !destination) return null;
  return {
    temperature: Math.round((destination.temperature - base.temperature) * 10) / 10,
    precipitation: Math.round((destination.precipitation - base.precipitation) * 10) / 10,
    cloudCover: Math.round(destination.cloudCover - base.cloudCover),
    windSpeed: Math.round((destination.windSpeed - base.windSpeed) * 10) / 10,
    uvIndex: (destination.uvIndex != null && base.uvIndex != null)
      ? Math.round((destination.uvIndex - base.uvIndex) * 10) / 10
      : null
  };
}

/**
 * Check if weather at base is considered "bad" per thresholds.
 * @param {import('../types/index.js').WeatherData} weather
 * @returns {boolean}
 */
export function isBadWeather(weather) {
  return (
    weather.precipitation > WEATHER_THRESHOLDS.precipitationBad ||
    weather.cloudCover > WEATHER_THRESHOLDS.cloudCoverBad ||
    weather.temperature < WEATHER_THRESHOLDS.tempSingleDigit
  );
}

function createEmptyWeather(source) {
  return {
    temperature: 0, precipitation: 0, cloudCover: 0, windSpeed: 0,
    uvIndex: null, conditionCode: 'unknown', conditionText: 'No data',
    confidence: null, source, fetchedAt: new Date().toISOString(),
    precipitationType: 'none'
  };
}

/**
 * Get weather emoji for condition code.
 * @param {string} code
 * @returns {string}
 */
export function getWeatherEmoji(code) {
  if (!code) return '❓';
  const c = code.toLowerCase();
  if (c.includes('clear') || c === 'fair') return '☀️';
  if (c.includes('nearly_clear')) return '🌤️';
  if (c.includes('partly_cloudy') || c.includes('partlycloudy')) return '⛅';
  if (c.includes('overcast') || c.includes('cloudy')) return '☁️';
  if (c.includes('fog')) return '🌫️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '🌨️';
  if (c.includes('sleet')) return '🌧️';
  if (c.includes('heavy_rain') || c.includes('heavyrain')) return '🌧️';
  if (c.includes('rain')) return '🌦️';
  return '🌥️';
}
