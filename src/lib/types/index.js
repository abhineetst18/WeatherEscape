/**
 * @typedef {Object} Location
 * @property {string} id - Unique identifier (crypto.randomUUID())
 * @property {string} name - Display name (e.g., "Home", "Gothenburg")
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {boolean} isDefault - Whether this is the default location
 * @property {'saved' | 'gps' | 'search'} source - How the location was set
 */

/**
 * @typedef {Object} Destination
 * @property {string} id - Unique identifier
 * @property {string} name - Place name
 * @property {number} lat - Latitude
 * @property {number} lon - Longitude
 * @property {'town' | 'beach' | 'hiking' | 'attraction' | 'custom'} type - Destination category
 * @property {number} population - Population (for sorting relevance)
 * @property {number | null} driveTimeMinutes - Driving time from base in minutes
 * @property {number | null} driveDistanceKm - Driving distance in km
 * @property {WeatherData | null} weather - Weather data for this destination
 * @property {WeatherDelta | null} delta - Weather comparison vs base
 * @property {number | null} qualityScore - Composite quality score (0-100)
 */

/**
 * @typedef {Object} WeatherData
 * @property {number} temperature - Temperature in °C
 * @property {number} precipitation - Precipitation in mm (for forecast period)
 * @property {number} cloudCover - Cloud cover percentage (0-100)
 * @property {number} windSpeed - Wind speed in m/s
 * @property {number | null} uvIndex - UV index (if available)
 * @property {string} conditionCode - Weather condition symbol/code
 * @property {string} conditionText - Human-readable condition (localized)
 * @property {number | null} confidence - Forecast confidence percentage (SMHI)
 * @property {'smhi' | 'yr'} source - Which API provided this data
 * @property {string} fetchedAt - ISO timestamp of data fetch
 * @property {'burst' | 'spread' | 'none'} precipitationType - Precipitation pattern
 */

/**
 * @typedef {Object} WeatherDelta
 * @property {number} temperature - Temperature difference (destination - base)
 * @property {number} precipitation - Precipitation difference (negative = less rain = better)
 * @property {number} cloudCover - Cloud cover difference (negative = clearer = better)
 * @property {number} windSpeed - Wind speed difference (negative = calmer = better)
 * @property {number | null} uvIndex - UV index difference
 */

/**
 * @typedef {Object} UserSettings
 * @property {'dark' | 'light'} theme - Current theme
 * @property {'en' | 'sv' | 'no' | 'da'} locale - Current language
 * @property {number} drivingRadiusMinutes - Driving radius in minutes (default: 60)
 * @property {string} openRouteServiceKey - User's ORS API key
 * @property {WeatherWeights} weights - Weather scoring weights
 * @property {Location[]} savedLocations - Array of saved locations
 * @property {string | null} activeLocationId - Currently selected base location ID
 */

/**
 * @typedef {Object} WeatherWeights
 * @property {number} sunshine - Weight for cloud cover improvement (default: 0.35)
 * @property {number} precipitation - Weight for precipitation reduction (default: 0.30)
 * @property {number} temperature - Weight for temperature improvement (default: 0.20)
 * @property {number} wind - Weight for wind reduction (default: 0.10)
 * @property {number} uv - Weight for UV improvement (default: 0.05)
 */
