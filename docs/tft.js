/* =========================================================
   The workbooks, live.
   Renders each sheet with its own styling and evaluates the
   real formulas, so cells can be edited and the model
   recalculates the way it does in Excel.
   ========================================================= */
(function () {
  'use strict';

  var root = document.getElementById('tft');
  if (!root) return;

  var STYLES = [];
  var sel = null;        // { book, sheet, row, col }
  var books = [];        // [{ label, file, model, engine }]
  var current = null;

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

  /* ---------- grid ---------- */

  function renderSheet(bookIdx, sheetName) {
    var bk = books[bookIdx];
    var model = null;
    bk.model.forEach(function (s) { if (s.name === sheetName) model = s; });
    if (!model) return;
    current = { bookIdx: bookIdx, sheet: sheetName, model: model };

    var covered = {};
    model.covered.forEach(function (k) { covered[k] = 1; });
    var spans = {};
    model.merges.forEach(function (m) { spans[m[0] + ',' + m[1]] = [m[2], m[3]]; });

    var scroll = el('div', 'xl-scroll');
    var table = el('table', 'xl');

    var cg = document.createElement('colgroup');
    cg.appendChild(el('col', 'xl-gutter'));
    model.widths.forEach(function (w) {
      var c = document.createElement('col');
      c.style.width = Math.max(40, Math.min(260, w)) + 'px';
      cg.appendChild(c);
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
        var v = bk.engine.value(sheetName, r, cc);
        if (typeof v === 'number' && !(st && st.a)) td.style.textAlign = 'right';
        td.textContent = display(v, st);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);

    var host = document.getElementById('xl-grid');
    host.innerHTML = '';
    host.appendChild(scroll);
    setBar(null);
  }

  function refreshValues() {
    if (!current) return;
    var bk = books[current.bookIdx];
    var model = current.model;
    var cells = document.querySelectorAll('#xl-grid td[data-r]');
    Array.prototype.forEach.call(cells, function (td) {
      var r = +td.dataset.r, c = +td.dataset.c;
      var cell = model.cells[r + ',' + c];
      var st = cell && cell.s !== undefined ? STYLES[cell.s] : null;
      var v = bk.engine.value(current.sheet, r, c);
      td.textContent = display(v, st);
      td.classList.toggle('xl-f', !!(cell && 'f' in cell));
    });
  }

  /* ---------- formula bar ---------- */

  var refBox, input;

  function setBar(td) {
    if (!td) {
      refBox.textContent = '—';
      input.value = '';
      input.disabled = true;
      return;
    }
    var r = +td.dataset.r, c = +td.dataset.c;
    var bk = books[current.bookIdx];
    refBox.textContent = colName(c) + r;
    input.value = bk.engine.formulaOf(current.sheet, r, c);
    input.disabled = false;
  }

  function commit() {
    if (!sel || !current) return;
    var bk = books[current.bookIdx];
    bk.engine.set(current.sheet, sel.r, sel.c, input.value);
    refreshValues();
  }

  /* ---------- boot ---------- */

  function build(data) {
    STYLES = data.styles || [];
    books = data.books.map(function (b) {
      return { label: b.label, file: b.file, model: b.sheets, engine: new window.XLSheet.Book(b.sheets) };
    });

    var host = document.getElementById('tft-sheets');
    host.innerHTML = '';

    var tabs = el('div', 'tft-tabs');
    books.forEach(function (b, bi) {
      b.model.forEach(function (s) {
        var btn = el('button', 'tft-tab', b.label + ' · ' + s.name);
        btn.type = 'button';
        btn.addEventListener('click', function () {
          Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('is-on'); });
          btn.classList.add('is-on');
          sel = null;
          renderSheet(bi, s.name);
          dlBtn.href = '../files/' + b.file;
        });
        tabs.appendChild(btn);
      });
    });
    host.appendChild(tabs);

    var bar = el('div', 'xl-bar');
    refBox = el('span', 'xl-ref', '—');
    input = el('input', 'xl-input');
    input.type = 'text';
    input.disabled = true;
    input.setAttribute('aria-label', 'Formula for the selected cell');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { commit(); input.blur(); }
      if (e.key === 'Escape') { setBar(document.querySelector('#xl-grid td.is-sel')); input.blur(); }
    });
    input.addEventListener('blur', commit);
    var dlBtn = el('a', 'btn btn-sm');
    dlBtn.setAttribute('download', '');
    dlBtn.appendChild(el('span', null, '↓ Open in Excel'));
    bar.appendChild(refBox);
    bar.appendChild(input);
    bar.appendChild(dlBtn);
    host.appendChild(bar);

    var grid = el('div', 'xl-frame');
    grid.id = 'xl-grid';
    host.appendChild(grid);

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

    tabs.children[0].click();
    // Start on the Calculator: it is the sheet worth playing with.
    Array.prototype.forEach.call(tabs.children, function (btn) {
      if (/Calculator/.test(btn.textContent)) btn.click();
    });
  }

  fetch('../data/tft-sheets.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(build)
    .catch(function (e) {
      var host = document.getElementById('tft-sheets');
      if (host) host.innerHTML = '<p class="tft-error">Couldn\'t load the workbooks (' +
        e.message + '). The .xlsx files are still downloadable below.</p>';
    });
})();
