/**
 * Re-runs the type and layout probes with the OS text size turned up.
 *
 * A phone at 200% text size is not a zoomed desktop — it reflows, and every
 * fixed-rem size in the stylesheet stays put while the browser's own text
 * scaling grows everything around it. That is exactly how a "responsive" page
 * breaks in the hands of the person who most needs it to work, and no amount of
 * viewport testing catches it.
 *
 *   node scripts/probe-zoom.mjs http://127.0.0.1:4400/ [fontScale]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const scale = Number(process.argv[3] ?? 2);
const PORT = 9337;

/** Small phone first: that is where a fixed rem size collides first. */
const WIDTHS = [320, 390];

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
  const doc = document.documentElement;
  const overflow = doc.scrollWidth - doc.clientWidth;
  const visible = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' &&
           el.getBoundingClientRect().height > 1;
  };
  const labels = [...document.querySelectorAll('.font-code, time')]
    .filter(visible)
    .map((el) => parseFloat(getComputedStyle(el).fontSize));
  const body = [...document.querySelectorAll('main p')]
    .filter((el) => visible(el) && el.textContent.trim().length > 60)
    .map((el) => parseFloat(getComputedStyle(el).fontSize));
  const h1 = document.querySelector('h1');
  return {
    overflow,
    body: body.length ? Math.min(...body) : null,
    label: labels.length ? Math.min(...labels) : null,
    h1: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
    h1Lines: h1 ? Math.round(h1.getBoundingClientRect().height /
                parseFloat(getComputedStyle(h1).lineHeight)) : null,
  };
})()`;

let failed = 0;
for (const w of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: 900,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url });
  await sleep(700);

  // Default first, then with the browser's font multiplier applied.
  const before = await evaluate(PROBE);
  await evaluate(
    `document.documentElement.style.fontSize = '${100 * scale}%'`,
  );
  await sleep(300);
  const after = await evaluate(PROBE);

  const problems = [];
  if (after.overflow > 0) problems.push(`overflows by ${after.overflow}px`);
  if (after.h1Lines > 2) problems.push(`name wraps to ${after.h1Lines} lines`);

  if (problems.length) failed++;
  console.log(
    `${problems.length ? "FAIL" : "ok  "}  ${w}px @ ${scale * 100}% text` +
      `\n        body ${before.body}px -> ${after.body}px` +
      `\n        label ${before.label}px -> ${after.label}px` +
      `\n        name  ${before.h1}px -> ${after.h1}px (${after.h1Lines} lines)` +
      (problems.length ? `\n        ${problems.join("\n        ")}` : ""),
  );
}

console.log(
  failed ? `\n${failed} width(s) break at ${scale * 100}% text` : "\nreflows cleanly",
);
ws.close();
try {
  chrome.kill();
} catch {}
process.exit(failed ? 1 : 0);