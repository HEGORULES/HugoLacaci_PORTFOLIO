#!/usr/bin/env python3
"""Generate docs/work/*.html from the PROJECTS list below.

Each project gets its own page and URL so a recruiter can link straight to
one piece of work. Edit a project here and re-run:

    python3 tools/build_work_pages.py

The generated HTML is committed, so GitHub Pages needs no build step.
"""

import html
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "work"

# doc: (label, filename in docs/files/, size label) or None
PROJECTS = [
    {
        "slug": "beyond-the-health-bar",
        "title": "Beyond the Health Bar",
        "eyebrow": "Bachelor's thesis · Graded 9.1 / 10",
        "disciplines": ["Research", "Systems", "Narrative"],
        "lead": "Analysis of recurring patterns in the design of boss encounters. A ludonarrative "
                "framework arguing that a boss isn't a stronger enemy — it's the convergence point "
                "of mechanical, spatial, narrative and psychological design.",
        "what": "Boss design is usually treated as a subcategory of enemy design: a bigger, tougher "
                "version of a regular enemy. This thesis challenges that. Drawing on academic work "
                "across mechanical design, level design, narrative design and player psychology, it "
                "argues bosses are holistic experiences — moments where every discipline converges "
                "on a single point. To test the idea it compares encounters from three genres that "
                "share almost nothing mechanically, and finds the same structure in all of them.",
        "role": "Sole author. 111 pages, from the state of the art through methodology to the full "
                "framework applied case by case. Supervised by Álvaro Ortuño Morente.",
        "process": None,
        "extra_html": """
      <div class="section-head" style="margin-top:var(--s8)">
        <div class="head-group">
          <p class="label">Principle 01, plotted</p>
          <h2 style="font-size:clamp(28px,4vw,48px)">The Convergence</h2>
        </div>
      </div>
      <div class="figure" data-reveal>
        <canvas class="figure-canvas" aria-label="Four design curves — narrative, difficulty, learning and tension — starting apart and settling into one shared shape."></canvas>
        <div class="figure-legend">
          <span class="legend-item"><span class="legend-swatch" style="background:rgba(169,155,181,.55)"></span>Narrative</span>
          <span class="legend-item"><span class="legend-swatch" style="background:rgba(124,77,255,.85)"></span>Difficulty</span>
          <span class="legend-item"><span class="legend-swatch" style="background:rgba(169,155,181,.4)"></span>Learning</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#FF3D57"></span>Tension</span>
        </div>
        <p class="figure-caption">Four curves the industry treats as separate systems. Watch them settle:
        build, escalate, peak, release. They aren't four systems — they're one pattern seen from four angles.</p>
      </div>

      <div class="section-head" style="margin-top:var(--s8)">
        <div class="head-group">
          <p class="label">Three genres, one shared structure</p>
          <h2 style="font-size:clamp(28px,4vw,48px)">Case Studies</h2>
        </div>
      </div>
      <div class="chip-row" data-reveal>
        <div class="chip"><span class="chip-name">Zoh Shia</span><span class="chip-note">Monster Hunter Wilds · Action</span></div>
        <div class="chip"><span class="chip-name">Dispatch</span><span class="chip-note">Narrative · Choice-driven</span></div>
        <div class="chip"><span class="chip-name">GlaDOS</span><span class="chip-note">Portal · Puzzle</span></div>
      </div>

      <div class="section-head" style="margin-top:var(--s8)">
        <div class="head-group">
          <p class="label">The output</p>
          <h2 style="font-size:clamp(28px,4vw,48px)">Five Principles</h2>
        </div>
      </div>
      <div class="principles">
        <article class="principle" data-reveal>
          <span class="principle-num">01</span>
          <div><h3>The Convergence of Curves</h3>
          <p>Narrative structure, tension arc, difficulty curve and learning arc aren't separate systems — they're the same cyclical pattern of build, escalate, peak, viewed from different angles.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:60ms">
          <span class="principle-num">02</span>
          <div><h3>Communicating the Challenge</h3>
          <p>Telegraphing turns a difficult encounter into a fair one. Without it the failure–improvement cycle breaks and frustration replaces learning.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:120ms">
          <span class="principle-num">03</span>
          <div><h3>Space as an Active Element</h3>
          <p>The arena isn't a backdrop — it's part of the challenge, guiding attention and reinforcing the encounter's mechanical and narrative stakes.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:180ms">
          <span class="principle-num">04</span>
          <div><h3>Ludonarrative Coherence</h3>
          <p>Visual design, behaviour, sound and narrative all need to say the same thing at once, so the player can read the encounter without being told.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:240ms">
          <span class="principle-num">05</span>
          <div><h3>Emotional Validation</h3>
          <p>The payoff of a boss fight is proportional to everything the player invested to get there. It validates the journey, not just the win.</p></div>
        </article>
      </div>
""",
        "docs": [("Full thesis · 111 pages", "beyond-the-health-bar.pdf")],
        "links": [],
    },
    {
        "slug": "tft-set",
        "title": "Custom TFT Set",
        "eyebrow": "Personal project · Solo",
        "disciplines": ["Systems", "Economy", "Balance"],
        "lead": "A full Teamfight Tactics set built from zero on my own time — champions, costs, "
                "16 traits, and a damage model to balance the numbers against.",
        "what": "Nobody asked for this one. I wanted to find out whether I could hold an entire "
                "competitive economy in my head: champions across five cost tiers, 16 traits that "
                "have to combine without collapsing into one dominant line, and item interactions "
                "on top. The trait sheet runs 3 tabs; the damage calculator runs 5, covering "
                "champions, base items, items and the calculator itself.",
        "role": "Solo — design, documentation and the whole balancing model.",
        "process": None,
        "extra_html": "",
        "docs": [],
        "links": [("16 Traits (.xlsx)", "../files/tft-set-16-traits.xlsx", "34 KB"),
                  ("Damage calculator (.xlsx)", "../files/tft-damage-calculator.xlsx", "38 KB")],
    },
    {
        "slug": "enemy-design",
        "title": "Enemy Design",
        "eyebrow": "Final year project · Team",
        "disciplines": ["Combat", "Production", "Docs"],
        "lead": "The enemy roster for our final year game, designed against three constraints at "
                "once: what the team could actually build, the art direction, and how the enemies "
                "read together inside an encounter.",
        "what": "A roster is not a list of monsters — it's a set of problems the player learns to "
                "solve, and every one of them has to be built by somebody. I designed each enemy so "
                "it earned its production cost: distinct silhouette, one clear behaviour to read, "
                "and a role that made the others more interesting when combined.",
        "role": "Enemy and encounter design. I delivered animation-ready spec tables so the "
                "animation team had everything they needed per enemy without coming back to ask.",
        "process": None,
        "extra_html": "",
        "docs": [],
        "links": [("Full documentation (Notion)", "https://clover-echo-9e9.notion.site/Enemy-Design-c13e31c9d5648328867f813b2c348285", None)],
    },
    {
        "slug": "uniformity-rpg",
        "title": "Uniformity",
        "eyebrow": "Class project · Solo",
        "disciplines": ["Narrative", "World", "Docs"],
        "lead": "A 43-page design document for a stylised third-person RPG set in a city divided "
                "into four districts, each with its own aesthetic and cultural identity.",
        "what": "The city is the system. Four districts, four cultures, and a player who has to move "
                "between them — so the document covers art direction, narrative structure, "
                "progression, combat and NPC design as one connected whole rather than separate "
                "chapters that happen to share a setting.",
        "role": "Solo design and documentation.",
        "process": None,
        "extra_html": "",
        "docs": [("Full GDD · 43 pages", "uniformity-rpg-gdd.pdf")],
        "links": [],
    },
    {
        "slug": "genre-hybridization",
        "title": "Genre Hybridization",
        "eyebrow": "Class project · Team",
        "disciplines": ["Systems", "Narrative"],
        "lead": "Take two genres that shouldn't fit and make one game out of them. We drew "
                "roguelike and narrative-driven, and wrote a 75-page GDD to prove it holds up.",
        "what": "The brief was deliberately awkward: roguelikes reset, narrative games accumulate. "
                "Reconciling them meant deciding what the player is allowed to carry across a run "
                "and what the story does with a protagonist who keeps starting over — which turns "
                "out to be a structural question, not a writing one.",
        "role": "Game design, co-authored with Aaron Fuentes.",
        "process": None,
        "extra_html": "",
        "docs": [("Full GDD · 75 pages", "genre-hybridization-gdd.pdf")],
        "links": [],
    },
    {
        "slug": "ravenswatch-analysis",
        "title": "Multiplayer Structure",
        "eyebrow": "Case study · Solo",
        "disciplines": ["Analysis", "Multiplayer"],
        "lead": "Our own co-op project wasn't working. Rather than guess, I took apart Ravenswatch "
                "to find out why its structure frustrates players — and what that meant for ours.",
        "what": "A class multiplayer game of ours kept producing the same complaint from testers, "
                "and 'make it more fun' isn't an actionable note. So I looked at a shipped game with "
                "the same shape and traced the frustration back to structural decisions rather than "
                "tuning — which made the fix for our own project obvious.",
        "role": "Solo analysis and write-up.",
        "process": None,
        "extra_html": "",
        "docs": [("Full analysis · 10 pages", "ravenswatch-analysis.pdf")],
        "links": [],
    },
    {
        "slug": "sotc-boss",
        "title": "Colossus Boss Concept",
        "eyebrow": "Personal project · Solo",
        "disciplines": ["Encounters", "Combat"],
        "lead": "A boss designed inside somebody else's rules — the world, scale and restraint of "
                "Shadow of the Colossus, where a fight is a climb rather than a damage race.",
        "what": "Designing within an existing game is a harder constraint than a blank page: every "
                "idea has to survive the question 'would this game do that?'. Shadow of the Colossus "
                "has almost no combat vocabulary, so the encounter has to come from traversal, "
                "scale and patience instead of abilities.",
        "role": "Solo design.",
        "process": None,
        "extra_html": "",
        "docs": [],
        "links": [],
    },
    {
        "slug": "infinite-runner",
        "title": "Infinite Runner",
        "eyebrow": "Class project · Team",
        "disciplines": ["Prototyping", "Speed"],
        "lead": "A complete, playable runner built and polished in under a week, promoted with its "
                "own one-pager.",
        "what": "A hard one-week deadline treated as a design constraint rather than an excuse: "
                "decide what the game is, cut everything that doesn't serve it, and spend the "
                "remaining time making the core loop feel good instead of adding features.",
        "role": None,
        "process": None,
        "extra_html": "",
        "docs": [],
        "links": [],
    },
]

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Hugo Lacaci Torres</title>
<meta name="description" content="{meta}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} — Hugo Lacaci Torres">
<meta property="og:description" content="{meta}">
<meta name="theme-color" content="#0B0710">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%230B0710'/><circle cx='13' cy='16' r='9' fill='%23FF3D57'/><circle cx='20' cy='16' r='9' fill='%237C4DFF' fill-opacity='.8'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Karla:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
</head>
<body>

<div class="bg-grid" aria-hidden="true"></div>
<div class="bg-screen" aria-hidden="true"></div>

<nav class="nav">
  <div class="wrap">
    <a class="nav-mark" href="../index.html">
      <span class="dot" aria-hidden="true"></span>
      <span>Lacaci</span>
    </a>
    <ul class="nav-links">
      <li><a href="../index.html#work" aria-current="page">Work</a></li>
      <li><a href="../play.html">Play</a></li>
      <li><a href="../index.html#about">About</a></li>
      <li><a href="../index.html#contact">Contact</a></li>
    </ul>
  </div>
  <span class="nav-progress" aria-hidden="true"></span>
</nav>

<main class="shell">

  <div class="page-head" id="top">
    <canvas class="page-head-scope" data-seed="{slug}" aria-hidden="true"></canvas>
    <div class="wrap">
      <a class="backlink" href="../index.html#work">← All work</a>
      <p class="label">{eyebrow}</p>
      <h1 class="display page-title"><span class="misprint" data-text="{title}">{title}</span></h1>
      <p class="lead">{lead}</p>
      <div class="disc-row" style="margin-top:var(--s5)">{discs}</div>
    </div>
  </div>

  <section class="section section-flush">
    <div class="wrap-narrow">
{body}
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head">
        <div class="head-group">
          <p class="label">Keep going</p>
          <h2 style="font-size:clamp(30px,5vw,64px)">Next up</h2>
        </div>
      </div>
      <div class="work-grid">
{next_cards}
      </div>
    </div>
  </section>

  <footer class="footer" id="contact">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <p class="label" data-reveal>Open to junior roles</p>
          <h2 class="display" data-reveal style="--d:80ms"><span class="misprint" data-text="Let's talk">Let's talk</span></h2>
          <p class="footer-meta" data-reveal style="--d:140ms">
            <span>hugo.lacaci@gmail.com</span><span>·</span><span>Madrid, Spain</span>
          </p>
        </div>
        <div class="btn-row" data-reveal style="--d:200ms">
          <a class="btn btn-solid" href="mailto:hugo.lacaci@gmail.com"><span>Email me</span></a>
          <a class="btn" href="https://www.linkedin.com/in/hugo-lacaci-torres" target="_blank" rel="noopener"><span>LinkedIn ↗</span></a>
          <a class="btn" href="../index.html#work"><span>All work</span></a>
        </div>
      </div>
      <div class="footer-base">
        <span>Hugo Lacaci Torres — Game Designer</span>
        <span>Madrid · 2026</span>
      </div>
    </div>
  </footer>

</main>

<script src="../site.js"></script>
</body>
</html>
"""


def esc(s):
    return html.escape(s, quote=True)


def build_body(p):
    out = []
    add = out.append

    add('      <div class="prose" data-reveal>')
    add('        <h2 class="display" style="font-size:clamp(26px,3.6vw,40px);margin:0 0 var(--s4)">What it is</h2>')
    add(f'        <p>{esc(p["what"])}</p>')
    add('      </div>')

    if p.get("role"):
        add('      <div class="prose" data-reveal style="--d:80ms;margin-top:var(--s7)">')
        add('        <h2 class="display" style="font-size:clamp(26px,3.6vw,40px);margin:0 0 var(--s4)">My role</h2>')
        add(f'        <p>{esc(p["role"])}</p>')
        add('      </div>')

    if p.get("process"):
        add('      <div class="prose" data-reveal style="--d:120ms;margin-top:var(--s7)">')
        add('        <h2 class="display" style="font-size:clamp(26px,3.6vw,40px);margin:0 0 var(--s4)">Process</h2>')
        add(f'        <p>{esc(p["process"])}</p>')
        add('      </div>')

    if p.get("extra_html"):
        add(p["extra_html"])

    for label, fname in p.get("docs", []):
        add('      <div class="doc-block" data-reveal style="margin-top:var(--s8)">')
        add('        <div class="doc-head">')
        add(f'          <p class="label">{esc(label)}</p>')
        add('          <div class="btn-row">')
        add(f'            <a class="btn btn-sm" href="../files/{fname}" target="_blank" rel="noopener"><span>Open full PDF ↗</span></a>')
        add(f'            <a class="btn btn-sm" href="../files/{fname}" download><span>&#8595; Download</span></a>')
        add('          </div>')
        add('        </div>')
        add('        <div class="doc-embed">')
        add(f'          <iframe src="../files/{fname}" title="{esc(p["title"])}" loading="lazy"></iframe>')
        add('        </div>')
        add('      </div>')

    links = p.get("links", [])
    if links:
        add('      <div class="btn-row" data-reveal style="margin-top:var(--s7)">')
        for item in links:
            label, href, size = (item + (None,))[:3] if len(item) == 2 else item
            text = f"{label} · {size}" if size else f"{label} ↗"
            dl = " download" if href.startswith("../files/") else ' target="_blank" rel="noopener"'
            add(f'        <a class="btn btn-sm"{dl} href="{href}"><span>{esc(text)}</span></a>')
        add('      </div>')

    if not p.get("docs") and not links:
        add('      <div class="btn-row" data-reveal style="margin-top:var(--s7)">')
        add('        <span class="btn btn-sm btn-idle"><span>Documentation pending upload</span></span>')
        add('      </div>')

    return "\n".join(out)


def build_next(current):
    others = [q for q in PROJECTS if q["slug"] != current][:2]
    cards = []
    for i, q in enumerate(others):
        discs = "".join(f'<span class="disc">{esc(d)}</span>' for d in q["disciplines"][:2])
        cards.append(f"""        <a class="panel work-card" href="{q['slug']}.html" data-reveal style="--d:{i*80}ms">
          <span class="work-plate"><canvas data-plate="{q['slug']}" aria-hidden="true"></canvas></span>
          <span class="work-body">
            <span class="disc-row">{discs}</span>
            <h3>{esc(q['title'])}</h3>
            <p>{esc(q['lead'][:130])}…</p>
            <span class="work-go">Open →</span>
          </span>
        </a>""")
    return "\n".join(cards)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for p in PROJECTS:
        page = PAGE.format(
            title=esc(p["title"]),
            meta=esc(p["lead"][:180]),
            eyebrow=esc(p["eyebrow"]),
            slug=p["slug"],
            lead=esc(p["lead"]),
            discs="".join(f'<span class="disc">{esc(d)}</span>' for d in p["disciplines"]),
            body=build_body(p),
            next_cards=build_next(p["slug"]),
        )
        (OUT / f"{p['slug']}.html").write_text(page, encoding="utf-8")
        print(f"  wrote work/{p['slug']}.html")
    print(f"{len(PROJECTS)} pages generated in {OUT}")


if __name__ == "__main__":
    main()
