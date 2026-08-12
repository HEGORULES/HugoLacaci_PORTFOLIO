/* =========================================================
   BLUEPRINT, interaction layer
   Every project gets a generated node graph, seeded by its
   name so no two are alike: nodes, the edges between them,
   and one path through the middle picked out as the solution.
   ========================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SIGNAL = [200, 242, 49];
  var MARKER = [255, 90, 31];
  var DATUM  = [110, 139, 255];

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

  /* ---------- one generated graph ---------- */
  /* Nodes are scattered on a jittered grid rather than at random, so a
     plate never collapses into a clump or a straight line. Edges join
     near neighbours; one path through the graph is then picked out, which
     is the whole image: a system, and a route found through it. */
  function plate(cv, seedStr, opts) {
    opts = opts || {};
    var rnd = seeded(seedStr);
    var onPaper = !!cv.closest('.work-plate');
    var ink = onPaper ? [21, 24, 31] : [236, 233, 224];

    var cols = 3 + Math.floor(rnd() * 2);          // 3 or 4
    var rows = 3;
    var nodes = [];
    for (var gy = 0; gy < rows; gy++) {
      for (var gx = 0; gx < cols; gx++) {
        if (rnd() < 0.14) continue;                // a few gaps keep it organic
        nodes.push({
          x: (gx + 0.5) / cols + (rnd() - 0.5) * 0.16,
          y: (gy + 0.5) / rows + (rnd() - 0.5) * 0.2,
          r: 2.6 + rnd() * 2.6
        });
      }
    }
    if (nodes.length < 4) nodes.push({ x: 0.5, y: 0.5, r: 3 });

    // Join every node to its two nearest neighbours, without repeats.
    var edges = [], seen = {};
    nodes.forEach(function (a, i) {
      var order = nodes
        .map(function (b, j) { return { j: j, d: Math.hypot(a.x - b.x, a.y - b.y) }; })
        .filter(function (o) { return o.j !== i; })
        .sort(function (p, q) { return p.d - q.d; });
      order.slice(0, 2).forEach(function (o) {
        var key = Math.min(i, o.j) + '-' + Math.max(i, o.j);
        if (seen[key]) return;
        seen[key] = 1;
        edges.push([i, o.j]);
      });
    });

    // The highlighted route: walk from the leftmost node to the rightmost.
    var startIdx = 0, endIdx = 0;
    nodes.forEach(function (n, i) {
      if (n.x < nodes[startIdx].x) startIdx = i;
      if (n.x > nodes[endIdx].x) endIdx = i;
    });
    var path = [startIdx], guard = 0;
    while (path[path.length - 1] !== endIdx && guard++ < 12) {
      var here = path[path.length - 1];
      var next = null, best = Infinity;
      edges.forEach(function (e) {
        var other = e[0] === here ? e[1] : (e[1] === here ? e[0] : null);
        if (other === null || path.indexOf(other) !== -1) return;
        var d = Math.hypot(nodes[other].x - nodes[endIdx].x, nodes[other].y - nodes[endIdx].y);
        if (d < best) { best = d; next = other; }
      });
      if (next === null) break;
      path.push(next);
    }
    var onPath = {};
    for (var k = 0; k + 1 < path.length; k++) {
      onPath[Math.min(path[k], path[k + 1]) + '-' + Math.max(path[k], path[k + 1])] = 1;
    }

    var accent = rnd() > 0.5 ? SIGNAL : DATUM;
    var t = REDUCED ? 1 : 0;
    var started = null, playing = false;

    function draw() {
      var f = fit(cv);
      if (!f) return;
      var ctx = f.ctx, w = f.w, h = f.h;
      var pad = Math.min(w, h) * 0.12;
      var X = function (n) { return pad + n.x * (w - pad * 2); };
      var Y = function (n) { return pad + n.y * (h - pad * 2); };

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      // Plain edges first, drawn in from nothing.
      ctx.lineWidth = 1;
      edges.forEach(function (e, i) {
        var key = Math.min(e[0], e[1]) + '-' + Math.max(e[0], e[1]);
        if (onPath[key]) return;
        var appear = Math.max(0, Math.min(1, (t - i * 0.02) / 0.4));
        if (appear <= 0) return;
        var a = nodes[e[0]], b = nodes[e[1]];
        ctx.strokeStyle = rgba(ink, 0.22 * appear);
        ctx.beginPath();
        ctx.moveTo(X(a), Y(a));
        ctx.lineTo(X(a) + (X(b) - X(a)) * appear, Y(a) + (Y(b) - Y(a)) * appear);
        ctx.stroke();
      });

      // The route, thicker and in colour, arriving after the structure.
      ctx.lineWidth = 2.4;
      for (var i = 0; i + 1 < path.length; i++) {
        var appear2 = Math.max(0, Math.min(1, (t - 0.3 - i * 0.12) / 0.4));
        if (appear2 <= 0) break;
        var a2 = nodes[path[i]], b2 = nodes[path[i + 1]];
        ctx.strokeStyle = rgba(accent, 0.95);
        ctx.beginPath();
        ctx.moveTo(X(a2), Y(a2));
        ctx.lineTo(X(a2) + (X(b2) - X(a2)) * appear2, Y(a2) + (Y(b2) - Y(a2)) * appear2);
        ctx.stroke();
      }

      // Nodes on top, so no edge ever crosses a joint.
      nodes.forEach(function (n, i) {
        var appear3 = Math.max(0, Math.min(1, (t - i * 0.03) / 0.35));
        if (appear3 <= 0) return;
        var lit = path.indexOf(i) !== -1;
        var r = n.r * appear3;
        ctx.beginPath();
        ctx.arc(X(n), Y(n), r, 0, Math.PI * 2);
        ctx.fillStyle = lit ? rgba(accent, 1) : (onPaper ? '#E2DDCD' : '#11141B');
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = lit ? rgba(accent, 1) : rgba(ink, 0.5);
        ctx.stroke();
      });

      // One annotated node: the mark a designer leaves on a diagram.
      if (t > 0.75 && path.length) {
        var m = nodes[path[path.length - 1]];
        var s = 9;
        ctx.strokeStyle = rgba(MARKER, Math.min(1, (t - 0.75) / 0.25));
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(X(m), Y(m), s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(X(m) + s + 3, Y(m));
        ctx.lineTo(X(m) + s + 14, Y(m));
        ctx.stroke();
      }
    }

    function step(ts) {
      if (started === null) started = ts;
      t = Math.min(1, (ts - started) / 1400);
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

  /* ---------- the pointer light ---------- */
  /* The drafting grid is only visible around the pointer, so the page
     reads as a surface being worked on rather than a printed backdrop. */
  function setupSpotlight() {
    var grid = document.querySelector('.bg-grid');
    if (!grid || REDUCED) return;
    var x = 0, y = 0, queued = false;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        grid.style.setProperty('--mx', x + 'px');
        grid.style.setProperty('--my', y + 'px');
      });
    }, { passive: true });
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

  /* ---------- slide decks ---------- */
  function setupDecks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-deck]'), function (deck) {
      var slides = deck.querySelectorAll('.deck-slide');
      var dots = deck.querySelectorAll('[data-deck-go]');
      var now = deck.querySelector('[data-deck-now]');
      var prev = deck.querySelector('[data-deck-prev]');
      var next = deck.querySelector('[data-deck-next]');
      if (!slides.length) return;
      var at = 0;

      function show(i) {
        at = Math.max(0, Math.min(slides.length - 1, i));
        Array.prototype.forEach.call(slides, function (s, k) {
          s.classList.toggle('is-on', k === at);
          s.setAttribute('aria-hidden', k === at ? 'false' : 'true');
        });
        Array.prototype.forEach.call(dots, function (d, k) {
          d.classList.toggle('is-on', k === at);
          d.setAttribute('aria-selected', k === at ? 'true' : 'false');
        });
        if (now) now.textContent = String(at + 1);
        if (prev) prev.disabled = at === 0;
        if (next) next.disabled = at === slides.length - 1;
        // Fetch the neighbour ahead of time so stepping forward feels instant.
        var ahead = slides[at + 1] && slides[at + 1].querySelector('img');
        if (ahead) ahead.loading = 'eager';
      }

      if (prev) prev.addEventListener('click', function () { show(at - 1); });
      if (next) next.addEventListener('click', function () { show(at + 1); });
      Array.prototype.forEach.call(dots, function (d) {
        d.addEventListener('click', function () { show(+d.getAttribute('data-deck-go') - 1); });
      });
      // Clicking the slide itself advances, wrapping at the end.
      Array.prototype.forEach.call(slides, function (s) {
        s.addEventListener('click', function () {
          show(at === slides.length - 1 ? 0 : at + 1);
        });
      });
      deck.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(at + 1); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(at - 1); }
        if (e.key === 'Home') { e.preventDefault(); show(0); }
        if (e.key === 'End') { e.preventDefault(); show(slides.length - 1); }
      });

      var x0 = null;
      deck.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      deck.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 45) show(dx < 0 ? at + 1 : at - 1);
      }, { passive: true });

      show(0);
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

    playOnEnter(canvases);
    setupSpotlight();
    setupReveal();
    setupCounters();
    setupDecks();
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
