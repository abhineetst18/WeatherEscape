import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../utils/constants.js';
import { updateSetting } from './settingsStore.svelte.js';

const localeCache = {};

/** @type {{ locale: string, translations: Record<string, string>, loading: boolean }} */
export const i18n = $state({
  locale: DEFAULT_LOCALE,
  translations: {},
  loading: true
});

/**
 * Load a locale's translations from JSON file.
 * @param {string} locale
 * @returns {Promise<Record<string, any>>}
 */
async function loadLocale(locale) {
  if (localeCache[locale]) {
    return localeCache[locale];
  }
  try {
    const base = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL
      : '/';
    const stamp = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BUILD_TS)
      ? import.meta.env.VITE_BUILD_TS
      : Date.now();
    const response = await fetch(`${base}locales/${locale}.json?v=${stamp}`);
    if (!response.ok) throw new Error(`Failed to load locale: ${locale}`);
    const translations = await response.json();
    localeCache[locale] = translations;
    return translations;
  } catch (e) {
    console.warn(`Failed to load locale ${locale}, falling back to en:`, e);
    if (locale !== 'en' && localeCache['en']) return localeCache['en'];
    return {};
  }
}

/**
 * Initialize i18n with the given locale.
 * @param {string} [locale]
 */
export async function initI18n(locale = DEFAULT_LOCALE) {
  i18n.loading = true;
  i18n.translations = await loadLocale(locale);
  i18n.locale = locale;
  i18n.loading = false;
}

/**
 * Switch locale at runtime.
 * @param {string} locale
 */
export async function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`);
    return;
  }
  i18n.loading = true;
  i18n.translations = await loadLocale(locale);
  i18n.locale = locale;
  updateSetting('locale', locale);
  i18n.loading = false;
}

/**
 * Translate a key. Supports dot notation for nested keys.
 * Falls back to the key itself if not found.
 * @param {string} key - Translation key (e.g., 'header.title')
 * @param {Record<string, string>} [params] - Interpolation params (e.g., {name: 'Gothenburg'})
 * @returns {string}
 */
export function t(key, params = {}) {
  let value = key.split('.').reduce((obj, k) => obj?.[k], i18n.translations);
  if (typeof value !== 'string') return key;
  for (const [k, v] of Object.entries(params)) {
    value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v).replace(/\$/g, '$$$$'));
  }
  return value;
}
