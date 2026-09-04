/* Alf Maskan — form behaviours shared by every long form in the app
   (listing editor, collections, settings).

   Enhancement only. Without JavaScript both language panes are still in the
   DOM and submittable; this just hides one at a time. */

(function () {
  'use strict';

  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* --------------------------------------------- Arabic / English switch
     One field, two scripts — not two fields. Switching keeps you in the same
     place in the form instead of scrolling past a duplicate. */

  $$('[data-lang-field]').forEach(function (field) {
    var tabs = $$('[data-lang-tab]', field);
    var panes = $$('[data-lang-pane]', field);
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var want = tab.getAttribute('data-lang-tab');
        tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
        panes.forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-lang-pane') !== want;
        });
        var pane = panes.filter(function (p) { return !p.hidden; })[0];
        var input = pane && pane.querySelector('input, textarea');
        if (input) input.focus();
      });
    });
  });

  /* --------------------------------------------- autosave chip
     Optimistic: the edit is already on screen, so the chip reports the save
     rather than gating the edit behind it. */

  var chip = document.querySelector('[data-savechip]');
  if (!chip) return;

  var text = document.querySelector('[data-savetext]');
  var timer = null;

  function saved(word) {
    clearTimeout(timer);
    chip.removeAttribute('data-dirty');
    text.textContent = word + ' · just now';
  }

  function touch() {
    chip.setAttribute('data-dirty', '');
    text.textContent = 'Unsaved changes';
    clearTimeout(timer);
    timer = setTimeout(function () { saved('Saved'); }, 1400);
  }

  document.addEventListener('input', touch);
  document.addEventListener('change', touch);

  // Other scripts mark the form dirty without reaching into this one.
  document.addEventListener('am:dirty', touch);

  $$('[data-publish]').forEach(function (btn) {
    btn.addEventListener('click', function () { saved(btn.getAttribute('data-publish-word') || 'Saved'); });
  });

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saved('Saved');
    }
  });
})();
