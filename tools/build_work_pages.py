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
        "title": "Bachelor's Final Project (BFP)",
        "eyebrow": "Theoretical modality · Graded 9.1 / 10",
        "disciplines": ["Research", "Systems", "Narrative"],
        "lead": "A research thesis on how the mechanical, spatial, narrative and psychological dimensions of design come together to shape a boss encounter, tested across three genres that share almost no combat system.",
        "what": "Beyond the Health Bar investigates how different dimensions of game design (mechanical, spatial, narrative and psychological) come together to shape the player's experience during boss encounters. To test this, I analysed recurring patterns across boss fights from three genres that share almost no combat system in common: an action RPG, a narrative choice-driven game, and a puzzle game. The aim was a clearer, more useful redefinition of what a boss actually is, beyond simply “a stronger enemy”.",
        "role_label": "What I did / experience gained",
        "role": ["I conducted the research and analysis entirely solo: reviewing existing literature on mechanical, level, narrative and player-psychology design, then applying that lens to the bosses of Monster Hunter Wilds, Dispatch and Portal. From that comparison I built a five-principle framework (Convergence of Curves, Communicating the Challenge, Space as an Active Element, Ludonarrative Coherence, Emotional Validation) defining what elements make a boss.", "Above all, this project sharpened my analytical thinking and my ability to look at problems from different angles. Comparing genres that share very little forced me to think outside the box and approach problem-solving from multiple perspectives at once, which consistently led to more creative, less obvious solutions.", "It also strengthened my research skills and my ability to document complex information clearly, structuring both the investigation and the final write-up so the ideas stay accessible without losing depth."],
        "process": None,
        "extra_html": """
      <div class="section-head" style="margin-top:var(--s8)">
        <div class="head-group">
          <p class="label">Three genres, six encounters</p>
          <h2 style="font-size:clamp(28px,4vw,48px)">What I analysed</h2>
        </div>
      </div>
      <div class="case-grid doc-wide">
        <article class="panel case" data-reveal>
          <p class="label">Action RPG</p>
          <h3>Monster Hunter Wilds</h3>
          <ul class="boss-list">
            <li><strong>Zoh Shia</strong><span>The final confrontation of the main story, and an encounter that really begins the moment you first set foot in the Forbidden Lands.</span></li>
            <li><strong>Rey Dau</strong><span>Essentially different: it doesn't close the central conflict, which is exactly what makes it useful as a comparison.</span></li>
          </ul>
        </article>
        <article class="panel case" data-reveal style="--d:80ms">
          <p class="label">Narrative · Choice-driven</p>
          <h3>Dispatch</h3>
          <ul class="boss-list">
            <li><strong>Episode 8</strong><span>The finale, where the three-act structure running under the whole season resolves.</span></li>
            <li><strong>Episode 5</strong><span>"Team Building": two narrative arcs developing in parallel, with no traditional enemy anywhere.</span></li>
          </ul>
        </article>
        <article class="panel case" data-reveal style="--d:160ms">
          <p class="label">First-person puzzle</p>
          <h3>Portal</h3>
          <ul class="boss-list">
            <li><strong>GLaDOS</strong><span>The encounter that doesn't start when you reach the room. It starts with the first line she speaks.</span></li>
            <li><strong>Test Chamber 15</strong><span>Consolidates the player's mechanical base before the game asks them to use it under pressure.</span></li>
          </ul>
        </article>
      </div>

      <div class="section-head" style="margin-top:var(--s9)">
        <div class="head-group">
          <p class="label">The output</p>
          <h2 style="font-size:clamp(28px,4vw,48px)">Five Principles</h2>
        </div>
      </div>
      <div class="principles">
        <article class="principle" data-reveal>
          <span class="principle-num">01</span>
          <div><h3>The Convergence of Curves</h3>
          <p>Narrative structure, tension arc, difficulty curve and learning arc aren't separate systems: they're the same cyclical pattern of build, escalate, peak, viewed from different angles.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:60ms">
          <span class="principle-num">02</span>
          <div><h3>Communicating the Challenge</h3>
          <p>Telegraphing turns a difficult encounter into a fair one. Without it the failure-improvement cycle breaks and frustration replaces learning.</p></div>
        </article>
        <article class="principle" data-reveal style="--d:120ms">
          <span class="principle-num">03</span>
          <div><h3>Space as an Active Element</h3>
          <p>The arena isn't a backdrop: it's part of the challenge, guiding attention and reinforcing the encounter's mechanical and narrative stakes.</p></div>
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
        "decks": [{
            "label": "BFP presentation",
            "file": "bfp-presentation.pdf",
            "dir": "bfp-slides",
            "count": 16,
            "w": 1728,
            "h": 972,
            "note": "The slides I defended the thesis with: a summary of its most important "
                    "points, from the hypothesis to the five principles it arrives at.",
        }],
        "docs": [("Full thesis · 111 pages", "beyond-the-health-bar.pdf")],
        "links": [],
    },
    {
        "slug": "infinite-runner",
        "title": "Prototype: Infinite Runner",
        "eyebrow": "Class project · Team",
        "disciplines": ["Prototyping", "Speed", "Level Design"],
        "lead": "An arcade endless runner built in under a week: a penguin chasing the thief who "
                "stole his fish, with a gacha pull every 10 sardines that can help or hurt.",
        "what": "A prototype built in under a week with an arcade aesthetic: a penguin whose fish "
                "has been stolen chases the thief down a hill, dodging obstacles and collecting "
                "sardines that act as currency. Every 10 sardines trigger a gacha pull, granting a "
                "random effect, some helpful (temporary invulnerability), some harmful (inverted "
                "controls), that shift the odds of pulling the game's win condition on future "
                "spins. Crash into too many obstacles, though, and the run resets from the "
                "beginning.",
        "role_label": "What I did / experience gained",
        "role": [
            "I modeled every environment element except the characters, designed the game's "
            "systems and how the gacha's effects would interact with the procedurally generated "
            "level, and assembled the levels and tiles the programming team provided for "
            "procedural obstacle generation.",
            "Working under a sub-week deadline made this project a sharp lesson in reading the "
            "team's real strengths and limitations and scoping around them rather than around the "
            "ideal design. It also doubled as hands-on practice with Unity itself: my first real "
            "contact with Cinemachine, researching procedural generation approaches, and working "
            "with multiple simultaneous cameras in a single scene.",
        ],
        "process": None,
        # The playable build. Same pattern as the Automatic Battle page: nothing
        # downloads until Start is pressed, because this one is large.
        "extra_html": """
      <div class="doc-block doc-wide" data-reveal style="margin-top:var(--s8)">
        <div class="doc-head">
          <p class="label">Playable build</p>
          <div class="btn-row">
            <a class="btn btn-sm" href="https://github.com/HEGORULES/HugoLacaci_PORTFOLIO/releases/download/trial/OperationFishback.zip"><span>&#8595; Windows build (118 MB)</span></a>
          </div>
        </div>

        <!-- 16:9: the game's own menu is laid out for it, and at 16:10 the
             buttons fall off the left edge. -->
        <div class="stage" id="stage" style="aspect-ratio:16/9">
          <canvas id="unity-canvas" width="1280" height="720" tabindex="-1"></canvas>

          <div class="stage-loading" id="loading" hidden>
            <p class="label">Loading build</p>
            <div class="load-bar"><div class="load-fill" id="load-fill"></div></div>
            <p class="load-pct num" id="load-pct">0%</p>
          </div>

          <div class="stage-poster" id="poster">
            <canvas class="stage-bg" data-plate="infinite-runner-prototype" data-dot="12" aria-hidden="true"></canvas>
            <div class="poster-inner">
              <p class="label">Arcade runner &middot; Built in &lt; 1 week</p>
              <h2>Play in browser</h2>
              <button class="btn btn-solid btn-play" type="button" id="play-btn"><span>&#9654; Start</span></button>
              <p class="poster-note">
                Roughly 90 MB loads when you press start. Nothing downloads before that,
                and on a slow connection it will take a while. Built for desktop, and best
                played in fullscreen: the menu is laid out for a big screen.
              </p>
            </div>
          </div>

          <div class="stage-error" id="stage-error" hidden></div>
        </div>

        <div class="stage-bar">
          <p class="label">Unity WebGL &middot; runs in the browser</p>
          <div class="btn-row">
            <button class="btn btn-sm" type="button" id="fullscreen-btn" hidden><span>&#9974; Fullscreen</span></button>
          </div>
        </div>
      </div>

      <script>
      (function () {
        var BUILD = '../game/runner/Build/OperationFishback';
        /* ?fps=45 sets the cap, ?fps=0 turns it off, and any ?fps at all shows
           a live readout. The desktop build starts at quality Ultra and this one
           at High, so the two run at different frame rates on the same machine;
           until the project's frame-rate dependent rotations are fixed, the right
           cap is whatever number makes this feel like the desktop build. */
        var qs = new URLSearchParams(location.search).get('fps');
        var FPS_CAP = qs === null ? 60 : parseInt(qs, 10);
        if (isNaN(FPS_CAP)) FPS_CAP = 60;

        /* The build's movement is frame-rate dependent, and WebGL runs at the
           browser's refresh rate: on a 144 Hz screen the game plays more than
           twice as fast as it was tuned to. Until that is fixed in the project
           itself, gate the animation frames Unity is given so the demo runs at
           the speed it was designed at. Installed only when the build starts,
           so the rest of the page keeps its own timing. */
        function capFrames(fps) {
          var raf = window.requestAnimationFrame.bind(window);
          var caf = window.cancelAnimationFrame.bind(window);
          var gap = 1000 / fps - 0.5;          // half a ms of slack
          var lastFired = -Infinity;
          var pending = {};
          var nextId = 1;

          window.requestAnimationFrame = function (cb) {
            var id = nextId++;
            function tick(t) {
              // Callbacks queued for a frame that already passed the gate go
              // through together, so a second caller is never starved.
              if (t !== lastFired && t - lastFired < gap) {
                pending[id] = raf(tick);
                return;
              }
              lastFired = t;
              delete pending[id];
              cb(t);
            }
            pending[id] = raf(tick);
            return id;
          };
          window.cancelAnimationFrame = function (id) {
            if (pending[id] !== undefined) { caf(pending[id]); delete pending[id]; }
          };
        }
        var poster  = document.getElementById('poster');
        var loading = document.getElementById('loading');
        var fill    = document.getElementById('load-fill');
        var pct     = document.getElementById('load-pct');
        var errBox  = document.getElementById('stage-error');
        var playBtn = document.getElementById('play-btn');
        var fsBtn   = document.getElementById('fullscreen-btn');
        var canvas  = document.getElementById('unity-canvas');

        /* Diagnostic only: never rendered unless ?fps is in the address. */
        function showMeter() {
          var box = document.createElement('p');
          box.style.cssText = 'position:absolute;top:8px;left:8px;z-index:5;margin:0;' +
            'padding:4px 8px;border-radius:4px;background:rgba(0,0,0,.7);color:#fff;' +
            'font:700 12px/1.4 ui-monospace,Menlo,monospace;pointer-events:none';
          document.getElementById('stage').appendChild(box);
          var frames = 0, t0 = performance.now();
          (function tick() {
            frames++;
            var now = performance.now();
            if (now - t0 >= 500) {
              box.textContent = Math.round(frames / ((now - t0) / 1000)) + ' fps' +
                (FPS_CAP > 0 ? '  (cap ' + FPS_CAP + ')' : '  (sin cap)');
              frames = 0; t0 = now;
            }
            requestAnimationFrame(tick);
          })();
        }

        function fail(msg) {
          loading.hidden = true;
          errBox.hidden = false;
          errBox.textContent = msg;
        }

        playBtn.addEventListener('click', function () {
          poster.hidden = true;
          loading.hidden = false;
          if (FPS_CAP > 0) capFrames(FPS_CAP);
          if (qs !== null) showMeter();

          var script = document.createElement('script');
          script.src = BUILD + '.loader.js';

          script.onerror = function () {
            fail('Could not load the game engine. Check your connection and reload the page.');
          };

          script.onload = function () {
            createUnityInstance(canvas, {
              arguments: [],
              dataUrl:      BUILD + '.data.unityweb',
              frameworkUrl: BUILD + '.framework.js.unityweb',
              codeUrl:      BUILD + '.wasm.unityweb',
              streamingAssetsUrl: 'StreamingAssets',
              companyName: 'Hugo Lacaci Torres',
              productName: 'Operation Fishback',
              productVersion: '0.1',
              showBanner: function (msg, type) { if (type === 'error') fail(msg); }
            }, function (progress) {
              var p = Math.round(progress * 100);
              fill.style.width = p + '%';
              pct.textContent = p + '%';
            }).then(function (instance) {
              loading.hidden = true;
              fsBtn.hidden = false;
              fsBtn.addEventListener('click', function () { instance.SetFullscreen(1); });
              canvas.focus();
            }).catch(function (message) {
              fail(String(message));
            });
          };

          document.body.appendChild(script);
        });
      })();
      </script>
""",
        "docs": [],
        "posters": [(
            "The one-pager",
            "operation-fishback-one-pager.pdf",
            "operation-fishback-one-pager.jpg",
            1347, 1743,
            "One-pager for the infinite runner prototype: lore, unique selling points and genres.",
        )],
        "links": [],
    },
    {
        "slug": "tft-set",
        "title": "Custom TFT Set",
        "eyebrow": "Personal project · Solo",
        "disciplines": ["Systems", "Economy", "Balance"],
        "lead": "A complete custom Teamfight Tactics set designed from scratch: a self-linking traits spreadsheet and a damage calculator built to mirror TFT's real combat rules.",
        "what": "A self-initiated project: a complete custom Teamfight Tactics set built from zero. The first spreadsheet handles traits, where changing a single champion's trait automatically updates the set-wide results; it came out of deep research into every previous TFT set (trait types, champion counts per trait, cost distribution) to land on a combination that mirrors how an official set is actually structured. The second is a damage calculator built to follow TFT's real combat rules as closely as possible, letting me run 1v1 match-ups between champions with up to three items each to check for dominant strategies and flag who needs buffs or nerfs. The full design document is still in progress; for now, the spreadsheets speak for themselves.",
        "role_label": "What I did / experience gained",
        "role": ["I designed and built both spreadsheets solo, including their internal linking, so a change in one place (a champion's trait, a stat, an item) propagates correctly across the whole set instead of requiring manual updates everywhere.", "This project taught me how to actually use Excel as a design tool: building automated tables and linking multiple sheets together to keep a large, interconnected dataset clean and error-resistant, rather than a flat spreadsheet that breaks the moment something changes."],
        "process": None,
        "extra_html": """
      <div id="tft" style="margin-top:var(--s8)">

        <div class="section-head">
          <div class="head-group">
            <p class="label">Workbook one</p>
            <h2 style="font-size:clamp(28px,4vw,48px)">Traits</h2>
          </div>
        </div>
        <p class="prose" style="margin-bottom:var(--s5)">Change a single champion's trait and the
        set-wide results update on their own. The structure came out of research into every
        previous TFT set (trait types, champion counts per trait, cost distribution) to land on a
        combination that mirrors how an official set is actually built. It opens fitted so the
        whole sheet is on screen at once; use the zoom to walk back into it. Click any cell to
        read what's behind it; edit one and the sheet recalculates. Nothing you type touches the
        file.</p>
        <div class="xl-book" data-book="0" data-fit="on"></div>

        <div class="section-head" style="margin-top:var(--s9)">
          <div class="head-group">
            <p class="label">Workbook two</p>
            <h2 style="font-size:clamp(28px,4vw,48px)">Damage calculator</h2>
          </div>
        </div>
        <p class="prose" style="margin-bottom:var(--s5)">Built to follow TFT's real combat rules as
        closely as possible, so I could run 1v1 match-ups between champions with up to three items
        each, check for dominant strategies and flag who needed a buff or a nerf. The cells in the
        equipment selector are dropdowns, the same ones the workbook has in Excel: pick the two
        champions and up to three items each, and every stat, resistance and damage figure below
        recalculates. Each pick takes on its damage-type colour from the Champions and Items
        sheets, and further down the simulation runs turn by turn until someone's health goes
        red.</p>
        <div class="xl-book" data-book="1"></div>

      </div>
""",
        "docs": [],
        "scripts": ["../xlsheet.js", "../tft.js"],
        "links": [("16 Traits (.xlsx)", "../files/tft-set-16-traits.xlsx", "34 KB"),
                  ("Damage calculator (.xlsx)", "../files/tft-damage-calculator.xlsx", "38 KB")],
    },
    {
        "slug": "enemy-design",
        "title": "Enemy Design",
        "eyebrow": "Final year project · Team",
        "disciplines": ["Combat", "Production", "Docs"],
        "lead": "An enemy design document for Bobrfield, a top-down shooter where you switch between three beavers who grow stressed if left unattended.",
        "what": "An enemy design document built for Bobrfield, a top-down shooter prototype where the player controls three beavers who grow stressed if left unattended, switching between them while clearing enemies, completing objectives and unlocking rewards across the map. Enemies were designed specifically to exploit that core mechanic, not just complementing each other within a species' different roles, but across species too, while staying grounded in the game's actual systems: weapons, armour types, and the different zones the levels would offer, including how enemies interact with the environment as well as the player.",
        "role_label": "What I did / experience gained",
        "role": ["I designed the enemy roster working directly alongside the art and narrative teams to build out every faction from day one, rather than handing off a finished spec afterward. Every enemy had to justify itself beyond “it's a cool design”: I had to trace how it would affect moment-to-moment gameplay, how it would interact with the other enemies around it, and whether it reinforced the beaver-switching mechanic the whole game is built on.", "This was my first real experience designing inside a multidisciplinary team from the ground up, and it taught me what holistic design actually requires in practice: keeping every discipline's constraints in view at once so the final experience feels intentional rather than assembled from disconnected pieces. It sharpened my instinct to ask how a design choice ripples outward: into systems, into other enemies, into the player's moment-to-moment experience, instead of treating any one enemy as an isolated idea."],
        "process": None,
        "extra_html": """
      <div class="doc-block doc-wide" data-reveal style="margin-top:var(--s8)">
        <div class="doc-head">
          <p class="label">The full documentation</p>
          <a class="btn btn-sm" href="https://clover-echo-9e9.notion.site/Enemy-Design-c13e31c9d5648328867f813b2c348285" target="_blank" rel="noopener"><span>Open in Notion ↗</span></a>
        </div>
        <div class="notion-embed">
          <iframe src="https://clover-echo-9e9.notion.site/ebd/c13e31c9d5648328867f813b2c348285"
                  title="Enemy Design, full documentation" loading="lazy"
                  allowfullscreen></iframe>
        </div>
        <p class="figure-caption">Lives in Notion, so it needs that page to stay published. The button above always works even if the frame doesn't load.</p>
      </div>
""",
        "docs": [],
        "links": [],
    },
    {
        "slug": "uniformity-rpg",
        "title": "RPG Design",
        "eyebrow": "Class project · Solo",
        "disciplines": ["Narrative", "World", "Docs"],
        "lead": "An RPG design document for a third-person, Persona-style game set in Patchwork City: four rival school districts fighting for territory, with a faculty plot underneath.",
        "what": "Uniformity is a design document for a third-person, Persona-style RPG set in Patchwork City: a city split into four rival school districts, plus a neutral commercial hub, fighting for territorial control. That conflict hides a deeper threat: a faculty organisation plotting to turn every student into an obedient “model student”. The design borrows Persona's social-sim backbone (a daily actions system, affection and companion events, a three-act linear structure) and pairs it with Beat 'em Up combat inspired by Yakuza, Granblue Fantasy: Relink and SIFU, where street fights break out while exploring and boss fights are one-on-one duels against gang leaders.",
        "role_label": "What I did / experience gained",
        "role": ["I designed the full document: the three-act narrative structure, the five districts and their schools, the actions-per-day and mission systems, the stats, equipment and skill-tree progression, the combat and companion systems, and a roster of characters distributed across all four districts.", "The core challenge was keeping four districts, each with its own school, aesthetic and companions, genuinely equivalent, so no path through the game feels like the correct one. That meant setting hard rules before writing any content: the same number of companions per district, the same combat-role archetypes, and equal opportunities to raise every stat, even when the specific activity differs.", "This project sharpened my ability to design systems that reinforce narrative structure, using mechanical constraints (daily actions, act chokepoints) to control pacing the way a screenwriter controls a script. It also taught me how to take clear references and recombine them into a cohesive original system instead of a patchwork of borrowed mechanics."],
        "process": None,
        "extra_html": "",
        "docs": [("Full GDD · 43 pages", "uniformity-rpg-gdd.pdf")],
        "links": [],
    },
    {
        "slug": "genre-hybridization",
        "title": "Genre Hybridation",
        "eyebrow": "Class project · Team",
        "disciplines": ["Systems", "Narrative"],
        "lead": "A genre hybridization exercise fusing narrative adventure and roguelike: an unnamed child with social anxiety navigating a school his own imagination distorts into something hostile.",
        "what": "Through Their Eyes combines two genres with very different design philosophies into a single cohesive game. It follows an unnamed child with social anxiety navigating a school that his own imagination turns into a hostile, nightmarish space. Procedurally generated levels and permadeath (the roguelike backbone) are used to reinforce a branching, choice-driven narrative, so every run produces a distinct path through the story rather than resetting it. Co-designed with Aaron Fuentes.",
        "role_label": "What I did / experience gained",
        "role": ["I designed the game's core concept and the development framework used to structure the whole project. On the systems side, I designed how the different systems talk to each other: movement between rooms, and the central design challenge: how to fold narrative into a roguelike structure so each run feels like its own story rather than a repeated loop. I also designed the characters, rooms, levels and enemies, and shaped the intended player experience end to end.", "This project pushed me to think about hybridization not as “genre A's mechanics next to genre B's mechanics”, but as finding the single system (here, turn-based combat and branching room paths) that can hold two very different design languages together without either feeling bolted on. It sharpened my ability to design at the systems level: how mechanics reinforce narrative intent, and how narrative intent should in turn shape mechanical decisions, rather than treating the two as separate layers."],
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
        "lead": "A design analysis of why Ravenswatch's multiplayer ends up feeling like several simultaneous solo runs, and what a roguelite built for co-op from the ground up does differently.",
        "what": "A design analysis essay examining why Ravenswatch's multiplayer mode, despite being marketed as a core feature, ends up feeling like several simultaneous solo runs rather than genuine cooperative play. I identify three root design failures (enemy scaling that assumes players stay grouped, a reward-distribution system that penalises splitting up to explore, and the lack of real communication tools) and use Elden Ring Nightreign, a structurally similar roguelite built for multiplayer from the ground up, as a comparison point to show how each problem can be solved.",
        "role_label": "What I did / experience gained",
        "role": ["I conducted the analysis and wrote the essay solo, breaking down Ravenswatch's core loop and multiplayer systems to trace each source of player frustration back to a specific design decision, rather than treating them as separate, unrelated complaints. For each problem I cross-referenced Nightreign's equivalent system (boss-only scaling, character synergies, shared experience and fast travel, a forgiving revive system, multi-marker communication) to show concretely what a multiplayer-first version of the same core loop looks like.", "This project sharpened my ability to diagnose systemic design problems rather than surface-level ones: recognising that the shared-lives system, the map size and the enemy scaling weren't separate issues but symptoms of the same root cause: a single-player framework extended to multiplayer without rethinking its underlying assumptions.", "It also reinforced how much multiplayer design has to account for social dynamics, not just mechanical balance. A system can be perfectly fair on paper (equal scaling per player) while still generating blame, guilt and frustration between real players."],
        "process": None,
        "extra_html": "",
        "docs": [("Full analysis · 10 pages", "ravenswatch-analysis.pdf")],
        "links": [],
    },
    
]

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · Hugo Lacaci Torres</title>
<meta name="description" content="{meta}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} · Hugo Lacaci Torres">
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
          <h2 style="font-size:clamp(30px,5vw,64px)">Before and after</h2>
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
          <h2 class="display" data-reveal style="--d:80ms"><span class="misprint" data-text="Contact me">Contact me</span></h2>
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
        <span>Hugo Lacaci Torres · Game Designer</span>
        <span>Madrid · 2026</span>
      </div>
    </div>
  </footer>

</main>

<script src="../site.js"></script>{scripts}
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
        add(f'        <h2 class="display" style="font-size:clamp(26px,3.6vw,40px);margin:0 0 var(--s4)">{esc(p.get("role_label", "What I did"))}</h2>')
        for para in p["role"] if isinstance(p["role"], list) else [p["role"]]:
            add(f'        <p>{esc(para)}</p>')
        add('      </div>')

    if p.get("process"):
        add('      <div class="prose" data-reveal style="--d:120ms;margin-top:var(--s7)">')
        add(f'        <h2 class="display" style="font-size:clamp(26px,3.6vw,40px);margin:0 0 var(--s4)">{esc(p.get("process_label", "Process"))}</h2>')
        for para in p["process"] if isinstance(p["process"], list) else [p["process"]]:
            add(f'        <p>{esc(para)}</p>')
        add('      </div>')

    if p.get("extra_html"):
        add(p["extra_html"])

    # A deck is meant to be stepped through, not scrolled. Each slide is a
    # pre-rasterised image; only the first loads eagerly, the rest arrive as
    # the reader advances. Slide images live in docs/files/<dir>/NN.webp.
    for deck in p.get("decks", []):
        add('      <div class="doc-block doc-wide" data-reveal style="margin-top:var(--s8)">')
        add('        <div class="doc-head">')
        add(f'          <p class="label">{esc(deck["label"])}</p>')
        add('          <div class="btn-row">')
        add(f'            <a class="btn btn-sm" href="../files/{deck["file"]}" target="_blank" rel="noopener"><span>Open full PDF ↗</span></a>')
        add(f'            <a class="btn btn-sm" href="../files/{deck["file"]}" download><span>&#8595; Download</span></a>')
        add('          </div>')
        add('        </div>')
        if deck.get("note"):
            add(f'        <p class="figure-caption">{esc(deck["note"])}</p>')
        add(f'        <div class="deck" data-deck tabindex="0" role="group" aria-roledescription="carousel" aria-label="{esc(deck["label"])}">')
        add('          <div class="deck-stage">')
        for i in range(1, deck["count"] + 1):
            on = " is-on" if i == 1 else ""
            lazy = "" if i == 1 else ' loading="lazy"'
            add(f'            <figure class="deck-slide{on}" data-i="{i}" aria-hidden="{"false" if i == 1 else "true"}">')
            add('              <picture>')
            add(f'                <source srcset="../files/{deck["dir"]}/{i:02d}.webp" type="image/webp">')
            add(f'                <img src="../files/{deck["dir"]}/{i:02d}.jpg" alt="{esc(deck["label"])}, slide {i} of {deck["count"]}" width="{deck["w"]}" height="{deck["h"]}"{lazy}>')
            add('              </picture>')
            add('            </figure>')
        add('          </div>')
        add('          <div class="deck-bar">')
        add('            <button class="btn btn-sm deck-nav" type="button" data-deck-prev><span>← Prev</span></button>')
        add(f'            <p class="deck-count num"><span data-deck-now>1</span> / {deck["count"]}</p>')
        add('            <button class="btn btn-sm deck-nav" type="button" data-deck-next><span>Next →</span></button>')
        add('          </div>')
        add('          <div class="deck-dots" role="tablist">')
        for i in range(1, deck["count"] + 1):
            on = " is-on" if i == 1 else ""
            add(f'            <button class="deck-dot{on}" type="button" data-deck-go="{i}" role="tab" aria-label="Slide {i}"></button>')
        add('          </div>')
        add('        </div>')
        add('      </div>')

    # A single-page document is worth showing whole rather than trapped in a
    # scrolling PDF frame, so it renders as a pre-rasterised sheet capped to
    # the viewport height. The real PDF is one click away either way.
    for label, fname, img, w, h, alt in p.get("posters", []):
        stem = img.rsplit(".", 1)[0]
        add('      <div class="doc-block" data-reveal style="margin-top:var(--s8)">')
        add('        <div class="doc-head">')
        add(f'          <p class="label">{esc(label)}</p>')
        add('          <div class="btn-row">')
        add(f'            <a class="btn btn-sm" href="../files/{fname}" target="_blank" rel="noopener"><span>Open full PDF ↗</span></a>')
        add(f'            <a class="btn btn-sm" href="../files/{fname}" download><span>&#8595; Download</span></a>')
        add('          </div>')
        add('        </div>')
        add(f'        <a class="poster-sheet" href="../files/{fname}" target="_blank" rel="noopener">')
        add('          <picture>')
        add(f'            <source srcset="../files/{stem}.webp" type="image/webp">')
        add(f'            <img src="../files/{img}" alt="{esc(alt)}" width="{w}" height="{h}" loading="lazy">')
        add('          </picture>')
        add('        </a>')
        add('      </div>')

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

    if not p.get("docs") and not p.get("posters") and not p.get("decks") and not links:
        add('      <div class="btn-row" data-reveal style="margin-top:var(--s7)">')
        add('        <span class="btn btn-sm btn-idle"><span>Documentation pending upload</span></span>')
        add('      </div>')

    return "\n".join(out)


# The playable build has its own page rather than a PROJECTS entry, but it
# belongs in the ring: stepping neighbour to neighbour has to reach all eight
# pieces of work, not seven.
PLAY_CARD = {
    "slug": "automatic-combat-autobattler",
    "page": "play.html",
    "title": "Prototype: Automatic Battle",
    "lead": "A two-player automatic combat prototype built in under a week. Four units, "
            "three lanes, and balance that had to hold.",
    "disciplines": ["Playable", "Balance"],
}


def ring():
    """Every piece of work in the order the home grid shows it."""
    items = []
    for p in PROJECTS:
        items.append(dict(p, page=f"{p['slug']}.html"))
        if p["slug"] == "beyond-the-health-bar":
            items.append(PLAY_CARD)
    return items


def build_next(current, from_work_dir=True):
    """The piece before this one and the piece after it.

    Showing the same two projects on every page meant a reader who arrived
    on one page and followed the links could circle a corner of the site
    forever. Neighbours in the grid order wrap around, so following either
    arrow walks through all eight and misses none.
    """
    items = ring()
    here = next((i for i, q in enumerate(items) if q["page"] == current), 0)
    picks = [(items[(here - 1) % len(items)], "← Previous"),
             (items[(here + 1) % len(items)], "Next →")]
    cards = []
    for i, (q, go) in enumerate(picks):
        discs = "".join(f'<span class="disc">{esc(d)}</span>' for d in q["disciplines"][:2])
        href = q["page"] if from_work_dir else q["page"]
        if from_work_dir and q["page"] == "play.html":
            href = "../play.html"
        elif not from_work_dir and q["page"] != "play.html":
            href = f"work/{q['page']}"
        cards.append(f"""        <a class="panel work-card" href="{href}" data-reveal style="--d:{i*80}ms">
          <span class="work-plate"><canvas data-plate="{q['slug']}" aria-hidden="true"></canvas></span>
          <span class="work-body">
            <span class="disc-row">{discs}</span>
            <h3>{esc(q['title'])}</h3>
            <p>{esc(q['lead'][:130])}…</p>
            <span class="work-go">{go}</span>
          </span>
        </a>""")
    return "\n".join(cards)


def update_play_page():
    """Keep the playable build's own neighbours in step with the ring."""
    path = ROOT / "docs" / "play.html"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    start, end = "<!-- NEXTUP:START -->", "<!-- NEXTUP:END -->"
    if start not in text or end not in text:
        print("  play.html has no neighbour block, skipped")
        return
    head, rest = text.split(start, 1)
    _, tail = rest.split(end, 1)
    block = build_next("play.html", from_work_dir=False)
    path.write_text(f"{head}{start}\n{block}\n        {end}{tail}", encoding="utf-8")
    print("  updated play.html neighbours")


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
            next_cards=build_next(f"{p['slug']}.html"),
            scripts="".join(
                f'\n<script src="{src}"></script>' for src in p.get("scripts", [])
            ),
        )
        (OUT / f"{p['slug']}.html").write_text(page, encoding="utf-8")
        print(f"  wrote work/{p['slug']}.html")
    update_play_page()
    print(f"{len(PROJECTS)} pages generated in {OUT}")


if __name__ == "__main__":
    main()
