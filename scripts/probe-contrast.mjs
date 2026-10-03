/**
 * Measures real contrast on the rendered page, not on the token table.
 *
 * The token list cannot answer whether a pairing is legible — only the
 * composited pixels can. Walks every visible text node, resolves its effective
 * background by climbing ancestors until an opaque colour is found, and reports
 * anything under the WCAG AA floor.
 *
 *   node scripts/probe-contrast.mjs http://127.0.0.1:4400/ [dark]
 */
const url = process.argv[2] ?? "http://127.0.0.1:4400/";
const theme = process.argv[3] ?? "light";
const PORT = 9335;

const AA_BODY = 4.5;
const AA_LARGE = 3.0; // >=24px, or >=18.66px bold

const { spawn } = await import("node:child_process");
const { setTimeout: sleep } = await import("node:timers/promises");

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
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-color-scheme", value: theme === "dark" ? "dark" : "light" },
  ],
});
await send("Page.navigate", { url });
await sleep(1200);

const findings = await evaluate(`(() => {
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const [r, g, b, a] = m[1].split(',').map((v) => parseFloat(v));
    return { r, g, b, a: a === undefined ? 1 : a };
  };
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = ({ r, g, b }) =>
    0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };

  // Composite the real backdrop by walking ancestors to the first opaque layer.
  const backdrop = (el) => {
    let stack = [];
    let node = el;
    while (node && node !== document.documentElement) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
      node = node.parentElement;
    }
    let base = parse(getComputedStyle(document.body).backgroundColor) || { r:255,g:255,b:255,a:1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const out = [];
  const seen = new Set();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue.trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || el.closest('.sr-only')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    const fg0 = parse(cs.color);
    if (!fg0) continue;
    const bg = backdrop(el);
    const fg = fg0.a < 1 ? over(fg0, bg) : fg0;

    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? ${AA_LARGE} : ${AA_BODY};
    const got = ratio(fg, bg);

    // One entry per distinct pairing, not per text node.
    const key = cs.color + '|' + Math.round(size) + '|' + el.className;
    if (seen.has(key)) continue;
    seen.add(key);

    if (got < need) {
      out.push({
        text: text.slice(0, 34),
        color: cs.color,
        size: Math.round(size * 10) / 10,
        weight,
        ratio: Math.round(got * 100) / 100,
        need,
        where: el.className.toString().slice(0, 48) || el.tagName.toLowerCase(),
      });
    }
  }
  return out;
})()`);

if (!findings.length) {
  console.log(`  PASS  ${theme}: every text pairing meets AA`);
} else {
  console.log(`  ${findings.length} pairing(s) under AA in ${theme}:`);
  for (const f of findings) {
    console.log(
      `        ${f.ratio} (need ${f.need})  ${f.size}px/${f.weight}  "${f.text}"  ${f.color}  ${f.where}`,
    );
  }
}

ws.close();
try {
  chrome.kill();
} catch {}
process.exit(findings.length ? 1 : 0);