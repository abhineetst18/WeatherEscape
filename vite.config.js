import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'locales/*.json'],
      manifest: {
        name: 'WeatherEscape',
        short_name: 'WeatherEscape',
        description: 'Find better weather nearby — Nordic weather destination finder',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: /^https:\/\/opendata-download-metfcst\.smhi\.se\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'smhi-weather',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 60 }
            }
          },
          {
            urlPattern: /^https:\/\/api\.met\.no\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'yr-weather',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 60 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});
