# Installation

## Requirements

- **Node.js 18+** (with npm)
- A modern browser (Chrome, Firefox, Safari, Edge)

No backend server, database, or API keys are required. The app runs entirely in the browser.

## Quick Install

```bash
git clone <repo-url>
cd WeatherEscape
npm install
```

## Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot-module replacement.

## Production Build

```bash
npm run build
```

Output is written to `dist/`. Serve with any static file server.

## Preview Production Build

```bash
npm run preview
```

Serves the production build locally at `http://localhost:4173`.

## GitHub Pages Deployment

```bash
npm run build:gh-pages
```

This passes `--base=./` to Vite, producing relative asset paths that work under any subdirectory URL. Deploy the `dist/` folder to your gh-pages branch.

## Other Static Hosts

For Netlify, Vercel, or Cloudflare Pages:
- Build command: `npm run build`
- Publish directory: `dist/`
- No environment variables required

## Optional: OpenRouteService API Key

Without a key, drive times use a straight-line estimate (distance × 1.3). For accurate road-based isochrones:

1. Get a free key at [openrouteservice.org](https://openrouteservice.org)
2. Open the app → Settings → enter the key

The key is stored in `localStorage` and never leaves the browser.

## Troubleshooting

### Weather data not loading
- Check browser console for CORS or network errors
- SMHI and MET Norway APIs are free and require no authentication
- Ensure you have an internet connection (first load fetches live data)

### Map tiles not showing
- CARTO tiles require internet on first load
- After installation as PWA, tiles are cached for 7 days offline

### GPS location not working
- Browser must grant location permission
- HTTPS is required for geolocation (localhost is exempt during development)
- Use the search box as an alternative

### PWA not installing
- Must be served over HTTPS (or localhost)
- Check that the service worker registers without errors in DevTools → Application
