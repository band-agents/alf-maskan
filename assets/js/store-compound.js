/* Alf Maskan storefront — compound page.
   Enhancement only: the unit-type tabs filter cards that all ship in the HTML,
   so with JavaScript off a buyer sees every available unit in the compound. */

(function () {
  'use strict';

  var grid = document.querySelector('[data-ugrid]');
  if (!grid) return;

  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var cards = $$('.st-card', grid);
  var tabs = $$('[data-utab]');
  var empty = document.querySelector('[data-ugrid-empty]');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var want = tab.getAttribute('data-utab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });

      var shown = 0;
      cards.forEach(function (card) {
        var ok = want === 'all' || card.getAttribute('data-utype') === want;
        card.hidden = !ok;
        if (ok) shown++;
      });

      grid.hidden = shown === 0;
      if (empty) empty.hidden = shown !== 0;
    });
  });
})();
