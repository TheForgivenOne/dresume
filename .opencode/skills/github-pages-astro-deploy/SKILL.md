---
name: GitHub Pages Astro Deploy
description: Deploy an Astro static site to GitHub Pages with correct base paths and a GitHub Actions workflow. Use when hosting an Astro site on GitHub Pages, fixing 404s on asset URLs or styles, or setting up CI for a static site.
---

# Astro to GitHub Pages

## The base path trap

This is the failure nearly every Astro-on-Pages project hits. Two distinct cases:

| Repo | `site` | `base` |
|---|---|---|
| `you.github.io` (user/org page) | `https://you.github.io` | `"/"` |
| `dresume` (project page) | `https://you.github.io/dresume` | `"/dresume"` |

```js
// astro.config.mjs
export default defineConfig({
  site: "https://you.github.io/dresume",
  base: "/dresume",
  output: "static",
});
```

Astro prefixes its own bundled assets with `base` automatically. **Hand-written absolute links do not get rewritten.** Anything you type as `href="/projects"` becomes `dresume.example/projects` — the root, not the app.

Two fixes, both required:

```astro
<!-- internal links -->
<a href={import.meta.env.BASE_URL + "projects/"}>Projects</a>

<!-- or use Astro's helper, which handles the trailing slash -->
<a href={withBase("/projects")}>Projects</a>
```

```astro
<!-- inline <script> is not processed by Astro, so prefix by hand -->
<script is:inline>
  fetch(`${import.meta.env.BASE_URL}feed.json`);
</script>
```

Rule of thumb: never hardcode a leading `/` in an internal URL. Prefer relative (`./projects`) or `import.meta.env.BASE_URL`.

## Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build
        run: bun run build

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## One-time repo setup

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. If the project is private, Settings → Pages → Actions → allow GitHub Actions.

## Verify locally before pushing

The dev server hides base-path bugs. Test the real build:

```sh
bun run build
bun run preview
```

Then, from `dist/`, confirm the emitted HTML references the prefixed paths:

```sh
grep -o 'href="/[^"]*"' dist/index.html | head
grep -o 'src="/[^"]*"'  dist/index.html | head
```

Every internal path must start with `/dresume`. If one starts with bare `/`, it is a hardcoded link to fix.

## SPA routing

Astro output is static, so there is no client-side router to configure. Deep links work because each route is a real file. A 404 page is still worth adding — GitHub Pages serves its own generic one otherwise:

```astro
---
// src/pages/404.html — note the .html extension
---
<html lang="en"><head><title>Not found</title></head>
<body><h1>404</h1><p><a href="/">Home</a></p></body></html>
```

## Gotchas

| Symptom | Cause |
|---|---|
| Blank page, 404 on assets | Wrong `base` |
| Page loads, nav links break | Hand-written `href="/..."` not prefixed |
| 404.html ignored | Named `404.astro` instead of `404.html` |
| CSS loads locally, breaks deployed | Never tested `astro build` + `preview` |
| Deploy job has no URL | Pages source not set to GitHub Actions |
