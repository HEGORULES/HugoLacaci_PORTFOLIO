#!/usr/bin/env python3
"""Rasterise a slide deck PDF into per-slide images for the web deck viewer.

A 16-slide presentation shown through a PDF frame means scrolling through a
document to read slides. Rendering each slide to an image lets the page show
one slide at a time, whole, at the size the screen allows.

    python3 tools/render_slides.py <pdf> <out-dir> [scale]

Writes NN.webp and NN.jpg per slide (the JPEG is the fallback for browsers
without WebP) and prints the pixel size, which the page needs for the width
and height attributes that reserve layout space.
"""

import io
import pathlib
import sys

import pymupdf
from PIL import Image


def render(pdf: pathlib.Path, out: pathlib.Path, scale: float = 1.8) -> None:
    out.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(pdf)
    size = None
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
        im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        im.save(out / f"{i:02d}.webp", quality=82, method=6)
        im.save(out / f"{i:02d}.jpg", quality=84, optimize=True, progressive=True)
        size = im.size
    total = sum(f.stat().st_size for f in out.iterdir()) // 1024
    print(f"{doc.page_count} slides at {size[0]}x{size[1]} -> {out} ({total} KB)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    render(
        pathlib.Path(sys.argv[1]),
        pathlib.Path(sys.argv[2]),
        float(sys.argv[3]) if len(sys.argv) > 3 else 1.8,
    )
