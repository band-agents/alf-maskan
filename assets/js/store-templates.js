/* Alf Maskan storefront — the template gallery.
   Enhancement only: all ten tiles are in the HTML. This filters by style. */

(function () {
  'use strict';

  var gallery = document.querySelector('[data-tpl-gallery]');
  if (!gallery) return;

  var sel = document.querySelector('[data-tpl-filter]');
  var count = document.querySelector('[data-tpl-count]');
  var empty = document.querySelector('[data-tpl-empty]');
  var tiles = Array.prototype.slice.call(gallery.querySelectorAll('.tplframe'));

  if (!sel) return;

  sel.addEventListener('change', function () {
    var want = sel.value.toLowerCase();
    var shown = 0;

    tiles.forEach(function (tile) {
      // The tags printed on the tile are the filter's only source, so the
      // count and the chips can never disagree.
      var tags = Array.prototype.slice.call(tile.querySelectorAll('.tplmeta__tags i'))
        .map(function (i) { return i.textContent.trim().toLowerCase(); });
      var ok = !want || tags.indexOf(want) !== -1;
      tile.hidden = !ok;
      if (ok) shown++;
    });

    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
    gallery.hidden = shown === 0;
    sel.closest('.fpill').classList.toggle('fpill--on', !!sel.value);
  });
})();
