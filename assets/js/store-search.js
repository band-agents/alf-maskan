/* Alf Maskan storefront — search and results.
   Enhancement only. Every card ships in the HTML, so with JavaScript off a
   buyer still sees all 9 units and can open any of them; this filters, sorts
   and lets them stack a comparison. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var grid = $('[data-grid]');
  if (!grid) return;

  var cards = $$('.st-card', grid);
  var q = $('[data-q]');
  var filters = $$('[data-f]');
  var sort = $('[data-sort]');
  var countEl = $('[data-count]');
  var mapCount = $('[data-map-count]');
  var empty = $('[data-empty]');
  var clearBtns = $$('[data-clear]');

  var d = function (card, key) { return card.getAttribute('data-' + key) || ''; };
  var n = function (card, key) { return parseFloat(d(card, key)) || 0; };

  /* ------------------------------------------------------------- filter */

  function state() {
    var s = { q: q ? q.value.trim().toLowerCase() : '' };
    filters.forEach(function (el) {
      s[el.getAttribute('data-f')] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return s;
  }

  function matches(card, s) {
    if (s.q) {
      var hay = (card.textContent + ' ' + d(card, 'compound') + ' ' + d(card, 'zone')).toLowerCase();
      if (hay.indexOf(s.q) === -1) return false;
    }
    if (s.purpose && d(card, 'purpose') !== s.purpose) return false;
    if (s.zone && d(card, 'zone') !== s.zone) return false;
    if (s.type && d(card, 'type') !== s.type) return false;
    if (s.delivery && d(card, 'delivery') !== s.delivery) return false;
    if (s.finish && d(card, 'finish') !== s.finish) return false;
    if (s.beds && n(card, 'beds') < parseFloat(s.beds)) return false;
    if (s.plan && d(card, 'plan') !== 'yes') return false;
    if (s.price) {
      var band = s.price.split('-');
      var p = n(card, 'price');
      if (p < parseFloat(band[0]) || p > parseFloat(band[1])) return false;
    }
    return true;
  }

  function activeCount(s) {
    var c = s.q ? 1 : 0;
    filters.forEach(function (el) {
      if (el.type === 'checkbox' ? el.checked : el.value) c++;
    });
    return c;
  }

  function render() {
    var s = state();
    var shown = 0;

    cards.forEach(function (card) {
      var ok = matches(card, s);
      card.hidden = !ok;
      if (ok) shown++;
      if (!ok) {
        var box = $('[data-compare]', card);
        if (box && box.checked) { box.checked = false; }
      }
    });

    if (countEl) countEl.textContent = String(shown);
    if (mapCount) mapCount.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
    grid.hidden = shown === 0;

    var active = activeCount(s);
    clearBtns.forEach(function (b) { if (b.hasAttribute('data-clear')) b.hidden = active === 0; });
    filters.forEach(function (el) {
      var pill = el.closest('.fpill');
      if (pill) pill.classList.toggle('fpill--on', el.type === 'checkbox' ? el.checked : !!el.value);
    });

    syncCompare();
  }

  /* --------------------------------------------------------------- sort */

  function applySort() {
    if (!sort) return;
    var mode = sort.value;
    var sorted = cards.slice().sort(function (a, b) {
      switch (mode) {
        case 'price-asc':  return n(a, 'price') - n(b, 'price');
        case 'price-desc': return n(b, 'price') - n(a, 'price');
        case 'area-desc':  return n(b, 'area') - n(a, 'area');
        default:           return n(b, 'added') - n(a, 'added');
      }
    });
    sorted.forEach(function (c) { grid.appendChild(c); });
  }

  if (sort) sort.addEventListener('change', applySort);

  /* ------------------------------------------------------------ compare */

  var bar = $('[data-compare-bar]');
  var barN = $('[data-compare-n]');
  var note = $('[data-compare-note]');

  function syncCompare() {
    var picked = $$('[data-compare]').filter(function (b) {
      return b.checked && !b.closest('.st-card').hidden;
    });
    if (barN) barN.textContent = String(picked.length);
    if (note) {
      note.hidden = picked.length === 0;
      note.textContent = picked.length + ' selected to compare';
    }
    // Comparison needs a pair, so the bar waits for the second tick.
    if (bar) bar.style.display = picked.length >= 2 ? 'flex' : 'none';
  }

  $$('[data-compare]').forEach(function (box) {
    box.addEventListener('change', syncCompare);
  });

  var compareClear = $('[data-compare-clear]');
  if (compareClear) {
    compareClear.addEventListener('click', function () {
      $$('[data-compare]').forEach(function (b) { b.checked = false; });
      syncCompare();
    });
  }

  /* ------------------------------------------------------------- inputs */

  if (q) q.addEventListener('input', render);
  filters.forEach(function (el) { el.addEventListener('change', render); });

  clearBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (q) q.value = '';
      filters.forEach(function (el) {
        if (el.type === 'checkbox') el.checked = false; else el.value = '';
      });
      render();
    });
  });

  /* The footer's zone links deep-link into a filtered search. */
  var zone = new URLSearchParams(location.search).get('zone');
  if (zone) {
    var zoneSel = $('[data-f="zone"]');
    if (zoneSel && Array.prototype.some.call(zoneSel.options, function (o) { return o.value === zone; })) {
      zoneSel.value = zone;
    }
  }

  render();
})();
