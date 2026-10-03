"""One-off: raise the type floor for touch.

9.9px field labels and 15.2px body both fail on the device this site is
actually opened on — a phone, from a pasted link, outdoors. These are exact
token swaps so clamps, --baseline and the stack-cell width (0.72rem) are
untouched. Wider type carries less tracking to occupy the same width.
"""
import pathlib
import re

changed = []
for f in sorted(pathlib.Path("src").rglob("*")):
    if f.suffix not in (".astro", ".css") or f.name == "print.css":
        continue
    s = orig = f.read_text()
    s = s.replace("text-[0.62rem]", "text-[0.7rem]")
    s = s.replace("text-[0.95rem]", "text-[1rem]")
    s = s.replace("font-size: 0.62rem", "font-size: 0.7rem")
    s = s.replace("font-size: 0.95rem", "font-size: 1rem")
    s = s.replace("tracking-[0.16em]", "tracking-[0.1em]")
    if s != orig:
        f.write_text(s)
        changed.append(f.as_posix())

print("rewritten:")
for c in changed:
    print("  ", c)

sizes = {}
for f in pathlib.Path("src").rglob("*"):
    if f.suffix not in (".astro", ".css") or f.name == "print.css":
        continue
    for m in re.finditer(
        r"text-\[([0-9.]+)rem\]|font-size:\s*([0-9.]+)rem", f.read_text()
    ):
        sizes[m.group(1) or m.group(2)] = sizes.get(m.group(1) or m.group(2), 0) + 1

print("\nscreen ramp now:")
for k in sorted(sizes, key=float):
    print(f"   {k}rem x{sizes[k]}")