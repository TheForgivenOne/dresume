/**
 * Identity for the record. This is the first file to edit.
 *
 * Everything below is PLACEHOLDER — no real employment history, education,
 * metrics, or links have been supplied yet. Replace every value marked
 * `PLACEHOLDER` before publishing. Nothing in this file may be invented:
 * a claim that is not true is a liability, a placeholder is merely unfinished.
 */

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  x?: string;
  /** Optional personal site, shown if present. */
  website?: string;
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
    "Two or three sentences on where you have been and what you are good at. This paragraph is the one piece of prose a reader is likely to finish, so make it count rather than listing everything.",
    "A second sentence that gives the reader a reason to trust the claims above it — scale, a hard problem you solved, or a thing you shipped that people actually use.",
  ],

  /** PLACEHOLDER */
  location: "City, Country",

  /** PLACEHOLDER — set to null to hide the badge entirely. */
  availability: "Open to new work",

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
   * A reference code for the record, printed in the footer. PLACEHOLDER.
   * Purely presentational — do not imply it is a real registration number.
   */
  recordRef: "REC · 0000/0000",
} as const;

/** Social links that actually have a value, in display order. */
export const socialEntries = (Object.entries(site.social) as [
  keyof SocialLinks,
  string | undefined,
][]).filter((entry): entry is [keyof SocialLinks, string] => Boolean(entry[1]));
