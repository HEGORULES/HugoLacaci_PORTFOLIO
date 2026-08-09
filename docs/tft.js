/* =========================================================
   The workbooks, live.
   Each .xl-book host gets its own independent viewer: own
   tabs, own formula bar, own selection. Editing one workbook
   never touches the other.
   ========================================================= */
(function () {
  'use strict';

  var hosts = document.querySelectorAll('.xl-book');
  if (!hosts.length) return;

  var STYLES = [];

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

  function Viewer(host, book) {
    var engine = new window.XLSheet.Book(book.sheets);
    var sheet = null;      // the sheet currently on screen
    var sel = null;

    var tabs = el('div', 'tft-tabs');
    var bar = el('div', 'xl-bar');
    var refBox = el('span', 'xl-ref', '');
    var input = el('input', 'xl-input');
    var grid = el('div', 'xl-frame');

    input.type = 'text';
    input.disabled = true;
    input.setAttribute('aria-label', 'Formula for the selected cell in ' + book.label);

    var dl = el('a', 'btn btn-sm');
    dl.href = '../files/' + book.file;
    dl.setAttribute('download', '');
    dl.appendChild(el('span', null, '↓ Open in Excel'));

    bar.appendChild(refBox);
    bar.appendChild(input);
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

    function refresh() {
      Array.prototype.forEach.call(grid.querySelectorAll('td[data-r]'), function (td) {
        var r = +td.dataset.r, c = +td.dataset.c;
        var cell = sheet.cells[r + ',' + c];
        var st = cell && cell.s !== undefined ? STYLES[cell.s] : null;
        td.textContent = display(engine.value(sheet.name, r, c), st);
        td.classList.toggle('xl-f', !!(cell && 'f' in cell));
      });
    }

    function commit() {
      if (!sel) return;
      engine.set(sheet.name, sel.r, sel.c, input.value);
      refresh();
    }

    function render(model) {
      sheet = model;
      sel = null;

      var covered = {};
      model.covered.forEach(function (k) { covered[k] = 1; });
      var spans = {};
      model.merges.forEach(function (m) { spans[m[0] + ',' + m[1]] = [m[2], m[3]]; });

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
          if (typeof v === 'number' && !(st && st.a)) td.style.textAlign = 'right';
          td.textContent = display(v, st);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      var scroll = el('div', 'xl-scroll');
      scroll.appendChild(table);
      grid.innerHTML = '';
      grid.appendChild(scroll);
      setBar(null);
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
        if (book) Viewer(host, book);
      });
    })
    .catch(function (e) {
      Array.prototype.forEach.call(hosts, function (host) {
        host.innerHTML = '<p class="tft-error">Couldn\'t load this workbook (' + e.message +
          '). The .xlsx is still downloadable below.</p>';
      });
    });
})();
