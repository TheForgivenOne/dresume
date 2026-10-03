/**
 * One place that knows how a date is spoken and shown. Every date in the
 * record passes through here, so the record cannot disagree with itself.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const monthYear = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** "Mar 2024" */
export const formatDate = (d: Date): string => monthYear(d);

/** "Mar 2024 – Present" */
export const formatRange = (start: Date, end?: Date | null): string =>
  end ? `${monthYear(start)} – ${monthYear(end)}` : `${monthYear(start)} – Present`;

/** "2024 – 2026", the coarse form used for the counted stack and the CV. */
export const formatYears = (start: Date, end?: Date | null): string => {
  const a = start.getUTCFullYear();
  const b = end ? end.getUTCFullYear() : new Date().getUTCFullYear();
  return a === b ? `${a}` : `${a} – ${b}`;
};

/**
 * Whole years between two dates, rounded down, never negative. An open-ended
 * range runs to today.
 */
export const yearsBetween = (start: Date, end?: Date | null): number => {
  const to = end ?? new Date();
  const months =
    (to.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - start.getUTCMonth());
  return Math.max(0, Math.floor(months / 12));
};

/** Machine-readable value for a <time> element. */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Parses the loose date forms a person actually writes in frontmatter.
 *
 * `z.coerce.date()` is wrong here: YAML turns `start: 2015` into the number
 * 2015, and `new Date(2015)` is 1.97 seconds after the epoch — so a bare year
 * silently renders as "Jan 1970". A CV is full of bare years, so this accepts
 * year, year-month, full ISO, and a real Date.
 *
 * Always UTC: a bare year means 1 January of that year everywhere, not a
 * timezone-dependent instant that can drift a day across the Atlantic.
 */
export const parseLooseDate = (input: unknown): Date => {
  if (input instanceof Date) {
    if (Number.isNaN(input.valueOf())) throw new Error("Invalid Date in frontmatter");
    return input;
  }

  if (typeof input === "number" || typeof input === "string") {
    const raw = String(input).trim();

    // "2015" — a bare year, which YAML has already turned into a number.
    if (/^\d{4}$/.test(raw)) return new Date(Date.UTC(Number(raw), 0, 1));

    // "2015-06" or "2015-6"
    const ym = /^(\d{4})-(\d{1,2})$/.exec(raw);
    if (ym) return new Date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1));

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.valueOf())) return parsed;
  }

  throw new Error(
    `Unrecognised date ${JSON.stringify(input)}. Use YYYY, YYYY-MM, or YYYY-MM-DD.`,
  );
};

