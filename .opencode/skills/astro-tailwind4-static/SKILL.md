---
name: Astro Tailwind v4 Static Site
description: Wire Astro 5+ to Tailwind CSS v4 correctly for a static site. Use when setting up or changing Tailwind in an Astro project, defining theme tokens, implementing a class-based dark mode toggle, or when dark: utilities or custom colours are not working.
---

# Astro + Tailwind v4 static setup

## The one rule

Tailwind v4 has **no `tailwind.config.js`**. Theme tokens live in CSS via `@theme`, and Tailwind is added through the Vite plugin. If you find yourself writing `tailwind.config.js` or installing `@astrojs/tailwind`, stop — that is the v3 path and it is deprecated.

## Install

```sh
bun add astro tailwindcss @tailwindcss/vite
```

Three dependencies total. No `@astrojs/tailwind`.

## astro.config.mjs

```js
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://example.github.io",
  base: "/repo-name",          // omit or "/" for a user/org page
  output: "static",
  vite: { plugins: [tailwindcss()] },
});
```

`site` and `base` are mandatory on GitHub Pages. See the `github-pages-astro-deploy` skill.

## global.css

```css
@import "tailwindcss";

@theme {
  --color-accent: #6366f1;
  --color-surface: #ffffff;
  --color-surface-raised: #f8fafc;
  --color-ink: #0f172a;
  --color-ink-muted: #64748b;
  --color-line: #e2e8f0;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Required: switch dark: from prefers-color-scheme to a class. */
@custom-variant dark (&:where(.dark, .dark *));
```

`@theme` keys are namespace-driven: `--color-*` generates colour utilities, `--font-*` generates `font-*`, `--ease-*` generates `ease-*`.

## Class-based dark mode

Without the `@custom-variant` line, `dark:` keys off `prefers-color-scheme` and a manual toggle cannot work at all. This is the single most common Tailwind v4 mistake.

Apply the class from an **inline script in `<head>`**, before paint, or the page flashes the wrong theme:

```astro
<script is:inline>
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
</script>
```

`is:inline` stops Astro bundling and deferring it — a deferred script runs after first paint and the flash returns.

Toggle handler:

```astro
<script>
  const btn = document.getElementById("theme-toggle")!;
  btn.addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.theme = dark ? "dark" : "light";
  });
</script>
```

Paired surface tokens: define both themes in `@theme` and swap the whole token set on `.dark`, so components never hardcode colours.

```css
@theme {
  --color-surface: #ffffff;
  --color-ink: #0f172a;
}
.dark {
  --color-surface: #0b1120;
  --color-ink: #e2e8f0;
}
```

## Verifying

```sh
bunx astro check      # types
bunx astro build      # real build
bunx astro preview    # serve dist/
```

Always `astro build` + `preview` before calling it done. The dev server hides base-path and CSS ordering bugs.

## Gotchas

| Symptom | Cause |
|---|---|
| `dark:` never fires with a toggle | Missing `@custom-variant dark` |
| Theme flashes on load | Script not `is:inline`, or placed after `<body>` |
| Custom colour utilities missing | Token missing from `@theme`, or declared outside it |
| Styles work in dev, broken in build | Extra CSS file not imported by a layout |
| Integration errors | An old `@astrojs/tailwind` is still in `astro.config.mjs` — remove it |
