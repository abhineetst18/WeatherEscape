# Features

## Core Concept

WeatherEscape answers one question: **where should I drive to escape bad weather today?**

Set your location, choose a driving radius, and see every reachable destination scored against your current weather on an interactive map.

---

## Weather Intelligence

### Live Forecast Data

| Region | Provider | Update Frequency |
|--------|----------|-----------------|
| Sweden | SMHI Open Data | Every 15 minutes |
| Norway, Denmark | MET Norway (YR) | Hourly |

No API keys required. Data is fetched directly from public APIs.

### Quality Scoring

Each destination receives a 0–100 score based on how much better its forecast is compared to your base location:

| Factor | Default Weight | Improvement Direction |
|--------|---------------|----------------------|
| Cloud cover | 35% | Less cloud → higher score |
| Precipitation | 30% | Less rain → higher score |
| Temperature | 20% | Warmer → higher score |
| Wind speed | 10% | Calmer → higher score |
| UV index | 5% | More UV → higher score |

Weights are adjustable per-session in Settings.

### Score Interpretation

| Score | Marker Colour | Meaning |
|-------|---------------|---------|
| 80–100 | Green | Significant improvement — worth the drive |
| 50–79 | Yellow | Moderate improvement |
| 20–49 | Orange | Marginal improvement |
| 0–19 | Red | Worse or no improvement |

### Time Periods

View forecasts for specific parts of the day:

- **All Day** — aggregated summary
- **Morning** — 06:00–12:00
- **Afternoon** — 12:00–18:00
- **Evening** — 18:00–00:00

Toggle between today and tomorrow.

### Delta Display

Each weather card shows exact improvements over your base location:
- Temperature difference (e.g. "+4 °C")
- Precipitation reduction (e.g. "−8 mm")
- Cloud cover change
- Wind speed change

---

## Map and Navigation

### Interactive Leaflet Map

- Colour-coded markers for all destinations within radius
- Click any marker to highlight its weather card
- Pan and zoom freely; map respects theme (dark/light tiles)

### Driving Radius

Adjustable from 30 minutes to 4 hours via slider.

**With OpenRouteService key:** Accurate road-based isochrone calculation.
**Without key:** Straight-line distance × 1.3 estimate (no signup needed).

### Location Management

- **GPS detection** — one-click current location
- **Search** — type a city or address (Nominatim geocoding)
- **Saved locations** — store favourites for quick switching
- **Base weather display** — current conditions shown in header

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| T | Toggle between today and tomorrow |
| 1 | Set time period: Morning |
| 2 | Set time period: Afternoon |
| 3 | Set time period: Evening |
| 4 | Set time period: All Day |
| Escape | Close settings modal |

---

## Personalisation

### Themes

- **Light** (default) — bright interface with light CARTO map tiles
- **Dark** — reduced-glare interface with dark CARTO tiles
- Follows system preference or manual toggle

### Languages

- English
- Swedish (Svenska)
- Norwegian (Norsk)
- Danish (Dansk)

### Score Weights

Adjust the relative importance of each weather factor in Settings to match your preferences (e.g. prioritise sunshine over temperature).

---

## Progressive Web App

### Offline Support

After first load, WeatherEscape works offline:
- Map tiles cached for 7 days
- Weather data cached for 30 minutes
- Full app shell available immediately

### Installation

On supported browsers, install WeatherEscape as a standalone app:
- Chrome/Edge: click the install icon in the address bar
- Safari (iOS): Share → Add to Home Screen
- Firefox: not supported for PWA install

---

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen-reader compatible (ARIA labels on all interactive elements)
- Focus-visible rings on interactive controls
- Colour contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text)
- Respects `prefers-reduced-motion`

---

## Supported Regions

Currently optimised for Scandinavia (Sweden, Norway, Denmark) due to API coverage. Destinations are pre-defined city/town lists within each country.
