/* Alf Maskan — analytics.
   Enhancement only. Every figure is in the HTML, so the report reads with
   JavaScript off. This switches the date range, which is the one control that
   changes what the numbers mean. */

(function () {
  'use strict';

  var seg = document.querySelector('[data-range]');
  if (!seg) return;

  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  // Deterministic sample figures per range, so switching never shows a number
  // that contradicts the one beside it. Swap for the API and the rest holds.
  var DATA = {
    7:   { visits: 4102,  views: 2180, leads: 29,  label: '28 August – 3 September 2026 · compared with the previous 7 days' },
    30:  { visits: 18204, views: 9318, leads: 125, label: '1 August – 3 September 2026 · compared with the previous 34 days' },
    90:  { visits: 51660, views: 26440, leads: 342, label: '5 June – 3 September 2026 · compared with the previous 90 days' },
    365: { visits: 196300, views: 98120, leads: 1284, label: '3 September 2025 – 3 September 2026 · compared with the year before' }
  };

  var out = {
    visits: document.querySelector('[data-kpi="visits"]'),
    views: document.querySelector('[data-kpi="views"]'),
    leads: document.querySelector('[data-kpi="leads"]'),
    ratio: document.querySelector('[data-kpi="ratio"]')
  };
  var caption = document.querySelector('.page-head p');

  $$('[data-range-btn]', seg).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-range-btn');
      var d = DATA[key];
      if (!d) return;

      $$('[data-range-btn]', seg).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });

      out.visits.textContent = d.visits.toLocaleString('en-US');
      out.views.textContent = d.views.toLocaleString('en-US');
      out.leads.textContent = d.leads.toLocaleString('en-US');
      // Derived, never authored — it can only ever agree with the two above it.
      out.ratio.textContent = Math.round(d.views / d.leads).toLocaleString('en-US');
      if (caption) caption.textContent = d.label;
    });
  });
})();
