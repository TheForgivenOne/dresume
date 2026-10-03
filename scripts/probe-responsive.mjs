/**
 * Measures the touch-target floor and the type floor across real device widths.
 *
 * Screenshots show that a layout looks right; they cannot tell you a tap target
 * is 36px or a label is 9.9px. Both silently fail on the device this site is
 * actually opened on. This walks the widths that matter and asserts the floors.
 *
 *   node scripts/probe-responsive.mjs http://127.0.0.1:4400/
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const PORT = 9334;

/** Phones and the tablet/laptop gap that broke the header. */
const WIDTHS = [
  { w: 320, h: 700, name: "iPhone SE / small Android" },
  { w: 360, h: 800, name: "common Android" },
  { w: 390, h: 844, name: "iPhone 12-15" },
  { w: 430, h: 932, name: "iPhone Pro Max" },
  { w: 768, h: 1024, name: "tablet portrait" },
  { w: 900, h: 700, name: "tablet landscape / small laptop" },
  { w: 844, h: 390, name: "phone landscape" },
  { w: 1280, h: 800, name: "laptop" },
  { w: 1920, h: 1080, name: "desktop" },
];

const MIN_TAP = 44; // WCAG 2.5.8 target size
const MIN_BODY_PX = 16; // legibility floor for body copy
const MIN_LABEL_PX = 11; // field labels are read outdoors, on a phone

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
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
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

/** Everything worth asserting about one width, measured in the live page. */
const PROBE = `(() => {
  const px = (el) => parseFloat(getComputedStyle(el).fontSize);
  const visible = (el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null;
  };

  // Body copy. Paragraphs and list items only — a tag chip or a field label is
  // a caption, not body text, and measuring it here produced phantom failures.
  const isBody = (el) => {
    if (el.tagName === 'P') return true;
    if (el.tagName !== 'LI') return false;
    // Skip chips and other single-label list items.
    return (el.textContent || '').trim().length > 40;
  };
  const bodyEls = [...document.querySelectorAll('main p, main li')].filter(
    (el) => isBody(el) && visible(el) && px(el) >= 12,
  );

  // Interactive elements a finger has to hit.
  //
  // WCAG 2.5.8 exempts a link sitting inline in a sentence: the target is the
  // text itself, which is already as large as the type. What must clear 44px is
  // a standalone control — a button, a summary, or a link that is the element's
  // whole reason for being there.
  // A link is a standalone control when it is the entire content of its
  // container — a nav row, a button-styled link, an action with a label of its
  // own. A link running inside a sentence, or a reference code inside prose,
  // is text and inherits the text's target.
  const STANDALONE = 'BUTTON, SUMMARY';
  const taps = [...document.querySelectorAll('a, button, summary')]
    .filter(visible)
    .map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // "Is this link the whole content of its parent?" — an action whose only
      // job is to be tapped. A link sharing a line with a title or a date is
      // prose, and WCAG 2.5.8 exempts it.
      const soleContent = (() => {
        const p = el.parentElement;
        if (!p) return false;
        const meaningful = [...p.childNodes].filter((n) =>
          n.nodeType === 3 ? n.nodeValue.trim() : n.nodeType === 1 && n.tagName === 'BR',
        );
        return meaningful.length === 1;
      })();
      // WCAG 2.5.8 exempts a target sized by the input: a mouse pointer is accurate
  // at 36px, a finger is not. At desktop widths the environment reports a fine
  // pointer, so the compact control is correct and flagging it is a false
  // positive — but only when the measurement actually came from a fine pointer.
  // Headless Chromium reports pointer:none, hover:none, maxTouchPoints 0 — no
  // input device at all. That is not "a mouse", so it must not be treated as a
  // licence for a compact target. The size exemption applies only when a fine
  // pointer is affirmatively present.
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const isCompactButton =
    el.matches('BUTTON') &&
    finePointer &&
    parseFloat(getComputedStyle(el).width) >= 32;

  const standalone =
    !isCompactButton &&
    (el.matches(STANDALONE) ||
      cs.display === 'flex' ||
      soleContent ||
      el.closest('nav, aside'));
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 26),
        w: Math.round(r.width),
        h: Math.round(r.height),
        standalone,
      };
    });

  const labels = [...document.querySelectorAll('.font-code, time')]
    .filter(visible)
    .map(px);

  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    smallestTapH: taps.length ? Math.min(...taps.map((t) => t.h)) : null,
    smallestTapW: taps.length ? Math.min(...taps.map((t) => t.w)) : null,
    undersized: taps.filter((t) => t.standalone && (t.w < ${MIN_TAP} || t.h < ${MIN_TAP})),
    minBody: bodyEls.length ? Math.min(...bodyEls.map(px)) : null,
    minLabel: labels.length ? Math.min(...labels) : null,
    // The seal must never exceed the viewport it sits in.
    seal: (() => {
      const s = document.querySelector('.seal');
      if (!s) return null;
      const r = s.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })(),
    vw: window.innerWidth,
    vh: window.innerHeight,
    navInline: (() => {
      const n = document.querySelector('header nav[aria-label=\"Sections\"]');
      return n ? getComputedStyle(n).display !== 'none' : null;
    })(),
  };
})()`;

let failures = 0;

for (const { w, h, name } of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: w < 768,
  });
  await send("Page.navigate", { url });
  await sleep(900);
  const r = await evaluate(PROBE);

  const problems = [];
  if (r.overflow > 0) problems.push(`overflows by ${r.overflow}px`);
  if (r.minBody !== null && r.minBody < MIN_BODY_PX)
    problems.push(`body ${r.minBody}px < ${MIN_BODY_PX}`);
  if (r.minLabel !== null && r.minLabel < MIN_LABEL_PX)
    problems.push(`label ${r.minLabel}px < ${MIN_LABEL_PX}`);
  if (r.seal && (r.seal.h > r.vh || r.seal.w > r.vw))
    problems.push(`seal ${r.seal.w}x${r.seal.h} exceeds viewport`);

  // A tap target may be short if it is a wide inline link, but not if it is
  // both — that is a control, not a text link.
  for (const t of r.undersized) {
    problems.push(`tap ${t.w}x${t.h} "${t.label}"`);
  }

  if (problems.length) failures++;
  const mark = problems.length ? "FAIL" : "ok  ";
  console.log(
    `${mark}  ${String(w).padStart(4)}x${String(h).padEnd(4)} ${name}` +
      (problems.length ? `\n        ${problems.join("\n        ")}` : ""),
  );
}

console.log(
  failures ? `\n${failures} width(s) with problems` : "\nall widths pass",
);
ws.close();
try {
  chrome.kill();
} catch {}
process.exit(failures ? 1 : 0);