#!/usr/bin/env python3
"""Publish the Blueprint design at docs/v3/ without duplicating the heavy assets.

Only the HTML, CSS and JS are copied. Everything big (the Unity builds, the
PDFs, the slide images) is referenced one level up, so the preview costs a few
hundred KB instead of 170 MB.
"""
import pathlib, subprocess

ROOT = pathlib.Path('/home/user/HugoLacaci_PORTFOLIO')
OUT = ROOT / 'docs' / 'v3'
BRANCH = 'claude/design-v3'

def read(path):
    return subprocess.run(['git', 'show', f'{BRANCH}:{path}'], cwd=ROOT,
                          capture_output=True, text=True, check=True).stdout

WORK = ['beyond-the-health-bar', 'infinite-runner', 'tft-set', 'enemy-design',
        'uniformity-rpg', 'genre-hybridization', 'ravenswatch-analysis']

(OUT / 'work').mkdir(parents=True, exist_ok=True)
(OUT / 'data').mkdir(parents=True, exist_ok=True)

# Plain copies: same relative depth as the originals.
for name in ('style.css', 'site.js', 'tft.js', 'xlsheet.js'):
    (OUT / name).write_text(read(f'docs/{name}'), encoding='utf-8')

(OUT / 'data' / 'tft-sheets.json').write_text(read('docs/data/tft-sheets.json'), encoding='utf-8')

def banner(up):
    """up: relative prefix that reaches docs/ from the page being written."""
    return ('<style>body{padding-bottom:44px}</style>'
            '<div style="position:fixed;left:0;right:0;bottom:0;z-index:99;padding:8px 16px;'
            'background:#C8F231;color:#0A0C11;font:700 12px/1.4 ui-monospace,Menlo,monospace;'
            'letter-spacing:.08em;text-transform:uppercase;text-align:center">'
            'Propuesta visual 02 &middot; Blueprint &middot; '
            f'<a href="{up}index.html" style="color:#0A0C11">volver al portfolio actual</a></div>\n')

# Home: only the CV lives one level up.
home = read('docs/index.html')
home = home.replace('href="Curriculum_GD_G.pdf"', 'href="../Curriculum_GD_G.pdf"')
home = home.replace('</body>', banner('../') + '</body>')
(OUT / 'index.html').write_text(home, encoding='utf-8')

# Play page: the Unity build stays where it is.
play = read('docs/play.html')
play = play.replace('game/Build/', '../game/Build/')
play = play.replace('</body>', banner('../') + '</body>')
(OUT / 'play.html').write_text(play, encoding='utf-8')

# Work pages sit one level deeper, so shared assets need another ../
for slug in WORK:
    page = read(f'docs/work/{slug}.html')
    page = page.replace('"../files/', '"../../files/')
    page = page.replace("'../game/runner/Build/", "'../../game/runner/Build/")

    # La build del runner se reconstruyó con Decompression Fallback: los tres
    # archivos pasan a .unityweb. La rama claude/design-v3 todavía pide los
    # antiguos, así que se corrigen aquí en vez de tocar esa rama.
    page = page.replace("BUILD + '.data',", "BUILD + '.data.unityweb',")
    page = page.replace("BUILD + '.framework.js',", "BUILD + '.framework.js.unityweb',")
    page = page.replace("BUILD + '.wasm',", "BUILD + '.wasm.unityweb',")
    page = page.replace("Roughly 120 MB loads", "Roughly 90 MB loads")
    page = page.replace('</body>', banner('../../') + '</body>')
    (OUT / 'work' / f'{slug}.html').write_text(page, encoding='utf-8')

total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
print(f'preview escrito en {OUT} ({total/1024:.0f} KB)')
