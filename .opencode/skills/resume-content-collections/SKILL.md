---
name: Resume Content Collections
description: Model resume and portfolio content as typed data and Markdown collections in Astro, and hide sections that have no content yet. Use when adding experience, education, projects, or skills sections, defining frontmatter schemas, or when a site built with placeholder content must degrade cleanly when entries are deleted.
---

# Content as data for a resume site

## Principle

A resume site is edited far more often than it is designed. Keep **identity** in one typed config file and **entries** in Markdown files. Never hardcode a job title in markup.

Two layers:

| Layer | Lives in | Holds |
|---|---|---|
| Identity | `src/data/site.ts` | name, title, bio, contact, social, accent, nav |
| Entries | `src/content/<collection>/*.md` | one file per job, course, project, post |

## site.ts

```ts
// src/data/site.ts
export const site = {
  name: "Your Name",
  title: "Your Job Title",
  tagline: "One line that says what you do",
  bio: "Two or three sentences.",
  email: "you@example.com",
  location: "City, Country",
  availability: "Open to work",     // null hides the badge
  accent: "#6366f1",
  resumePdf: "/resume.pdf",         // null hides the button
  social: {
    github: "https://github.com/you",
    linkedin: "https://linkedin.com/in/you",
    x: "https://x.com/you",
  },
  nav: ["about", "experience", "skills", "projects", "contact"],
} as const;
```

`as const` plus an `satisfies Site` interface makes a typo a type error, not a blank page.

## Schemas

`src/content.config.ts`:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const experience = defineCollection({
  loader: glob({ base: "./src/content/experience", pattern: "**/*.md" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    location: z.string().optional(),
    start: z.coerce.date(),
    end: z.coerce.date().nullish(),   // nullish = current role
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { experience };
```

- Import `z` from `astro/zod`, never a bare `zod` import.
- `.default([])` and `.nullish()` matter: without them an entry missing a key fails the build, which is hostile while content is still being filled in.
- Give every field a default except the few that are genuinely required.

## Querying

```astro
---
import { getCollection } from "astro:content";

const jobs = (await getCollection("experience", ({ data }) => !data.draft))
  .sort((a, b) => b.data.order - a.data.order || b.data.start.valueOf() - a.data.start.valueOf());
---
```

**Collection order is non-deterministic and platform-dependent.** Always sort explicitly when order matters. Never rely on filename or filesystem order.

Format dates once, centrally:

```ts
// src/lib/date.ts
export const formatRange = (start: Date, end?: Date | null) => {
  const f = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return end ? `${f(start)} – ${f(end)}` : `${f(start)} – Present`;
};
```

## Render nothing when empty

The defining behaviour of a site that starts empty. A section with no entries must not render a heading.

```astro
---
const jobs = await getCollection("experience");
---
{jobs.length > 0 && (
  <section id="experience">
    <h2>Experience</h2>
    {jobs.map((j) => <Article entry={j} />)}
  </section>
)}
```

Compute the nav from real content so links to empty sections never appear:

```astro
---
const jobs = await getCollection("experience");
const sections = [
  { id: "about",     label: "About",      ready: true },
  { id: "experience", label: "Experience", ready: jobs.length > 0 },
  { id: "projects",   label: "Projects",   ready: projects.length > 0 },
];
const visible = sections.filter((s) => s.ready);
---
```

`devportfolio` does this in `src/components/Header.astro` with `siteConfig.projects && siteConfig.projects.length > 0` — worth copying exactly.

## Detail pages from entries

```astro
---
// src/pages/projects/[...id].astro
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects.map((p) => ({ params: { id: p.id }, props: { project: p } }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---
<h1>{project.data.title}</h1>
<Content />
```

Use `[...id]` (rest param) rather than `[id]` — it is required as soon as any entry uses a `slug` containing `/`.

## Checks

- Deleting every file in a collection must still produce a clean build with no empty headings.
- A typo'd frontmatter key must fail the build with a readable message.
- Restart the dev server after editing a schema, or `astro:content` types go stale.
