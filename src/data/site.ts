/**
 * Identity for the record. This is the first file to edit.
 *
 * Everything below is PLACEHOLDER — no real employment history, education,
 * metrics, or links have been supplied yet. Replace every value marked
 * `PLACEHOLDER` before publishing. Nothing here may be invented: a claim that
 * is not true is a liability, a placeholder is merely unfinished.
 *
 * Optional fields are typed `| null` and default to null. An optional field that
 * is set to a placeholder string is worse than an absent one, because it renders
 * a value with nothing behind it — a dot beside "Open to new work", a reference
 * code reading 0000/0000. Until there is something true to say, leave them null.
 */

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  x?: string;
  /** Optional personal site, shown if present. */
  website?: string;
}

/**
 * Availability, if you are open to work. Null hides it entirely.
 *
 * `detail` is what makes the badge worth the space: a bare status is a label a
 * reader cannot act on. Give it a role, a location, or a date.
 */
export interface Availability {
  /** The one-line claim, e.g. "Open to new work". */
  status: string;
  /** What is actually wanted, e.g. "Senior agentic tooling, remote or EU". */
  detail?: string;
}

export const site = {
  /** PLACEHOLDER */
  name: "Your Name",

  /** PLACEHOLDER — the single line a screener reads first. */
  title: "Agentic Development Engineer",

  /** PLACEHOLDER — one line on what you actually do. */
  tagline:
    "I build the tooling that lets coding agents do real work — evaluation harnesses, orchestration, and the traces that prove it worked.",

  /** PLACEHOLDER */
  bio: [
    "PLACEHOLDER summary — the paragraph a screener reads first.",
    "PLACEHOLDER summary — a second paragraph carrying evidence for the claim above.",
  ],

  /** PLACEHOLDER */
  location: "City, Country",

  /** PLACEHOLDER — set to null until there is something true to put in it. */
  availability: {
    status: "PLACEHOLDER availability",
    detail: undefined,
  } satisfies Availability,

  /** PLACEHOLDER */
  email: "you@example.com",

  social: {
    github: "https://github.com/TheForgivenOne",
    linkedin: undefined,
    x: undefined,
    website: undefined,
  } satisfies SocialLinks,

  /**
   * The reserved examination ink. Overridable, but keep it distinct from the
   * dense ink used for text: the whole design rests on exactly one accent,
   * spent only on the present appointment.
   */
  examinationInk: "#9d2135",

  /**
   * Optional reference code, printed in the header and footer. Null hides it —
   * an unset code that still renders is a counter with nothing behind it.
   */
  recordRef: null,
} as const;

/** Social links that actually have a value, in display order. */
export const socialEntries = (Object.entries(site.social) as [
  keyof SocialLinks,
  string | undefined,
][]).filter((entry): entry is [keyof SocialLinks, string] => Boolean(entry[1]));