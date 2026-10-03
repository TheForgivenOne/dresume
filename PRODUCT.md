# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-selected after being offered options: **Astro 7 (static output) + Tailwind CSS 4**, deployed to **GitHub Pages** at `https://theforgivenone.github.io/dresume` (base path `/dresume`).

Content is Markdown content collections plus one typed `site.ts` config. No UI framework, no WebGL, no 3D library.

## Users

The primary user is a **recruiter or hiring manager screening a candidate**, landing on the site for a 20–30 second pass to decide whether to call back. They are not reading for pleasure and they are not evaluating craft; they are triaging a stack of applicants.

A secondary reader exists at a later stage: a hiring manager or peer who has already decided to look closer and will open project detail pages and a linked repository.

The site may also be opened on a phone, from a link pasted into email, Slack, or LinkedIn, at a moment when the reader did not choose to visit.

## Product Purpose

A resume and profile site that lets a screener reach a callback decision from a single link, and lets a deeper reader verify the work without a separate document.

Success is a screener being able to answer, unprompted and within one glance: what this person does, whether they are good at it, and how to contact them.

## Positioning

One content source renders two outputs — an interactive screen profile and a flat print-optimised CV at `/cv`. The CV therefore cannot drift out of sync with the site, because there is no second copy of the content to drift.

Secondary differentiator: projects carry their own detail pages, so the same link serves both the 30-second screener and the deep reader without either being shortchanged.

## Operating Context

- Reached primarily as a pasted URL in email, Slack, LinkedIn DMs, or an ATS field. The link preview in those clients is a real surface, not an afterthought.
- Frequently opened on mobile.
- The `/cv` route is printed, or saved as PDF via the browser's print dialog.
- Deployed to a `github.io` sub-path, not a domain root.
- Content is edited by the owner directly, in Markdown and one config file, without a deploy beyond git push.

## Capabilities and Constraints

Confirmed:

- Content lives in data. Identity in `src/data/site.ts`; entries as Markdown files in content collections.
- **Sections with no entries render nothing at all**, including their navigation link. There is currently no real content, so this is the defining behaviour, not a fallback.
- `/cv` is a separate flat print renderer over the same collections. Screen 3D styling must never affect it.
- Dark mode via a class on `<html>`, defaulting to the OS preference.
- `prefers-reduced-motion` is honoured by default, not behind a toggle.
- No WebGL or 3D library. The dimensional feel is CSS transform work only, so the site stays dependency-light and the print view stays flat.
- Field emphasis: **agentic assisted development** — AI/LLM agent tooling that assists software development. Leans software-engineering shaped: stack, shipped work, measurable outcomes.
- Only three runtime dependencies: `astro`, `tailwindcss`, `@tailwindcss/vite`, plus `@astrojs/sitemap` and `@astrojs/rss`.

Open, undecided:

- Whether a blog exists. A `blog/` collection with one placeholder post currently exists purely so the RSS feed is valid; a feed with zero entries is invalid and readers drop it. Delete the folder and the endpoint together if no blog is wanted.

## Brand Commitments

- Project and repository name: **dresume**.
- GitHub account: `TheForgivenOne`.
- Personal name, job title, and any existing visual identity are **not yet supplied**. Everything renders from placeholders.

## Evidence on Hand

**None. There is no real content yet.**

Specifically absent, and therefore never to be fabricated by future work: employment history, employers, education, project names and descriptions, metrics, testimonials, client names, certifications, metrics or benchmarks, employer logos, and a personal photograph.

Placeholder entries must be visibly placeholder — a reader must never mistake seeded content for a real claim.

## Product Principles

1. **Twenty seconds or nothing.** A screener who has not found the role, the evidence, and the contact route in one pass has failed.
2. **Content is data, never markup.** Nobody should edit a component to change a job title.
3. **Empty means invisible.** No heading without content beneath it. No dead navigation link.
4. **One source, two renderers.** The CV is a view of the site, never a separate document to maintain.
5. **Motion is decoration and always optional.** Depth and animation exist to make the work memorable; they are never allowed to impede reading or print.
6. **Never invent a claim.** A placeholder is honest. A fabricated metric is a liability.

## Accessibility & Inclusion

Confirmed by the user:

- `prefers-reduced-motion: reduce` is honoured automatically.

Established as engineering constraints for this product:

- Text contrast meets WCAG AA in both light and dark themes.
- All interactive controls are keyboard reachable with a visible focus indicator.
- Decorative 3D never encodes information; no content depends on colour alone or on hover.
- The print output must remain legible in monochrome.
