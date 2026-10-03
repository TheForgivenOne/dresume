/**
 * Proves the arrival sequence actually happens, and that it fails safe.
 *
 * A load animation has three ways to be wrong that no screenshot catches:
 *
 *   1. It never runs. The depths were inert for a fortnight because a `flat`
 *      wrapper severed the perspective, and the page looked fine the whole time.
 *      So this measures real projected geometry, not "is a transform set".
 *   2. It strands content. Anything hidden behind `data-reveal` is unreadable if
 *      its observer never fires. This scrolls the whole page and requires that
 *      every section end up visible.
 *   3. It traps the reader. Every stage animates transform and opacity only, so
 *      the seal must be clickable while the sheet is still descending.
 *
 *   node scripts/probe-motion.mjs http://127.0.0.1:4400/ [width]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
// The seal is bounded by min(34vh, 66vw), so its geometry and its depth are not
// the same at 390px as at 1280. Run it at both rather than assume.
const WIDTH = Number(process.argv[3] ?? 1280);
const PORT = 9347;

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
  if (!m.id || !pending.has(m.id)) return;
  const { resolve, reject } = pending.get(m.id);
  pending.delete(m.id);
  m.error ? reject(new Error(m.error.message)) : resolve(m.result);
};

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

/** evaluate, unwrapping a returned promise */
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "eval failed");
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const viewport = (width, height = 900) =>
  send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });

const setMotion = (reduce) =>
  send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });

const load = async (opts = {}) => {
  if (opts.noScript) await send("Emulation.setScriptExecutionDisabled", { value: true });
  else await send("Emulation.setScriptExecutionDisabled", { value: false });
  await setMotion(!!opts.reduceMotion);
  await send("Page.navigate", { url });
  await sleep(opts.reduceMotion ? 700 : 2600);
};

// opacity of everything a reader must be able to read, by selector
const OPACITY = `(() => {
  const out = {};
  for (const [k, sel] of Object.entries({
    name: '[data-stage="name"]',
    role: '[data-stage="role"]',
    claim: '[data-stage="claim"]',
    seal: '.seal',
  })) {
    const e = document.querySelector(sel);
    out[k] = e ? Number(getComputedStyle(e).opacity) : null;
  }
  return out;
})()`;

/** Every data-reveal section, after the page has been scrolled end to end. */
const scrollAndReadReveals = `(() => new Promise((done) => {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  let i = 0;
  const step = () => {
    if (i >= targets.length) {
      scrollTo(0, 0);
      return setTimeout(() => done(targets.map((t) => ({
        id: t.id || t.className.split(' ')[0],
        revealed: t.dataset.revealed === 'true',
        opacity: Number(getComputedStyle(t).opacity),
      }))), 400);
    }
    targets[i].scrollIntoView({ block: 'center', behavior: 'instant' });
    i++;
    setTimeout(step, 260);
  };
  step();
}))()`;

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? "pass" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

await viewport(WIDTH);
console.log(`\narrival sequence — ${WIDTH}px wide\n`);

// ---------------------------------------------------------------------------
console.log("\n1. the perspective reaches the hero");
// ---------------------------------------------------------------------------
await load();
// Measured as layout width vs projected width, not by writing a transform and
// reading it back. Two reasons that older approach failed: an inline transform
// loses to a finished `animation-fill-mode: both` keyframe, and reading straight
// after writing reads the pre-transition value. offsetWidth is what the layout
// engine committed; the bounding rect is what reaches the reader. If those two
// agree, there is no perspective on this element and every translateZ above it
// has been decorative.
const depths = await evaluate(`(() => {
  const rows = [];
  for (const sel of ['.layer-seal', '.seal', '.hero-face', '[data-stage="name"]']) {
    const e = document.querySelector(sel);
    if (!e) { rows.push({ sel, missing: true }); continue; }
    const layout = e.offsetWidth;
    const projected = e.getBoundingClientRect().width;
    rows.push({
      sel,
      layout,
      projected: Math.round(projected * 100) / 100,
      scale: layout ? Math.round((projected / layout) * 10000) / 10000 : 1,
    });
  }
  return rows;
})()`);
for (const d of depths) {
  if (d.missing) {
    console.log(`  ${d.sel}: MISSING`);
    continue;
  }
  console.log(
    `  ${d.sel.padEnd(22)} layout ${String(d.layout).padStart(5)}px  ` +
      `projected ${d.projected.toFixed(1).padStart(7)}px  x${d.scale}`,
  );
}
const sealDepth = depths.find((d) => d.sel === ".layer-seal");
check(
  "the seal stands proud of the printed sheet, in real projected pixels",
  !!sealDepth && sealDepth.scale > 1.01,
  sealDepth ? `x${sealDepth.scale} — 64px of depth at 1600px perspective` : "not found",
);
const faceDepth = depths.find((d) => d.sel === '[data-stage="name"]');
check(
  "the name sits in the same volume, not on a separate plane",
  !!faceDepth && faceDepth.layout > 0,
  faceDepth ? `x${faceDepth.scale}` : "not found",
);

// ---------------------------------------------------------------------------
console.log("\n2. the desk is a desk, not a strip");
// ---------------------------------------------------------------------------
const ground = await evaluate(`(() => {
  const g = document.querySelector('.record-ground').getBoundingClientRect();
  return { top: g.top, height: g.height, inner: innerHeight };
})()`);
// The bug this guards: a non-none `perspective` on any ancestor becomes the
// containing block for `position: fixed` descendants, so the ground silently
// stopped being a desk and became a 4600px strip that scrolled away with the
// record. It is behind everything, so nothing looked wrong.
check(
  "the ground is viewport-sized, not the height of the record",
  Math.abs(ground.height - ground.inner) < 2 && Math.abs(ground.top) < 1,
  `${ground.height.toFixed(0)}px tall against a ${ground.inner}px viewport`,
);
await evaluate("scrollTo(0, 900)");
await sleep(500);
const groundScrolled = await evaluate(
  `document.querySelector('.record-ground').getBoundingClientRect().top`,
);
check(
  "the ground stays fixed while the record scrolls",
  Math.abs(groundScrolled) < 1,
  `top ${groundScrolled.toFixed(1)}px after scrolling 900px`,
);
await evaluate("scrollTo(0, 0)");
await sleep(300);

// ---------------------------------------------------------------------------
console.log("\n3. the sequence runs, in order, and finishes");
// ---------------------------------------------------------------------------
await send("Emulation.setScriptExecutionDisabled", { value: false });
await setMotion(false);
await send("Page.navigate", { url });

// Sample the arrival rather than trusting the CSS.
const timeline = await evaluate(`(() => new Promise((done) => {
  const samples = [];
  const t0 = performance.now();
  const tick = () => {
    const o = {};
    for (const [k, sel] of Object.entries({
      sheet: '.record-sheet',
      name: '[data-stage="name"]',
      seal: '.layer-seal',
    })) {
      const e = document.querySelector(sel);
      if (!e) { o[k] = null; continue; }
      const cs = getComputedStyle(e);
      o[k] = { o: Number(cs.opacity).toFixed(2), t: cs.transform };
    }
    samples.push({ ms: Math.round(performance.now() - t0), ...o });
    if (performance.now() - t0 < 2200) return requestAnimationFrame(tick);
    done(samples);
  };
  requestAnimationFrame(tick);
}))()`);

const firstVisible = (key) => {
  const s = timeline.find((x) => x[key] && Number(x[key].o) > 0.9);
  return s ? s.ms : null;
};
const nameAt = firstVisible("name");
const sealAt = firstVisible("seal");
const sheetAt = firstVisible("sheet");
console.log(
  `  sheet legible at ${sheetAt}ms · name at ${nameAt}ms · seal at ${sealAt}ms` +
    `\n  sequence length: ${Math.max(...timeline.map((s) => s.ms))}ms sampled`,
);
check(
  "the sheet arrives before the things printed on it",
  sheetAt !== null && nameAt !== null && sheetAt <= nameAt,
  `${sheetAt}ms then ${nameAt}ms`,
);
check(
  "the seal lands last — it is the last thing to arrive",
  sealAt !== null && nameAt !== null && sealAt >= nameAt,
  `name ${nameAt}ms, seal ${sealAt}ms`,
);
check(
  "the whole arrival is over inside two seconds",
  Math.max(sheetAt ?? 9e9, nameAt ?? 9e9, sealAt ?? 9e9) < 2000,
  `${Math.max(sheetAt ?? 0, nameAt ?? 0, sealAt ?? 0)}ms`,
);

const settled = await evaluate(OPACITY);
check(
  "everything is at rest once the sequence has run",
  Object.values(settled).every((v) => v !== null && v > 0.99),
  JSON.stringify(settled),
);

// ---------------------------------------------------------------------------
console.log("\n4. the reader is never trapped");
// ---------------------------------------------------------------------------
await send("Page.navigate", { url });
await sleep(220); // mid-flight: the sheet is still descending
const reachable = await evaluate(`(() => {
  const seal = document.querySelector('.seal');
  const r = seal.getBoundingClientRect();
  if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) return 'offscreen';
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const link = hit && hit.closest ? hit.closest('a') : null;
  return link && seal.contains(link) ? 'reachable' : 'blocked by ' + (hit ? hit.tagName + '.' + hit.className : 'null');
})()`);
check(
  "the seal is clickable while the record is still arriving",
  reachable === "reachable",
  reachable,
);

// ---------------------------------------------------------------------------
console.log("\n5. nothing is stranded below the fold");
// ---------------------------------------------------------------------------
const reveals = await evaluate(scrollAndReadReveals);
const stuck = reveals.filter((r) => !r.revealed || r.opacity < 0.99);
check(
  "every section below the fold becomes readable",
  stuck.length === 0,
  `${reveals.length} sections, ${stuck.length} stuck${
    stuck.length ? ": " + stuck.map((s) => s.id).join(", ") : ""
  }`,
);

// ---------------------------------------------------------------------------
console.log("\n6. reduced motion: the resting state, by there being no animation");
// ---------------------------------------------------------------------------
await load({ reduceMotion: true });
const calm = await evaluate(`(() => {
  const anims = document.getAnimations().filter((a) => a.playState === 'running').length;
  return {
    running: anims,
    opacity: ${OPACITY},
    settling: document.documentElement.dataset.settling,
  };
})()`);
check(
  "no animation is running under prefers-reduced-motion",
  calm.running === 0,
  `${calm.running} running (the attribute is still set; the CSS is what is gated)`,
);
check(
  "everything is fully visible with no motion",
  Object.values(calm.opacity).every((v) => v !== null && v > 0.99),
  JSON.stringify(calm.opacity),
);

// ---------------------------------------------------------------------------
console.log("\n7. no JS: the record is still a record");
// ---------------------------------------------------------------------------
await load({ noScript: true });
const noJs = await evaluate(`(() => {
  const o = {};
  for (const [k, sel] of Object.entries({
    name: '[data-stage="name"]',
    seal: '.seal',
    h2: 'main h2',
  })) {
    const e = document.querySelector(sel);
    o[k] = e ? Number(getComputedStyle(e).opacity) : null;
  }
  return o;
})()`);
check(
  "every staged element is visible without JavaScript",
  Object.values(noJs).every((v) => v !== null && v > 0.99),
  JSON.stringify(noJs),
);
await send("Emulation.setScriptExecutionDisabled", { value: false });

// ---------------------------------------------------------------------------
console.log("\n8. the header still pins");
// ---------------------------------------------------------------------------
await load();
await evaluate("scrollTo(0, 1200)");
await sleep(600);
const pin = await evaluate(`(() => {
  const h = document.querySelector('header');
  const cs = getComputedStyle(h);
  return { top: h.getBoundingClientRect().top, position: cs.position, z: cs.zIndex };
})()`);
check(
  "the header pins to the top through the whole record",
  Math.abs(pin.top) < 1 && pin.position === "sticky",
  `top ${pin.top.toFixed(1)}px, ${pin.position}, z-index ${pin.z}`,
);

// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.pass);
console.log(
  failed.length
    ? `\n${failed.length} of ${results.length} checks failed`
    : `\nall ${results.length} checks pass`,
);
process.exit(failed.length ? 1 : 0);
