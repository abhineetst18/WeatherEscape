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
  const uvScore = delta.uvIndex != null ? normalize(delta.uvIndex, -5, 5) : 0.5; // More UV = better (neutral if unavailable)

  const raw = (
    weights.sunshine * sunshineScore +
    weights.precipitation * precipScore +
    weights.temperature * tempScore +
    weights.wind * windScore +
    weights.uv * uvScore
  );

  return Math.round(clamp(raw * 100, 0, 100));
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
  if (score >= QUALITY_COLORS.great.min) return { label: 'great', color: QUALITY_COLORS.great.color };
  if (score >= QUALITY_COLORS.moderate.min) return { label: 'moderate', color: QUALITY_COLORS.moderate.color };
  if (score >= QUALITY_COLORS.marginal.min) return { label: 'marginal', color: QUALITY_COLORS.marginal.color };
  return { label: 'worse', color: QUALITY_COLORS.worse.color };
}
