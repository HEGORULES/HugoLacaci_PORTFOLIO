/* =========================================================
   A small spreadsheet engine.
   The workbooks only ever use VLOOKUP, COUNTIF, SUM, IF and
   RAND, so a purpose-built evaluator beats shipping a general
   one — it stays a few KB and carries no licence baggage.
   ========================================================= */
window.XLSheet = (function () {
  'use strict';

  /* ---------- tokenizer ---------- */

  var RE = {
    num: /^\d+(\.\d+)?([eE][+-]?\d+)?/,
    str: /^"((?:[^"]|"")*)"/,
    // Sheet1!$A$1 or 'My Sheet'!A1 or A1
    ref: /^(?:('([^']+)'|[A-Za-z_][A-Za-z0-9_.]*)!)?(\$?)([A-Za-z]{1,3})(\$?)(\d+)/,
    fn: /^([A-Za-z][A-Za-z0-9_.]*)\s*\(/,
    op: /^(<>|<=|>=|[-+*/^&<>=%,():])/,
    ws: /^\s+/
  };

  function colToNum(s) {
    var n = 0;
    s = s.toUpperCase();
    for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n;
  }

  function tokenize(src) {
    var out = [], s = src, m;
    while (s.length) {
      if ((m = s.match(RE.ws))) { s = s.slice(m[0].length); continue; }
      if ((m = s.match(RE.fn))) {
        out.push({ t: 'fn', v: m[1].toUpperCase() });
        s = s.slice(m[0].length);
        continue;
      }
      if ((m = s.match(RE.ref))) {
        out.push({ t: 'ref', sheet: m[2] || m[1] || null, col: colToNum(m[4]), row: +m[6] });
        s = s.slice(m[0].length);
        continue;
      }
      if ((m = s.match(RE.num))) { out.push({ t: 'num', v: parseFloat(m[0]) }); s = s.slice(m[0].length); continue; }
      if ((m = s.match(RE.str))) { out.push({ t: 'str', v: m[1].replace(/""/g, '"') }); s = s.slice(m[0].length); continue; }
      if ((m = s.match(RE.op))) { out.push({ t: 'op', v: m[1] }); s = s.slice(m[0].length); continue; }
      // Anything unrecognised (TRUE/FALSE, defined names) becomes a bare word.
      m = s.match(/^[A-Za-z_][A-Za-z0-9_.]*/);
      if (m) { out.push({ t: 'word', v: m[0] }); s = s.slice(m[0].length); continue; }
      s = s.slice(1);
    }
    return out;
  }

  /* ---------- parser (precedence climbing) ---------- */

  var BIN = {
    '<': 1, '>': 1, '=': 1, '<=': 1, '>=': 1, '<>': 1,
    '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5
  };

  function parse(tokens) {
    var i = 0;

    function peek() { return tokens[i]; }
    function eat(v) {
      var t = tokens[i];
      if (t && t.t === 'op' && t.v === v) { i++; return true; }
      return false;
    }

    function primary() {
      var t = tokens[i];
      if (!t) return { k: 'num', v: 0 };

      if (t.t === 'op' && t.v === '-') { i++; return { k: 'neg', a: primary() }; }
      if (t.t === 'op' && t.v === '+') { i++; return primary(); }

      if (t.t === 'num') { i++; return postfix({ k: 'num', v: t.v }); }
      if (t.t === 'str') { i++; return { k: 'str', v: t.v }; }

      if (t.t === 'word') {
        i++;
        var up = t.v.toUpperCase();
        if (up === 'TRUE') return { k: 'bool', v: true };
        if (up === 'FALSE') return { k: 'bool', v: false };
        return { k: 'num', v: 0 };
      }

      if (t.t === 'fn') {
        i++;
        var args = [];
        if (!eat(')')) {
          for (;;) {
            args.push(expr(0));
            if (eat(',')) continue;
            eat(')');
            break;
          }
        }
        return postfix({ k: 'call', name: t.v, args: args });
      }

      if (t.t === 'ref') {
        i++;
        var next = tokens[i];
        if (next && next.t === 'op' && next.v === ':' && tokens[i + 1] && tokens[i + 1].t === 'ref') {
          var b = tokens[i + 1];
          i += 2;
          return { k: 'range', sheet: t.sheet, r1: t.row, c1: t.col, r2: b.row, c2: b.col };
        }
        return postfix({ k: 'ref', sheet: t.sheet, row: t.row, col: t.col });
      }

      if (t.t === 'op' && t.v === '(') {
        i++;
        var e = expr(0);
        eat(')');
        return postfix(e);
      }

      i++;
      return { k: 'num', v: 0 };
    }

    // Excel's trailing % divides by 100.
    function postfix(node) {
      while (peek() && peek().t === 'op' && peek().v === '%') { i++; node = { k: 'pct', a: node }; }
      return node;
    }

    function expr(min) {
      var left = primary();
      for (;;) {
        var t = peek();
        if (!t || t.t !== 'op' || !(t.v in BIN) || BIN[t.v] < min) break;
        var op = t.v, prec = BIN[op];
        i++;
        var right = expr(op === '^' ? prec : prec + 1);
        left = { k: 'bin', op: op, a: left, b: right };
      }
      return left;
    }

    return expr(0);
  }

  /* ---------- workbook ---------- */

  function Book(model) {
    this.sheets = {};       // name -> { cells: {"r,c": {v|f}}, ... }
    this.cache = {};        // "sheet!r,c" -> value
    this.visiting = {};     // cycle guard
    this.ast = {};
    var self = this;
    model.forEach(function (s) { self.sheets[s.name] = s; });
  }

  Book.prototype.raw = function (sheet, row, col) {
    var s = this.sheets[sheet];
    if (!s) return null;
    return s.cells[row + ',' + col] || null;
  };

  Book.prototype.value = function (sheet, row, col) {
    var key = sheet + '!' + row + ',' + col;
    if (key in this.cache) return this.cache[key];
    if (this.visiting[key]) return 0;           // circular: stop, don't hang

    var cell = this.raw(sheet, row, col);
    if (!cell) return (this.cache[key] = '');

    if (!('f' in cell)) return (this.cache[key] = cell.v === undefined ? '' : cell.v);

    this.visiting[key] = 1;
    var out;
    try {
      if (!this.ast[key]) this.ast[key] = parse(tokenize(cell.f));
      out = this.eval(this.ast[key], sheet);
    } catch (e) {
      out = '#ERROR';
    }
    delete this.visiting[key];
    this.cache[key] = out;
    return out;
  };

  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v === '' || v === null || v === undefined) return 0;
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function same(a, b) {
    if (typeof a === 'string' && typeof b === 'string') return a.trim().toLowerCase() === b.trim().toLowerCase();
    if (typeof a === 'string' || typeof b === 'string') {
      var na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na === nb;
      return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    }
    return a === b;
  }

  Book.prototype.rangeValues = function (node, ctx) {
    var sheet = node.sheet || ctx;
    var out = [];
    for (var r = Math.min(node.r1, node.r2); r <= Math.max(node.r1, node.r2); r++) {
      var row = [];
      for (var c = Math.min(node.c1, node.c2); c <= Math.max(node.c1, node.c2); c++) {
        row.push(this.value(sheet, r, c));
      }
      out.push(row);
    }
    return out;
  };

  Book.prototype.eval = function (n, ctx) {
    switch (n.k) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'neg': return -num(this.eval(n.a, ctx));
      case 'pct': return num(this.eval(n.a, ctx)) / 100;
      case 'ref': return this.value(n.sheet || ctx, n.row, n.col);
      case 'range': {
        var g = this.rangeValues(n, ctx);
        return g.length && g[0].length ? g[0][0] : '';
      }
      case 'bin': {
        var a = this.eval(n.a, ctx), b = this.eval(n.b, ctx);
        switch (n.op) {
          case '+': return num(a) + num(b);
          case '-': return num(a) - num(b);
          case '*': return num(a) * num(b);
          case '/': return num(b) === 0 ? '#DIV/0!' : num(a) / num(b);
          case '^': return Math.pow(num(a), num(b));
          case '&': return String(a) + String(b);
          case '=': return same(a, b);
          case '<>': return !same(a, b);
          case '<': return num(a) < num(b);
          case '>': return num(a) > num(b);
          case '<=': return num(a) <= num(b);
          case '>=': return num(a) >= num(b);
        }
        return 0;
      }
      case 'call': return this.call(n, ctx);
    }
    return 0;
  };

  Book.prototype.call = function (n, ctx) {
    var self = this;
    var name = n.name;

    function flat(node) {
      if (node.k === 'range') {
        var g = self.rangeValues(node, ctx), out = [];
        g.forEach(function (row) { out.push.apply(out, row); });
        return out;
      }
      return [self.eval(node, ctx)];
    }

    if (name === 'SUM') {
      var total = 0;
      n.args.forEach(function (a) { flat(a).forEach(function (v) { total += num(v); }); });
      return total;
    }

    if (name === 'IF') {
      var cond = this.eval(n.args[0], ctx);
      var truthy = typeof cond === 'boolean' ? cond : num(cond) !== 0;
      if (truthy) return n.args.length > 1 ? this.eval(n.args[1], ctx) : true;
      // Excel returns FALSE when the third argument is missing, and FALSE
      // is 0 in arithmetic — which is exactly the enemy-damage bug.
      return n.args.length > 2 ? this.eval(n.args[2], ctx) : false;
    }

    if (name === 'RAND') return Math.random();

    if (name === 'COUNTIF') {
      var vals = flat(n.args[0]);
      var crit = this.eval(n.args[1], ctx);
      var op = null, target = crit;
      if (typeof crit === 'string') {
        var m = crit.match(/^(<>|<=|>=|<|>|=)\s*(.*)$/);
        if (m) { op = m[1]; target = m[2]; }
      }
      var count = 0;
      vals.forEach(function (v) {
        var hit;
        if (!op) hit = same(v, target);
        else {
          var a = num(v), b = num(target);
          hit = op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b
              : op === '>=' ? a >= b : op === '=' ? same(v, target) : !same(v, target);
        }
        if (hit) count++;
      });
      return count;
    }

    if (name === 'VLOOKUP') {
      var needle = this.eval(n.args[0], ctx);
      var table = n.args[1];
      if (table.k !== 'range') return '#N/A';
      var grid = this.rangeValues(table, ctx);
      var idx = Math.round(num(this.eval(n.args[2], ctx)));
      var exact = true;
      if (n.args.length > 3) {
        var f = this.eval(n.args[3], ctx);
        exact = !(f === true || num(f) === 1);
      }
      for (var r = 0; r < grid.length; r++) {
        if (same(grid[r][0], needle)) {
          return idx - 1 < grid[r].length ? grid[r][idx - 1] : '#REF!';
        }
      }
      if (!exact) {
        var best = null;
        for (var j = 0; j < grid.length; j++) {
          if (num(grid[j][0]) <= num(needle)) best = grid[j];
        }
        if (best) return idx - 1 < best.length ? best[idx - 1] : '#REF!';
      }
      return '#N/A';
    }

    return '#NAME?';
  };

  // Editing a cell invalidates every computed value; the workbooks are
  // small enough that a full clear beats maintaining a dependency graph.
  Book.prototype.set = function (sheet, row, col, input) {
    var s = this.sheets[sheet];
    if (!s) return;
    var key = row + ',' + col;
    var cell = s.cells[key] || (s.cells[key] = {});
    delete cell.f; delete cell.v;
    var txt = String(input).trim();
    if (txt === '') { /* cleared */ }
    else if (txt.charAt(0) === '=') cell.f = txt.slice(1);
    else if (txt !== '' && !isNaN(Number(txt))) cell.v = Number(txt);
    else cell.v = txt;
    this.cache = {};
    this.ast = {};
  };

  Book.prototype.formulaOf = function (sheet, row, col) {
    var c = this.raw(sheet, row, col);
    if (!c) return '';
    if ('f' in c) return '=' + c.f;
    return c.v === undefined ? '' : String(c.v);
  };

  return { Book: Book, colToNum: colToNum };
})();
