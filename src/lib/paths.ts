/**
 * Internal link helper.
 *
 * Astro rewrites its own bundled asset URLs with `base`, but a hand-written
 * `href="/cv"` in a template is left exactly as typed — which points at the
 * domain root instead of the app, and 404s on a GitHub Pages sub-path.
 * Everything internal goes through here.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const withBase = (path: string): string => `${BASE}${path}`;
