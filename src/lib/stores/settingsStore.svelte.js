import { DEFAULT_THEME, DEFAULT_LOCALE, DEFAULT_RADIUS_MINUTES, DEFAULT_WEIGHTS, DEFAULT_LOCATION } from '../utils/constants.js';

const STORAGE_KEY = 'weatherescape-settings';

const RADIUS_MIN = 15;
const RADIUS_MAX = 300;

function isValidLocation(loc) {
  return loc &&
    typeof loc.id === 'string' &&
    typeof loc.name === 'string' &&
    Number.isFinite(loc.lat) && loc.lat >= -90 && loc.lat <= 90 &&
    Number.isFinite(loc.lon) && loc.lon >= -180 && loc.lon <= 180;
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return null;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

const stored = loadSettings();

// WHY: compute validated locations separately so activeLocationId can be checked
// against the filtered list — if activeLocationId points to a location that was
// filtered out (e.g. lat/lon stored as strings in an older version), the app
// would silently load nothing because fetchBaseWeather's find() returns undefined.
const validStoredLocations = Array.isArray(stored?.savedLocations) && stored.savedLocations.some(isValidLocation)
  ? stored.savedLocations.filter(isValidLocation)
  : [{ ...DEFAULT_LOCATION }];

const validActiveId = validStoredLocations.some(l => l.id === stored?.activeLocationId)
  ? stored.activeLocationId
  : validStoredLocations[0]?.id ?? DEFAULT_LOCATION.id;

/** @type {import('../types/index.js').UserSettings} */
export const settings = $state({
  theme: stored?.theme === 'dark' || stored?.theme === 'light' ? stored.theme : DEFAULT_THEME,
  locale: stored?.locale ?? DEFAULT_LOCALE,
  drivingRadiusMinutes: Number.isFinite(stored?.drivingRadiusMinutes) &&
    stored.drivingRadiusMinutes >= RADIUS_MIN &&
    stored.drivingRadiusMinutes <= RADIUS_MAX
      ? stored.drivingRadiusMinutes
      : DEFAULT_RADIUS_MINUTES,
  openRouteServiceKey: typeof stored?.openRouteServiceKey === 'string' ? stored.openRouteServiceKey : '',
  weights: stored?.weights ?? { ...DEFAULT_WEIGHTS },
  savedLocations: validStoredLocations,
  activeLocationId: validActiveId
});

/** Apply theme class to document root */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Toggle between dark and light themes */
export function toggleTheme() {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(settings.theme);
  saveSettings(settings);
}

/** Update a specific setting */
export function updateSetting(key, value) {
  settings[key] = value;
  saveSettings(settings);
}

/** Get the currently active location */
export function getActiveLocation() {
  return settings.savedLocations.find(l => l.id === settings.activeLocationId) ?? settings.savedLocations[0] ?? DEFAULT_LOCATION;
}

// Initialize theme on load
if (typeof document !== 'undefined') {
  applyTheme(settings.theme);
}
