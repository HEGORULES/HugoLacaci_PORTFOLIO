#!/usr/bin/env python3
"""Compose a work-card cover out of several source images.

The BFP card needs to say "I studied these three games" at a glance, so the
cover is a triptych: a slice of each, in order, separated by angled seams.
The seams are angled rather than vertical because three flat rectangles read
as an accident and a slant reads as a decision.

    python3 tools/make_cover.py bfp a.jpg b.png c.png

Panels are cropped to fill, not squashed. Each one can be nudged with a focus
value from 0 (show the left/top of the source) to 1 (show the right/bottom);
0.5 is centred. Pass them with --focus, one per image.
"""
import argparse
import pathlib
import sys

from PIL import Image, ImageDraw, ImageEnhance

# 16:10, matching .work-plate. Rendered at most around 600px wide on the card,
# so this is comfortably past 2x for retina.
OUT_W, OUT_H = 1600, 1000

# Ink of the site, used for the seams so they read as part of the design.
SEAM_RGB = (11, 7, 16)
SEAM_PX = 10

# How far the seams lean, as a fraction of the height. 0 gives vertical cuts.
SLANT = 0.10

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "files" / "covers"


def crop_to_fill(img, box_w, box_h, focus_x=0.5, focus_y=0.5):
    """Scale so the image covers the box, then take the requested window."""
    img = img.convert("RGB")
    scale = max(box_w / img.width, box_h / img.height)
    new = img.resize((max(1, round(img.width * scale)),
                      max(1, round(img.height * scale))), Image.LANCZOS)

    left = round((new.width - box_w) * focus_x)
    top = round((new.height - box_h) * focus_y)

    return new.crop((left, top, left + box_w, top + box_h))


def panel_polygon(index, count, width, height, slant):
    """Vertical-ish slice with both edges leaning by the same amount."""
    step = width / count
    lean = height * slant

    x_top_l = index * step + lean / 2
    x_bot_l = index * step - lean / 2
    x_top_r = (index + 1) * step + lean / 2
    x_bot_r = (index + 1) * step - lean / 2

    # The outer edges stay square so the cover has no transparent corners.
    if index == 0:
        x_top_l = x_bot_l = -2
    if index == count - 1:
        x_top_r = x_bot_r = width + 2

    return [(x_top_l, 0), (x_top_r, 0), (x_bot_r, height), (x_bot_l, height)]


def build(sources, focus, unify):
    count = len(sources)
    canvas = Image.new("RGB", (OUT_W, OUT_H), SEAM_RGB)

    # Each panel is cut wider than its slot so the slant never exposes a gap.
    slot_w = round(OUT_W / count + OUT_H * SLANT + SEAM_PX * 2)

    for i, path in enumerate(sources):
        src = Image.open(path)
        piece = crop_to_fill(src, slot_w, OUT_H, focus[i], 0.5)

        if unify:
            # Three very different art styles fight each other at full
            # saturation. A light pull brings them into the same room without
            # turning the card grey.
            piece = ImageEnhance.Color(piece).enhance(0.88)
            piece = ImageEnhance.Contrast(piece).enhance(1.04)

        mask = Image.new("L", (OUT_W, OUT_H), 0)
        ImageDraw.Draw(mask).polygon(
            panel_polygon(i, count, OUT_W, OUT_H, SLANT), fill=255)

        layer = Image.new("RGB", (OUT_W, OUT_H), SEAM_RGB)
        offset = round(i * OUT_W / count - (slot_w - OUT_W / count) / 2)
        layer.paste(piece, (offset, 0))

        canvas.paste(layer, (0, 0), mask)

    # Seams drawn on top, so they sit above every panel edge.
    draw = ImageDraw.Draw(canvas)
    lean = OUT_H * SLANT
    for i in range(1, count):
        x = i * OUT_W / count
        draw.line([(x + lean / 2, -2), (x - lean / 2, OUT_H + 2)],
                  fill=SEAM_RGB, width=SEAM_PX)

    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name", help="output basename, e.g. bfp")
    ap.add_argument("images", nargs="+", help="sources, left to right")
    ap.add_argument("--focus", nargs="*", type=float, default=None,
                    help="0..1 per image; 0 keeps the left edge, 1 the right")
    ap.add_argument("--no-unify", action="store_true",
                    help="skip the shared colour pull")
    args = ap.parse_args()

    missing = [p for p in args.images if not pathlib.Path(p).exists()]
    if missing:
        sys.exit("no encuentro: " + ", ".join(missing))

    focus = args.focus or [0.5] * len(args.images)
    if len(focus) != len(args.images):
        sys.exit(f"--focus necesita {len(args.images)} valores, hay {len(focus)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cover = build(args.images, focus, not args.no_unify)

    out = OUT_DIR / f"{args.name}.webp"
    cover.save(out, "WEBP", quality=88, method=6)

    preview = OUT_DIR / f"{args.name}-preview.jpg"
    cover.save(preview, "JPEG", quality=90)

    kb = out.stat().st_size / 1024
    print(f"{out.relative_to(ROOT)}  {OUT_W}x{OUT_H}  {kb:.0f} KB")


if __name__ == "__main__":
    main()
