// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Project page: https://theforgivenone.github.io/dresume
// base MUST match the repo name or every asset 404s on GitHub Pages.
export default defineConfig({
  site: "https://theforgivenone.github.io/dresume",
  // Overridable so a demo can be served from a domain root. The default MUST
  // stay /dresume for the GitHub Pages project site — that is the repo name,
  // and every asset will 404 without it.
  base: process.env.BASE_PATH ?? "/dresume",
  output: "static",
  // "always" so the directory-style links this site emits (/cv/, /projects/x/)
  // actually resolve. Under "never" the server rejects them with a 404.
  trailingSlash: "always",
  integrations: [sitemap({ filter: (page) => !page.includes("/cv") })],
  vite: {
    plugins: [tailwindcss()],
    // The dev/preview server only. Quick tunnels (trycloudflare.com) get a
    // fresh hostname on every run, so the suffix is allowed rather than a
    // single host. This does not affect the built site or the Pages deploy.
    server: { allowedHosts: [".trycloudflare.com"] },
    preview: { allowedHosts: [".trycloudflare.com"] },
  },
});
