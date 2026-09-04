/* Alf Maskan — audit log.
   Enhancement only: every entry is in the HTML. This filters, and keeps the
   count honest against what is on screen. */

(function () {
  'use strict';

  var log = document.querySelector('[data-audit]');
  if (!log) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var rows = $$('.auditrow', log);
  var q = $('[data-audit-q]');
  var filters = $$('[data-audit-filter]');
  var empty = $('[data-audit-empty]');
  var count = $('[data-audit-count]');

  function render() {
    var term = q ? q.value.trim().toLowerCase() : '';
    var who = ($('[data-audit-filter="who"]') || {}).value || '';
    var kind = ($('[data-audit-filter="kind"]') || {}).value || '';
    var shown = 0;

    rows.forEach(function (row) {
      var ok = (!who || row.getAttribute('data-who') === who) &&
               (!kind || row.getAttribute('data-kind') === kind) &&
               (!term || row.textContent.toLowerCase().indexOf(term) !== -1);
      row.hidden = !ok;
      if (ok) shown++;
    });

    if (count) count.textContent = String(shown);
    if (empty) empty.hidden = shown !== 0;
    log.hidden = shown === 0;

    filters.forEach(function (sel) {
      var pill = sel.closest('.fselect');
      if (pill) pill.classList.toggle('fselect--on', !!sel.value);
    });
  }

  if (q) q.addEventListener('input', render);
  filters.forEach(function (sel) { sel.addEventListener('change', render); });

  render();
})();
