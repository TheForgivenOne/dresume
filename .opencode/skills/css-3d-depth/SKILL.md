---
name: CSS 3D Depth
description: Add depth and dimensionality to a static site with pure CSS 3D transforms - tilt cards, parallax layers, preserve-3d scenes - without WebGL or a framework. Use when building a portfolio or landing page with a 3D feel, or when 3D motion is causing jank, clipping, or accessibility problems.
---

# CSS 3D depth without WebGL

## Scope

CSS 3D gives tilt, parallax, layered planes, and depth shadows with **zero dependencies and zero runtime JS beyond a few listeners**. Use it over Three.js whenever the 3D is decorative.

Reach for WebGL only when the scene must be genuinely 3D geometry. A resume site should never: the print view must stay flat, and WebGL costs 150–300 KB gzipped.

## The three properties

```css
.scene   { perspective: 1000px; }              /* creates the viewing volume */
.stage   { transform-style: preserve-3d; }     /* lets children sit at different depths */
.card    { transform: rotateX(8deg) rotateY(-8deg) translateZ(40px); }
```

- `perspective` on the **parent**. On the element itself it applies to children only, not to itself.
- `preserve-3d` on the **parent** of the rotated elements. Without it, children flatten into their parent's plane and rotateX does nothing visible.
- `translateZ` is what produces visible depth against `perspective`.

## Depth shadows

Layered shadows read as depth far better than a single blur:

```css
.card {
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 4px 8px rgb(0 0 0 / 0.04),
    0 12px 24px rgb(0 0 0 / 0.06),
    0 24px 48px rgb(0 0 0 / 0.04);
}
.card[data-depth="1"] { translate: 0 0.5rem; }
.card[data-depth="2"] { translate: 0 1rem; box-shadow: 0 32px 64px rgb(0 0 0 / 0.08); }
```

A 1–3% background gradient plus a subtle inner highlight sells the surface better than heavy blur:

```css
.card {
  background: linear-gradient(160deg, #fff, #f8fafc);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.9);
}
```

## Tilt card

Pointer-driven rotation. Throttle with `requestAnimationFrame` — an unthrottled `pointermove` handler triggers layout thrash on every event.

```astro
<div class="tilt-stage">
  <article class="tilt-card">
    <slot />
  </article>
</div>

<style>
  .tilt-stage { perspective: 1000px; }
  .tilt-card {
    transform-style: preserve-3d;
    transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .tilt-card { transform: none !important; transition: none; }
  }
</style>

<script>
  const MAX = 6; // degrees — small reads as premium, large reads as a toy
  const stage = document.querySelector<HTMLElement>(".tilt-stage")!;
  const card = stage.querySelector<HTMLElement>(".tilt-card")!;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    let frame = 0;

    const apply = (rx: number, ry: number) => {
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(-py * MAX * 2, px * MAX * 2));
    });

    stage.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(0, 0));
    });
  }
</script>
```

Non-negotiable details:

- Keep `MAX` at 4–8 degrees.
- **Reset to zero on leave**, or cards stay crooked when the user moves on.
- Gate on `(hover: hover)` so touch devices never get stuck in a tilted state.
- The reduced-motion block must set `transform: none !important` — the inline style written by JS outranks a stylesheet rule otherwise.

## Parallax

Scroll-linked transforms, one shared `requestAnimationFrame` loop. Never attach a scroll listener per element.

```astro
---
const { speed = 0.2 } = Astro.props;
---
<div class="parallax" data-speed={speed}><slot /></div>

<script>
  const layers = [...document.querySelectorAll<HTMLElement>(".parallax")];

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      for (const el of layers) {
        const r = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.speed ?? "0.2");
        const progress = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = `translate3d(0, ${progress * speed * 100}px, 0)`;
      }
      ticking = false;
    };

    addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }
</script>
```

Use `translate3d` so the compositor handles it. `{ passive: true }` prevents scroll-blocking.

Prefer CSS scroll-driven animations where supported (`animation-timeline: view()`), which need no JS at all — but keep the JS path as the fallback and verify support before relying on it.

## Performance

- `will-change: transform` only on elements actively animating. Blanket use costs memory.
- Only `transform` and `opacity` animate. Animating `top`/`left`/`width` forces layout on every frame.
- `preserve-3d` is expensive — do not put it on a long scrolling list. Scope it to individual cards.
- Test with CPU throttling in DevTools. If a card animates its shadow, switch the shadow to `translateZ` layering.

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

`prefers-reduced-motion` is an OS-level accessibility setting, not a preference. Honour it by default rather than behind a toggle.

## Print

Any print stylesheet must neutralise 3D:

```css
@media print {
  *, *::before, *::after {
    transform: none !important;
    box-shadow: none !important;
  }
}
```

Better still, use a separate print layout that never imports the depth stylesheet at all.
