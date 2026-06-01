import { MAP_TILES, MAP_ATTRIBUTION, MAP_DEFAULTS } from './constants.js';

/**
 * Get the tile URL based on theme.
 * @param {'dark' | 'light'} theme
 * @returns {string}
 */
export function getTileUrl(theme) {
  return theme === 'dark' ? MAP_TILES.dark : MAP_TILES.light;
}

/**
 * Get quality color for a score.
 * @param {number} score - 0-100
 * @returns {string} hex color
 */
export function getQualityColor(score) {
  if (score >= 80) return '#00b894';
  if (score >= 50) return '#fdcb6e';
  if (score >= 20) return '#e17055';
  return '#d63031';
}

/**
 * Create a colored circle marker icon for Leaflet.
 * @param {string} color - hex color
 * @returns {import('leaflet').DivIcon}
 */
export function createMarkerIcon(color) {
  const L = window.L;
  return L.divIcon({
    className: 'weather-marker',
    html: `<div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

/**
 * Format drive time from minutes.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDriveTime(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
}
