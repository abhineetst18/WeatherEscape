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
  // --- Gothenburg area: beaches ---
  { name: 'Styrsö', lat: 57.6167, lon: 11.7833, type: 'beach', population: 1500 },
  { name: 'Vrångö', lat: 57.5667, lon: 11.7667, type: 'beach', population: 500 },
  { name: 'Öckerö', lat: 57.7167, lon: 11.6500, type: 'beach', population: 4500 },
  { name: 'Tjörn', lat: 57.9833, lon: 11.5667, type: 'beach', population: 15000 },
  { name: 'Marstrand', lat: 57.8869, lon: 11.5922, type: 'beach', population: 1400 },
  { name: 'Varberg', lat: 57.1057, lon: 12.2508, type: 'beach', population: 35000 },
  { name: 'Falkenberg', lat: 56.9054, lon: 12.4914, type: 'beach', population: 20000 },
  { name: 'Halmstad', lat: 56.6745, lon: 12.8578, type: 'beach', population: 70000 },
  { name: 'Lysekil', lat: 58.2747, lon: 11.4358, type: 'beach', population: 7500 },
  { name: 'Smögen', lat: 58.3531, lon: 11.2271, type: 'beach', population: 1300 },
  { name: 'Strömstad', lat: 58.9395, lon: 11.1712, type: 'beach', population: 6500 },
  { name: 'Grebbestad', lat: 58.6955, lon: 11.2536, type: 'beach', population: 1600 },
  { name: 'Fjällbacka', lat: 58.5995, lon: 11.2850, type: 'beach', population: 860 },
  // --- Stockholm area: beaches & nature ---
  { name: 'Sandhamn', lat: 59.2833, lon: 18.9167, type: 'beach', population: 100 },
  { name: 'Grinda', lat: 59.3833, lon: 18.7333, type: 'beach', population: 50 },
  { name: 'Möja', lat: 59.4167, lon: 18.8667, type: 'beach', population: 400 },
  { name: 'Vaxholm', lat: 59.4024, lon: 18.3297, type: 'town', population: 5200 },
  { name: 'Sigtuna', lat: 59.6173, lon: 17.7248, type: 'attraction', population: 9000 },
  { name: 'Mariefred', lat: 59.2524, lon: 17.2228, type: 'attraction', population: 4000 },
  { name: 'Trosa', lat: 58.8981, lon: 17.5489, type: 'beach', population: 4000 },
  { name: 'Norrtälje', lat: 59.7578, lon: 18.7047, type: 'town', population: 17000 },
  { name: 'Nynäshamn', lat: 58.9035, lon: 17.9477, type: 'beach', population: 13000 },
  { name: 'Tyresta', lat: 59.1833, lon: 18.2667, type: 'hiking', population: 200 },
  // --- Malmö/Skåne area ---
  { name: 'Falsterbo', lat: 55.3833, lon: 12.8333, type: 'beach', population: 2000 },
  { name: 'Ystad', lat: 55.4292, lon: 13.8200, type: 'town', population: 18000 },
  { name: 'Helsingborg', lat: 56.0465, lon: 12.6945, type: 'town', population: 110000 },
  { name: 'Kristianstad', lat: 56.0294, lon: 14.1567, type: 'town', population: 38000 },
  { name: 'Åhus', lat: 55.9281, lon: 14.3044, type: 'beach', population: 10000 },
  { name: 'Simrishamn', lat: 55.5564, lon: 14.3621, type: 'beach', population: 7000 },
  { name: 'Kullaberg', lat: 56.2800, lon: 12.4500, type: 'hiking', population: 300 },
  { name: 'Österlen', lat: 55.6500, lon: 14.1000, type: 'hiking', population: 1000 },
  // --- Oslo area (Norway) ---
  { name: 'Drøbak', lat: 59.6633, lon: 10.6178, type: 'town', population: 14000 },
  { name: 'Fredrikstad', lat: 59.2181, lon: 10.9298, type: 'town', population: 82000 },
  { name: 'Moss', lat: 59.4352, lon: 10.6582, type: 'town', population: 32000 },
  { name: 'Hønefoss', lat: 60.1706, lon: 10.2515, type: 'town', population: 15000 },
  { name: 'Kongsberg', lat: 59.6700, lon: 9.6500, type: 'attraction', population: 26000 },
  { name: 'Hvaler', lat: 59.0667, lon: 11.0000, type: 'beach', population: 4000 },
  { name: 'Halden', lat: 59.1228, lon: 11.3878, type: 'town', population: 31000 },
  { name: 'Lillehammer', lat: 61.1153, lon: 10.4662, type: 'hiking', population: 27000 },
  // --- Copenhagen area (Denmark) ---
  { name: 'Helsingør', lat: 56.0361, lon: 12.6136, type: 'attraction', population: 47000 },
  { name: 'Roskilde', lat: 55.6415, lon: 12.0803, type: 'attraction', population: 51000 },
  { name: 'Køge', lat: 55.4579, lon: 12.1820, type: 'beach', population: 36000 },
  { name: 'Hillerød', lat: 55.9355, lon: 12.3090, type: 'attraction', population: 29000 },
  { name: 'Tisvildeleje', lat: 56.0544, lon: 12.0736, type: 'beach', population: 1500 },
  { name: 'Hornbæk', lat: 56.0858, lon: 12.4550, type: 'beach', population: 3000 },
  // --- Major Swedish cities (broad coverage) ---
  { name: 'Uppsala', lat: 59.8586, lon: 17.6389, type: 'town', population: 170000 },
  { name: 'Västerås', lat: 59.6099, lon: 16.5448, type: 'town', population: 119000 },
  { name: 'Örebro', lat: 59.2753, lon: 15.2134, type: 'town', population: 115000 },
  { name: 'Linköping', lat: 58.4108, lon: 15.6214, type: 'town', population: 105000 },
  { name: 'Norrköping', lat: 58.5877, lon: 16.1924, type: 'town', population: 94000 },
  { name: 'Jönköping', lat: 57.7826, lon: 14.1618, type: 'town', population: 93000 },
  { name: 'Borås', lat: 57.7210, lon: 12.9401, type: 'town', population: 72000 },
  { name: 'Lund', lat: 55.7047, lon: 13.1910, type: 'town', population: 93000 },
  { name: 'Umeå', lat: 63.8258, lon: 20.2630, type: 'town', population: 89000 },
  { name: 'Gävle', lat: 60.6749, lon: 17.1413, type: 'town', population: 77000 },
  { name: 'Sundsvall', lat: 62.3908, lon: 17.3069, type: 'town', population: 50000 },
  { name: 'Östersund', lat: 63.1792, lon: 14.6357, type: 'town', population: 45000 },
  // --- Gothenburg area: hiking/towns ---
  { name: 'Kinnekulle', lat: 58.5800, lon: 13.3900, type: 'hiking', population: 500 },
  { name: 'Tiveden', lat: 58.8500, lon: 14.5000, type: 'hiking', population: 200 },
  { name: 'Ullared', lat: 57.1305, lon: 12.7152, type: 'attraction', population: 800 },
  { name: 'Nordens Ark', lat: 58.2583, lon: 11.3833, type: 'attraction', population: 500 },
  { name: 'Läckö Slott', lat: 58.6745, lon: 13.1984, type: 'attraction', population: 300 },
  { name: 'Stenungsund', lat: 58.0694, lon: 11.8180, type: 'town', population: 11000 },
  { name: 'Alingsås', lat: 57.9304, lon: 12.5332, type: 'town', population: 28000 },
  { name: 'Trollhättan', lat: 58.2837, lon: 12.2886, type: 'town', population: 50000 },
  { name: 'Uddevalla', lat: 58.3498, lon: 11.9381, type: 'town', population: 36000 },
  { name: 'Skövde', lat: 58.3914, lon: 13.8459, type: 'town', population: 40000 },
  { name: 'Lidköping', lat: 58.5053, lon: 13.1574, type: 'town', population: 26000 },
  { name: 'Mariestad', lat: 58.7101, lon: 13.8233, type: 'town', population: 15000 },
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
    [out:json][timeout:20];
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

  // WHY: AbortController gives a hard 15s cap so a stalled Overpass request
  // doesn't block the UI indefinitely — fallback kicks in instead.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(API_URLS.overpass, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    let data;
    if (text.startsWith('<') || !res.ok) {
      // WHY: overpass-api.de returns HTML error body when overloaded — fallback to kumi.systems
      console.warn('[destinations] primary Overpass returned HTML, trying kumi.systems');
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
      try {
        const res2 = await fetch('https://overpass.kumi.systems/api/interpreter', { ...fetchOptions, signal: controller2.signal });
        clearTimeout(timeoutId2);
        const text2 = await res2.text();
        if (text2.startsWith('<') || !res2.ok) {
          throw new Error('Both Overpass endpoints returned HTML/error');
        }
        data = JSON.parse(text2);
      } catch (e2) {
        clearTimeout(timeoutId2);
        throw e2;
      }
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
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
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
