// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Project page: https://theforgivenone.github.io/dresume
// base MUST match the repo name or every asset 404s on GitHub Pages.
export default defineConfig({
  site: "https://theforgivenone.github.io/dresume",
  base: "/dresume",
  output: "static",
  // "always" so the directory-style links this site emits (/cv/, /projects/x/)
  // actually resolve. Under "never" the server rejects them with a 404.
  trailingSlash: "always",
  integrations: [sitemap({ filter: (page) => !page.includes("/cv") })],
  vite: {
    plugins: [tailwindcss()],
  },
});
