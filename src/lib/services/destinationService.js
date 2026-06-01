import { API_URLS, CACHE_DURATIONS, DESTINATION_LIMITS } from '../utils/constants.js';
import { cacheGet, cacheSet, buildCacheKey } from './cacheService.js';
import { haversineDistance } from './routingService.js';

/**
 * Curated fallback list of popular Nordic towns.
 */
// WHY: min distance is 20km — coastal islands are often closer but have meaningfully
// different weather due to sea exposure (wind, fog, temp). Inland suburbs at <20km
// share the same micro-climate and produce delta ≈ 0.
const FALLBACK_MIN_KM = 20;

const FALLBACK_TOWNS = [
  // --- Beaches (20km+, coastal first) ---
  // Southern archipelago
  { name: 'Styrsö', lat: 57.6167, lon: 11.7833, type: 'beach', population: 1500 },
  { name: 'Vrångö', lat: 57.5667, lon: 11.7667, type: 'beach', population: 500 },
  { name: 'Donsö', lat: 57.5833, lon: 11.7833, type: 'beach', population: 1000 },
  // Northern archipelago
  { name: 'Öckerö', lat: 57.7167, lon: 11.6500, type: 'beach', population: 4500 },
  { name: 'Hönö', lat: 57.6833, lon: 11.6167, type: 'beach', population: 3500 },
  { name: 'Klädesholmen', lat: 57.8833, lon: 11.5167, type: 'beach', population: 600 },
  { name: 'Tjörn', lat: 57.9833, lon: 11.5667, type: 'beach', population: 15000 },
  { name: 'Marstrand', lat: 57.8869, lon: 11.5922, type: 'beach', population: 1400 },
  { name: 'Åsa', lat: 57.3500, lon: 12.1200, type: 'beach', population: 2000 },
  { name: 'Tjolöholm', lat: 57.3800, lon: 12.1600, type: 'beach', population: 1000 },
  { name: 'Varberg', lat: 57.1057, lon: 12.2508, type: 'beach', population: 35000 },
  { name: 'Falkenberg', lat: 56.9054, lon: 12.4914, type: 'beach', population: 20000 },
  { name: 'Halmstad', lat: 56.6745, lon: 12.8578, type: 'beach', population: 70000 },
  { name: 'Lysekil', lat: 58.2747, lon: 11.4358, type: 'beach', population: 7500 },
  { name: 'Smögen', lat: 58.3531, lon: 11.2271, type: 'beach', population: 1300 },
  { name: 'Strömstad', lat: 58.9395, lon: 11.1712, type: 'beach', population: 6500 },
  { name: 'Grebbestad', lat: 58.6955, lon: 11.2536, type: 'beach', population: 1600 },
  { name: 'Fjällbacka', lat: 58.5995, lon: 11.2850, type: 'beach', population: 860 },
  { name: 'Laholm', lat: 56.5112, lon: 13.0432, type: 'beach', population: 6500 },
  // --- Hiking / Nature (20km+) ---
  { name: 'Orust', lat: 58.1833, lon: 11.6667, type: 'hiking', population: 15000 },
  { name: 'Orust Island', lat: 58.1500, lon: 11.7300, type: 'hiking', population: 15000 },
  { name: 'Kinnekulle', lat: 58.5800, lon: 13.3900, type: 'hiking', population: 500 },
  { name: 'Tiveden', lat: 58.8500, lon: 14.5000, type: 'hiking', population: 200 },
  // --- Attractions (20km+) ---
  { name: 'Tjolöholms Slott', lat: 57.3825, lon: 12.1675, type: 'attraction', population: 500 },
  { name: 'Ullared', lat: 57.1305, lon: 12.7152, type: 'attraction', population: 800 },
  { name: 'Nordens Ark', lat: 58.2583, lon: 11.3833, type: 'attraction', population: 500 },
  { name: 'Läckö Slott', lat: 58.6745, lon: 13.1984, type: 'attraction', population: 300 },
  // --- Towns (20km+) ---
  { name: 'Stenungsund', lat: 58.0694, lon: 11.8180, type: 'town', population: 11000 },
  { name: 'Alingsås', lat: 57.9304, lon: 12.5332, type: 'town', population: 28000 },
  { name: 'Borås', lat: 57.7210, lon: 12.9401, type: 'town', population: 72000 },
  { name: 'Trollhättan', lat: 58.2837, lon: 12.2886, type: 'town', population: 50000 },
  { name: 'Uddevalla', lat: 58.3498, lon: 11.9381, type: 'town', population: 36000 },
  { name: 'Vänersborg', lat: 58.3805, lon: 12.3234, type: 'town', population: 25000 },
  { name: 'Skövde', lat: 58.3914, lon: 13.8459, type: 'town', population: 40000 },
  { name: 'Lidköping', lat: 58.5053, lon: 13.1574, type: 'town', population: 26000 },
  { name: 'Mariestad', lat: 58.7101, lon: 13.8233, type: 'town', population: 15000 },
  { name: 'Skara', lat: 58.3867, lon: 13.4388, type: 'town', population: 11000 },
  { name: 'Jönköping', lat: 57.7826, lon: 14.1618, type: 'town', population: 93000 },
];

/**
 * Discover destinations within a bounding box using Overpass API.
 * Falls back to curated list on failure.
 * @param {number} centerLat
 * @param {number} centerLon
 * @param {number} radiusKm - Approximate radius in km
 * @returns {Promise<import('../types/index.js').Destination[]>}
 */
export async function discoverDestinations(centerLat, centerLon, radiusKm) {
  // v8: don't cache empty results; fallback if Overpass returns 0 elements
  const cacheKey = buildCacheKey('dest-v8', centerLat, centerLon, radiusKm);
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log(`[destinations] cache hit (${cached.length} results)`);
    return cached;
  }

  let destinations;
  try {
    destinations = await queryOverpass(centerLat, centerLon, radiusKm);
    if (destinations.length === 0) {
      console.warn('[destinations] Overpass returned 0 results, using fallback');
      destinations = getFallbackDestinations(centerLat, centerLon, radiusKm);
    } else {
      console.log(`[destinations] Overpass returned ${destinations.length} results`);
    }
  } catch (e) {
    console.warn('[destinations] Overpass failed, using fallback:', e.message);
    destinations = getFallbackDestinations(centerLat, centerLon, radiusKm);
  }

  console.log(`[destinations] final count before cache: ${destinations.length}`);
  // WHY: never cache empty — forces retry next load instead of 24h of nothing
  destinations = destinations.slice(0, DESTINATION_LIMITS.maxResults);
  if (destinations.length > 0) {
    cacheSet(cacheKey, destinations, CACHE_DURATIONS.destinations);
  }
  return destinations;
}

/**
 * Query Overpass API for towns and points of interest.
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusKm
 * @returns {Promise<import('../types/index.js').Destination[]>}
 */
async function queryOverpass(lat, lon, radiusKm) {
  // Build bounding box from center + radius
  const latDelta = radiusKm / 111;
  const cosLat = Math.max(Math.cos(lat * Math.PI / 180), 0.01); // clamp near poles
  const lonDelta = radiusKm / (111 * cosLat);
  const south = lat - latDelta;
  const north = lat + latDelta;
  const west = lon - lonDelta;
  const east = lon + lonDelta;
  const bbox = `${south},${west},${north},${east}`;

  // WHY: Use nwr (node+way+relation) for beach/nature — OSM maps these as
  // polygon ways/relations, not point nodes. "out center" returns a centroid
  // for each polygon so we can use it as a lat/lon coordinate.
  // WHY: Separate queries per type so we get a balanced set of results rather
  // than having towns (high population) consume all available slots.
  const query = `
    [out:json][timeout:30];
    (
      node["place"~"city|town"](${bbox});
      nwr["natural"="beach"](${bbox});
      nwr["leisure"="nature_reserve"]["name"](${bbox});
      nwr["boundary"~"national_park|protected_area"]["name"](${bbox});
      nwr["tourism"~"attraction|viewpoint"]["name"](${bbox});
    );
    out center 200;
  `;

  const fetchOptions = {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  };
  const res = await fetch(API_URLS.overpass, fetchOptions);
  const text = await res.text();
  let data;
  if (text.startsWith('<') || !res.ok) {
    // WHY: overpass-api.de returns HTML error body when overloaded — fallback to kumi.systems
    console.warn('[destinations] primary Overpass returned HTML, trying kumi.systems');
    const res2 = await fetch('https://overpass.kumi.systems/api/interpreter', fetchOptions);
    const text2 = await res2.text();
    if (text2.startsWith('<') || !res2.ok) {
      throw new Error('Both Overpass endpoints returned HTML/error');
    }
    data = JSON.parse(text2);
  } else {
    data = JSON.parse(text);
  }

  const elements = Array.isArray(data.elements) ? data.elements : [];
  const seen = new Set(); // WHY: deduplicate by name — same place often appears as node + way

  const mapped = elements
    .filter(el => el.tags?.name)
    .map(el => {
      // WHY: ways/relations use el.center.{lat,lon}; nodes use el.lat/el.lon directly
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) return null;
      return {
        id: `osm-${el.type ?? 'n'}-${el.id}`,
        name: el.tags.name,
        lat: elLat,
        lon: elLon,
        type: categorizeOSMTags(el.tags),
        population: parseInt(el.tags.population) || estimatePopulation(el.tags),
        driveTimeMinutes: null,
        driveDistanceKm: null,
        weather: null,
        delta: null,
        qualityScore: null
      };
    })
    .filter(d => {
      if (!d) return false;
      if (haversineDistance(lat, lon, d.lat, d.lon) < 20) return false; // WHY: <20km = same micro-climate, delta ≈ 0
      const key = d.name.toLowerCase();
      if (seen.has(key)) return false; // deduplicate
      seen.add(key);
      return true;
    });

  // WHY: Sort towns by population but put all beach/hiking/attraction results FIRST
  // so they are not crowded out when the caller slices to maxResults.
  const nonTowns = mapped.filter(d => d.type !== 'town').sort((a, b) => b.population - a.population);
  const towns = mapped.filter(d => d.type === 'town').sort((a, b) => b.population - a.population);
  return [...nonTowns, ...towns];
}

/**
 * Categorize OSM tags into destination type.
 * @param {object} tags
 * @returns {'town' | 'beach' | 'hiking' | 'attraction' | 'custom'}
 */
function categorizeOSMTags(tags) {
  if (tags.natural === 'beach') return 'beach';
  if (tags.route === 'hiking') return 'hiking';
  if (tags.leisure === 'nature_reserve' || tags.boundary === 'national_park' || tags.boundary === 'protected_area') return 'hiking';
  if (tags.leisure === 'park') return 'hiking';
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') return 'attraction';
  return 'town';
}

/**
 * Estimate population from OSM tags when not explicitly set.
 * @param {object} tags
 * @returns {number}
 */
function estimatePopulation(tags) {
  if (tags.place === 'city') return 50000;
  if (tags.place === 'town') return 10000;
  if (tags.tourism) return 1000;
  return 500;
}

/**
 * Get filtered fallback destinations within radius.
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusKm
 * @returns {import('../types/index.js').Destination[]}
 */
function getFallbackDestinations(lat, lon, radiusKm) {
  return FALLBACK_TOWNS
    .filter(t => haversineDistance(lat, lon, t.lat, t.lon) <= radiusKm)
    .filter(t => haversineDistance(lat, lon, t.lat, t.lon) >= FALLBACK_MIN_KM)
    .map(t => ({
      id: `fallback-${t.name.toLowerCase().replace(/\s/g, '-')}`,
      name: t.name,
      lat: t.lat,
      lon: t.lon,
      type: t.type,
      population: t.population,
      driveTimeMinutes: null,
      driveDistanceKm: null,
      weather: null,
      delta: null,
      qualityScore: null
    }))
    .sort((a, b) => b.population - a.population);
}

// Expose a helper so UI can load fallback results directly when Overpass/network fails
export function fallbackDestinationsFor(lat, lon, radiusKm) {
  return getFallbackDestinations(lat, lon, radiusKm);
}
