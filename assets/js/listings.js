/* Alf Maskan — listings index.
   Enhancement only. Without JavaScript the page is a complete, readable table;
   this adds filtering, sorting, selection and the grid view on top of it.

   The table is the single source of truth. The grid view is rendered from the
   same rows, so the two can never disagree. */

(function () {
  'use strict';

  var table = document.querySelector('[data-listings]');
  if (!table) return;

  var tbody = table.tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);
  var grid = document.querySelector('[data-grid]');
  var wrap = document.querySelector('[data-table-wrap]');
  var empty = document.querySelector('[data-empty]');
  var countEl = document.querySelector('[data-count]');
  var resultline = countEl && countEl.closest('.resultline');
  var chipsEl = document.querySelector('[data-chips]');
  var pager = document.querySelector('.pager');
  var q = document.querySelector('[data-q]');
  var selects = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var views = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  var clearBtns = Array.prototype.slice.call(document.querySelectorAll('[data-clear]'));

  var state = { view: 'all', q: '', filters: {}, sort: null, dir: 1, density: 'table' };

  var LABELS = {
    status: 'Status', purpose: 'Purpose', zone: 'Zone', type: 'Type',
    beds: 'Beds', compound: 'Compound', price: 'Price', delivery: 'Delivery',
    agent: 'Agent'
  };

  var d = function (row, key) { return row.getAttribute('data-' + key) || ''; };
  var n = function (row, key) { return parseFloat(d(row, key)) || 0; };
  var money = function (v) { return 'EGP ' + Number(v).toLocaleString('en-US'); };

  /* ---------------------------------------------------------------- filter */

  // Saved views. "Needs photos" and "Price drop candidates" are rules, not
  // stored lists — the same rules the server would run over all 42 units.
  function inView(row) {
    switch (state.view) {
      case 'live':      return d(row, 'status') === 'live';
      case 'photos':    return n(row, 'photos') < 3;
      case 'pricedrop': return d(row, 'status') === 'live' && n(row, 'views') >= 300 && n(row, 'leads') <= 4;
      default:          return true;
    }
  }

  function matches(row) {
    if (!inView(row)) return false;

    if (state.q) {
      var hay = (d(row, 'title') + ' ' + d(row, 'ar') + ' ' + d(row, 'ref') + ' ' +
                 d(row, 'compound') + ' ' + d(row, 'zone') + ' ' + d(row, 'type')).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }

    for (var key in state.filters) {
      var want = state.filters[key];
      if (!want) continue;

      if (key === 'beds') {
        if (n(row, 'beds') < parseFloat(want)) return false;
      } else if (key === 'price') {
        var band = want.split('-');
        var p = n(row, 'price');
        if (p < parseFloat(band[0]) || p > parseFloat(band[1])) return false;
      } else if (d(row, key).toLowerCase() !== want.toLowerCase()) {
        return false;
      }
    }
    return true;
  }

  function activeFilterCount() {
    var c = state.q ? 1 : 0;
    for (var k in state.filters) if (state.filters[k]) c++;
    return c;
  }

  /* ---------------------------------------------------------------- render */

  function render() {
    var shown = 0;

    rows.forEach(function (row) {
      var ok = matches(row);
      row.hidden = !ok;
      if (ok) shown++;
      // A hidden row must not stay selected — it would be acted on invisibly.
      if (!ok) {
        var box = row.querySelector('[data-row-check]');
        if (box && box.checked) { box.checked = false; row.removeAttribute('data-selected'); }
      }
    });

    if (countEl) countEl.textContent = String(shown);

    // With no filter this is page 1 of 42 units. With one, it is a search over
    // the rows on this page, so the "of 42" and the pager would both be lies.
    var filtering = activeFilterCount() > 0 || state.view !== 'all';
    if (resultline) {
      var label = resultline.firstElementChild;
      if (label) {
        label.innerHTML = filtering
          ? '<b data-count>' + shown + '</b> matching on this page'
          : '<b data-count>' + shown + '</b> of <b>42</b> units';
      }
      countEl = resultline.querySelector('[data-count]');
    }
    if (pager) pager.hidden = filtering;

    if (empty) empty.hidden = shown !== 0;
    if (wrap) wrap.hidden = shown === 0 || state.density !== 'table';
    if (grid) grid.hidden = shown === 0 || state.density !== 'grid';

    clearBtns.forEach(function (b) { if (b.classList.contains('tool-btn')) b.hidden = !filtering; });

    renderChips();
    if (state.density === 'grid') renderGrid();
    syncBulk();
  }

  function renderChips() {
    if (!chipsEl) return;
    chipsEl.textContent = '';
    Object.keys(state.filters).forEach(function (key) {
      var val = state.filters[key];
      if (!val) return;
      var sel = document.querySelector('[data-filter="' + key + '"]');
      var text = sel ? sel.options[sel.selectedIndex].text : val;

      var chip = document.createElement('span');
      chip.className = 'fchip';
      chip.appendChild(document.createTextNode((LABELS[key] || key) + ': ' + text));

      var x = document.createElement('button');
      x.type = 'button';
      x.innerHTML = '<svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      x.appendChild(Object.assign(document.createElement('span'), {
        className: 'visually-hidden', textContent: 'Remove ' + (LABELS[key] || key) + ' filter'
      }));
      x.addEventListener('click', function () {
        state.filters[key] = '';
        if (sel) { sel.value = ''; sel.parentNode.classList.remove('fselect--on'); }
        render();
      });

      chip.appendChild(x);
      chipsEl.appendChild(chip);
    });
  }

  /* ------------------------------------------------------------ grid view */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderGrid() {
    if (!grid) return;
    grid.textContent = '';

    rows.filter(function (r) { return !r.hidden; }).forEach(function (row) {
      var card = el('article', 'ucard');

      var media = el('div', 'ucard__media');
      var ph = el('div', 'ph');
      ph.setAttribute('aria-hidden', 'true');
      ph.textContent = d(row, 'type').toLowerCase() + ' · ' + d(row, 'compound') + ' · 4:3';
      media.appendChild(ph);

      var flags = el('div', 'ucard__flags');
      var status = d(row, 'status');
      flags.appendChild(el('span', 'st st--' + status, status.charAt(0).toUpperCase() + status.slice(1)));
      if (n(row, 'photos') < 3) flags.appendChild(el('span', 'badge badge--sand', 'Needs photos'));
      media.appendChild(flags);
      card.appendChild(media);

      var body = el('div', 'ucard__body');

      var link = el('a', 'ucard__title', d(row, 'title'));
      link.href = row.querySelector('.cell-unit__title').getAttribute('href');
      body.appendChild(link);

      var ar = el('div', 'cell-unit__ar', d(row, 'ar'));
      ar.lang = 'ar';
      ar.dir = 'rtl';
      body.appendChild(ar);

      var compound = d(row, 'compound');
      body.appendChild(el('div', 'ucard__where',
        d(row, 'zone') + (compound && compound !== '—' ? ' · ' + compound : '')));

      var specs = el('div', 'ucard__specs');
      specs.appendChild(el('span', null, d(row, 'area') + ' m²'));
      if (n(row, 'beds')) specs.appendChild(el('span', null, d(row, 'beds') + ' bed'));
      specs.appendChild(el('span', null, d(row, 'ref')));
      body.appendChild(specs);

      body.appendChild(el('div', 'ucard__price', money(d(row, 'price'))));
      body.appendChild(el('div', 'ucard__plan', d(row, 'plan')));

      var foot = el('div', 'ucard__foot');
      var av = el('span', 'avatar avatar--sm');
      av.title = d(row, 'agent');
      foot.appendChild(av);
      foot.appendChild(el('span', null, d(row, 'updated')));
      var stats = el('span', 'ucard__stats');
      stats.appendChild(el('span', null, d(row, 'views') + ' views'));
      stats.appendChild(el('span', null, d(row, 'leads') + ' leads'));
      foot.appendChild(stats);
      body.appendChild(foot);

      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* --------------------------------------------------------------- sorting */

  var sortBtns = Array.prototype.slice.call(table.querySelectorAll('[data-sort]'));
  sortBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-sort');
      state.dir = state.sort === key ? -state.dir : 1;
      state.sort = key;

      table.querySelectorAll('th[aria-sort]').forEach(function (th) { th.setAttribute('aria-sort', 'none'); });
      btn.closest('th').setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');

      var numeric = key !== 'title';
      rows.sort(function (a, b) {
        var av = numeric ? n(a, key) : d(a, key).toLowerCase();
        var bv = numeric ? n(b, key) : d(b, key).toLowerCase();
        if (av < bv) return -state.dir;
        if (av > bv) return state.dir;
        return 0;
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
      if (state.density === 'grid') renderGrid();
    });
  });

  /* ------------------------------------------------------------- selection */

  var checkAll = document.querySelector('[data-check-all]');
  var bulkbar = document.querySelector('[data-bulkbar]');
  var bulkN = document.querySelector('[data-bulk-n]');

  function syncBulk() {
    var visible = rows.filter(function (r) { return !r.hidden; });
    var picked = visible.filter(function (r) {
      var b = r.querySelector('[data-row-check]');
      return b && b.checked;
    });

    if (bulkbar) bulkbar.hidden = picked.length === 0;
    if (bulkN) bulkN.textContent = String(picked.length);
    if (checkAll) {
      checkAll.checked = picked.length > 0 && picked.length === visible.length;
      checkAll.indeterminate = picked.length > 0 && picked.length < visible.length;
    }
  }

  rows.forEach(function (row) {
    var box = row.querySelector('[data-row-check]');
    if (!box) return;
    box.addEventListener('change', function () {
      if (box.checked) row.setAttribute('data-selected', ''); else row.removeAttribute('data-selected');
      syncBulk();
    });
  });

  if (checkAll) {
    checkAll.addEventListener('change', function () {
      rows.filter(function (r) { return !r.hidden; }).forEach(function (row) {
        var box = row.querySelector('[data-row-check]');
        if (!box) return;
        box.checked = checkAll.checked;
        if (box.checked) row.setAttribute('data-selected', ''); else row.removeAttribute('data-selected');
      });
      syncBulk();
    });
  }

  var bulkClear = document.querySelector('[data-bulk-clear]');
  if (bulkClear) {
    bulkClear.addEventListener('click', function () {
      rows.forEach(function (row) {
        var box = row.querySelector('[data-row-check]');
        if (box) box.checked = false;
        row.removeAttribute('data-selected');
      });
      syncBulk();
    });
  }

  /* ---------------------------------------------------------------- inputs */

  if (q) {
    q.addEventListener('input', function () {
      state.q = q.value.trim().toLowerCase();
      render();
    });
  }

  selects.forEach(function (sel) {
    var key = sel.getAttribute('data-filter');
    state.filters[key] = '';
    sel.addEventListener('change', function () {
      state.filters[key] = sel.value;
      sel.parentNode.classList.toggle('fselect--on', !!sel.value);
      render();
    });
  });

  views.forEach(function (btn) {
    btn.addEventListener('click', function () {
      views.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      state.view = btn.getAttribute('data-view');
      render();
    });
  });

  clearBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.q = '';
      if (q) q.value = '';
      selects.forEach(function (sel) {
        sel.value = '';
        state.filters[sel.getAttribute('data-filter')] = '';
        sel.parentNode.classList.remove('fselect--on');
      });
      views.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-view') === 'all')); });
      state.view = 'all';
      render();
    });
  });

  var moreBtn = document.querySelector('[data-more-filters]');
  var morePanel = document.getElementById('more-filters');
  if (moreBtn && morePanel) {
    moreBtn.addEventListener('click', function () {
      var open = morePanel.hidden;
      morePanel.hidden = !open;
      moreBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ------------------------------------------------------- table vs grid */

  var seg = document.querySelector('[data-density]');
  if (seg && grid) {
    seg.hidden = false;   // only useful with JS, so it ships hidden
    seg.querySelectorAll('[data-density-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.density = btn.getAttribute('data-density-btn');
        seg.querySelectorAll('[data-density-btn]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        render();
      });
    });
  }

  /* The drafts sub-nav link deep-links into the Needs-photos view. */
  if (location.hash === '#drafts') {
    var draftView = document.querySelector('[data-view="photos"]');
    if (draftView) draftView.click();
  }

  render();
})();
