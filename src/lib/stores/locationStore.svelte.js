import { settings } from './settingsStore.svelte.js';
import { DEFAULT_LOCATION } from '../utils/constants.js';

/**
 * Get the currently active location (derived from settings).
 * @returns {import('../types/index.js').Location}
 */
export function getActiveLocation() {
  return settings.savedLocations.find(l => l.id === settings.activeLocationId)
    ?? settings.savedLocations[0]
    ?? DEFAULT_LOCATION;
}
