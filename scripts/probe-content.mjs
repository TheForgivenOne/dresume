/**
 * The content gate.
 *
 * This site ships with placeholder content on purpose, which makes it very easy
 * to publish a page that is technically complete and useless: instructions
 * addressed to the site owner rendering as the candidate's own words, counters
 * with nothing behind them, a duration field printing "0 yrs" as though that
 * were a measurement.
 *
 * Everything checked here is automatable and belongs in CI. Whether the copy
 * reads like a human wrote it is not automatable and is not attempted.
 *
 *   node scripts/probe-content.mjs            # report only
 *   node scripts/probe-content.mjs --strict   # exit 1 on any finding
 *
 * Placeholder *content* is expected here and is not itself a failure. The gate
 * fails on placeholder content that has escaped into a reader-facing voice.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const read = (p) => readFile(join(root, p), "utf8");

const findings = [];
const fail = (gate, where, detail) => findings.push({ gate, where, detail });

// ---------------------------------------------------------------------------
// 1 — instruction leak
//
// The worst failure available: prose addressed to the site owner rendering as
// the candidate's own words. Matched as whole phrases so ordinary copy is safe.
// ---------------------------------------------------------------------------
const INSTRUCTION_VOICE = [
  "make it count",
  "replace with",
  "one piece of prose",
  "two or three sentences",
  "what you owned",
  "and what it was for",
  "the reader would otherwise",
  "delete the sentence",
  "name the trade-off",
  "fill this in",
  "replace it with a real",
];

const flagVoice = (where, text) => {
  const hay = String(text).toLowerCase();
  for (const phrase of INSTRUCTION_VOICE) {
    if (hay.includes(phrase)) fail("instruction-voice", where, `"${phrase}"`);
  }
};

/** Pull every reader-facing string out of a frontmatter block plus body. */
function proseOf(markdown) {
  const [fm = "", ...rest] = markdown.split(/^---$/m);
  const out = [];

  for (const m of fm.matchAll(/^(summary|description):\s*"([^"]*)"/gm)) {
    out.push([m[1], m[2]]);
  }
  for (const m of fm.matchAll(/^\s+-\s+"([^"]{20,})"/gm)) {
    out.push(["bullet", m[1]]);
  }
  // Markdown body: paragraphs and headings, skipping fenced code.
  for (const para of rest.join("---").split(/\n\s*\n/)) {
    const t = para.replace(/[#>*`_-]/g, " ").trim();
    if (t.length > 40) out.push(["body", t]);
  }
  return out;
}

for (const dir of ["experience", "education", "projects", "blog"]) {
  let names = [];
  try {
    names = await readdir(join(root, "src/content", dir));
  } catch {
    continue;
  }
  for (const n of names.filter((n) => n.endsWith(".md"))) {
    const p = `src/content/${dir}/${n}`;
    for (const [field, value] of proseOf(await read(p))) {
      flagVoice(`${p} (${field})`, value);
    }
  }
}

const siteSrc = await read("src/data/site.ts");
flagVoice("src/data/site.ts (tagline)", siteSrc.match(/tagline:\s*\n?\s*"([^"]*)"/)?.[1] ?? "");
flagVoice("src/data/site.ts (bio)", siteSrc.match(/bio:\s*\[([\s\S]*?)\]/)?.[1] ?? "");

// ---------------------------------------------------------------------------
// 2 — placeholder identity
//
// A published resume with no name is not a resume. Checked against source, not
// the build, because the build cannot tell a placeholder from a real "Your Name"
// that happens to be someone's actual name.
// ---------------------------------------------------------------------------
for (const bad of ["your name", "example.com", "you@", "city, country", "lorem ipsum"]) {
  if (siteSrc.toLowerCase().includes(bad)) {
    fail("placeholder-identity", "src/data/site.ts", `still contains "${bad}"`);
  }
}

// ---------------------------------------------------------------------------
// 3 — identity coherence
//
// Title, h1 and canonical must describe the same person, or a placeholder has
// been fixed in one surface and left in another.
// ---------------------------------------------------------------------------
const distIndex = await read("dist/index.html");
const siteName = siteSrc.match(/^\s*name:\s*["'`]([^"'`]+)["'`]/m)?.[1] ?? "";

const htmlTitle = distIndex.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
const htmlH1 = distIndex.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.trim() ?? "";
const canonical = distIndex.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? "";

if (siteName && !htmlTitle.includes(siteName))
  fail("identity-coherence", "dist/index.html", "<title> omits site.name");
if (siteName && htmlH1 !== siteName)
  fail("identity-coherence", "dist/index.html", `<h1> "${htmlH1}" != site.name`);
if (!canonical.startsWith("https://"))
  fail("identity-coherence", "dist/index.html", "canonical is not absolute");

// ---------------------------------------------------------------------------
// 4 — empty-data render
//
// A counter with nothing behind it is a layout bug printed as a fact.
// ---------------------------------------------------------------------------
for (const m of distIndex.matchAll(/>\s*(0\s*(?:yrs?|years?|months?))\s*</g)) {
  fail("empty-data", "dist/index.html", `zero duration rendered: "${m[1].trim()}"`);
}

// Checked against the *assigned* value, not the file: an earlier version grepped
// for "0000/0000" anywhere in site.ts and kept failing after the field was set
// to null, because the explanation above it still mentioned the old value.
const recordRef = siteSrc.match(/^\s*recordRef:\s*(.+)$/m)?.[1].trim() ?? "";
if (/^(?:"[^"]*0000[^"]*"|'[^']*0000[^']*'|`[^`]*0000[^`]*`)$/.test(recordRef)) {
  fail("empty-data", "src/data/site.ts", "recordRef is still a placeholder value");
}

/* A rendered counter must have a value behind it. "0" is the shape a layout
   bug takes when a field was never filled. */
for (const m of distIndex.matchAll(/>(?:REC · )?(0{2,})[^<]*</g)) {
  fail("empty-data", "dist/index.html", `counter rendered with no value: "${m[0].trim()}"`);
}

// ---------------------------------------------------------------------------
// 5 — link integrity
//
// Internal hrefs resolve, no placeholder domain survives.
// ---------------------------------------------------------------------------
const distFiles = [];
const collectIds = new Set();

async function walk(dir) {
  for (const e of await readdir(join(root, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith(".html")) distFiles.push(p);
  }
}
await walk("dist");

for (const p of distFiles) {
  const html = await read(p);
  for (const m of html.matchAll(/id="([^"]+)"/g)) collectIds.add(m[1]);
}

for (const p of distFiles) {
  const html = await read(p);

  if (/(?:href|src)="https?:\/\/(?:www\.)?example\.com/.test(html)) {
    fail("link-integrity", p, "links to example.com");
  }

  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!collectIds.has(m[1])) {
      fail("link-integrity", p, `anchor #${m[1]} has no target`);
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const GATES = [
  "instruction-voice",
  "placeholder-identity",
  "identity-coherence",
  "empty-data",
  "link-integrity",
];

console.log("content gate — run against src/ and dist/\n");

if (!findings.length) {
  console.log("  all gates pass");
} else {
  for (const gate of GATES) {
    const hits = findings.filter((f) => f.gate === gate);
    console.log(`  ${hits.length ? "FAIL" : "ok  "}  ${gate}${hits.length ? ` (${hits.length})` : ""}`);
    for (const h of hits) console.log(`          ${h.where}: ${h.detail}`);
  }
  console.log(
    `\n${findings.length} finding(s)${strict ? "" : "  — reporting only, pass --strict to fail"}`,
  );
}

process.exit(findings.length && strict ? 1 : 0);