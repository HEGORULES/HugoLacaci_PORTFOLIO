/* =========================================================
   ENCOUNTER READOUT — interaction layer
   One metaphor drives everything: scrolling scrubs the
   timeline of an encounter. Curves plot, phases trip,
   values settle.
   ========================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SIGNAL = '#F2912E';
  var STEEL  = '#6C7FA3';
  var RULE   = '#232838';

  /* ---------- curve maths ---------- */

  // Catmull-Rom through the control points, sampled to a polyline.
  function sample(pts, steps) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      for (var s = 0; s < steps; s++) {
        var t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                 (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                 (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                 (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                 (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  // The encounter tension curve: build, three escalating phases,
  // a final spike, then release. This is the thesis, plotted.
  var TENSION = [
    [0.00, 0.05], [0.07, 0.17], [0.13, 0.11], [0.21, 0.33], [0.28, 0.22],
    [0.35, 0.29], [0.44, 0.51], [0.52, 0.38], [0.60, 0.45], [0.69, 0.67],
    [0.75, 0.53], [0.81, 0.61], [0.88, 0.94], [0.93, 0.70], [1.00, 0.26]
  ];

  var PHASES = [
    { x: 0.21, name: 'PHASE 01' },
    { x: 0.44, name: 'PHASE 02' },
    { x: 0.69, name: 'PHASE 03' },
    { x: 0.88, name: 'PEAK' }
  ];

  // A deterministic pseudo-random curve, seeded by a string, so each
  // project carries its own signature rather than a shared placeholder.
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  function signature(seedStr, count) {
    var rnd = seeded(seedStr);
    var pts = [];
    for (var i = 0; i <= count; i++) {
      var x = i / count;
      // Rising envelope so every signature reads as an escalation.
      var env = 0.22 + 0.55 * Math.pow(x, 1.25);
      pts.push([x, Math.max(0.04, Math.min(0.96, env * (0.45 + rnd() * 1.05)))]);
    }
    return pts;
  }

  /* ---------- canvas helpers ---------- */

  function fitCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    cv.width  = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  // Stroke a normalized polyline into a box, revealed up to `progress`.
  function strokeCurve(ctx, poly, box, progress, opts) {
    var n = Math.max(2, Math.floor(poly.length * progress));
    if (n < 2) return null;
    var last = null;

    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var px = box.x + poly[i][0] * box.w;
      var py = box.y + box.h - poly[i][1] * box.h;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      last = [px, py];
    }

    if (opts.fill) {
      ctx.save();
      ctx.lineTo(last[0], box.y + box.h);
      ctx.lineTo(box.x, box.y + box.h);
      ctx.closePath();
      var g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
      g.addColorStop(0, 'rgba(242,145,46,0.20)');
      g.addColorStop(1, 'rgba(242,145,46,0)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // Re-trace, since the fill closed the path.
      ctx.beginPath();
      for (var j = 0; j < n; j++) {
        var qx = box.x + poly[j][0] * box.w;
        var qy = box.y + box.h - poly[j][1] * box.h;
        if (j === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
    }

    ctx.strokeStyle = opts.color || SIGNAL;
    ctx.lineWidth = opts.width || 1.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (opts.dash) ctx.setLineDash(opts.dash); else ctx.setLineDash([]);
    if (opts.glow) {
      ctx.shadowColor = 'rgba(242,145,46,0.5)';
      ctx.shadowBlur = 14;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    return last;
  }

  /* ---------- 1. hero scope ---------- */

  function heroScope(cv) {
    var poly = sample(TENSION, 26);
    var progress = REDUCED ? 1 : 0;
    var readhead = 0;
    var started = null;

    function draw() {
      var f = fitCanvas(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);

      var padX = Math.min(48, w * 0.05);
      var box = { x: padX, y: h * 0.16, w: w - padX * 2, h: h * 0.66 };

      // Baseline
      ctx.strokeStyle = RULE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.h + 0.5);
      ctx.lineTo(box.x + box.w, box.y + box.h + 0.5);
      ctx.stroke();

      // Phase gridlines + labels, tripping as the trace passes them
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      for (var p = 0; p < PHASES.length; p++) {
        var ph = PHASES[p];
        var lit = progress > ph.x;
        var px = box.x + ph.x * box.w;

        ctx.strokeStyle = lit ? 'rgba(242,145,46,0.28)' : 'rgba(35,40,56,0.9)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, box.y - 8);
        ctx.lineTo(px, box.y + box.h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = lit ? SIGNAL : '#3A4155';
        ctx.fillText(ph.name, px + 6, box.y - 12);
      }

      // The trace
      var tip = strokeCurve(ctx, poly, box, progress, {
        color: SIGNAL, width: 2, fill: true, glow: true
      });

      // Leading dot while drawing
      if (tip && progress < 1) {
        ctx.fillStyle = '#FFB05C';
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scroll readhead — the scrubber position on the timeline
      if (progress >= 1 && readhead > 0.002) {
        var rx = box.x + Math.min(readhead, 1) * box.w;
        var idx = Math.min(poly.length - 1, Math.floor(readhead * (poly.length - 1)));
        var ry = box.y + box.h - poly[idx][1] * box.h;

        ctx.strokeStyle = 'rgba(242,145,46,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, box.y - 8);
        ctx.lineTo(rx, box.y + box.h);
        ctx.stroke();

        ctx.fillStyle = '#FFB05C';
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(242,145,46,0.25)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Axis captions
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.fillStyle = STEEL;
      ctx.textAlign = 'left';
      ctx.fillText('TENSION', box.x, box.y - 12);
      ctx.textAlign = 'right';
      ctx.fillText('ENCOUNTER TIME →', box.x + box.w, box.y + box.h + 16);
    }

    function step(ts) {
      if (started === null) started = ts;
      progress = Math.min(1, (ts - started) / 1700);
      // ease-out
      var e = 1 - Math.pow(1 - progress, 3);
      var saved = progress;
      progress = e;
      draw();
      progress = saved >= 1 ? 1 : e;
      if (saved < 1) requestAnimationFrame(step);
    }

    cv.__setReadhead = function (v) {
      readhead = v;
      if (progress >= 1) draw();
    };
    cv.__redraw = draw;

    if (REDUCED) draw();
    else requestAnimationFrame(step);

    return cv;
  }

  /* ---------- 2. small signature canvases ---------- */

  function signatureCanvas(cv, seedStr, opts) {
    opts = opts || {};
    var poly = sample(signature(seedStr, opts.nodes || 9), 18);
    var shown = REDUCED ? 1 : 0;
    var raf = null, started = null;

    function draw() {
      var f = fitCanvas(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      var pad = opts.pad === undefined ? 6 : opts.pad;
      var box = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

      if (opts.grid) {
        ctx.strokeStyle = 'rgba(35,40,56,0.85)';
        ctx.lineWidth = 1;
        for (var i = 1; i < 6; i++) {
          var gx = box.x + (box.w / 6) * i;
          ctx.beginPath();
          ctx.moveTo(gx, box.y);
          ctx.lineTo(gx, box.y + box.h);
          ctx.stroke();
        }
        for (var j = 1; j < 3; j++) {
          var gy = box.y + (box.h / 3) * j;
          ctx.beginPath();
          ctx.moveTo(box.x, gy);
          ctx.lineTo(box.x + box.w, gy);
          ctx.stroke();
        }
      }

      strokeCurve(ctx, poly, box, shown, {
        color: opts.color || SIGNAL,
        width: opts.width || 1.5,
        fill: !!opts.fill,
        glow: !!opts.glow
      });
    }

    function step(ts) {
      if (started === null) started = ts;
      var t = Math.min(1, (ts - started) / 1100);
      shown = 1 - Math.pow(1 - t, 3);
      draw();
      if (t < 1) raf = requestAnimationFrame(step);
    }

    cv.__redraw = draw;
    cv.__play = function () {
      if (REDUCED || started !== null) { draw(); return; }
      raf = requestAnimationFrame(step);
    };
    draw();
    return cv;
  }

  /* ---------- 3. convergence figure (thesis principle 01) ---------- */
  /* Four curves the thesis argues are the same shape seen from
     different angles: they start apart and settle into alignment. */

  function convergence(cv) {
    var LAYERS = [
      { key: 'NARRATIVE',  color: 'rgba(108,127,163,0.75)', off: 0.16, sq: 1.35 },
      { key: 'DIFFICULTY', color: 'rgba(108,127,163,0.45)', off: -0.13, sq: 0.72 },
      { key: 'LEARNING',   color: 'rgba(155,150,132,0.55)', off: 0.08, sq: 1.14 },
      { key: 'TENSION',    color: SIGNAL,                   off: 0, sq: 1 }
    ];
    var base = sample(TENSION, 22);
    var t = REDUCED ? 1 : 0;
    var started = null, playing = false;

    function draw() {
      var f = fitCanvas(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      var box = { x: 44, y: 18, w: w - 62, h: h - 46 };

      ctx.strokeStyle = 'rgba(35,40,56,0.8)';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) {
        var gy = box.y + (box.h / 4) * g;
        ctx.beginPath();
        ctx.moveTo(box.x, gy + 0.5);
        ctx.lineTo(box.x + box.w, gy + 0.5);
        ctx.stroke();
      }

      // Ease toward alignment, but stop short of a perfect overlap — the
      // four traces have to stay individually readable at rest.
      var conv = (1 - Math.pow(1 - t, 2)) * 0.86;

      LAYERS.forEach(function (L, i) {
        var poly = base.map(function (p) {
          var spread = (1 - conv);
          var y = Math.pow(p[1], 1 + (L.sq - 1) * spread) + L.off * spread;
          return [p[0], Math.max(0.02, Math.min(0.98, y))];
        });
        strokeCurve(ctx, poly, box, 1, {
          color: L.color,
          width: i === LAYERS.length - 1 ? 2 : 1.2,
          glow: i === LAYERS.length - 1 && conv > 0.9
        });
      });

      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.fillStyle = STEEL;
      ctx.textAlign = 'right';
      ctx.fillText('HIGH', box.x - 8, box.y + 4);
      ctx.fillText('LOW', box.x - 8, box.y + box.h + 4);
      ctx.textAlign = 'left';
      ctx.fillText('ENCOUNTER TIME →', box.x, box.y + box.h + 22);
    }

    function step(ts) {
      if (started === null) started = ts;
      t = Math.min(1, (ts - started) / 2000);
      draw();
      if (t < 1) requestAnimationFrame(step);
    }

    cv.__redraw = draw;
    cv.__play = function () {
      if (playing || REDUCED) { draw(); return; }
      playing = true;
      requestAnimationFrame(step);
    };
    draw();
    return cv;
  }

  /* ---------- 4. reveal on scroll ---------- */

  function setupReveal() {
    var nodes = document.querySelectorAll('[data-reveal], [data-draw]');
    if (!nodes.length) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------- 5. counters ---------- */

  function setupCounters() {
    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      if (REDUCED) { el.textContent = target.toFixed(dec); return; }
      var t0 = null;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1200);
        var e = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------- 6. play canvases when they enter view ---------- */

  function playOnEnter(list) {
    if (!list.length) return;
    if (!('IntersectionObserver' in window)) {
      list.forEach(function (c) { if (c.__play) c.__play(); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.__play) e.target.__play();
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    list.forEach(function (c) { io.observe(c); });
  }

  /* ---------- 7. timeline rail ---------- */

  function buildRail() {
    var rail = document.querySelector('.rail');
    if (!rail) return null;
    var chapters = document.querySelectorAll('[data-chapter]');
    if (chapters.length < 2) { rail.remove(); return null; }

    var line = document.createElement('span');
    line.className = 'rail-line';
    var fill = document.createElement('span');
    fill.className = 'rail-line-fill';
    line.appendChild(fill);

    var ul = document.createElement('ul');
    ul.className = 'rail-list';

    var items = [];
    Array.prototype.forEach.call(chapters, function (sec, i) {
      if (!sec.id) sec.id = 'chapter-' + (i + 1);
      var li = document.createElement('li');
      li.className = 'rail-item';
      li.innerHTML =
        '<span class="rail-tick"></span>' +
        '<a class="rail-name" href="#' + sec.id + '"></a>';
      li.querySelector('.rail-name').textContent = sec.getAttribute('data-chapter');
      ul.appendChild(li);
      items.push({ li: li, sec: sec });
    });

    rail.appendChild(line);
    rail.appendChild(ul);
    return { fill: fill, items: items };
  }

  /* ---------- 8. scroll driver ---------- */

  function setupScroll(hero, rail) {
    var grid = document.querySelector('.bg-grid');
    var navProgress = document.querySelector('.nav-progress');
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.scrollTop;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

      if (navProgress) navProgress.style.setProperty('--progress', p.toFixed(4));
      if (rail) rail.fill.style.height = (p * 100).toFixed(2) + '%';

      if (grid && !REDUCED) {
        grid.style.setProperty('--grid-y', (y * 0.12).toFixed(1) + 'px');
      }

      // The hero readhead tracks how far into the page you are.
      if (hero && hero.__setReadhead) hero.__setReadhead(p);

      if (rail) {
        var mid = y + window.innerHeight * 0.4;
        var activeIdx = -1;
        rail.items.forEach(function (it, i) {
          if (it.sec.offsetTop <= mid) activeIdx = i;
        });
        rail.items.forEach(function (it, i) {
          it.li.classList.toggle('is-active', i === activeIdx);
          it.li.classList.toggle('is-past', i < activeIdx);
        });
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- 9. modals ---------- */

  function setupModals() {
    var lastFocus = null;

    function open(id) {
      var m = document.getElementById(id);
      if (!m) return;
      lastFocus = document.activeElement;
      m.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var close = m.querySelector('.modal-close');
      if (close) close.focus();
      // Draw any canvases that were hidden while the modal was closed.
      Array.prototype.forEach.call(m.querySelectorAll('canvas'), function (c) {
        if (c.__redraw) c.__redraw();
      });
    }

    function close(m) {
      m.classList.remove('is-open');
      if (!document.querySelector('.modal.is-open')) document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-modal]');
      if (trigger) { open(trigger.getAttribute('data-modal')); return; }

      var closer = e.target.closest('[data-modal-close]');
      if (closer) {
        var box = closer.closest('.modal');
        if (box) close(box);
        return;
      }

      if (e.target.classList && e.target.classList.contains('modal')) close(e.target);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open_ = document.querySelector('.modal.is-open');
      if (open_) close(open_);
    });
  }

  /* ---------- boot ---------- */

  function init() {
    var canvases = [];

    var heroCv = document.querySelector('.hero-scope');
    var hero = heroCv ? heroScope(heroCv) : null;

    var headCv = document.querySelector('.page-head-scope');
    if (headCv) {
      canvases.push(signatureCanvas(headCv, headCv.getAttribute('data-seed') || 'header', {
        nodes: 11, pad: 0, width: 1.4, color: 'rgba(242,145,46,0.55)', grid: false
      }));
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-signature]'), function (cv) {
      canvases.push(signatureCanvas(cv, cv.getAttribute('data-signature'), {
        nodes: parseInt(cv.getAttribute('data-nodes') || '8', 10),
        grid: cv.hasAttribute('data-grid'),
        fill: cv.hasAttribute('data-fill'),
        width: 1.5
      }));
    });

    var conv = document.querySelector('.figure-canvas');
    if (conv) canvases.push(convergence(conv));

    playOnEnter(canvases);
    setupReveal();
    setupCounters();
    setupModals();

    var rail = buildRail();
    setupScroll(hero, rail);

    // Keep every canvas crisp across resizes / orientation changes.
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (hero && hero.__redraw) hero.__redraw();
        canvases.forEach(function (c) { if (c.__redraw) c.__redraw(); });
      }, 160);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
