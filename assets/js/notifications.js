/* Alf Maskan — notifications.
   Enhancement only. The feed and the preference table are both complete in the
   HTML; this adds the tab switch, the two filters, and marking as read. */

(function () {
  'use strict';

  var feed = document.querySelector('[data-feed]');
  if (!feed) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var items = $$('.notif', feed);
  var empty = $('[data-feed-empty]');
  var typeSel = $('[data-nfilter]');
  var unreadBtn = $('[data-only-unread]');

  /* -------------------------------------------------------------- tabs */

  var tabs = $$('[data-ntab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var want = tab.getAttribute('data-ntab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      $$('[data-npane]').forEach(function (p) {
        p.hidden = p.getAttribute('data-npane') !== want;
      });
    });
  });

  /* ------------------------------------------------------------ filter */

  function render() {
    var type = typeSel ? typeSel.value : '';
    var onlyUnread = unreadBtn && unreadBtn.getAttribute('aria-pressed') === 'true';
    var shown = 0;

    items.forEach(function (item) {
      var ok = (!type || item.getAttribute('data-ntype') === type) &&
               (!onlyUnread || item.hasAttribute('data-unread'));
      item.hidden = !ok;
      if (ok) shown++;
    });

    if (empty) empty.hidden = shown !== 0;
    if (typeSel) {
      var pill = typeSel.closest('.fselect');
      if (pill) pill.classList.toggle('fselect--on', !!type);
    }
    count();
  }

  // Derived from the feed, so it can never disagree with the dots beside it.
  function count() {
    var unread = items.filter(function (i) { return i.hasAttribute('data-unread'); }).length;
    var out = $('[data-unread-n]');
    if (out) out.textContent = String(unread);

    var bell = document.querySelector('.icon-btn__dot');
    if (bell) bell.hidden = unread === 0;
  }

  if (typeSel) typeSel.addEventListener('change', render);

  if (unreadBtn) {
    unreadBtn.addEventListener('click', function () {
      var on = unreadBtn.getAttribute('aria-pressed') !== 'true';
      unreadBtn.setAttribute('aria-pressed', String(on));
      unreadBtn.classList.toggle('tool-btn--quiet', !on);
      render();
    });
  }

  /* -------------------------------------------------------- mark as read */

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      item.removeAttribute('data-unread');
      render();
    });
  });

  var markAll = $('[data-mark-all]');
  if (markAll) {
    markAll.addEventListener('click', function () {
      items.forEach(function (i) { i.removeAttribute('data-unread'); });
      render();
    });
  }

  render();
})();
