/**
 * Generates public/og.png — the 1200x630 card a link preview shows.
 *
 * Authored rather than screenshotted: no screenshot service to depend on, no
 * broken preview when the site is offline, and the card is designed rather than
 * captured. Run after changing site.ts:
 *
 *   node scripts/make-og.mjs
 *
 * Renders SVG text through sharp, which resolves families via fontconfig.
 * The TTFs must be installed locally for the real faces to appear; otherwise
 * it falls back to a system serif and the card stops matching the site.
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Pull the few identity fields this card needs out of site.ts. */
const readField = async (field) => {
  const src = await readFile(join(root, "src/data/site.ts"), "utf8");
  const m = src.match(new RegExp(`^\\s*${field}:\\s*\n?\\s*["'\`]([^"'\`]+)["'\`]`, "m"));
  if (!m) throw new Error(`make-og: could not read \`${field}\` from site.ts`);
  return m[1];
};

const name = await readField("name");
const title = await readField("title");
const recordRef = await readField("recordRef");
const availability = await readField("availability");

const PAPER = "#f2eee4";
const RAISED = "#fbf9f4";
const INK = "#191512";
const MUTED = "#57503f";
const SUBTLE = "#857c68";
const RULE = "#cdc4b0";
const RULE_STRONG = "#a2977c";
const CARMINE = "#9d2135";

const W = 1200;
const H = 630;
const PAD = 72;

// Shrink the name to fit rather than letting it overflow the card.
const nameSize = name.length > 22 ? 92 : name.length > 14 ? 108 : 124;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Ruled field, on the same rhythm as the page. */
const rules = Array.from({ length: 16 }, (_, i) => {
  const y = 40 + i * 36;
  return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${RULE}" stroke-opacity="0.35" stroke-width="1"/>`;
}).join("");

/** The seal, struck. */
const sealR = 92;
const sealCx = W - PAD - sealR;
const sealCy = H / 2 - 20;

const seal = `
  <g>
    <circle cx="${sealCx}" cy="${sealCy}" r="${sealR}" fill="${RAISED}" stroke="${CARMINE}" stroke-width="3"/>
    <circle cx="${sealCx}" cy="${sealCy}" r="${sealR - 13}" fill="none" stroke="${RULE_STRONG}" stroke-width="1.5"/>
    <circle cx="${sealCx}" cy="${sealCy}" r="${sealR - 24}" fill="none" stroke="${RULE}" stroke-width="1"/>
    <path d="M ${sealCx - 13} ${sealCy} L ${sealCx} ${sealCy - 13} L ${sealCx + 13} ${sealCy} L ${sealCx} ${sealCy + 13} Z"
          fill="none" stroke="${CARMINE}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="${sealCx}" y="${sealCy + 38}" text-anchor="middle"
          font-family="Archivo" font-size="11" letter-spacing="1.5"
          fill="${SUBTLE}">1 SOURCE</text>
    <text x="${sealCx}" y="${sealCy + 53}" text-anchor="middle"
          font-family="Archivo" font-size="11" letter-spacing="1.5"
          fill="${SUBTLE}">2 RENDERINGS</text>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="lift" cx="26%" cy="0%" r="92%">
      <stop offset="0%" stop-color="${RAISED}" stop-opacity="0.95"/>
      <stop offset="62%" stop-color="${PAPER}" stop-opacity="0.2"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <g>${rules}</g>
  <rect width="${W}" height="${H}" fill="url(#lift)"/>

  <text x="${PAD}" y="92" font-family="Archivo" font-size="16" letter-spacing="4.2"
        fill="${SUBTLE}">${esc(recordRef.toUpperCase())}</text>

  <text x="${PAD}" y="${PAD + 148}" font-family="Libre Caslon Text" font-size="${nameSize}"
        letter-spacing="-2.4" fill="${INK}">${esc(name)}</text>

  <line x1="${PAD}" y1="${PAD + 196}" x2="${W - PAD - 220}" y2="${PAD + 196}"
        stroke="${RULE_STRONG}" stroke-width="1.5"/>

  <text x="${PAD}" y="${PAD + 250}" font-family="Archivo" font-size="34" font-weight="500"
        fill="${INK}">${esc(title)}</text>

  <text x="${PAD}" y="${H - 78}" font-family="Archivo" font-size="22" fill="${MUTED}">theforgivenone.github.io/dresume</text>

  <line x1="${PAD}" y1="${H - 128}" x2="${W - PAD - 220}" y2="${H - 128}"
        stroke="${RULE}" stroke-width="1"/>
  <rect x="${PAD}" y="${H - 137}" width="7" height="7" fill="${CARMINE}"/>
  <text x="${PAD + 22}" y="${H - 128}" font-family="Archivo" font-size="17" letter-spacing="2.6"
        fill="${MUTED}">${esc(availability.toUpperCase())}</text>

  ${seal}
</svg>`;

await writeFile(join(root, "dist/og.svg"), svg).catch(() => {});
await sharp(Buffer.from(svg))
  .png({ quality: 92, compressionLevel: 9 })
  .toFile(join(root, "public/og.png"));

const meta = await sharp(join(root, "public/og.png")).metadata();
console.log(`og.png written — ${meta.width}x${meta.height}`);
