#!/usr/bin/env python3
"""Turn the uploaded artwork into work-card covers.

The sources live at the root of the `main` branch, where they were uploaded,
and are read straight out of git so nothing has to be duplicated into docs/.
Run from anywhere in the repo:

    python3 tools/build_covers.py

Two treatments, because the sources are not the same kind of picture:

  fill   crop to fill the frame. For screenshots and key art, where the
         picture already reaches every edge.
  plate  trim the empty background away, then centre what is left on that
         same background. For the logo and the enemy sheet, which are ink on
         white: cropping those to fill would just enlarge the white.

The BFP cover is a triptych of the three games the thesis studied, built by
tools/make_cover.py.
"""
import io
import pathlib
import subprocess
import sys

from PIL import Image, ImageChops

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from make_cover import build as build_triptych  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "files" / "covers"
SRC_REF = "origin/main"

# The card renders at most about 600 CSS px wide, so this is 2x for retina.
W, H = 1200, 750

COVERS = [
    # slug, mode, source(s), options
    ("beyond-the-health-bar", "triptych",
     ["MonsterHunter.jpg", "Dispatch.jpg", "Portal.jpg"],
     {"focus": [0.42, 0.5, 0.5]}),

    # Fullscreen grab: the top strip carries the browser's "press Esc" notice
    # and a Windows overlay icon, so it goes before anything else happens.
    ("automatic-combat-autobattler", "fill", ["Slavic Battle.png"],
     {"top_crop": 175, "focus_x": 0.12}),

    ("infinite-runner", "fill", ["Operation Fishback.png"], {"focus_x": 0.5}),
    # Square icon: cropping to 16:10 beheads the crown and eats the wordmark,
    # so it keeps its full shape on its own orange instead.
    ("tft-set", "plate", ["teamfight-tactics_fpua.600.jpg"], {"pad": 0.03}),
    ("genre-hybridization", "fill", ["through their eyes.jpg"], {"focus_y": 0.5}),
    ("ravenswatch-analysis", "fill", ["ravenswatch.jpg"], {"focus_x": 0.5}),

    ("enemy-design", "plate", ["enemyDesign.png"], {"pad": 0.05}),
    ("uniformity-rpg", "plate", ["Uniformity.jpg"], {"pad": 0.16}),
]


def from_git(name):
    """Read a file out of the branch it was uploaded to."""
    blob = subprocess.run(["git", "show", f"{SRC_REF}:{name}"],
                          cwd=ROOT, capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(blob))


def flatten(img):
    """Drop alpha onto white so PNG screenshots keep their own background."""
    img = img.convert("RGBA")
    ground = Image.new("RGBA", img.size, (255, 255, 255, 255))
    return Image.alpha_composite(ground, img).convert("RGB")


def fill(img, focus_x=0.5, focus_y=0.5, top_crop=0):
    if top_crop:
        img = img.crop((0, top_crop, img.width, img.height))

    scale = max(W / img.width, H / img.height)
    big = img.resize((max(W, round(img.width * scale)),
                      max(H, round(img.height * scale))), Image.LANCZOS)

    left = round((big.width - W) * focus_x)
    top = round((big.height - H) * focus_y)
    return big.crop((left, top, left + W, top + H))


def plate(img, pad=0.08):
    """Trim the flat background, then centre the ink on it again."""
    corner = img.getpixel((0, 0))
    ground = Image.new("RGB", img.size, corner)
    diff = ImageChops.difference(img, ground).convert("L")
    box = diff.point(lambda v: 255 if v > 12 else 0).getbbox()

    ink = img.crop(box) if box else img

    inner_w, inner_h = W * (1 - pad * 2), H * (1 - pad * 2)
    scale = min(inner_w / ink.width, inner_h / ink.height)
    ink = ink.resize((max(1, round(ink.width * scale)),
                      max(1, round(ink.height * scale))), Image.LANCZOS)

    canvas = Image.new("RGB", (W, H), corner)
    canvas.paste(ink, ((W - ink.width) // 2, (H - ink.height) // 2))
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    for slug, mode, sources, opts in COVERS:
        imgs = [flatten(from_git(s)) for s in sources]

        if mode == "triptych":
            cover = build_triptych(
                [_tmp(i) for i in imgs], opts.get("focus", [0.5] * len(imgs)), True)
            cover = cover.resize((W, H), Image.LANCZOS)
        elif mode == "plate":
            cover = plate(imgs[0], opts.get("pad", 0.08))
        else:
            cover = fill(imgs[0], opts.get("focus_x", 0.5),
                         opts.get("focus_y", 0.5), opts.get("top_crop", 0))

        path = OUT / f"{slug}.webp"
        cover.save(path, "WEBP", quality=84, method=6)
        print(f"  {path.relative_to(ROOT)}  {W}x{H}  {path.stat().st_size/1024:.0f} KB")

    total = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    print(f"{len(COVERS)} covers, {total/1024:.0f} KB total")


_TMP = ROOT / ".cover-tmp"


def _tmp(img):
    """make_cover works on paths, so the triptych panels land on disk first."""
    _TMP.mkdir(exist_ok=True)
    n = len(list(_TMP.glob("*.png")))
    p = _TMP / f"{n}.png"
    img.save(p)
    return p


if __name__ == "__main__":
    try:
        main()
    finally:
        if _TMP.exists():
            for f in _TMP.iterdir():
                f.unlink()
            _TMP.rmdir()
