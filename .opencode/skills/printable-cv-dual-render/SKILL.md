---
name: Printable CV Dual Render
description: Render one dataset through two layouts - an interactive screen page and a flat print-optimised A4 page - so a resume site gets a downloadable PDF for free. Use when adding a printable CV, a resume page, or a download button to a portfolio site.
---

# One dataset, two renderers

## Principle

Write the content once. Render it twice: an expressive screen layout and a flat print layout. Every alternative costs a second copy of the truth, which drifts.

This is the `devscard` pattern — one set of section data, `src/web/` for screen and `src/pdf/` for print.

```
src/content/…        ← content, written once
src/components/sections/   ← shared primitives (ExperienceList, SkillsGrid)
src/layouts/BaseLayout.astro   ← screen
src/layouts/CVLayout.astro     ← print
src/pages/cv.astro            ← print renderer
```

Shared components keep the markup in one place. Only the **wrapper** differs.

## Print page

```astro
---
// src/pages/cv.astro
import CVLayout from "../layouts/CVLayout.astro";
import { getCollection } from "astro:content";
import { site } from "../data/site";
import { formatRange } from "../lib/date";

const jobs = (await getCollection("experience", ({ data }) => !data.draft))
  .sort((a, b) => b.data.start.valueOf() - a.data.start.valueOf());
---
<CVLayout title={`${site.name} — CV`}>
  <header class="cv-head">
    <h1>{site.name}</h1>
    <p class="cv-role">{site.title}</p>
    <p class="cv-contact">
      {site.email} · {site.location} · {site.social.linkedin}
    </p>
  </header>

  {jobs.length > 0 && (
    <section>
      <h2>Experience</h2>
      {jobs.map((j) => (
        <article>
          <h3>{j.data.role} — {j.data.company}</h3>
          <p class="cv-dates">{formatRange(j.data.start, j.data.end)}</p>
          {j.data.highlights.map((h) => <ul><li>{h}</li></ul>)}
        </article>
      ))}
    </section>
  )}
</CVLayout>

<style>
  .cv-head { margin-bottom: 1.5rem; }
  .cv-dates { font-size: 0.8rem; color: #555; }
  h3 { font-size: 0.95rem; }
  /* Bullets in a list need no flex wrapper — reset the UA margin. */
  ul { margin: 0.25rem 0 0; padding-left: 1.1rem; }
</style>
```

## CVLayout

```astro
---
import "../styles/print.css";
const { title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="robots" content="noindex" />
  </head>
  <body class="cv-body">
    <main class="cv-sheet"><slot /></main>

    <button class="no-print" onclick="window.print()">Download PDF</button>
  </body>
</html>
```

`noindex` on the print page: it is a machine artefact, not a page to rank.

## print.css

```css
:root { --cv-pad: 18mm; }

.cv-body {
  font: 11pt/1.45 ui-sans-serif, system-ui, sans-serif;
  color: #111;
  background: #f4f4f5;
}

.cv-sheet {
  width: 210mm;                       /* A4 */
  min-height: 297mm;
  margin: 2rem auto;
  padding: var(--cv-pad);
  background: #fff;
  box-shadow: 0 2px 24px rgb(0 0 0 / 0.12);
}

.no-print { position: fixed; top: 1rem; right: 1rem; }

@media print {
  @page { size: A4; margin: 0; }

  html, body { background: #fff; }
  .no-print { display: none !important; }

  /* The sheet must become the page, not sit inside margins. */
  .cv-sheet {
    width: auto;
    min-height: 0;
    margin: 0;
    padding: var(--cv-pad);
    box-shadow: none;
  }

  /* Neutralise anything decorative from the screen design. */
  *, *::before, *::after {
    transform: none !important;
    box-shadow: none !important;
    animation: none !important;
    transition: none !important;
  }

  /* Stop entries splitting across pages. */
  article, section { break-inside: avoid; }
  h2, h3 { break-after: avoid; }

  /* Force real ink on every printer, even if the OS is in dark mode. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

@media (max-width: 240mm) {
  .cv-sheet { width: auto; margin: 0; box-shadow: none; }
}
```

The `@page { margin: 0 }` plus padding on `.cv-sheet` pattern is what stops the browser applying its own margins on top of yours — the single most common cause of a "print preview looks different from my page" bug.

## Download button

`window.print()` lets the user choose "Save as PDF" and keeps the CV in sync with the site forever, with no build step or PDF library.

```
Save as PDF → Format: A4 → Margins: Default → Enable Background graphics: ON
```

If a real `.pdf` file is linked instead, the print route still earns its keep as a preview. Never make a PDF the only copy of the content.

## Checks

- Print preview in Chrome **and** Firefox; they differ on margin handling.
- Confirm the CV fits sensibly within 1–2 pages. A CV longer than two pages is a content problem, not a layout one.
- Check in both light and dark OS mode — `print-color-adjust: exact` should prevent it going dark on paper.
- Verify nothing 3D, animated, or interactive leaks in from shared components.
