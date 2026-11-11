/* Districts of India: the all-India finder on the home page, and the filter and sort on list pages. Searched inside the browser. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); }, esc = function (s) { return SYG.esc(s); };

  /* ---------- filter and sort a table or grid ---------- */
  var f = $('ds-f'), t = $('ds-t');
  if (f && t) {
    var body = t.tBodies ? t.tBodies[0] : t, none = $('ds-none');
    f.addEventListener('input', function () {
      var v = f.value.trim().toLowerCase(), n = 0;
      [].forEach.call(t.querySelectorAll('[data-f]'), function (r) { var hit = !v || r.getAttribute('data-f').indexOf(v) > -1; r.hidden = !hit; if (hit) n++; });
      if (none) none.hidden = n > 0;
    });
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sort]'); if (!b || !body.rows) return;
      var col = parseInt(b.getAttribute('data-sort'), 10), rows = [].slice.call(body.rows);
      rows.sort(function (a, c) {
        if (col === 0) return a.cells[0].textContent.localeCompare(c.cells[0].textContent);
        return parseFloat(c.cells[col].getAttribute('data-n')) - parseFloat(a.cells[col].getAttribute('data-n'));
      });
      rows.forEach(function (r) { body.appendChild(r); });
      [].forEach.call(d.querySelectorAll('[data-sort]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
  }

  /* ---------- the finder ---------- */
  var q = $('ds-q'); if (!q) return;
  var out = $('ds-out'), rec = $('ds-recent'), D = null, wait = null;
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function run() {
    var v = norm(q.value);
    if (v.length < 2) { out.innerHTML = ''; return; }
    var tight = v.replace(/ /g, ''), starts = [], has = [], hq = [];
    D.d.forEach(function (x) {
      var n = norm(x[0]), h = norm(x[3]);
      if (n.indexOf(v) === 0 || n.replace(/ /g, '').indexOf(tight) === 0) starts.push(x);
      else if (n.indexOf(v) > -1) has.push(x);
      else if (h && h.indexOf(v) === 0) hq.push(x);
    });
    var hits = starts.concat(has, hq);
    if (!hits.length) { out.innerHTML = '<p class="hint">No district or headquarters matches "' + esc(q.value.trim()) + '". Check the spelling, or <a href="/states/">browse by state</a>. New names are used here, such as Prayagraj, Ayodhya and Gurugram.</p>'; return; }
    out.innerHTML = '<p class="hint">' + hits.length + (hits.length === 1 ? ' match' : ' matches') + (hits.length > 40 ? ', showing the first 40' : '') + '.</p><ul class="ds-list">' + hits.slice(0, 40).map(function (x) {
      return '<li><a href="' + x[2] + '" data-go="' + esc(x[0] + ', ' + D.states[x[1]]) + '"><b>' + esc(x[0]) + '</b><small>' + esc(D.states[x[1]]) + (x[3] && norm(x[3]) !== norm(x[0]) ? ' · headquarters ' + esc(x[3]) : '') + '</small></a></li>';
    }).join('') + '</ul>';
  }
  function recent() {
    var list = SYG.recent('ds-recent');
    rec.hidden = !list.length;
    rec.innerHTML = list.length ? '<b>Looked at recently:</b> ' + list.map(function (x) { return '<a href="' + esc(x.u) + '">' + esc(x.t) + '</a>'; }).join('') : '';
  }
  function go() {
    if (D) return run();
    if (!wait) { out.innerHTML = '<div class="shim"></div>'; wait = SYG.json('/data/districts.json').then(function (j) { D = j; }); }
    wait.then(run, function () { out.innerHTML = '<p class="hint">The list could not be loaded. Check your connection and try again.</p>'; wait = null; });
  }
  q.addEventListener('input', go);
  d.addEventListener('click', function (e) { var a = e.target.closest('[data-go]'); if (a) SYG.recent('ds-recent', { u: a.getAttribute('href'), t: a.getAttribute('data-go') }); });
  var p = new URLSearchParams(location.search).get('q'); if (p) { q.value = p; go(); }
  recent();
})();
