import { DEFAULT_WEIGHTS, QUALITY_COLORS } from '../utils/constants.js';

/**
 * Calculate weather quality score for a destination.
 * Score represents how much BETTER the destination is than the base.
 *
 * Formula: weighted sum of normalized deltas, scaled to 0-100.
 * - For cloudCover, precipitation, wind: NEGATIVE delta = improvement
 * - For temperature, UV: POSITIVE delta = improvement
 *
 * @param {import('../types/index.js').WeatherDelta} delta
 * @param {import('../types/index.js').WeatherWeights} [weights]
 * @returns {number} Score 0-100
 */
export function calculateQualityScore(delta, weights = DEFAULT_WEIGHTS) {
  if (!delta) return null;
  // Normalize each delta to [0, 1] range
  const sunshineScore = normalize(-delta.cloudCover, -100, 100);   // Less cloud = better
  const precipScore = normalize(-delta.precipitation, -20, 20);     // Less rain = better
  const tempScore = normalize(delta.temperature, -15, 15);          // Warmer = better
  const windScore = normalize(-delta.windSpeed, -20, 20);           // Less wind = better
  const scores = {
    sunshine: sunshineScore, precipitation: precipScore, temperature: tempScore, wind: windScore,
    uv: Number.isFinite(delta.uvIndex) ? normalize(delta.uvIndex, -5, 5) : null
  };
  const valid = Object.entries(scores).filter(([key, score]) =>
    Number.isFinite(score) && Number.isFinite(weights?.[key]) && weights[key] > 0
  );
  if (!valid.length) return 50;
  const maxWeight = Math.max(...valid.map(([key]) => weights[key]));
  const total = valid.reduce((sum, [key]) => sum + weights[key] / maxWeight, 0);
  const weighted = valid.reduce((sum, [key, score]) => sum + (weights[key] / maxWeight) * score, 0);
  return Math.round(clamp((weighted / total) * 100, 0, 100));
}

/**
 * Normalize a value from [min, max] to [0, 1].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalize(value, min, max) {
  return clamp((value - min) / (max - min), 0, 1);
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get quality label and color for a score.
 * @param {number} score - 0-100
 * @returns {{ label: string, color: string }}
 */
export function getQualityInfo(score) {
  for (const [label, { min, color }] of Object.entries(QUALITY_COLORS)) {
    if (score >= min) return { label, color };
  }
  return { label: 'worse', color: QUALITY_COLORS.worse.color };
}
