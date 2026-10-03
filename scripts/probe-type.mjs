/**
 * Measures the type ramp as it actually renders, at every width.
 *
 * A screenshot cannot tell you that a heading has wrapped to three lines, that a
 * label's tracking has closed up at 320px, or that the display size has grown
 * *larger* on a narrow screen because it is a vw unit. This walks the widths and
 * reports the real computed sizes, the wrap counts, and the measure in
 * characters — the things that decide whether type is comfortable.
 *
 *   node scripts/probe-type.mjs http://127.0.0.1:4400/
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const PORT = 9336;

/** Phone portrait through desktop, plus the two widths that broke before. */
const WIDTHS = [320, 360, 390, 430, 640, 768, 1024, 1280, 1920];

const chrome = spawn(
  "chromium",
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);
process.on("exit", () => {
  try {
    chrome.kill();
  } catch {}
});

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) =>
        r.json(),
      );
      const p = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("devtools never came up");
}

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");

/**
 * Measure one text element: size, lines, and how wide the measure really is.
 *
 * `lines` is measured from the box height against the computed line-height,
 * which is the honest way to count a wrap — `getClientRects().length` counts
 * boxes, not lines, and lies whenever a heading is `text-wrap: balance`d.
 */
const PROBE = `(() => {
  try {
  const lh = (cs) => {
    const v = cs.lineHeight;
    return v === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(v);
  };
  const rect = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.height < 1) return null;
    const ch = advance(cs) || parseFloat(cs.fontSize) * 0.5;
    const full = (el.textContent || '').trim();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 40),
      text: full.slice(0, 28),
      size: Math.round(parseFloat(cs.fontSize) * 10) / 10,
      lh: Math.round(lh(cs) * 10) / 10,
      lines: Math.max(1, Math.round(r.height / lh(cs))),
      ch: Math.round(r.width / ch),
      cpl: Math.round(r.width / ch),
      tracking: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing),
      overflow: el.scrollWidth - el.clientWidth,
    };
  };

  const pick = (sel) => [...document.querySelectorAll(sel)]
    .filter((el) => el.getBoundingClientRect().height > 1)
    .map(rect)
    .filter(Boolean);

  // Measure an element's own advance width for '0'.
  //
  // The cssText font shorthand is deliberately NOT used: it serialises to ""
  // for self-hosted families, which silently measures the probe in the default
  // serif. That made every measure read ~15% long and would have had me
  // "fixing" a 68ch column that was already correct. Individual properties
  // serialise reliably.
  const advance = (cs) => {
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(100);
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'pre';
    probe.style.top = '0';
    probe.style.left = '-9999px';
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.fontStyle = cs.fontStyle;
    probe.style.letterSpacing = '0';
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width / 100;
    probe.remove();
    return w;
  };

  const out = {};
  out.display = pick('h1')[0] ?? null;
  out.h2 = pick('main h2').slice(0, 2);
  out.h3 = pick('main h3').slice(0, 2);
  // Prose only: <p> in main. list items include chips and reference codes, which
  // are captions, not paragraphs, and they skew the measure.
  // Full text length, not the 28-char preview — the preview is short by design,
  // which is why this filter returned nothing before.
  // Filter on the DOM node *before* pick() turns it into a plain object —
  // getComputedStyle on a measurement object is what threw.
  const paras = [...document.querySelectorAll('main p')]
    .filter((el) => el instanceof Element)
    .filter((el) => el.getBoundingClientRect().height > 1)
    // A caption is small and short; prose is neither.
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) >= 15)
    .filter((el) => el.textContent.trim().length > 60)
    .map(rect)
    .filter(Boolean);
  out.body = paras.slice(0, 2);
  out.longest = paras
    .slice()
    .sort((a, b) => (b.ch || 0) - (a.ch || 0))[0] ?? null;
  out.sealText = pick('.seal span').filter((t) => parseFloat(getComputedStyle(document.createElement('span')).fontSize) !== t.size)[0] ?? null;
  out.sealLabel = pick('.seal span.font-code')[0] ?? null;
  out.tagline = pick('main p')[0] ?? null;
  // Anything whose text is wider than its box.
  //
  // sr-only is excluded deliberately: it is a 1px clip box holding screen-reader
  // text, so it is always "clipped" and always reports a large overflow. Counting
  // it buried the real overflows in noise.
  out.clipped = [...document.querySelectorAll('main *, header *, footer *')]
    // closest() throws on a non-Element, and SVG children are not Elements.
    .filter((el) => el instanceof Element)
    .filter((el) => el.children.length === 0)
    .filter((el) => !el.closest('.sr-only') && !el.classList.contains('sr-only'))
    .filter((el) => getComputedStyle(el).position !== 'absolute')
    .filter((el) => el.getBoundingClientRect().height > 1)
    .filter((el) => el.scrollWidth - el.clientWidth > 1)
    .slice(0, 6)
    .map((el) => ({
      text: (el.textContent || '').trim().slice(0, 30),
      over: el.scrollWidth - el.clientWidth,
    }));
  return out;
  } catch (e) {
    return { __error: String(e && e.stack || e) };
  }
})()`;

const rows = [];

for (const w of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: 900,
    deviceScaleFactor: 1,
    mobile: w < 768,
  });
  await send("Page.navigate", { url });
  await sleep(850);
  const r = await evaluate(PROBE);
  if (r && r.__error) {
    console.error(`\nprobe failed at ${w}px:\n${r.__error}\n`);
    process.exit(2);
  }
  rows.push({ w, r });
}

// ---- report -------------------------------------------------------------

console.log("display type — the name, and how much of the line it takes\n");
console.log("  width    size   lines   chars   share of line\n");
for (const { w, r } of rows) {
  const d = r.display;
  if (!d) continue;
  const share = Math.round((d.ch / 42) * 100);
  const flag = d.lines > 2 ? "  <- wraps" : share > 95 ? "  <- fills it" : "";
  console.log(
    `  ${String(w).padStart(4)}px  ${String(d.size).padStart(6)}px   ${d.lines}    ${String(d.ch).padStart(3)}   ${String(share).padStart(3)}%${flag}`,
  );
}

console.log(
  "\nbody measure — target 45-75ch.\n  A narrow phone cannot reach 45ch at 16px; that is geometry, not a defect.\n  The floor is a check on desktop.\n",
);
for (const { w, r } of rows) {
  const b = r.longest ?? r.body[0];
  if (!b || !b.ch) continue;
  const note =
    b.ch > 75 ? "  <- too wide" : b.ch < 45 && w >= 640 ? "  <- too narrow" : "";
  console.log(
    `  ${String(w).padStart(4)}px  ${String(b.size).padStart(6)}px  ${String(b.ch).padStart(3)}ch${note}`,
  );
}

console.log("\nlabel tracking — as a proportion of the size, that is what reads\n");
for (const { w, r } of rows) {
  const s = r.sealLabel;
  if (!s) continue;
  const pct = Math.round((s.tracking / s.size) * 1000) / 10;
  console.log(
    `  ${String(w).padStart(4)}px  ${String(s.size).padStart(6)}px   tracking ${s.tracking}px = ${pct}%`,
  );
}

const clipped = rows.flatMap(({ w, r }) => r.clipped.map((c) => ({ w, ...c })));
console.log(
  clipped.length
    ? `\nclipped text (${clipped.length}):`
    : "\nno clipped text at any width",
);
for (const c of clipped) console.log(`  ${c.w}px  over by ${c.over}px  "${c.text}"`);

ws.close();
try {
  chrome.kill();
} catch {}