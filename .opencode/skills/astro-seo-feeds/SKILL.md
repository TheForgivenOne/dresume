---
name: Astro SEO and Feeds
description: Add Open Graph and Twitter meta tags, sitemap.xml, and an RSS feed to an Astro static site. Use when a portfolio or blog needs link previews to look correct on LinkedIn, X and Slack, or when setting up sitemap and feed endpoints.
---

# SEO and feeds for an Astro static site

## Meta tags

Put these in the layout's `<head>` so every page inherits them. Link previews are the highest-value SEO work on a portfolio — they are what a recruiter sees when you paste your URL into a message.

```astro
---
import { site } from "../data/site";
const {
  title = `${site.name} — ${site.title}`,
  description = site.tagline,
  image = "/og.png",
  canonical = Astro.url.pathname,
} = Astro.props;
const ogImage = new URL(image, Astro.site ?? Astro.url.origin).href;
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogImage} />
<meta property="og:site_name" content={site.name} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```

Rules that matter:

- `og:title` / `og:description` are what get rendered. Recruiters rarely click. Write them for the preview, not for SEO keyword stuffing.
- `summary_large_image` shows a 1200×630 image. `summary` shows a small thumbnail.
- `og:url` must be absolute. Build it with `new URL(image, Astro.site)` — a relative path silently breaks the preview.
- Requires `site` in `astro.config.mjs`. Without it `Astro.site` is undefined and absolute URLs fail.

## OG image

Generate one 1200×630 from the name and accent colour rather than screenshotting a service — no external dependency, no broken images when the site is offline. Put it in `public/og.png` and reference it as `/og.png`.

## Sitemap

```sh
bun add @astrojs/sitemap
```

```js
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://you.github.io",
  integrations: [sitemap()],
});
```

It infers routes from the build. It needs `site` to be set, and it respects `base` automatically. Exclude anything you do not want indexed:

```js
integrations: [sitemap({ filter: (page) => !page.includes("/cv") })]
```

## RSS

An endpoint, not a component:

```ts
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "../data/site";

export async function GET(context) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `${site.name} — writing`,
    description: site.bio,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}/`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
```

```sh
bun add @astrojs/rss
```

Note the explicit `.sort()` — collection order is not guaranteed. Then link it from the head:

```astro
<link rel="alternate" type="application/rss+xml" title={site.name} href="/rss.xml" />
```

A feed with zero entries is invalid and can get a feed reader to drop the URL. If there is nothing to publish, do not ship the endpoint — add it with the first real post.

## robots.txt

`public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://you.github.io/sitemap-index.xml
```

Match the filename `@astrojs/sitemap` actually emits — it is usually `sitemap-index.xml` when the site is small.

## Verify

1. Paste the URL into the Slack, LinkedIn, or Discord preview tool. This is the only real test.
2. `curl` the deployed URL and confirm `<meta property="og:image">` is absolute and resolves 200.
3. Validate `rss.xml` and `sitemap.xml` in a feed validator.
4. Run Lighthouse SEO — it catches missing viewport and title issues immediately.
