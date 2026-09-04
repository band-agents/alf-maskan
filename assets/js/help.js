/* Alf Maskan — help.
   Enhancement only: every guide is a <details> in the HTML, readable and
   searchable by the browser's own find. This adds the tabs and the filter. */

(function () {
  'use strict';

  var list = document.querySelector('[data-help-list]');
  if (!list) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var tabs = $$('[data-htab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var want = tab.getAttribute('data-htab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      $$('[data-hpane]').forEach(function (p) {
        p.hidden = p.getAttribute('data-hpane') !== want;
      });
    });
  });

  var guides = $$('.fset', list);
  var q = $('[data-help-q]');
  var topic = $('[data-help-topic]');
  var empty = $('[data-help-empty]');
  var count = $('[data-help-count]');

  function render() {
    var term = q ? q.value.trim().toLowerCase() : '';
    var want = topic ? topic.value : '';
    var shown = 0;

    guides.forEach(function (g) {
      var ok = (!want || g.getAttribute('data-topic') === want) &&
               (!term || g.textContent.toLowerCase().indexOf(term) !== -1);
      g.hidden = !ok;
      // Searching should show you the answer, not make you click again.
      g.open = ok && !!term;
      if (ok) shown++;
    });

    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
    list.hidden = shown === 0;
    if (topic) topic.closest('.fselect').classList.toggle('fselect--on', !!want);
  }

  if (q) q.addEventListener('input', render);
  if (topic) topic.addEventListener('change', render);
  render();
})();
