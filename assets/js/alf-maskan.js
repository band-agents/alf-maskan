/* Alf Maskan marketing site — progressive enhancement only.
   Every page renders and reads correctly with this file absent; each block
   below upgrades something that already works (links, details/summary, form). */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------- mobile nav */

  var navToggle = $('[data-nav-toggle]');
  var siteNav = $('#siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    // Close after following an in-page link.
    siteNav.addEventListener('click', function (e) {
      if (e.target.closest('a') && siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
        siteNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------- FAQ
     <details> already opens on its own; this only enforces one-at-a-time. */

  var faq = $('[data-faq]');
  if (faq) {
    $$('details', faq).forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        $$('details', faq).forEach(function (other) { if (other !== d) other.open = false; });
      });
    });
  }

  /* ---------------------------------------------------------- pricing toggle
     Monthly EGP 990 vs annual EGP 9,900 (two months free). */

  var billing = $('[data-billing]');
  if (billing) {
    var setBilling = function (period) {
      $$('button', billing).forEach(function (b) {
        b.setAttribute('aria-selected', String(b.dataset.period === period));
      });
      $$('[data-price]').forEach(function (el) { el.textContent = el.dataset[period]; });
      $$('[data-price-note]').forEach(function (el) { el.textContent = el.dataset[period]; });
      $$('[data-billing-only]').forEach(function (el) {
        el.hidden = el.dataset.billingOnly !== period;
      });
    };
    billing.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-period]');
      if (btn) setBilling(btn.dataset.period);
    });
    setBilling($('button[aria-selected="true"]', billing) ? $('button[aria-selected="true"]', billing).dataset.period : 'monthly');
  }

  /* ---------------------------------------------------------- template gallery
     Filter by tag, free-text search, and sort. Cards are in the HTML already,
     so with JS off the visitor still sees all of them. */

  var gallery = $('[data-gallery]');
  if (gallery) {
    var cards = $$('[data-template]', gallery);
    var empty = $('[data-gallery-empty]');
    var countEl = $('[data-gallery-count]');
    var searchInput = $('[data-gallery-search]');
    var sortSelect = $('[data-gallery-sort]');
    var filterBar = $('[data-gallery-filters]');
    var state = { tag: 'all', q: '', sort: 'newest' };

    var apply = function () {
      var shown = 0;
      cards.forEach(function (card) {
        var tag = card.dataset.tag || '';
        var haystack = (card.dataset.name + ' ' + tag + ' ' + (card.dataset.blurb || '')).toLowerCase();
        var ok = (state.tag === 'all' || tag === state.tag) &&
                 (!state.q || haystack.indexOf(state.q) !== -1);
        card.hidden = !ok;
        if (ok) shown++;
      });

      var order = cards.slice().sort(function (a, b) {
        if (state.sort === 'name') return a.dataset.name.localeCompare(b.dataset.name);
        if (state.sort === 'popular') return Number(b.dataset.popularity) - Number(a.dataset.popularity);
        return Number(a.dataset.added) - Number(b.dataset.added); // newest = lowest index first
      });
      order.forEach(function (card) { gallery.appendChild(card); });
      // Keep the "request a template" card and the empty note last.
      var tail = $('[data-gallery-tail]', gallery);
      if (tail) gallery.appendChild(tail);
      if (empty) gallery.appendChild(empty);

      if (empty) empty.hidden = shown !== 0;
      if (countEl) countEl.textContent = String(shown);
    };

    if (filterBar) {
      filterBar.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-tag]');
        if (!btn) return;
        state.tag = btn.dataset.tag;
        $$('button[data-tag]', filterBar).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply();
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.q = searchInput.value.trim().toLowerCase();
        apply();
      });
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        state.sort = sortSelect.value;
        apply();
      });
    }

    // Deep link from the footer: templates.html?tag=Coastal
    var wanted = new URLSearchParams(location.search).get('tag');
    if (wanted) {
      var match = $('button[data-tag="' + CSS.escape(wanted) + '"]', filterBar);
      if (match) match.click();
    }
  }

  /* ---------------------------------------------------------- preview tabs
     Desktop / Mobile / Arabic on the template detail page. */

  var tabs = $('[data-tabs]');
  if (tabs) {
    var panes = $$('[data-pane]');
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      $$('button[data-tab]', tabs).forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
      });
      panes.forEach(function (p) { p.hidden = p.dataset.pane !== btn.dataset.tab; });
    });
  }

  /* ---------------------------------------------------------- signup form */

  var pwToggle = $('[data-password-toggle]');
  if (pwToggle) {
    var pwInput = $('#password');
    pwToggle.addEventListener('click', function () {
      var hidden = pwInput.type === 'password';
      pwInput.type = hidden ? 'text' : 'password';
      pwToggle.textContent = pwToggle.dataset[hidden ? 'hide' : 'show'];
    });
  }

  var pw = $('#password');
  var meter = $('[data-strength]');
  if (pw && meter) {
    var bars = $$('i', meter);
    var label = $('span', meter);
    var words = (meter.dataset.strength || 'Weak,Fair,Good,Strong').split(',');
    pw.addEventListener('input', function () {
      var v = pw.value;
      var score = 0;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) score++;
      if (!v) score = 0;
      bars.forEach(function (b, i) { b.classList.toggle('is-on', i < score); });
      label.textContent = v ? words[Math.max(0, score - 1)] : '';
    });
  }
})();
