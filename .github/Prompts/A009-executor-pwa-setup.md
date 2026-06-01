# A009: PWA Setup

**Phase:** A — Foundation & Scaffolding
**Batch:** 2 (depends on A001)
**Complexity:** M
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD G4 requires an installable PWA with Lighthouse PWA score ≥ 90. PRD §7.1 specifies `vite-plugin-pwa` for service worker generation and manifest.

---

## Instructions

### 1. Install `vite-plugin-pwa`

```bash
npm install -D vite-plugin-pwa
```

### 2. Update `vite.config.js`

Add PWA plugin configuration:

```js
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg'],
  manifest: {
    name: 'WeatherEscape',
    short_name: 'WeatherEscape',
    description: 'Find better weather nearby — Nordic weather destination finder',
    theme_color: '#1a1a2e',
    background_color: '#1a1a2e',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,json}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'osm-tiles',
          expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'carto-tiles',
          expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
    ],
  },
})
```

### 3. Create PWA icons

Create simple SVG favicon and PNG icons:

- `public/favicon.svg` — Simple weather/compass icon in SVG (can be minimal)
- `public/pwa-192x192.png` — 192px PNG icon
- `public/pwa-512x512.png` — 512px PNG icon

For Phase A, create minimal placeholder icons. Use an SVG that can be rendered at any size. The PNGs can be generated from the SVG or be simple colored squares with the app initial "W".

### 4. Update `index.html`

Add required PWA meta tags:
```html
<meta name="theme-color" content="#1a1a2e" />
<link rel="icon" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/pwa-192x192.png" />
```

---

## Acceptance Criteria

- [ ] `vite-plugin-pwa` installed and configured in vite.config.js
- [ ] `npm run build` generates service worker files in dist/
- [ ] Manifest file generated with correct app name, icons, colors
- [ ] Service worker registers on page load (check DevTools → Application)
- [ ] `favicon.svg` exists in public/
- [ ] PWA icons (192px, 512px) exist in public/
- [ ] Map tiles have runtime caching configured (StaleWhileRevalidate)
- [ ] App installable prompt appears on mobile (or DevTools shows installable)

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `vite.config.js` | Modify | Add VitePWA plugin config |
| `index.html` | Modify | Add PWA meta tags |
| `public/favicon.svg` | Create | App favicon |
| `public/pwa-192x192.png` | Create | PWA icon 192px |
| `public/pwa-512x512.png` | Create | PWA icon 512px |
