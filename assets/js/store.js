/* Alf Maskan storefront — behaviour shared by every buyer-facing page.
   Loaded before the page-specific script. Enhancement only. */

(function () {
  'use strict';

  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  /* ------------------------------------------------------- mobile menu */

  var burger = document.querySelector('[data-store-burger]');
  var nav = document.querySelector('.st-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* --------------------------------------------------------- saved units
     Per-browser only. It never reaches the seller, and a private window or a
     second device starts empty — a convenience, never a record. Every access
     is wrapped because browsers set to block site data throw on read. */

  var KEY = 'am-saved-units';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* blocked */ }
  }

  var saved = read();

  $$('.st-card__save').forEach(function (btn, i) {
    var card = btn.closest('.st-card');
    var title = card && card.querySelector('.st-card__title');
    var id = title ? title.textContent.trim() : 'unit-' + i;

    if (saved.indexOf(id) !== -1) {
      btn.setAttribute('aria-pressed', 'true');
      var l = btn.querySelector('.visually-hidden');
      if (l) l.textContent = 'Saved. Remove from saved';
    }

    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      saved = read();
      var at = saved.indexOf(id);
      if (on && at === -1) saved.push(id);
      if (!on && at !== -1) saved.splice(at, 1);
      write(saved);
      var label = btn.querySelector('.visually-hidden');
      if (label) label.textContent = on ? 'Saved. Remove from saved' : 'Save this unit';
    });
  });
})();
