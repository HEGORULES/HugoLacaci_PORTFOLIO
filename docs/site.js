/* =========================================================
   KEY ART — interaction layer
   Every project gets a generated two-ink plate: overlapping
   shapes and halftone, seeded by its name so no two match.
   ========================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLARE = [255, 61, 87];
  var VOLT  = [124, 77, 255];

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------- deterministic randomness ---------- */
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 100000) / 100000;
    };
  }

  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  /* ---------- halftone ---------- */
  function halftone(ctx, x, y, w, h, colour, rnd, density) {
    var step = density || 9;
    var cx = x + w * (0.3 + rnd() * 0.4);
    var cy = y + h * (0.3 + rnd() * 0.4);
    var max = Math.hypot(w, h) * 0.62;
    ctx.fillStyle = colour;
    for (var gy = y; gy < y + h; gy += step) {
      for (var gx = x; gx < x + w; gx += step) {
        var d = Math.hypot(gx - cx, gy - cy) / max;      // 0 at core, 1 at edge
        var r = Math.max(0, (1 - d)) * (step * 0.46);
        if (r > 0.35) {
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /* ---------- one generated plate ---------- */
  function plate(cv, seedStr, opts) {
    opts = opts || {};
    var rnd = seeded(seedStr);
    // Freeze the shape list once so redraws stay identical.
    var shapes = [];
    var count = 3 + Math.floor(rnd() * 3);
    for (var i = 0; i < count; i++) {
      shapes.push({
        kind: ['disc', 'arc', 'wedge', 'bar'][Math.floor(rnd() * 4)],
        x: 0.1 + rnd() * 0.8,
        y: 0.1 + rnd() * 0.8,
        r: 0.18 + rnd() * 0.42,
        rot: rnd() * Math.PI * 2,
        ink: rnd() > 0.5 ? FLARE : VOLT,
        a: 0.55 + rnd() * 0.35
      });
    }
    var htInk = rnd() > 0.5 ? FLARE : VOLT;
    var htSeed = seeded(seedStr + '-ht');

    var t = REDUCED ? 1 : 0;
    var started = null, playing = false;

    function draw() {
      var f = fit(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      var S = Math.min(w, h);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#120B1A';
      ctx.fillRect(0, 0, w, h);

      // Ink overlaps brighten, the way two passes of transparent ink do.
      ctx.globalCompositeOperation = 'screen';

      shapes.forEach(function (s, i) {
        var appear = Math.max(0, Math.min(1, (t - i * 0.12) / 0.55));
        if (appear <= 0) return;
        var e = 1 - Math.pow(1 - appear, 3);
        var x = s.x * w, y = s.y * h, r = s.r * S * e;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(s.rot);
        ctx.fillStyle = rgba(s.ink, s.a * e);

        if (s.kind === 'disc') {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === 'arc') {
          ctx.lineWidth = r * 0.34;
          ctx.strokeStyle = rgba(s.ink, s.a * e);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 1.35);
          ctx.stroke();
        } else if (s.kind === 'wedge') {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, 0, Math.PI * 0.62);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-r, -r * 0.16, r * 2, r * 0.32);
        }
        ctx.restore();
      });

      if (t > 0.45) {
        ctx.globalAlpha = Math.min(1, (t - 0.45) / 0.5) * 0.5;
        halftone(ctx, 0, 0, w, h, rgba(htInk, 0.5), htSeed, opts.dot || 9);
        ctx.globalAlpha = 1;
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    function step(ts) {
      if (started === null) started = ts;
      t = Math.min(1, (ts - started) / 1300);
      draw();
      if (t < 1) requestAnimationFrame(step);
    }

    cv.__redraw = draw;
    cv.__play = function () {
      if (REDUCED || playing) { draw(); return; }
      playing = true;
      requestAnimationFrame(step);
    };
    draw();
    return cv;
  }

  /* ---------- convergence figure (thesis) ---------- */
  function convergence(cv) {
    var BASE = [
      [0.00, 0.06], [0.10, 0.20], [0.18, 0.13], [0.28, 0.38], [0.38, 0.26],
      [0.48, 0.55], [0.58, 0.40], [0.68, 0.50], [0.78, 0.74], [0.88, 0.96],
      [0.94, 0.66], [1.00, 0.28]
    ];
    var LAYERS = [
      { c: 'rgba(169,155,181,0.55)', off:  0.17, sq: 1.4 },
      { c: 'rgba(124,77,255,0.85)',  off: -0.14, sq: 0.7 },
      { c: 'rgba(169,155,181,0.4)',  off:  0.09, sq: 1.15 },
      { c: '#FF3D57',                off:  0,    sq: 1 }
    ];
    var t = REDUCED ? 1 : 0;
    var started = null, playing = false;

    function poly(pts, steps) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i];
        var p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        for (var s = 0; s < steps; s++) {
          var u = s / steps, u2 = u * u, u3 = u2 * u;
          out.push([
            0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*u + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*u2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*u3),
            0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*u + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*u2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*u3)
          ]);
        }
      }
      out.push(pts[pts.length - 1].slice());
      return out;
    }
    var SAMPLED = poly(BASE, 20);

    function draw() {
      var f = fit(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      ctx.clearRect(0, 0, w, h);
      var box = { x: 8, y: 16, w: w - 16, h: h - 44 };
      var conv = (1 - Math.pow(1 - t, 2)) * 0.86;

      LAYERS.forEach(function (L, i) {
        var last = i === LAYERS.length - 1;
        ctx.beginPath();
        SAMPLED.forEach(function (p, j) {
          var spread = 1 - conv;
          var y = Math.pow(p[1], 1 + (L.sq - 1) * spread) + L.off * spread;
          y = Math.max(0.02, Math.min(0.98, y));
          var px = box.x + p[0] * box.w;
          var py = box.y + box.h - y * box.h;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = L.c;
        ctx.lineWidth = last ? 6 : 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      ctx.font = '700 11px Karla, sans-serif';
      ctx.fillStyle = '#6E6178';
      ctx.textAlign = 'left';
      ctx.fillText('ENCOUNTER TIME →', box.x, box.y + box.h + 26);
    }

    function step(ts) {
      if (started === null) started = ts;
      t = Math.min(1, (ts - started) / 2000);
      draw();
      if (t < 1) requestAnimationFrame(step);
    }

    cv.__redraw = draw;
    cv.__play = function () {
      if (REDUCED || playing) { draw(); return; }
      playing = true;
      requestAnimationFrame(step);
    };
    draw();
    return cv;
  }

  /* ---------- reveal ---------- */
  function setupReveal() {
    var nodes = document.querySelectorAll('[data-reveal], [data-draw]');
    if (!nodes.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ---------- counters ---------- */
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
        var p = Math.min(1, (ts - t0) / 1300);
        el.textContent = (target * (1 - Math.pow(1 - p, 4))).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  function playOnEnter(list) {
    if (!list.length) return;
    if (!('IntersectionObserver' in window)) {
      list.forEach(function (c) { if (c.__play) c.__play(); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.__play) e.target.__play();
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    list.forEach(function (c) { io.observe(c); });
  }

  /* ---------- rail ---------- */
  function buildRail() {
    var rail = document.querySelector('.rail');
    if (!rail) return null;
    var chapters = document.querySelectorAll('[data-chapter]');
    if (chapters.length < 2) { rail.remove(); return null; }

    var ul = document.createElement('ul');
    ul.className = 'rail-list';
    var items = [];
    Array.prototype.forEach.call(chapters, function (sec, i) {
      if (!sec.id) sec.id = 'chapter-' + (i + 1);
      var li = document.createElement('li');
      li.className = 'rail-item';
      li.innerHTML = '<span class="rail-tick"></span><a class="rail-name" href="#' + sec.id + '"></a>';
      li.querySelector('.rail-name').textContent = sec.getAttribute('data-chapter');
      ul.appendChild(li);
      items.push({ li: li, sec: sec });
    });
    rail.appendChild(ul);
    return { items: items };
  }

  /* ---------- scroll ---------- */
  function setupScroll(rail) {
    var bloom = document.querySelector('.bg-grid');
    var navProgress = document.querySelector('.nav-progress');
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || doc.scrollTop;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

      if (navProgress) navProgress.style.setProperty('--progress', p.toFixed(4));
      if (bloom && !REDUCED) bloom.style.setProperty('--bloom-y', (-y * 0.16).toFixed(1) + 'px');

      if (rail) {
        var mid = y + window.innerHeight * 0.4;
        var active = -1;
        rail.items.forEach(function (it, i) { if (it.sec.offsetTop <= mid) active = i; });
        rail.items.forEach(function (it, i) {
          it.li.classList.toggle('is-active', i === active);
          it.li.classList.toggle('is-past', i < active);
        });
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- modals (kept for any page still using them) ---------- */
  function setupModals() {
    var lastFocus = null;
    function open(id) {
      var m = document.getElementById(id);
      if (!m) return;
      lastFocus = document.activeElement;
      m.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var c = m.querySelector('.modal-close');
      if (c) c.focus();
      Array.prototype.forEach.call(m.querySelectorAll('canvas'), function (x) {
        if (x.__redraw) x.__redraw();
      });
    }
    function close(m) {
      m.classList.remove('is-open');
      if (!document.querySelector('.modal.is-open')) document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-modal]');
      if (t) { open(t.getAttribute('data-modal')); return; }
      var c = e.target.closest('[data-modal-close]');
      if (c) { var box = c.closest('.modal'); if (box) close(box); return; }
      if (e.target.classList && e.target.classList.contains('modal')) close(e.target);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var o = document.querySelector('.modal.is-open');
      if (o) close(o);
    });
  }

  /* ---------- boot ---------- */
  function init() {
    var canvases = [];

    Array.prototype.forEach.call(document.querySelectorAll('[data-plate]'), function (cv) {
      canvases.push(plate(cv, cv.getAttribute('data-plate'), {
        dot: parseInt(cv.getAttribute('data-dot') || '9', 10)
      }));
    });

    var head = document.querySelector('.page-head-scope');
    if (head) canvases.push(plate(head, head.getAttribute('data-seed') || 'header', { dot: 13 }));

    var conv = document.querySelector('.figure-canvas');
    if (conv) canvases.push(convergence(conv));

    playOnEnter(canvases);
    setupReveal();
    setupCounters();
    setupModals();
    setupScroll(buildRail());

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
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
