import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { parseLooseDate } from "./lib/date";

/**
 * Every field carries a default except the handful that genuinely cannot be
 * absent. While the content is still being filled in, a missing optional key
 * should degrade quietly rather than fail the build — but a missing required
 * one must fail loudly, so an entry can never render as a blank row.
 */

/**
 * Dates are NOT z.coerce.date(). YAML turns `start: 2015` into the number
 * 2015, and new Date(2015) is 1970 — a bare year would render as "Jan 1970".
 * parseLooseDate accepts YYYY, YYYY-MM, ISO strings and real Dates.
 */
const DateField = z
  .union([z.date(), z.string(), z.number()])
  .transform((v) => parseLooseDate(v));

/** An absent or empty end means "current", not an error. */
const OptionalDate = DateField.nullish();

/** Frontmatter shared by every dated entry in the record. */
const dated = {
  start: DateField,
  end: OptionalDate,
  location: z.string().optional(),
  /** Rendered in the marginal column. The one place a note may appear. */
  note: z.string().optional(),
  /** Reference code printed in mono, e.g. "EX-01". Carries meaning. */
  ref: z.string().optional(),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
  draft: z.boolean().default(false),
};

const experience = defineCollection({
  loader: glob({ base: "./src/content/experience", pattern: "**/*.md" }),
  schema: z.object({
    role: z.string(),
    organisation: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    ...dated,
  }),
});

const education = defineCollection({
  loader: glob({ base: "./src/content/education", pattern: "**/*.md" }),
  schema: z.object({
    qualification: z.string(),
    institution: z.string(),
    summary: z.string().default(""),
    ...dated,
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.string().optional(),
    tags: z.array(z.string()).default([]),
    links: z
      .object({
        repo: z.string().optional(),
        demo: z.string().optional(),
        writeup: z.string().optional(),
      })
      .default({}),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: DateField,
    draft: z.boolean().default(false),
  }),
});

export const collections = { experience, education, projects, blog };
