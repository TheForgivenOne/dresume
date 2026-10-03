---
name: The Registered Record
description: A resume and profile system built as an official registrar's record — one ruled sheet on a desk, one reserved ink, one struck seal.
colors:
  exam-ink: "#9d2135"
  desk: "#e0d9c8"
  paper: "#f2eee4"
  paper-raised: "#fbf9f4"
  paper-sunken: "#e7e1d3"
  ink: "#191512"
  ink-muted: "#57503f"
  ink-subtle: "#6f6754"
  rule: "#cdc4b0"
  rule-strong: "#a2977c"
  desk-night: "#080705"
  paper-night: "#15120e"
  paper-raised-night: "#1e1a14"
  ink-night: "#f1ece0"
  ink-muted-night: "#a79d88"
  rule-night: "#332c21"
  rule-strong-night: "#524a3a"
  # Print-only palette. The certified copy prints on real paper, so it uses true
  # white and true black rather than the warm screen tones — a warm cast on
  # paper reads as a rendering fault, not as a document.
  print-paper: "#ffffff"
  print-ink: "#000000"
  print-ink-muted: "#4a4438"
  print-rule: "#b8ae99"
typography:
  display:
    fontFamily: "Libre Caslon Text, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(3.2rem, 11vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Libre Caslon Text, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.4rem, 7vw, 4rem)"
    fontWeight: 400
    lineHeight: 0.98
  headline:
    fontFamily: "Libre Caslon Text, Iowan Old Style, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.015em"
  subhead:
    fontFamily: "Libre Caslon Text, Iowan Old Style, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Libre Caslon Text, Iowan Old Style, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 400
    lineHeight: 1.25
  measure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.7
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  note:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Azeret Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  print-name:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "25pt"
    fontWeight: 400
    lineHeight: 1
  print-role:
    fontFamily: "Archivo, sans-serif"
    fontSize: "10.5pt"
    fontWeight: 500
    lineHeight: 1.25
  print-body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "10.2pt"
    fontWeight: 400
    lineHeight: 1.42
  print-note:
    fontFamily: "Archivo, sans-serif"
    fontSize: "9.5pt"
    fontWeight: 400
    lineHeight: 1.4
  print-label:
    fontFamily: "Azeret Mono, monospace"
    fontSize: "7.3pt"
    fontWeight: 400
    letterSpacing: "0.16em"
    textTransform: "uppercase"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  baseline: "1.75rem"
  measure: "68ch"
components:
  seal:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "clamp(13rem, 34vh, 17.5rem)"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
    padding: "0.15rem 0.5rem"
  theme-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    size: "2.25rem"
  tag-field:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1rem"
---

# Design System: The Registered Record

## Overview

**Creative North Star: "The Registered Record"**

This system treats a resume as an official document rather than a marketing
page. The visual world is a registrar's transcript: a ruled sheet of warm
record paper lying on a desk, its divisions separated by hairlines, its columns
headed in small tracked capitals, and its one claim to authority made by a seal
struck into the paper. Nothing here is trying to be a template for a template.
It is trying to be a document that a person would trust enough to act on.

Density is deliberately low and the reading order is fixed, because the reader
is scanning rather than reading. Identity is the largest element; the sections
below it are a ledger. Prose is confined to a 68-character measure and set in a
workhorse grotesque at a comfortable size, while the display voice is a
transitional serif — Caslon, the typeface of institutional and legal printing
for three centuries — used only for names, headings, and the figure a record
turns on.

Depth is real rather than implied. The record is one physical sheet inside a
viewing volume: content sits 24px proud of the paper, and the seal stands 64px
proud of both. The whole sheet tilts as a single object toward the pointer and
nothing on it moves independently, because printed paper does not flutter. One
piece of motion carries the page — the seal resolving from an embossed outset
to an inset as it is pressed.

**Key Characteristics:**
- Warm throughout. No blue-grays, no pure black, no pure white.
- One ink, one place. The carmine appears exactly once per screen.
- Everything on one rhythm of 1.75rem.
- Hairlines and rules do the structural work; shadows only carry relief.
- Motion is one authored gesture and it is optional.

## Colors

The palette is warm paper and dense ink, with exactly one saturated colour
reserved rather than spent.

### Primary
- **Reserved Carmine** (`#9d2135`): the ink of a stamp. It marks the thing
  under examination — the current appointment, and nothing else on the page.
  On a dark ground it is derived, not re-picked: `color-mix(in oklab, var(--exam-ink) 52%, #f1ece0)`,
  so a custom ink stays legible on dark without a second value to maintain.

### Neutral
- **Desk** (`#e0d9c8`): the surface the record lies on, one step below the
  paper. Only ever seen at the sheet's margins.
- **Record Paper** (`#f2eee4`): the warm off-white of the ground itself.
- **Raised Paper** (`#fbf9f4`): the sheet's own surface and the seal's face.
- **Sunken Paper** (`#e7e1d3`): recessed fields.
- **Dense Ink** (`#191512`): primary text, headings, the sheet edge. Warm black,
  never `#000`.
- **Muted Ink** (`#57503f`): body copy and secondary values.
- **Subtle Ink** (`#6f6754` light, `#8b8371` dark): field labels and
  reference codes. It carries text, so it holds 4.5:1 as text in both themes —
  the previous value measured 3.93:1 and was legal only for type far larger
  than any label on the page.
- **Rule** (`#cdc4b0`): hairlines, chip borders, dotted dividers.
- **Strong Rule** (`#a2977c`): division rules and the header's hairline.

**Print palette.** The certified copy is a separate medium and does not reuse
the screen tones: **Print Paper** (`#ffffff`) and **Print Ink** (`#000000`),
with **Print Muted** (`#4a4438`) and **Print Rule** (`#b8ae99`) for secondary
values and hairlines. A warm cast on real paper reads as a rendering fault
rather than as a document, so the warmth stops at the screen.

### Named Rules

**The Measured Floor.** Body copy is never below 16px, field labels never below
11px, and any standalone control is at least 44x44px. These are measured in a
browser by `scripts/probe-responsive.mjs` across nine widths, not eyeballed —
the previous values (15.2px body, 9.9px labels, a 36px toggle) all looked
correct in screenshots and failed on the device the site is actually opened on.
An inline link inside a sentence is exempt: its target is the text.

**The One Ink Rule.** The reserved carmine appears exactly once per screen, on
the current appointment. Never on links, hover states, badges, buttons, or
section headings. Interactive states use dense ink, which is why the focus ring
is `2px solid --color-ink` and not an accent. If a second coloured element feels
necessary, the fix is hierarchy through size or weight, not another hue.

**The Warmth Rule.** No blue-grey anywhere. Every neutral is tinted warm toward
the paper. A cool grey reads as a template; a warm one reads as a document.

**No Accent Token.** `--color-accent` is deliberately absent from the theme. Its
absence is the enforcement mechanism: there is no second colour to reach for.

## Typography

**Display Font:** Libre Caslon Text (fallback: Iowan Old Style, Georgia, serif)
**Body Font:** Archivo (fallback: ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Azeret Mono (fallback: ui-monospace, monospace)

**Character:** A Caslon institutional serif carrying authority for anything
named, an Archivo grotesque doing the clerical work of data fields, and Azeret
Mono reserved for measurement — dates, counts, reference codes, and grades.
Mono is used only where a value is genuinely a measurement, never as decoration
to suggest "technical".

All three are self-hosted from `src/assets/fonts/` and referenced relatively so
Vite fingerprints them and rewrites the URLs with the deployment base path.
Latin subset only: 4 files, 108.7 KB total.

### Hierarchy
Screen — nine steps, and no others. Anything outside this list is a bug.

- **Display** (400, `clamp(3.2rem, 11vw, 6rem)`, 0.92, -0.02em): the name on
  the record. The only element permitted to reach 6rem.
- **Page title** (400, `clamp(2.4rem, 7vw, 4rem)`, 0.98): a project title, a
  post title, the 404.
- **Headline** (400, 1.75rem, 1.0): section divisions — Experience, Education,
  Skills, Projects, Contact.
- **Subhead** (400, 1.5rem, 1.1): the contact address, the only serif set
  large outside a heading.
- **Title** (400, 1.3rem, 1.25): an entry's role, a project's name, a prose
  `h3`.
- **Measure** (400, 1.05rem, 1.7, max 52ch): the tagline and a detail page's
  summary — the only prose larger than body.
- **Body** (400, 1rem, 1.7, max 68ch): prose and highlights. 16px is the
  legibility floor for copy read on a phone; the step was raised from 0.95rem
  after measuring 15.2px in the browser.
- **Note** (400, 1rem, 1.65, max 36ch): marginal notes only, italic. It is a
  genuine register, not a caption, so it holds the body size rather than
  dropping below it — 0.85rem measured 13.6px and read as a footnote on a
  phone. Its smaller *measure* is what makes it secondary; its type size is not.
- **Label** (400, 0.62rem, 0.16em, uppercase): field headings, reference
  codes, chips, navigation, dates, durations. Nine near-identical sizes were
  deliberately collapsed into this one step; hierarchy among labels comes from
  colour, spacing, and letter-spacing, not from a ninth of a rem.

Print — five steps, in points, on a separate ramp because paper is a different
medium. `print-name` 25pt, `print-role` 10.5pt, `print-body` 10.2pt,
`print-note` 9.5pt, `print-label` 7.3pt.

Every date, count, grade, and duration is set `tabular-nums`, so columns of
figures align down their right edge.

### Named Rules

**The No-Kicker Rule.** No eyebrow, no kicker, no small label above a heading.
A heading carries its own weight. Field labels are permitted only where they
name a column or a value.

**The Reference Code Rule.** Reference codes (`EX-01`, `FIG-02`) are numbered
only when the number carries information — a link to a detail page, or an order
the reader can cite. Decorative numbering is prohibited.

## Layout

The page is a single sheet, `min(1120px, 100% - 3rem)`, centred on the desk with
its own background, hairline border, and three-part shadow. Below 760px the
sheet becomes edge-to-edge and loses its border and shadow, because on a phone
there is no margin worth spending on the metaphor.

Everything vertical sits on a rhythm of **1.75rem** (`--baseline`). The paper's
ruled texture repeats on twice that interval (3.5rem), so the ruling and the
type share one grid rather than merely coexisting.

Prose is capped at **68ch**. The identity block splits `1fr / auto` above
1024px, placing the seal in the right column aligned to the top of the name.
Experience entries are a three-column grid at `lg` — `8.5rem` for the span of
time, `1fr` for substance, `15rem` for the marginal note — collapsing to two
columns at `md` and one below that. Skills run two paired columns.

## Elevation & Depth

Depth is structural, not decorative: the record occupies a real viewing volume
(`perspective: 1500px`) and its parts sit at fixed distances — content 24px
proud of the sheet, the seal 64px proud of that. Offsets stay under 80px,
because beyond that the perspective reads as a gimmick rather than as paper
lifted off a desk.

The sheet itself tilts as one object (max 2.4°, exponential ease-out,
`requestAnimationFrame`-throttled) and settles flat when the pointer leaves.
Individual cards never rotate — a printed record does not wobble, and a resume
whose cards each animate is a resume nobody can read.

### Shadow Vocabulary
- **Lift** (`0 1px 2px … 0 18px 40px`, three layers): the sheet on the desk.
  The sheet's only resting shadow.
- **Emboss** (`0 1px 0 rgba(255,255,255,.7), 0 -1px 0 …, 0 2px 3px …`): the
  seal at rest — a light edge above, a dark edge below, plus a soft cast.
- **Press** (`inset 0 2px 4px …, inset 0 -1px 0 …`): the seal under pressure,
  the inverse of Emboss. This is the page's one authored motion.

Dark-theme shadows are deeper and softer rather than larger; a shadow tuned on
paper reads as a bruise on carbon.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Only the sheet and the
seal carry a resting shadow; every other element separates with a hairline.

**The One Gesture Rule.** Depth appears in exactly one authored moment — the
seal press. Everything else is either static or a state change, and everything
is suppressed under `prefers-reduced-motion: reduce`, which flattens the sheet
and every layer to `transform: none`.

**The Flat-Sheet Rule.** `.record-sheet` must stay a flat element. Inside a
`preserve-3d` context a sticky child projects out of the viewport as it pins —
leaving a strip of desk above the header — and paint order follows z-position
rather than `z-index`, so scrolled content renders straight over the bar no
matter what `z-40` says. The depth context is nested one level down
(`.depth-stage`) so the header remains ordinary 2D sticky.

## Shapes

Right angles everywhere except the seal and the theme toggle. Divisions are
separated by a 1px rule in `--color-rule-strong` with a second 3px-offset rule
beneath it — a double rule, the way a transcript separates its divisions — and
this double rule is the only decorative device in the system.

The chip is a plain bordered rectangle with no radius, because a rounded pill
belongs to a different world than a record. The seal and toggle are fully round
(`9999px`). Nothing uses a blur, a glass effect, or a clip-path.

## Components

### The Seal
The dominant gesture and the page's primary action. Round, sized
`clamp(13rem, 34vh, 17.5rem)`, raised on the `layer-seal` at 64px.
- **Rest:** paper-raised, double ring, outer 2px in carmine at 45% opacity.
- **Hover:** outer ring goes full carmine, scale 1.014, rises to 74px.
- **Press:** shadow resolves Emboss → Press, scale 0.985.
- **Content:** a rosette, the label, a hairline, `1 source / 2 renderings`,
  and `Open →`. It states the mechanism in its own words.

### Chips
- **Style:** transparent, 1px `--color-rule` border, no radius, 0.64rem mono,
  muted ink. Names a technology, never a personality.
- **State:** one. They are not selectable and must not be made to look it.

### Theme toggle
Round, 2.25rem, hairline border, muted ink; fills to strong ink on hover.
Carries a correct `aria-label` that updates on every press.

### Entry rows (experience, education)
A three-column grid: reference code and span of time, substance, margin.
Separated by a 1px rule above, never below — an entry belongs to the division
below it. The current appointment carries the reserved ink on its date cell
and a small filled square, and is the only row that does.

### The counted stack
Years of practice as a run of ruled cells with a numeral and a field label. It
must always draw an empty tail (minimum 12 cells) — a fully filled run reads as
a solid bar rather than as a measure. The numeral carries the truth, not the
block.

### Skills table
Grouped rows of name plus a five-cell grade scale, filled to the self-rating,
with the scale defined once beneath. Dotted row dividers, two columns.

### Navigation
Sticky, inside the sheet's own width, hairline base that appears on scroll.
Tracked mono capitals at the label step. The inline links and the identity split
change at the **same** width (`lg`, 1024px) — an earlier version switched the nav
at `md` while the layout split at `lg`, and every viewport between the two got
a six-item nav crowding a wrapping name.

Below `lg` the links collapse into a labelled `<details>` disclosure in the
header bar, not a floating corner button: a floating control covered content,
read as an ornament rather than as navigation, and sat exactly where a phone's
home indicator lives. The panel is opaque, dismisses on select, on Escape, and
on an outside tap, and every row is 44px. Links are generated from content that
exists — a section with no entries gets no link.

### Marginal notes
An entry's `note` renders in its own column as an italic aside under a `Note`
field label, on a 1px left border. Only rendered when present; it is not a
footnote and must not stack under the content at wide widths.

## Do's and Don'ts

### Do:
- **Do** keep every vertical measurement on the 1.75rem baseline.
- **Do** keep prose at or under 68ch and set it in Archivo at 0.95rem or larger.
- **Do** let sections with no content render nothing at all, heading and nav
  link included.
- **Do** keep internal links going through `withBase()` so the deployment base
  path is applied.
- **Do** set `font-variant-numeric: tabular-nums` on anything that is a
  measurement.
- **Do** suppress the sheet tilt and every layer transform under
  `prefers-reduced-motion: reduce`.

### Don't:
- **Don't** use the reserved carmine for anything but the current appointment —
  not links, not hover, not focus, not badges, not headings.
- **Don't** add a second accent colour, a `--color-accent` token, or a blue-grey
  neutral.
- **Don't** add a `tailwind.config.js`. Tailwind 4 has no config file; tokens
  live in `@theme`.
- **Don't** tilt individual cards or animate sections on scroll. The sheet
  tilts as one object; that is the whole gesture.
- **Don't** use glass, backdrop blur, gradient text, or Unicode glyphs as
  icons. Icons are authored SVG at one stroke weight.
- **Don't** put a kicker or eyebrow above a heading.
- **Don't** let screen styling reach the printable copy. `/cv` loads only
  `print.css` and must stay flat, A4, and legible in monochrome.
- **Don't** size a touch target by viewport width alone. Gate compact sizes on
  `(pointer: coarse)`, or just leave them at 44px.
- **Don't** set `preserve-3d` on an element containing `position: sticky`.
- **Don't** add a second layout effect to `/cv` without re-checking print
  preview in both Chrome and Firefox.
