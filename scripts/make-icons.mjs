/**
 * Generates the icon set from one mark.
 *
 * The seal in the favicon is the same object as the seal on the page, so it is
 * drawn once here and rendered at every size the platform asks for. Hand-drawing
 * eight files is how they drift apart.
 *
 *   node scripts/make-icons.mjs
 *
 * Outputs, all in public/:
 *   favicon.svg        the master mark, scalable
 *   favicon.ico        16/32/48, for legacy tab bars and bookmarks
 *   icon-192.png       Android / PWA, any purpose
 *   icon-512.png       Android splash and install prompt
 *   apple-touch-icon.png  180, iOS home screen
 *   mask-icon.svg      Safari pinned tab — monochrome, Safari recolours it
 *   site.webmanifest   install metadata and theme colours
 *
 * Renders through sharp, which resolves via astro's own dependency. SVG text is
 * a real font dependency, so no glyphs are used: the mark is geometry only.
 */
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

/**
 * sharp is not a direct dependency — it arrives with astro — so it is resolved
 * through astro's own tree rather than the project's flat node_modules.
 */
const requireFromAstro = createRequire(join(root, "node_modules/astro/"));
const sharp = requireFromAstro("sharp");

// ---------------------------------------------------------------------------
// Tokens, read from the stylesheet so the mark can never disagree with the site.
// ---------------------------------------------------------------------------
const css = await readFile(join(root, "src/styles/global.css"), "utf8");

const token = (name, fallback) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  return m ? m[1] : fallback;
};

const PAPER = token("color-paper", "#f2eee4");
const INK = token("color-ink", "#191512");
const CARMINE = token("color-carmine", "#9d2135");
const RULE = token("color-rule-strong", "#a2977c");

const site = await readFile(join(root, "src/data/site.ts"), "utf8");
const field = (name) => {
  const m = site.match(new RegExp(`^\\s*${name}:\\s*\\n?\\s*["'\`]([^"'\`]+)["'\`]`, "m"));
  if (!m) throw new Error(`make-icons: could not read \`${name}\` from site.ts`);
  return m[1];
};
const NAME = field("name");
const TITLE = field("title");

// ---------------------------------------------------------------------------
// THE MARK
//
// A ruled record seen end-on: the struck roundel with its double ring, holding
// two rules of unequal length. Drawn on a 32-unit grid, which is the same grid
// the page's own geometry uses, so the mark and the site share proportions.
//
// Geometry only — no text, no gradient, no blur. It has to survive being
// rasterised to 16px, and it has to survive Safari recolouring it flat black.
// ---------------------------------------------------------------------------
const mark = ({ mono = false } = {}) => {
  // A monochrome mask is pure black on transparent: Safari supplies the colour.
  const ground = mono ? "none" : PAPER;
  const ring = mono ? INK : CARMINE;
  const rules = mono ? INK : INK;
  const inner = mono ? INK : RULE;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" role="img" aria-label="${NAME}">
  <circle cx="16" cy="16" r="16" fill="${ground}"/>
  <circle cx="16" cy="16" r="13.4" fill="none" stroke="${ring}" stroke-width="2.2"/>
  <circle cx="16" cy="16" r="10.6" fill="none" stroke="${inner}" stroke-width="0.9"/>
  <rect x="8.6" y="13.1" width="14.8" height="1.9" fill="${rules}"/>
  <rect x="8.6" y="18.4" width="9.6" height="1.9" fill="${rules}"/>
</svg>
`;
};

// ---------------------------------------------------------------------------
// Rasterise
// ---------------------------------------------------------------------------
const svgBuf = Buffer.from(mark());
await writeFile(join(out, "favicon.svg"), mark());
await writeFile(join(out, "mask-icon.svg"), mark({ mono: true }));

const png = async (size, file) => {
  await sharp(svgBuf, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(out, file));
};

await png(180, "apple-touch-icon.png");
await png(192, "icon-192.png");
await png(512, "icon-512.png");

// maskable: the same mark inset to 60% inside a paper field, so an Android
// adaptive-icon mask can crop to a circle or a squircle without clipping it.
const maskable = (size) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="${PAPER}"/>
  <g transform="translate(16 16) scale(0.62) translate(-16 -16)">
    <circle cx="16" cy="16" r="13.4" fill="none" stroke="${CARMINE}" stroke-width="2.2"/>
    <circle cx="16" cy="16" r="10.6" fill="none" stroke="${RULE}" stroke-width="0.9"/>
    <rect x="8.6" y="13.1" width="14.8" height="1.9" fill="${INK}"/>
    <rect x="8.6" y="18.4" width="9.6" height="1.9" fill="${INK}"/>
  </g>
</svg>`;
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
};

await sharp(await maskable(512))
  .png({ compressionLevel: 9 })
  .toFile(join(out, "icon-maskable-512.png"));

// ---------------------------------------------------------------------------
// favicon.ico — a real container, not a renamed PNG.
//
// Structure: a 6-byte ICONDIR, then a 16-byte ICONDIRENTRY per image, then the
// PNG payloads. Modern browsers all read PNG-in-ICO; this is how favicon.ico
// has worked since Vista, and it is the only format that still covers old
// IE/Edge request paths.
// ---------------------------------------------------------------------------
const pngs = await Promise.all([16, 32, 48].map((s) => png(s, `favicon-${s}.png`).then(() =>
  sharp(svgBuf, { density: 384 }).resize(s, s, { fit: "contain" }).png().toBuffer(),
)));

const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0); // reserved
dir.writeUInt16LE(1, 2); // type: icon
dir.writeUInt16LE(pngs.length, 4);

let offset = 6 + pngs.length * 16;
const entries = pngs.map((buf, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(i === 0 ? 16 : i === 1 ? 32 : 48, 0); // width  (0 would mean 256)
  e.writeUInt8(i === 0 ? 16 : i === 1 ? 32 : 48, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});

await writeFile(join(out, "favicon.ico"), Buffer.concat([dir, ...entries, ...pngs]));
for (const f of ["favicon-16.png", "favicon-32.png", "favicon-48.png"]) {
  await sharp(svgBuf, { density: 384 })
    .resize(f.includes("16") ? 16 : f.includes("32") ? 32 : 48, f.includes("16") ? 16 : f.includes("32") ? 32 : 48)
    .png()
    .toFile(join(out, f));
}

// ---------------------------------------------------------------------------
// Web app manifest
// ---------------------------------------------------------------------------
const manifest = {
  name: `${NAME} — ${TITLE}`,
  short_name: NAME,
  description: field("tagline"),
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: PAPER,
  theme_color: PAPER,
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

await writeFile(join(out, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const { statSync } = await import("node:fs");
for (const f of [
  "favicon.svg",
  "favicon.ico",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "mask-icon.svg",
  "site.webmanifest",
]) {
  console.log(`  ${String(statSync(join(out, f)).size).padStart(7)} B  ${f}`);
}