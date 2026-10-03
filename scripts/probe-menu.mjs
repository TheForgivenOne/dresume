/**
 * Drives the real disclosure in a headless browser and reports what happened.
 *
 * A screenshot cannot show whether tapping a nav item closes the menu, whether
 * Escape works, or whether a stray click dismisses it — those are behavioural
 * and only a click proves them. Uses the DevTools protocol directly so the
 * project needs no test dependency.
 *
 *   node scripts/probe-menu.mjs http://127.0.0.1:4400/
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const PORT = 9333;

const chrome = spawn(
  "chromium",
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--window-size=390,844",
    url,
  ],
  { stdio: "ignore" },
);

const cleanup = () => {
  try {
    chrome.kill();
  } catch {}
};
process.on("exit", cleanup);

/** Poll until the debugger is listening, then return the page target. */
async function target() {
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

const ws = new WebSocket(await target());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

/** Evaluate in the page and return the JSON value. */
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};

await send("Runtime.enable");
await send("Page.enable");
await sleep(1200);

const isOpen = () =>
  evaluate(
    `!!document.getElementById('sections-menu')?.hasAttribute('open')`,
  );

const results = [];
const check = (name, pass, detail = "") =>
  results.push({ name, pass, detail });

// The disclosure must start closed.
check("menu starts closed", (await isOpen()) === false);

// Open it the way a finger would.
await evaluate(`document.querySelector('#sections-menu summary').click()`);
await sleep(250);
check("opens on tap", (await isOpen()) === true);

// Every section that has content must be reachable from the menu.
const navCount = await evaluate(
  `document.querySelectorAll('#sections-menu nav a').length`,
);
check("lists all sections", navCount >= 4, `${navCount} links`);

// The panel must be opaque: the bug this replaces showed hero text through it.
const opaque = await evaluate(`(() => {
  const p = document.querySelector('#sections-menu nav');
  if (!p) return null;
  const cs = getComputedStyle(p);
  return { bg: cs.backgroundColor, opacity: cs.opacity };
})()`);
check(
  "panel is opaque",
  opaque && opaque.bg !== "rgba(0, 0, 0, 0)" && Number(opaque.opacity) === 1,
  opaque ? opaque.bg : "no panel",
);

// The nav target must clear 44px for a finger.
const minTarget = await evaluate(`(() => {
  const a = document.querySelector('#sections-menu nav a');
  if (!a) return 0;
  return Math.round(a.getBoundingClientRect().height);
})()`);
check("nav target >= 44px", minTarget >= 44, `${minTarget}px`);

// Tapping a section must dismiss it.
await evaluate(
  `document.querySelector('#sections-menu nav a').dispatchEvent(new MouseEvent('click', {bubbles:true}))`,
);
await sleep(250);
check("closes after choosing", (await isOpen()) === false);

// Escape must close it from the keyboard.
await evaluate(`document.querySelector('#sections-menu summary').click()`);
await sleep(200);
await send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
});
await sleep(250);
check("Escape closes it", (await isOpen()) === false);

// A click elsewhere must not leave it stranded open over the page.
await evaluate(`document.querySelector('#sections-menu summary').click()`);
await sleep(200);
await evaluate(
  `document.body.dispatchEvent(new MouseEvent('click', {bubbles:true}))`,
);
await sleep(250);
check("outside click closes it", (await isOpen()) === false);

// Nothing may overflow horizontally at the narrowest common width.
const overflow = await evaluate(
  `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
);
check("no horizontal overflow", overflow <= 0, `${overflow}px`);

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);

ws.close();
cleanup();
process.exit(failed ? 1 : 0);