---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Surface: Home (recruiter screening) + certified copy at /cv

## Scope and visitor mode

Mode **Persuade**. Route: `/` (primary surface). Visitor decides and acts within
20–30 seconds. Action: call back, or take the certified copy at `/cv`.
Supporting routes `/projects/[id]` and `/blog/[id]` inherit this world.

## Audience, job, action, proof, constraints

Recruiter or hiring manager triaging applicants. Job: decide whether this person
is worth 15 minutes. Proof: years, roles, shipped work. Action: the seal.
Constraint: placeholder content only — nothing may be invented as a claim.
Placeholder entries must read as placeholder.
Dark mode, reduced-motion, A4 print, GitHub Pages sub-path `/dresume`.
No WebGL; the dimensional feel is CSS transform work and must not reach print.

## Direction and memorable moment

Direction: **THE REGISTERED RECORD** (registrar's transcript).
Memorable moment: the seal depresses — outset shadow resolving to inset —
and opens the certified copy, which is the same record rendered flat.

## Direction contract

**THESIS.** The resume is an official record, not a marketing page. Refuses the
category's centred-headline-over-a-row-of-cards arrangement in favour of one
continuous ruled sheet carrying a single dominant gesture: an embossed seal
that both certifies and converts.

**OWN-WORLD.** Registrar's transcript. Warm off-white record-paper ground with a
true horizon; dense ink; hairline warm-gray rules, never blue-gray. One carmine
ink reserved and spent only on the present role. A marginal annotation column
keyed to measured date spans. Registrar transitional roman for names and
section heads; institutional grotesque for data fields; tabular numerals
throughout; technical mono for reference codes. Embossed circular seal whose
outset shadow resolves to inset under press.

**STORY.** A screener lands and reads one record: who, what role, how many
years, what they built, how to reach them. The seal is the primary action and
opens `/cv`, a flat certified copy from the same source, so it cannot disagree
with what was just read. A section with no entries leaves no gap in the record.

**FIRST VIEWPORT.** Left: the name set large in the registrar roman, role and
location beneath on the same ruled baseline. Right of the name: the seal at
roughly a third of viewport height, carmine-ringed, stating two renderings from
one source — the only element permitted to outrank the name. Below the identity
block: the counted stack, years in field as ruled cells rather than a label. A
single ruled baseline separates identity from the first entry. The seal is the
primary action, unmistakable and keyboard reachable, with a visible label.

**FORM.** Registrar's transcript / institutional academic record. Position 3 of
7 grounded candidates, assigned by concept-seed. Seed key `47b948e7`, mode
`persuade`, scope `direction`.

**Raises.** One continuous paper field (from cyclorama). One reserved ink for
what is under examination (from patent sheet). Marginal annotation column keyed
to the measured axis (from daylight section). One unmistakable active state
(from one-bit desktop). Number as hero object, a counted stack not a label (from
nixie counter). One dominant gesture that outranks the page (from illuminated
initial).

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Blog: a `blog/` collection with one placeholder post exists only so the RSS
  feed is valid. Delete folder and endpoint together if no blog is wanted.
- Personal name, title, location, links all placeholder in `src/data/site.ts`.
- No photograph exists and none may be invented.
