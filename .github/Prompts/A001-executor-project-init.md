# A001: Project Initialization — Svelte 5 + Vite 6 + TailwindCSS 4

**Phase:** A — Foundation & Scaffolding
**Batch:** 1 (no dependencies)
**Complexity:** L
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

Green-field project. WeatherEscape is a Nordic weather destination finder PWA. This prompt sets up the entire build toolchain from scratch.

**Tech stack (from PRD §7.1):**
- Svelte 5 (runes mode) — framework
- Vite 6+ — build tool
- TailwindCSS 4 — styling
- Leaflet 1.9+ — maps (install now, configure in A006)

**Project root:** `WeatherEscape/`

---

## Instructions

### 1. Create `package.json`

```json
{
  "name": "weather-escape",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Dependencies to install:**
- `svelte` (^5)
- `leaflet` (^1.9)

**Dev dependencies:**
- `@sveltejs/vite-plugin-svelte` (^5)
- `vite` (^6)
- `tailwindcss` (^4)
- `@tailwindcss/vite` (^4)

### 2. Create `vite.config.js`

- Import `svelte` from `@sveltejs/vite-plugin-svelte`
- Import `tailwindcss` from `@tailwindcss/vite`
- Configure both plugins
- Set `server.port` to 5173 (Vite default)

### 3. Create `index.html`

Standard Vite HTML entry:
- `<div id="app"></div>`
- `<script type="module" src="/src/main.js"></script>`
- Meta viewport for mobile
- Title: "WeatherEscape"

### 4. Create `src/app.html`

Svelte template with `%sveltekit.head%` — actually, since this is NOT SvelteKit but plain Svelte + Vite, this file is NOT needed. The `index.html` at root IS the template.

### 5. Create `src/main.js`

Mount `App.svelte` to `#app` div:
```js
import App from './App.svelte';
import './styles/app.css';

const app = new App({ target: document.getElementById('app') });
export default app;
```

Note: For Svelte 5, use `mount()` from `svelte` instead of constructor:
```js
import { mount } from 'svelte';
import App from './App.svelte';
import './styles/app.css';

const app = mount(App, { target: document.getElementById('app') });
export default app;
```

### 6. Create `src/App.svelte`

Minimal placeholder:
```svelte
<main class="h-screen w-screen bg-gray-900 text-white">
  <h1>WeatherEscape</h1>
  <p>App shell loading...</p>
</main>
```

### 7. Create `src/styles/app.css`

```css
@import "tailwindcss";
```

TailwindCSS 4 uses `@import "tailwindcss"` instead of the old `@tailwind base/components/utilities` directives.

### 8. Create `.gitignore`

```
node_modules/
dist/
.env
.env.local
*.local
.DS_Store
```

### 9. Run `npm install`

Verify:
- `npm run dev` starts dev server
- `npm run build` produces `dist/`
- Open browser to localhost:5173, see placeholder text

---

## Acceptance Criteria

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts Vite dev server on port 5173
- [ ] `npm run build` produces `dist/` folder
- [ ] Browser shows placeholder "WeatherEscape" text
- [ ] TailwindCSS utility classes (e.g., `bg-gray-900`, `text-white`) render correctly
- [ ] No console errors in browser or terminal

---

## Files Created

| File | Purpose |
|------|---------|
| `package.json` | Project config + dependencies |
| `vite.config.js` | Vite + Svelte + TailwindCSS plugin config |
| `index.html` | Vite HTML entry point |
| `src/main.js` | App entry — mounts Svelte root |
| `src/App.svelte` | Placeholder root component |
| `src/styles/app.css` | Global styles + TailwindCSS import |
| `.gitignore` | Git ignore rules |

---

## Risks & Prevention

- **TailwindCSS 4 integration:** TailwindCSS 4 uses `@tailwindcss/vite` plugin (not PostCSS). Ensure using the Vite plugin approach, not the legacy PostCSS approach.
- **Svelte 5 mount API:** Svelte 5 uses `mount()` instead of `new App()`. Use the runes-compatible API.
