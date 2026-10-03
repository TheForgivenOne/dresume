# dresume

A resume and profile site that renders one set of content twice: an interactive
screen record and a flat, printable A4 CV. Because both come from the same
source, the CV can never drift out of date with the site.

Astro 7 · Tailwind CSS 4 · static output · GitHub Pages.

---

## Everything here is placeholder

No real employment history, education, projects, metrics, or contact details
have been supplied. Every entry is marked `PLACEHOLDER` on purpose.

**Two rules before you publish:**

1. Replace every `PLACEHOLDER`. Delete what you do not have — a shorter honest
   record beats a padded one.
2. Never invent a metric, a client, an employer, or a certification. A
   placeholder is merely unfinished. A fabricated claim is a liability that can
   end a hiring process.

There is no photograph, and none should be invented. The project covers are
typographic for the same reason.

---

## Fill this in first

**`src/data/site.ts`** — your identity. Name, title, tagline, bio, location,
availability, email, social links, and the reserved ink colour.

```ts
export const site = {
  name: "Your Name",
  title: "Agentic Development Engineer",
  tagline: "One line on what you actually do.",
  bio: ["First paragraph.", "Second paragraph."],
  location: "City, Country",
  availability: "Open to new work",   // null hides the badge
  email: "you@example.com",
  social: { github: "https://github.com/...", linkedin: undefined, x: undefined },
  examinationInk: "#9d2135",
  recordRef: "REC · 0000/0000",
} as const;
```

**`src/data/skills.ts`** — grouped skills with a 1–5 self-rating.

Then the entries, one Markdown file each:

| Folder | What one file is |
|---|---|
| `src/content/experience/` | one job or appointment |
| `src/content/education/` | one qualification |
| `src/content/projects/` | one project; the body becomes its detail page |
| `src/content/blog/` | one post; only here to feed the RSS file |

Delete the `placeholder-*.md` files as you replace them. Sections with no files
render **nothing at all** — no heading, no navigation link — so an empty
collection is a legitimate state, not a broken one.

### Frontmatter

Dates accept `2015`, `2015-06`, or `2015-06-18`. **Leave `end` off entirely for
a current role** — that is what renders "Present".

```yaml
---
role: "Staff Engineer"
organisation: "Acme"
location: "Remote"
start: 2024-03
# end:            ← omit for a current role
summary: "Two or three sentences on the scope of the role."
highlights:
  - "An outcome, with a real number attached."
tags: ["TypeScript", "Agent orchestration"]
note: "A detail a reader would otherwise have to ask about."   # renders as a marginal note
ref: "EX-01"                                                      # reference code
order: 1                                                          # lower is first
draft: false                                                     # true hides it everywhere
---
```

Anything optional may be left out; anything required, if wrong, fails the build
with a message naming the file. That is deliberate — a typo should not become a
silently blank row.

---

## Commands

```sh
bun install
bun run dev        # http://localhost:4321/dresume/
bun run build
bun run preview
bun run check      # type check
node scripts/make-og.mjs   # regenerate the link-preview card from site.ts
```

The dev server serves at **`/dresume/`**, not `/`. That is the GitHub Pages
base path and it applies locally too.

---

## Deploying

Push to `main`. The workflow at `.github/workflows/deploy.yml` type-checks,
builds, and publishes to GitHub Pages.

One-time repo setup:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. If the repo is private, **Settings → Pages → Actions** → allow GitHub Actions

If you rename the repository, change `base` in `astro.config.mjs` to match, or
every asset will 404.

---

## Things that will bite you

**Internal links must go through `withBase()`.** Astro rewrites its own asset
URLs for the base path but leaves a hand-written `href="/cv/"` alone, which
points at the domain root instead of the app.

**One accent, spent once.** The carmine in `--exam-ink` is reserved for the
present appointment. Do not use it for links, hover states, or badges — the
whole design rests on exactly one place the ink appears. Interactive states use
dense ink instead.

**Do not add a `tailwind.config.js`.** Tailwind 4 has no config file. Theme
tokens live in `@theme` inside `src/styles/global.css`.

**The dark theme is `html.dark`, not `.dark`.** Tailwind emits its tokens on
`:root`, which has the same specificity as a bare class, so `.dark` would lose
on source order and the theme would silently never apply.

**Print is a separate renderer.** `/cv` loads only `src/styles/print.css` and
never the depth or theme stylesheets, so nothing on the screen design can reach
paper. If you restyle the CV, change the CV layout.

---

## Layout

```
src/
  data/site.ts          identity — edit this first
  data/skills.ts        grouped skills
  content.config.ts     frontmatter schemas
  content/              the entries themselves
  components/           depth/ (TiltCard, ParallaxLayer) and sections/
  layouts/
    BaseLayout.astro    the screen record
    CVLayout.astro      the printable copy
  pages/
    index.astro         the record
    cv.astro            the certified copy
    projects/[...id]    project detail
    rss.xml.ts          delete with the blog collection if unused
  styles/
    global.css          tokens, dark theme, prose
    depth.css           the 3D sheet and the seal
    print.css           A4 output
scripts/make-og.mjs     regenerates public/og.png
```

`PRODUCT.md` holds the product truth — who this is for and what it may not
invent. `DESIGN.md` holds the visual system. Read them before restyling.
