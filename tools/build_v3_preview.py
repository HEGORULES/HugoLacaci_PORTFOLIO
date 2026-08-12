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

RUNNER_ZIP = ("https://github.com/HugoLacaci/HugoLacaci.github.io/releases/download/"
              "normal/OperationFishbackNormalBuild.zip")

RUNNER_DOWNLOAD = """<div class="stage" style="aspect-ratio:16/9">
          <img class="stage-art" src="../../files/covers/infinite-runner.webp" alt="" loading="lazy" decoding="async">
          <div class="stage-poster is-art">
            <div class="poster-inner">
              <p class="label">Arcade runner &middot; Built in &lt; 1 week</p>
              <h2>Download and play</h2>
              <a class="btn btn-solid btn-play" href="RUNNER_ZIP_URL"><span>&#8595; Download for Windows</span></a>
              <p class="poster-note">
                115 MB zipped, around 600 MB unpacked. Unzip the whole folder and run
                <strong>OperationFishback.exe</strong>; the files next to it have to stay there.
              </p>
            </div>
          </div>
        </div>""".replace("RUNNER_ZIP_URL", RUNNER_ZIP)

# La rama claude/design-v3 se congelo antes del cambio de nombre de la cuenta y
# antes de que el runner pasara a descarga, asi que sus enlaces se corrigen aqui.
RENAMES = [
    ("https://github.com/HEGORULES/HugoLacaci_PORTFOLIO",
     "https://github.com/HugoLacaci/HugoLacaci.github.io"),
    ("https://hegorules.github.io/HugoLacaci_PORTFOLIO/", "https://hugolacaci.github.io/"),
    ("releases/download/trial/OperationFishback.zip"
     '"><span>&#8595; Windows build (118 MB)',
     "releases/download/normal/OperationFishbackNormalBuild.zip"
     '"><span>&#8595; Windows build (115 MB)'),
]


def relink(page):
    for a, b in RENAMES:
        page = page.replace(a, b)
    return page


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
home = relink(home)
home = home.replace('</body>', banner('../') + '</body>')
(OUT / 'index.html').write_text(home, encoding='utf-8')

# Play page: the Unity build stays where it is.
play = read('docs/play.html')
play = play.replace('game/Build/', '../game/Build/')
play = relink(play)
play = play.replace('</body>', banner('../') + '</body>')
(OUT / 'play.html').write_text(play, encoding='utf-8')

# Work pages sit one level deeper, so shared assets need another ../
for slug in WORK:
    page = read(f'docs/work/{slug}.html')
    page = page.replace('"../files/', '"../../files/')

    # El runner ya no se juega en el navegador: la build de WebGL se retiró y
    # ahora se descarga. La rama claude/design-v3 sigue trayendo el reproductor,
    # así que aquí se sustituye por el mismo bloque de descarga que usa el sitio,
    # en vez de dejar un botón de Start que no llevaría a ninguna parte.
    if slug == "infinite-runner":
        a, b = page.index('<div class="stage"'), page.index("</script>") + len("</script>")
        page = page[:a] + RUNNER_DOWNLOAD + page[b:]
    page = relink(page)
    page = page.replace('</body>', banner('../../') + '</body>')
    (OUT / 'work' / f'{slug}.html').write_text(page, encoding='utf-8')

total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
print(f'preview escrito en {OUT} ({total/1024:.0f} KB)')
