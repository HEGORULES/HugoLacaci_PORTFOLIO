#!/usr/bin/env python3
"""Build the image that shows up when the portfolio link is pasted somewhere.

LinkedIn, WhatsApp, Slack and mail clients all read og:image. Without one they
render a bare text card, which is the first thing a recruiter sees of the site,
before they have clicked anything.

The card is the site's own hero plus a strip of the eight covers, so the range
of work is visible before the page even opens.

    python3 tools/make_share_card.py

Fonts are the site's own, fetched from Google Fonts and cached under
tools/.fonts/ (git-ignored). Covers come from docs/files/covers/.
"""
import pathlib
import re
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
COVERS = ROOT / "docs" / "files" / "covers"
FONTS = ROOT / "tools" / ".fonts"
OUT = ROOT / "docs" / "files" / "share-card.png"

W, H = 1200, 630
STRIP_H = 150

VOID = (11, 7, 16)
IVORY = (247, 241, 234)
FLARE = (255, 61, 87)
HAZE = (150, 140, 160)
VIOLET = (34, 22, 48)

# Same order as the home grid, so the strip reads as the site does.
ORDER = ["beyond-the-health-bar", "automatic-combat-autobattler", "infinite-runner",
         "tft-set", "enemy-design", "uniformity-rpg", "genre-hybridization",
         "ravenswatch-analysis"]

# An old Chrome asks for woff instead of woff2, which Pillow can read.
LEGACY_UA = ("Mozilla/5.0 (Windows NT 5.1) AppleWebKit/534.7 (KHTML, like Gecko) "
             "Chrome/7.0.517.44 Safari/534.7")


def font(family, size):
    name = re.sub(r"[^a-z0-9]", "", family.lower()) + ".woff"
    path = FONTS / name
    if not path.exists():
        FONTS.mkdir(parents=True, exist_ok=True)
        css = subprocess.run(
            ["curl", "-sL", "-H", f"User-Agent: {LEGACY_UA}",
             f"https://fonts.googleapis.com/css?family={family}"],
            capture_output=True, check=True).stdout.decode()
        url = re.search(r"url\((https://[^)]+)\)", css).group(1)
        path.write_bytes(subprocess.run(
            ["curl", "-sL", "-H", f"User-Agent: {LEGACY_UA}", url],
            capture_output=True, check=True).stdout)
    return ImageFont.truetype(str(path), size)


def tracked(draw, xy, text, fnt, fill, spacing):
    """Pillow has no letter-spacing, and the site's labels depend on it."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing
    return x


def glow(img, cx, cy, radius, rgb, strength):
    """Soft radial wash, the same trick the page uses behind the hero."""
    layer = Image.new("L", (radius * 2, radius * 2), 0)
    d = ImageDraw.Draw(layer)
    steps = 48
    for i in range(steps):
        r = radius * (1 - i / steps)
        v = int(strength * (i / steps) ** 2)
        d.ellipse([radius - r, radius - r, radius + r, radius + r], fill=v)
    tint = Image.new("RGB", layer.size, rgb)
    img.paste(tint, (cx - radius, cy - radius), layer)


def main():
    card = Image.new("RGB", (W, H), VOID)
    glow(card, 120, 90, 460, FLARE, 46)
    glow(card, W - 80, 380, 520, VIOLET, 150)

    d = ImageDraw.Draw(card)

    display = font("Bricolage+Grotesque:800", 116)
    label = font("Karla:700", 21)
    body = font("Karla:400", 27)

    tracked(d, (64, 88), "GAME DESIGNER", label, FLARE, 3.4)
    tracked(d, (330, 88), "MADRID  ·  OPEN TO WORK", label, HAZE, 3.4)

    d.text((60, 134), "Hugo Lacaci", font=display, fill=IVORY)

    d.text((64, 296), "Systems, combat, narrative and documentation.",
           font=body, fill=IVORY)
    d.text((64, 334), "Eight projects, one playable in the browser.",
           font=body, fill=HAZE)

    # Filmstrip: every cover, in grid order.
    top = H - STRIP_H
    d.rectangle([0, top - 2, W, top], fill=(38, 26, 52))
    gap = 3
    slot = (W - gap * (len(ORDER) - 1)) / len(ORDER)
    for i, slug in enumerate(ORDER):
        src = Image.open(COVERS / f"{slug}.webp").convert("RGB")
        tw, th = int(round(slot)), STRIP_H
        scale = max(tw / src.width, th / src.height)
        big = src.resize((max(tw, round(src.width * scale)),
                          max(th, round(src.height * scale))), Image.LANCZOS)
        left = (big.width - tw) // 2
        card.paste(big.crop((left, 0, left + tw, th)),
                   (int(round(i * (slot + gap))), top))

    # A flat dim over the whole strip: the covers are a texture here, not the
    # subject, and two of them are white enough to pull the eye off the name.
    veil = Image.new("RGB", (W, STRIP_H), VOID)
    card.paste(Image.blend(card.crop((0, top, W, H)), veil, 0.22), (0, top))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    card.save(OUT, "PNG", optimize=True)
    print(f"{OUT.relative_to(ROOT)}  {W}x{H}  {OUT.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
