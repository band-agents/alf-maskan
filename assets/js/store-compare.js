/* Alf Maskan storefront — compare.
   Enhancement only. Without JavaScript the table is a complete, readable
   comparison; this dims the rows that are identical across every unit and
   flags the extreme in each numeric row, so attention lands on what varies. */

(function () {
  'use strict';

  var table = document.querySelector('[data-compare-table]');
  if (!table) return;

  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  // "Lowest" and "Largest" are facts. "Best" is not — a bigger unit is not
  // better if you cannot carry the instalment, so the labels stay factual.
  var LABEL = { low: 'Lowest', high: 'Largest' };
  var LABEL_BY_ROW = {
    monthly: { low: 'Lowest monthly' },
    area: { high: 'Largest' },
    beds: { high: 'Most' },
    maint: { low: 'Lowest' },
    down: { low: 'Lowest' },
    ppm: { low: 'Best value per m²' }
  };

  function mark() {
    var rows = $$('tbody tr', table);

    rows.forEach(function (row) {
      var cells = $$('td', row).filter(function (c) { return !c.hidden; });
      if (cells.length < 2) { row.removeAttribute('data-same'); return; }

      var values = cells.map(function (c) { return c.getAttribute('data-v'); });
      var hasValues = values.every(function (v) { return v !== null; });
      if (!hasValues) { row.removeAttribute('data-same'); return; }

      var differs = values.some(function (v) { return v !== values[0]; });
      if (differs) row.removeAttribute('data-same'); else row.setAttribute('data-same', '');

      // Clear any flag from a previous pass before re-flagging.
      $$('.cmp__best', row).forEach(function (b) { b.remove(); });

      var best = row.getAttribute('data-best');
      if (!best || !differs) return;

      var nums = values.map(Number);
      if (nums.some(isNaN)) return;

      var target = best === 'low' ? Math.min.apply(null, nums) : Math.max.apply(null, nums);
      // A flag is only informative if exactly one unit wins it.
      if (nums.filter(function (n) { return n === target; }).length !== 1) return;

      var winner = cells[nums.indexOf(target)];
      var key = row.getAttribute('data-row');
      var text = (LABEL_BY_ROW[key] && LABEL_BY_ROW[key][best]) || LABEL[best];

      var flag = document.createElement('span');
      flag.className = 'cmp__best';
      flag.textContent = text;
      var anchor = winner.querySelector('b') || winner;
      anchor.appendChild(flag);
    });

    summarise(rows);
  }

  function summarise(rows) {
    var out = document.querySelector('[data-summary]');
    if (!out) return;
    var total = rows.filter(function (r) { return r.getAttribute('data-row') !== 'cta'; }).length;
    var same = rows.filter(function (r) {
      return r.hasAttribute('data-same') && r.getAttribute('data-row') !== 'cta';
    }).length;
    var differing = total - same;
    out.textContent = differing + ' of ' + total + ' rows differ between these units. The ' +
      'other ' + same + (same === 1 ? ' is' : ' are') + ' the same for all of them, greyed above.';
  }

  /* Removing a column has to take the header and every cell in that position. */
  $$('[data-drop]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var th = btn.closest('th');
      var index = $$('thead th', table).indexOf(th);
      if (index < 0) return;

      th.hidden = true;
      $$('tbody tr', table).forEach(function (row) {
        var cell = $$('td', row)[index];
        if (cell) cell.hidden = true;
      });
      mark();
    });
  });

  mark();
})();
