/* =========================================================
   The workbooks, live.
   Each .xl-book host gets its own independent viewer: own
   tabs, own formula bar, own zoom, own selection. Editing one
   workbook never touches the other.
   ========================================================= */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('.xl-book');
  if (!hosts.length) return;

  var STYLES = [];
  var STEPS = [0.25, 0.35, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 2];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function colName(n) {
    var s = '';
    while (n > 0) {
      var r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = (n - r - 1) / 26;
    }
    return s;
  }

  function display(value, style) {
    if (value === '' || value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') {
      if (!isFinite(value)) return '#NUM!';
      if (style && style.p) {
        var pct = value * 100;
        return (Math.abs(pct % 1) < 0.005 ? Math.round(pct) : pct.toFixed(1)) + '%';
      }
      if (Math.abs(value % 1) < 1e-9) return String(Math.round(value));
      return String(Math.round(value * 100) / 100);
    }
    return String(value);
  }

  /* ---------- one self-contained viewer ---------- */

  function Viewer(host, book, opts) {
    opts = opts || {};
    var engine = new window.XLSheet.Book(book.sheets);
    var sheet = null;      // the sheet currently on screen
    var sel = null;
    var zoom = 1;
    var fitting = !!opts.fit;

    var tabs = el('div', 'tft-tabs');
    var bar = el('div', 'xl-bar');
    var refBox = el('span', 'xl-ref', '');
    var input = el('input', 'xl-input');
    var grid = el('div', 'xl-frame');

    input.type = 'text';
    input.disabled = true;
    input.setAttribute('aria-label', 'Formula for the selected cell in ' + book.label);

    /* zoom group */
    var zoomBox = el('div', 'xl-zoom');
    var out = el('button', 'xl-zbtn', '−');
    var pctLabel = el('span', 'xl-zpct num', '100%');
    var into = el('button', 'xl-zbtn', '+');
    var fitBtn = el('button', 'xl-zfit', 'Fit');
    [out, into, fitBtn].forEach(function (b) { b.type = 'button'; });
    out.setAttribute('aria-label', 'Zoom out');
    into.setAttribute('aria-label', 'Zoom in');
    fitBtn.setAttribute('aria-label', 'Fit the whole sheet on screen');
    zoomBox.appendChild(out);
    zoomBox.appendChild(pctLabel);
    zoomBox.appendChild(into);
    zoomBox.appendChild(fitBtn);

    var dl = el('a', 'btn btn-sm');
    dl.href = '../files/' + book.file;
    dl.setAttribute('download', '');
    dl.appendChild(el('span', null, '↓ Open in Excel'));

    bar.appendChild(refBox);
    bar.appendChild(input);
    bar.appendChild(zoomBox);
    bar.appendChild(dl);
    host.appendChild(tabs);
    host.appendChild(bar);
    host.appendChild(grid);

    function setBar(td) {
      if (!td) {
        refBox.textContent = '';
        input.value = '';
        input.disabled = true;
        return;
      }
      var r = +td.dataset.r, c = +td.dataset.c;
      refBox.textContent = colName(c) + r;
      input.value = engine.formulaOf(sheet.name, r, c);
      input.disabled = false;
    }

    /* ---------- zoom ---------- */

    function budget() {
      return Math.min(Math.round(window.innerHeight * 0.72), 780);
    }

    /* The sheet's footprint at zoom 1, measured from what is actually on
       screen. Zooming reflows the table and rounds row heights, so the
       size has to be read back rather than predicted from the first
       measurement. */
    function footprint() {
      var pad = grid.querySelector('.xl-pad');
      if (!pad) return null;
      var r = pad.getBoundingClientRect();
      if (!r.height) return null;
      return { w: r.width / zoom, h: r.height / zoom };
    }

    function fitScale() {
      var scroll = grid.querySelector('.xl-scroll');
      var box = footprint();
      if (!scroll || !box) return 1;
      var avail = scroll.clientWidth || scroll.getBoundingClientRect().width;
      return Math.max(0.1, Math.min(avail / box.w, budget() / box.h, 1));
    }

    // Each pass measures the result of the last one, so the scale settles
    // even though zooming changes the very size it is computed from.
    function fitToScreen() {
      for (var i = 0; i < 3; i++) setZoom(fitScale(), true);
    }

    function applyZoom() {
      var table = grid.querySelector('table.xl');
      var pad = grid.querySelector('.xl-pad');
      var scroll = grid.querySelector('.xl-scroll');
      if (!table || !pad || !scroll) return;

      // CSS zoom rather than a transform: zoom re-runs layout, so the row
      // and column headers keep sticking and the scrollbars stay honest.
      // Where it is unsupported the sheet simply renders at full size.
      if (zoom === 1) {
        table.style.zoom = '';
        pad.style.width = '';
      } else {
        table.style.zoom = String(zoom);
        pad.style.width = 'fit-content';
      }
      scroll.style.height =
        Math.min(Math.ceil(pad.getBoundingClientRect().height) + 2, budget()) + 'px';
      pctLabel.textContent = Math.round(zoom * 100) + '%';
      fitBtn.classList.toggle('is-on', fitting);
      out.disabled = zoom <= STEPS[0] + 0.001;
      into.disabled = zoom >= STEPS[STEPS.length - 1] - 0.001;
    }

    function setZoom(z, isFit) {
      zoom = Math.max(0.1, Math.min(2, z));
      fitting = !!isFit;
      applyZoom();
    }

    // A fit scale rarely lands on a step, so require a real change rather
    // than nudging 33% to 35% and calling it a zoom.
    function stepZoom(dir) {
      var next;
      if (dir > 0) {
        for (var i = 0; i < STEPS.length; i++) {
          if (STEPS[i] > zoom * 1.12) { next = STEPS[i]; break; }
        }
        if (next === undefined) next = STEPS[STEPS.length - 1];
      } else {
        for (var j = STEPS.length - 1; j >= 0; j--) {
          if (STEPS[j] < zoom / 1.12) { next = STEPS[j]; break; }
        }
        if (next === undefined) next = STEPS[0];
      }
      setZoom(next, false);
    }

    out.addEventListener('click', function () { stepZoom(-1); });
    into.addEventListener('click', function () { stepZoom(1); });
    fitBtn.addEventListener('click', function () {
      if (fitting) setZoom(1, false);
      else fitToScreen();
    });

    /* ---------- grid ---------- */

    function refresh() {
      Array.prototype.forEach.call(grid.querySelectorAll('td[data-r]'), function (td) {
        var r = +td.dataset.r, c = +td.dataset.c;
        var cell = sheet.cells[r + ',' + c];
        var st = cell && cell.s !== undefined ? STYLES[cell.s] : null;
        var v = engine.value(sheet.name, r, c);
        var box = td.querySelector('select');
        if (box) box.value = v === null || v === undefined ? '' : String(v);
        else td.textContent = display(v, st);
        td.classList.toggle('xl-f', !!(cell && 'f' in cell));
      });
    }

    function commit() {
      if (!sel) return;
      engine.set(sheet.name, sel.r, sel.c, input.value);
      refresh();
    }

    function dropdown(model, r, c, current) {
      var options = model.lists[model.dv[r + ',' + c]];
      var box = el('select', 'xl-select');
      box.setAttribute('aria-label', 'Value for ' + colName(c) + r);
      var have = false;
      options.forEach(function (o) {
        var op = el('option', null, o);
        op.value = o;
        if (String(current) === o) have = true;
        box.appendChild(op);
      });
      if (!have) {
        var blank = el('option', null, current === '' ? '' : String(current));
        blank.value = current === '' ? '' : String(current);
        box.insertBefore(blank, box.firstChild);
      }
      box.value = current === null || current === undefined ? '' : String(current);
      box.addEventListener('change', function () {
        engine.set(model.name, r, c, box.value);
        refresh();
      });
      // Selecting inside the cell should not also re-fire the cell click.
      box.addEventListener('click', function (e) { e.stopPropagation(); });
      return box;
    }

    function render(model) {
      sheet = model;
      sel = null;

      var covered = {};
      model.covered.forEach(function (k) { covered[k] = 1; });
      var spans = {};
      model.merges.forEach(function (m) { spans[m[0] + ',' + m[1]] = [m[2], m[3]]; });
      var dv = model.dv || {};
      var lists = model.lists || [];

      var table = el('table', 'xl');
      var cg = document.createElement('colgroup');
      cg.appendChild(el('col', 'xl-gutter'));
      model.widths.forEach(function (w) {
        var col = document.createElement('col');
        col.style.width = Math.max(40, Math.min(260, w)) + 'px';
        cg.appendChild(col);
      });
      table.appendChild(cg);

      var thead = el('thead');
      var hr = el('tr');
      hr.appendChild(el('th', 'xl-corner'));
      for (var c = 1; c <= model.cols; c++) hr.appendChild(el('th', 'xl-head', colName(c)));
      thead.appendChild(hr);
      table.appendChild(thead);

      var tbody = el('tbody');
      for (var r = 1; r <= model.rows; r++) {
        var tr = el('tr');
        tr.appendChild(el('th', 'xl-head xl-rownum', String(r)));
        for (var cc = 1; cc <= model.cols; cc++) {
          var key = r + ',' + cc;
          if (covered[key]) continue;
          var td = el('td');
          td.dataset.r = r;
          td.dataset.c = cc;
          if (spans[key]) {
            if (spans[key][0] > 1) td.rowSpan = spans[key][0];
            if (spans[key][1] > 1) td.colSpan = spans[key][1];
          }
          var cell = model.cells[key];
          var st = cell && cell.s !== undefined ? STYLES[cell.s] : null;
          if (st) {
            if (st.bg) td.style.background = st.bg;
            if (st.fg) td.style.color = st.fg;
            if (st.b) td.style.fontWeight = '700';
            if (st.a) td.style.textAlign = st.a;
          }
          if (cell && 'f' in cell) td.classList.add('xl-f');
          var v = engine.value(model.name, r, cc);
          if (dv[key] !== undefined && lists[dv[key]]) {
            td.classList.add('xl-dv');
            td.appendChild(dropdown(model, r, cc, v));
          } else {
            if (typeof v === 'number' && !(st && st.a)) td.style.textAlign = 'right';
            td.textContent = display(v, st);
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      var pad = el('div', 'xl-pad');
      pad.appendChild(table);
      var scroll = el('div', 'xl-scroll');
      scroll.appendChild(pad);
      grid.innerHTML = '';
      grid.appendChild(scroll);
      setBar(null);

      if (fitting) fitToScreen();
      else setZoom(zoom, false);
    }

    book.sheets.forEach(function (s, i) {
      var btn = el('button', 'tft-tab', s.name);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('is-on'); });
        btn.classList.add('is-on');
        render(s);
      });
      tabs.appendChild(btn);
    });

    grid.addEventListener('click', function (e) {
      var td = e.target.closest('td[data-r]');
      if (!td) return;
      var prev = grid.querySelector('td.is-sel');
      if (prev) prev.classList.remove('is-sel');
      td.classList.add('is-sel');
      sel = { r: +td.dataset.r, c: +td.dataset.c };
      setBar(td);
    });
    grid.addEventListener('dblclick', function (e) {
      if (e.target.closest('td[data-r]')) input.focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { commit(); input.blur(); }
      if (e.key === 'Escape') { setBar(grid.querySelector('td.is-sel')); input.blur(); }
    });
    input.addEventListener('blur', commit);

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (fitting) fitToScreen();
        else applyZoom();
      }, 160);
    });

    // Open on the sheet worth looking at first, where there is one.
    var openAt = 0;
    book.sheets.forEach(function (s, i) { if (/calculator/i.test(s.name)) openAt = i; });
    tabs.children[openAt].click();
  }

  fetch('../data/tft-sheets.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      STYLES = data.styles || [];
      Array.prototype.forEach.call(hosts, function (host) {
        var book = data.books[+host.dataset.book];
        if (book) Viewer(host, book, { fit: host.dataset.fit === 'on' });
      });
    })
    .catch(function (e) {
      Array.prototype.forEach.call(hosts, function (host) {
        host.innerHTML = '<p class="tft-error">Couldn\'t load this workbook (' + e.message +
          '). The .xlsx is still downloadable below.</p>';
      });
    });
})();
