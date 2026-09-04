/* Alf Maskan storefront — unit detail page.
   Enhancement only. Without JavaScript the gallery panes are all in the DOM,
   the description is readable in both scripts, and the plan shows the seller's
   own headline terms. This adds the calculator, the gallery and the description switch.
   Saving a unit and the mobile menu live in store.js. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  // Western digits either way — Egyptian buyers read prices in 0–9 even in
  // Arabic copy — but the currency mark itself follows the page's language.
  var AR = document.documentElement.lang === 'ar';
  var egp = function (v) {
    var n = Math.round(v).toLocaleString('en-US');
    return AR ? n + ' ج.م' : 'EGP ' + n;
  };

  /* ------------------------------------------------ payment plan */

  var PRICE = 8450000;
  var down = $('#p-down');
  var years = $('#p-years');

  function plan() {
    if (!down || !years) return;
    var pct = Number(down.value);
    var yrs = Number(years.value);
    var downAmount = PRICE * pct / 100;
    var financed = PRICE - downAmount;
    var months = yrs * 12;
    // Flat split, no interest — that is how Egyptian developer plans are quoted,
    // and inventing a rate would put a wrong number in front of a buyer.
    var monthly = financed / months;

    $('[data-down-pct]').textContent = String(pct);
    $('[data-down-egp]').textContent = egp(downAmount);
    $('[data-years]').textContent = String(yrs);
    $('[data-monthly]').textContent = egp(monthly);
    $('[data-months]').textContent = AR
      ? months + ' قسط تبدأ عند الاستلام'
      : months + ' payments, starting on delivery';
    $('[data-bd-down]').textContent = egp(downAmount);
    $('[data-bd-financed]').textContent = egp(financed);

    var mini = $('[data-monthly-mini]');
    if (mini) mini.textContent = egp(monthly) + (AR ? '/شهر' : '/mo');
  }

  $$('[data-plan]').forEach(function (el) { el.addEventListener('input', plan); });
  plan();

  /* ------------------------------------------------ gallery */

  var tabs = $$('[data-gtab]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var want = tab.getAttribute('data-gtab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      $$('[data-gpane]').forEach(function (p) {
        p.hidden = p.getAttribute('data-gpane') !== want;
      });
    });
  });

  var stage = $('[data-gstage]');
  var thumbs = $$('[data-gpick]');
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (stage) stage.textContent = thumb.getAttribute('data-gpick');
      thumbs.forEach(function (t) { t.setAttribute('aria-current', String(t === thumb)); });
    });
  });

  /* ------------------------------------------------ description language */

  var dlangs = $$('[data-dlang]');
  dlangs.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var want = link.getAttribute('data-dlang');
      dlangs.forEach(function (l) {
        if (l === link) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
      $$('[data-dpane]').forEach(function (p) {
        p.hidden = p.getAttribute('data-dpane') !== want;
      });
    });
  });

})();
