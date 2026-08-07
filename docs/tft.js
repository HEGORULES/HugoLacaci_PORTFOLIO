/* =========================================================
   TFT SET — live damage model + sheet viewer
   The workbook's logic, reimplemented so the set can be read
   and played with in the browser instead of downloaded.
   ========================================================= */
(function () {
  'use strict';

  var root = document.getElementById('tft');
  if (!root) return;

  var STATS = [
    ['hp', 'Health'], ['ad', 'Attack Damage'], ['ap', 'Ability Power'],
    ['armor', 'Armor'], ['mr', 'Magic Resist'], ['as', 'Attack Speed'],
    ['crit', 'Crit Chance'], ['critDmg', 'Crit Damage'], ['omnivamp', 'Omnivamp'],
    ['dmgAmp', 'Damage Amp'], ['durability', 'Durability']
  ];
  var NONE = '— none —';
  var D;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function fmt(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '0';
    return Math.abs(n % 1) < 0.001 ? String(Math.round(n)) : n.toFixed(2);
  }

  function byName(list, name) {
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }

  /* ---------- the model ---------- */

  // Champion base + the three items, summed stat by stat.
  function build(champName, itemNames) {
    var c = byName(D.champions, champName);
    if (!c) return null;
    var out = { name: c.name, adScaling: c.adScaling, apScaling: c.apScaling };
    STATS.forEach(function (s) { out[s[0]] = c[s[0]] || 0; });
    itemNames.forEach(function (n) {
      var it = byName(D.items, n);
      if (!it) return;
      STATS.forEach(function (s) { out[s[0]] += it[s[0]] || 0; });
    });
    return out;
  }

  // One attack's damage, from the workbook's Final Damage row.
  // Crit is resolved on expectation rather than a coin flip, so the
  // numbers hold still while you compare builds.
  function damage(att, def) {
    var critMult = att.crit * (att.critDmg || 1) + (1 - att.crit) * 1;
    var physical = att.ad * att.adScaling * att.as * critMult / (1 + def.armor / 100);
    var magical  = att.ap * att.apScaling / (1 + def.mr / 100);
    var total = (physical + magical) * (1 + att.dmgAmp) / (1 + def.durability);
    return total > 0 ? total : 0;
  }

  // Alternating turns, ally first, with omnivamp healing the attacker.
  function simulate(ally, enemy, maxTurns) {
    var ah = ally.hp, eh = enemy.hp, log = [];
    for (var t = 1; t <= maxTurns; t++) {
      var attacker = (t % 2 === 1) ? ally : enemy;
      var defender = (t % 2 === 1) ? enemy : ally;
      var dmg = damage(attacker, defender);
      var heal = dmg * (attacker.omnivamp || 0);
      if (t % 2 === 1) { eh -= dmg; ah = Math.min(ally.hp, ah + heal); }
      else             { ah -= dmg; eh = Math.min(enemy.hp, eh + heal); }
      log.push({ turn: t, side: t % 2 === 1 ? 'Ally' : 'Enemy', dmg: dmg, ah: ah, eh: eh });
      if (ah <= 0 || eh <= 0) break;
    }
    return { log: log, allyHp: ah, enemyHp: eh };
  }

  /* ---------- selectors ---------- */

  function select(label, options, value, onChange) {
    var wrap = el('label', 'tft-field');
    wrap.appendChild(el('span', 'tft-field-label', label));
    var s = el('select', 'tft-select');
    options.forEach(function (o) {
      var opt = el('option', null, o);
      opt.value = o;
      s.appendChild(opt);
    });
    s.value = value;
    s.addEventListener('change', onChange);
    wrap.appendChild(s);
    return { node: wrap, input: s };
  }

  /* ---------- rendering ---------- */

  function statTable(ally, enemy) {
    var t = el('table', 'tft-table');
    var thead = el('thead');
    var hr = el('tr');
    ['Stat', ally.name, enemy.name].forEach(function (h) { hr.appendChild(el('th', null, h)); });
    thead.appendChild(hr);
    t.appendChild(thead);
    var tb = el('tbody');
    STATS.forEach(function (s) {
      var tr = el('tr');
      tr.appendChild(el('th', 'tft-rowhead', s[1]));
      tr.appendChild(el('td', 'num', fmt(ally[s[0]])));
      tr.appendChild(el('td', 'num', fmt(enemy[s[0]])));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }

  function render() {
    var ally  = build(sel.ac.input.value, [sel.a1.input.value, sel.a2.input.value, sel.a3.input.value]);
    var enemy = build(sel.ec.input.value, [sel.e1.input.value, sel.e2.input.value, sel.e3.input.value]);
    if (!ally || !enemy) return;

    var out = document.getElementById('tft-out');
    out.innerHTML = '';

    var aDmg = damage(ally, enemy);
    var eDmg = damage(enemy, ally);
    var sim = simulate(ally, enemy, 40);

    var winner = sim.enemyHp <= 0 ? ally.name
               : sim.allyHp  <= 0 ? enemy.name
               : 'Nobody — 40 turns, still standing';

    var summary = el('div', 'tft-summary');
    [
      ['Ally damage / attack', fmt(aDmg)],
      ['Enemy damage / attack', fmt(eDmg)],
      ['Turns to resolve', String(sim.log.length)],
      ['Winner', winner]
    ].forEach(function (pair, i) {
      var card = el('div', 'tft-stat' + (i === 3 ? ' tft-stat-wide' : ''));
      card.appendChild(el('span', 'tft-stat-key', pair[0]));
      card.appendChild(el('span', 'tft-stat-val', pair[1]));
      summary.appendChild(card);
    });
    out.appendChild(summary);

    out.appendChild(statTable(ally, enemy));

    // Health over the fight, drawn as two bars per turn.
    var simWrap = el('div', 'tft-sim');
    simWrap.appendChild(el('p', 'label', 'Combat simulation'));
    var bars = el('div', 'tft-bars');
    sim.log.forEach(function (r) {
      var col = el('div', 'tft-bar-col');
      var a = el('div', 'tft-bar tft-bar-ally');
      a.style.height = Math.max(0, (r.ah / ally.hp) * 100) + '%';
      var e = el('div', 'tft-bar tft-bar-enemy');
      e.style.height = Math.max(0, (r.eh / enemy.hp) * 100) + '%';
      col.appendChild(a); col.appendChild(e);
      col.title = 'Turn ' + r.turn + ' — ' + r.side + ' hits for ' + fmt(r.dmg);
      bars.appendChild(col);
    });
    simWrap.appendChild(bars);
    var legend = el('div', 'tft-legend');
    [['tft-bar-ally', ally.name + ' HP'], ['tft-bar-enemy', enemy.name + ' HP']].forEach(function (l) {
      var i = el('span', 'tft-legend-item');
      i.appendChild(el('span', 'tft-swatch ' + l[0]));
      i.appendChild(document.createTextNode(l[1]));
      legend.appendChild(i);
    });
    simWrap.appendChild(legend);
    out.appendChild(simWrap);
  }

  /* ---------- sheet viewer ---------- */

  function sheetTable(rows) {
    var wrap = el('div', 'tft-scroll');
    var t = el('table', 'tft-table tft-table-sheet');
    rows.forEach(function (row, ri) {
      var tr = el('tr');
      row.forEach(function (cell, ci) {
        var isHead = ri === 0 || ci === 0;
        var td = el(isHead ? 'th' : 'td', typeof cell === 'number' ? 'num' : null);
        td.textContent = cell === null || cell === undefined ? '' : String(cell);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    return wrap;
  }

  function buildSheets() {
    var host = document.getElementById('tft-sheets');
    if (!host) return;
    var all = [];
    D.sheets.traits.forEach(function (s) { all.push({ label: 'Traits · ' + s.name, rows: s.rows }); });
    D.sheets.calculator.forEach(function (s) { all.push({ label: 'Model · ' + s.name, rows: s.rows }); });

    var tabs = el('div', 'tft-tabs');
    var body = el('div');
    all.forEach(function (s, i) {
      var b = el('button', 'tft-tab' + (i === 0 ? ' is-on' : ''), s.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs.children, function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        body.innerHTML = '';
        body.appendChild(sheetTable(s.rows));
      });
      tabs.appendChild(b);
    });
    host.appendChild(tabs);
    host.appendChild(body);
    body.appendChild(sheetTable(all[0].rows));
  }

  /* ---------- boot ---------- */
  var sel = {};

  function start() {
    var champs = D.champions.map(function (c) { return c.name; });
    var items = [NONE].concat(D.items.map(function (i) { return i.name; }));

    var controls = document.getElementById('tft-controls');
    var ally = el('div', 'tft-side');
    ally.appendChild(el('p', 'label', 'Ally'));
    var enemy = el('div', 'tft-side');
    enemy.appendChild(el('p', 'label label-volt', 'Enemy'));

    sel.ac = select('Champion', champs, champs[0], render);
    sel.a1 = select('Item 1', items, items[1] || NONE, render);
    sel.a2 = select('Item 2', items, items[2] || NONE, render);
    sel.a3 = select('Item 3', items, items[3] || NONE, render);
    [sel.ac, sel.a1, sel.a2, sel.a3].forEach(function (s) { ally.appendChild(s.node); });

    sel.ec = select('Champion', champs, champs[Math.min(5, champs.length - 1)], render);
    sel.e1 = select('Item 1', items, items[4] || NONE, render);
    sel.e2 = select('Item 2', items, items[5] || NONE, render);
    sel.e3 = select('Item 3', items, items[6] || NONE, render);
    [sel.ec, sel.e1, sel.e2, sel.e3].forEach(function (s) { enemy.appendChild(s.node); });

    controls.appendChild(ally);
    controls.appendChild(enemy);

    render();
    buildSheets();
  }

  fetch('../data/tft.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) { D = json; start(); })
    .catch(function (e) {
      root.innerHTML = '<p class="tft-error">Couldn\'t load the set data (' + e.message +
        '). The spreadsheets are still available to download below.</p>';
    });
})();
