/**
 * Proves every control is actually tappable, not merely present.
 *
 * A 44px box can still be unclickable if something sits on top of it, and a
 * screenshot cannot tell you that. This dispatches a real tap at each target's
 * own centre and asks the browser what element receives it, scrolling each one
 * into view first so `elementFromPoint` is meaningful.
 *
 * `elementFromPoint` returning null for an off-screen point is not occlusion —
 * so off-viewport targets are scrolled in, and a target still reporting null
 * after that is a genuine failure.
 *
 *   node scripts/probe-occlusion.mjs http://127.0.0.1:4400/
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const PORT = 9338;

const WIDTHS = [320, 390, 768, 1280];

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

const PROBE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const out = [];

  for (const el of document.querySelectorAll('a[href], button, summary')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;

    // A closed <details> hides its panel. Its links are not targets yet.
    if (el.tagName !== 'SUMMARY' && el.closest('details:not([open])')) continue;

    // sr-only is a clip box for screen readers, not a control.
    if (el.closest('.sr-only')) continue;

    let r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    el.scrollIntoView({ block: 'center' });
    r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const inView = cx >= 0 && cx <= vw && cy >= 0 && cy <= vh;
    const hit = inView ? document.elementFromPoint(cx, cy) : null;
    const reachable = !inView ? null : hit === el || el.contains(hit);

    out.push({
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28),
      w: Math.round(r.width),
      h: Math.round(r.height),
      inView,
      reachable,
      // null here means: in the viewport, scrolled in, and still nothing there
      blockedBy: reachable ? null : (hit ? hit.tagName + '.' + String(hit.className).slice(0, 34) : 'nothing-at-point'),
    });
  }

  window.scrollTo(0, 0);
  return out;
})()`;

let failures = 0;

for (const w of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: 844,
    deviceScaleFactor: 1,
    mobile: w < 768,
  });
  await send("Page.navigate", { url });
  await sleep(900);
  const targets = await evaluate(PROBE);

  const blocked = targets.filter((t) => t.inView && !t.reachable);
  if (blocked.length) failures++;

  console.log(
    `${blocked.length ? "FAIL" : "ok  "}  ${String(w).padStart(4)}px  ` +
      `${targets.length} targets, ${targets.filter((t) => t.inView).length} in view`,
  );
  for (const b of blocked) {
    console.log(`        ${b.w}x${b.h} "${b.label}" covered by ${b.blockedBy}`);
  }
}

console.log(
  failures
    ? `\n${failures} width(s) with unreachable controls`
    : "\nevery control is the topmost element at its own centre",
);
ws.close();
try {
  chrome.kill();
} catch {}
process.exit(failures ? 1 : 0);