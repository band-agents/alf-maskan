/* Alf Maskan — listing editor.
   Enhancement only: with JavaScript off the form is a complete, submittable
   form with sensible pre-filled values. This adds the live preview, the payment
   calculator and gallery reordering. Language tabs and the autosave chip live
   in forms.js, which every long form in the app shares.

   The rule the whole editor follows: a control that claims to change something
   actually changes it, on screen, immediately. */

(function () {
  'use strict';

  var form = document.querySelector('[data-editor]');
  if (!form) return;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var egp = function (v) { return 'EGP ' + Math.round(v).toLocaleString('en-US'); };

  /* ------------------------------------------------ payment calculator */

  var price = $('#e-price');
  var down = $('#e-down');
  var years = $('#e-years');
  var area = $('#e-area');

  function calc() {
    var total = Number(price.value) || 0;
    var pct = Number(down.value) || 0;
    var yrs = Number(years.value) || 1;

    var downAmount = total * pct / 100;
    var financed = total - downAmount;
    var months = yrs * 12;
    // No interest: Egyptian developer plans are quoted as a flat split, and
    // inventing a rate here would put a wrong number in front of a buyer.
    var monthly = months ? financed / months : 0;

    $('[data-down-pct]').textContent = String(pct);
    $('[data-down-egp]').textContent = egp(downAmount);
    $('[data-years]').textContent = String(yrs);

    $('[data-monthly]').textContent = egp(monthly);
    $('[data-monthly-note]').textContent = months + ' payments after ' + egp(downAmount) + ' down';
    $('[data-bd-down]').textContent = egp(downAmount);
    $('[data-bd-financed]').textContent = egp(financed);
    $('[data-bd-years]').textContent = yrs + (yrs === 1 ? ' year' : ' years');

    var sqm = Number(area.value) || 0;
    $('[data-ppm]').value = sqm ? Math.round(total / sqm).toLocaleString('en-US') : '—';

    return { total: total, pct: pct, yrs: yrs, monthly: monthly };
  }

  /* ------------------------------------------------ live storefront card */

  function preview() {
    var c = calc();
    var set = function (key, text) {
      var el = $('[data-preview="' + key + '"]');
      if (el) el.textContent = text;
    };

    set('title', $('#e-title-en').value || 'Untitled unit');
    var compound = $('#e-compound').value;
    var zone = $('#e-zone').value;
    set('where', compound + ' · ' + zone);
    set('area', (area.value || '—') + ' m²');
    var beds = Number($('#e-beds').value) || 0;
    set('beds', beds ? beds + (beds === 1 ? ' bed' : ' bed') : 'Studio');
    set('type', $('#e-type').value);
    set('price', egp(c.total));
    set('plan', c.pct + '% down · ' + egp(c.monthly) + '/mo over ' + c.yrs +
      (c.yrs === 1 ? ' year' : ' years'));

    var badge = $('[data-preview-badge]');
    if (badge) badge.textContent = $('#e-type').value.toLowerCase() + ' · ' + compound + ' · 4:3';

    var featured = $('[data-live-featured]');
    var flag = $('[data-preview-featured]');
    if (featured && flag) flag.hidden = !featured.checked;
  }

  $$('[data-calc], [data-live], [data-live-featured]').forEach(function (el) {
    el.addEventListener('input', preview);
    el.addEventListener('change', preview);
  });

  /* ------------------------------------------------ SEO preview + counts */

  $$('[data-seo]').forEach(function (input) {
    var key = input.getAttribute('data-seo');
    var out = $('[data-serp="' + key + '"]');
    var count = $('[data-seo-count="' + key + '"]');
    var limit = key === 'title' ? 60 : 160;

    var sync = function () {
      if (out) out.textContent = input.value;
      if (count) {
        count.textContent = String(input.value.length);
        // Over the limit Google truncates, so the number turns red rather than
        // the field blocking you — it is a warning, not a rule.
        count.classList.toggle('is-over', input.value.length > limit);
      }
    };
    input.addEventListener('input', sync);
    sync();
  });

  /* ------------------------------------------------ amenity count */

  var amenities = $('[data-amenities]');
  if (amenities) {
    var amCount = $('[data-amenity-count]');
    var syncAm = function () {
      amCount.textContent = String($$('input:checked', amenities).length);
    };
    amenities.addEventListener('change', syncAm);
    syncAm();
  }

  /* ------------------------------------------------ gallery reorder */

  var gallery = $('[data-gallery]');
  if (gallery) {
    var dragged = null;

    gallery.addEventListener('dragstart', function (e) {
      dragged = e.target.closest('.gal__item');
      if (!dragged) return;
      dragged.setAttribute('data-dragging', '');
      e.dataTransfer.effectAllowed = 'move';
      // Firefox needs data set or the drag never starts.
      e.dataTransfer.setData('text/plain', '');
    });

    gallery.addEventListener('dragover', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var over = e.target.closest('.gal__item');
      $$('.gal__item', gallery).forEach(function (i) { i.removeAttribute('data-over'); });
      if (over && over !== dragged) over.setAttribute('data-over', '');
    });

    gallery.addEventListener('drop', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var over = e.target.closest('.gal__item');
      if (over && over !== dragged) {
        var items = $$('.gal__item', gallery);
        var from = items.indexOf(dragged);
        var to = items.indexOf(over);
        gallery.insertBefore(dragged, from < to ? over.nextSibling : over);
      }
      cleanupDrag();
    });

    gallery.addEventListener('dragend', cleanupDrag);

    function cleanupDrag() {
      $$('.gal__item', gallery).forEach(function (i) {
        i.removeAttribute('data-over');
        i.removeAttribute('data-dragging');
      });
      dragged = null;
      markCover();
      document.dispatchEvent(new Event('am:dirty'));
    }

    // Whichever photo is first is the cover. Moving one to the front is the
    // whole interaction, so the badge has to follow it.
    function markCover() {
      $$('.gal__item', gallery).forEach(function (item, i) {
        var badge = $('.gal__cover', item);
        if (i === 0 && !badge) {
          badge = document.createElement('span');
          badge.className = 'gal__cover';
          badge.textContent = 'Cover';
          item.insertBefore(badge, item.firstChild);
        } else if (i !== 0 && badge) {
          badge.remove();
        }
      });
      var first = $('.gal__item .ph', gallery);
      var badgeEl = $('[data-preview-badge]');
      if (first && badgeEl) badgeEl.textContent = first.textContent;
    }

    $$('.gal__del', gallery).forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.gal__item').remove();
        markCover();
        document.dispatchEvent(new Event('am:dirty'));
      });
    });
  }

  preview();
})();
