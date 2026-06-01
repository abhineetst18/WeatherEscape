// Default location: Gothenburg, Sweden
export const DEFAULT_LOCATION = {
  id: 'default-gothenburg',
  name: 'Gothenburg',
  lat: 57.7089,
  lon: 11.9746,
  isDefault: true,
  source: 'saved'
};

// Driving radius options (minutes)
export const RADIUS_OPTIONS = [30, 60, 90, 120, 150, 180, 240];
export const DEFAULT_RADIUS_MINUTES = 60;

// Weather thresholds
export const WEATHER_THRESHOLDS = {
  precipitationBad: 4,      // mm - above this is "bad weather"
  tempSingleDigit: 10,       // °C - below this is "cold"
  cloudCoverBad: 75,          // % - above this is "overcast"
  windSpeedBad: 10            // m/s - above this is "windy"
};

// Default weather scoring weights (must sum to 1.0)
export const DEFAULT_WEIGHTS = {
  sunshine: 0.35,
  precipitation: 0.30,
  temperature: 0.20,
  wind: 0.10,
  uv: 0.05
};

// Quality score color system (PRD §6.2)
export const QUALITY_COLORS = {
  great:    { min: 80, max: 100, color: '#00b894', label: 'Great' },
  moderate: { min: 50, max: 79,  color: '#fdcb6e', label: 'Moderate' },
  marginal: { min: 20, max: 49,  color: '#e17055', label: 'Marginal' },
  worse:    { min: 0,  max: 19,  color: '#d63031', label: 'Worse' }
};

// API URLs
export const API_URLS = {
  smhi: 'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point',
  yr: 'https://api.met.no/weatherapi/locationforecast/2.0/compact',
  ors: 'https://api.openrouteservice.org',
  overpass: 'https://overpass-api.de/api/interpreter'
};

// Map tile URLs
export const MAP_TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Cache durations (milliseconds)
export const CACHE_DURATIONS = {
  weather: 30 * 60 * 1000,           // 30 minutes
  isochrone: 60 * 60 * 1000,          // 1 hour
  destinations: 24 * 60 * 60 * 1000,  // 24 hours
  preferences: Infinity                // never expires
};

// Default map settings
export const MAP_DEFAULTS = {
  center: [57.7089, 11.9746], // Gothenburg
  zoom: 10,
  minZoom: 5,
  maxZoom: 18
};

// App info
export const APP_INFO = {
  name: 'WeatherEscape',
  version: '1.0.0',
  userAgent: 'WeatherEscape/1.0.0 github.com/abhineetst18/AstPythonTools'
};

// Destination limits
export const DESTINATION_LIMITS = {
  maxResults: 50,        // Max destinations to fetch weather for
  maxOrsCallsPerDay: 500 // OpenRouteService free tier limit
};

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'sv', 'no', 'da'];
export const DEFAULT_LOCALE = 'en';

// Theme
export const THEMES = ['dark', 'light'];
export const DEFAULT_THEME = 'light';
