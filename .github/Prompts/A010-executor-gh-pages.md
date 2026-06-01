# A010: GitHub Pages Deployment Configuration

**Phase:** A — Foundation & Scaffolding
**Batch:** 4 (depends on A001, A009)
**Complexity:** S
**PRD:** `WeatherEscape/.tasks/prd-weather-escape.md`

---

## Context

PRD G6 requires deployment as a static site to GitHub Pages with zero server costs. `npm run build` must produce deployable output.

The repo is `AstPythonTools` and WeatherEscape is a subfolder. Deployment options:
1. **GitHub Actions** workflow that builds and deploys the `WeatherEscape/dist/` folder
2. **Manual deployment** with documented steps

Since this is a subfolder of a multi-project repo, the base path needs careful configuration.

---

## Instructions

### 1. Configure Vite `base` path

In `vite.config.js`, set the `base` for GitHub Pages:

```js
export default defineConfig({
  base: '/AstPythonTools/',  // or '/WeatherEscape/' depending on deployment strategy
  // ... rest of config
});
```

**Note:** The exact base path depends on how the user wants to deploy:
- If deploying the entire repo → `base: '/AstPythonTools/'`
- If deploying WeatherEscape as a standalone site → `base: '/'`
- If using a custom domain → `base: '/'`

**Default to `base: './'`** (relative paths) for maximum flexibility. This works for both GitHub Pages subdirectory and standalone deployment.

### 2. Add build script verification

Ensure `package.json` scripts are correct:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Document deployment steps

Add a comment block at the top of `vite.config.js` or create a brief section:

```
# Deployment to GitHub Pages
# 1. cd WeatherEscape
# 2. npm run build
# 3. Deploy dist/ folder to GitHub Pages
#    Option A: Use gh-pages npm package
#    Option B: Manual upload
#    Option C: GitHub Actions workflow
```

### 4. (Optional) Create `.github/workflows/deploy.yml`

If the user wants automated deployment, create a GitHub Actions workflow:

```yaml
name: Deploy WeatherEscape to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['WeatherEscape/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd WeatherEscape && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./WeatherEscape/dist
```

**Note:** This is optional — include only if straightforward. The main requirement is that `npm run build` works.

---

## Acceptance Criteria

- [ ] `npm run build` produces `dist/` folder with all assets
- [ ] Built output uses relative paths (works when served from any directory)
- [ ] `npm run preview` serves the built output correctly
- [ ] No hardcoded absolute paths in built output
- [ ] Deployment steps documented

---

## Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `vite.config.js` | Modify | Set base path for deployment |
