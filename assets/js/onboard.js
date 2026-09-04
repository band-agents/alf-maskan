/* Alf Maskan — onboarding.
   Enhancement only. Every step is a real form with sensible defaults and a
   Continue link, so the whole flow works with JavaScript off. This adds the
   language flip, the live preview, the contrast check and the CSV pane switch. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  /* ------------------------------------------------- step 1: language */

  $$('[data-ui-lang]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var ar = radio.value === 'ar';
      // Picking العربية mirrors the flow immediately — the point is that you
      // see what your team will see before you commit to it. The artboard's
      // RTL board translates the copy too, not just the direction, so swap
      // every [data-i18n] string and let the Arabic option lead.
      document.body.dir = ar ? 'rtl' : 'ltr';
      document.documentElement.lang = ar ? 'ar' : 'en';

      $$('[data-i18n]').forEach(function (el) {
        if (!el.dataset.en) el.dataset.en = el.textContent.trim();
        el.textContent = ar ? el.dataset.ar : el.dataset.en;
        el.lang = ar ? 'ar' : 'en';
      });

      var choices = $('[data-lang-choices]');
      if (choices) {
        // order:-1 puts the chosen language first without moving it in the DOM,
        // so the radio group's reading order still matches the visual order.
        var en = $('[data-lang-choice="en"]', choices);
        var arEl = $('[data-lang-choice="ar"]', choices);
        if (en && arEl) { en.style.order = ar ? '1' : '0'; arEl.style.order = ar ? '0' : '1'; }
      }

      var note = $('[data-lang-note]');
      if (note) {
        note.textContent = ar
          ? 'اخترت العربية — الإعداد كله اتقلب من اليمين لليسار. تقدر تغيّر الاتنين بعدين من الإعدادات.'
          : 'You can change both later in Settings. Picking العربية flips this whole setup to right-to-left straight away, so you see what your team will see.';
        note.lang = ar ? 'ar' : 'en';
        note.style.fontFamily = ar ? 'var(--font-arabic)' : '';
      }
    });
  });

  $$('[data-store-lang] button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-store-lang] button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
    });
  });

  /* --------------------------------------------- step 3: live preview */

  var bizName = $('[data-biz-name]');
  if (bizName) {
    var sync = function () {
      var name = bizName.value.trim() || 'Your business';
      var out = $('[data-sf-name]');
      if (out) out.textContent = name;

      // Initials for the logo tile: first letter of the first two words.
      var initials = name.split(/\s+/).slice(0, 2).map(function (w) {
        return w.charAt(0).toUpperCase();
      }).join('');
      var logo = $('[data-sf-logo]');
      if (logo) logo.textContent = initials || 'A';
    };
    bizName.addEventListener('input', sync);
    sync();
  }

  var areas = $('[data-areas]');
  if (areas) {
    var count = function () {
      var n = $$('input:checked', areas).length;
      var out = $('[data-area-count]');
      if (out) out.textContent = String(n);

      // The hero line names the first area they picked, so the preview is
      // theirs rather than a generic mock-up.
      var first = $$('input:checked', areas)[0];
      var hero = $('[data-sf-hero]');
      if (first && hero) {
        hero.textContent = 'Find your unit in ' + first.closest('label').textContent.trim();
      }
    };
    areas.addEventListener('change', count);
    count();
  }

  /* ------------------------------------------ step 4: brand + contrast */

  // Relative luminance, then contrast against white. Same maths a checker uses.
  function luminance(hex) {
    var c = hex.replace('#', '');
    var rgb = [0, 2, 4].map(function (i) {
      var v = parseInt(c.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function contrastOnWhite(hex) {
    return (1.05) / (luminance(hex) + 0.05);
  }

  function applyBrand(hex) {
    $$('[data-sf-logo], [data-sf-btn]').forEach(function (el) { el.style.background = hex; });

    var note = $('[data-contrast]');
    var text = $('[data-contrast-text]');
    if (!note || !text) return;

    var ratio = contrastOnWhite(hex);
    var pass = ratio >= 4.5;
    note.className = 'contrast-note contrast-note--' + (pass ? 'ok' : 'warn');
    text.innerHTML = pass
      ? '<b>White text on this colour passes.</b> Contrast ' + ratio.toFixed(1) + ':1 — comfortable at any size.'
      : '<b>White text on this colour is hard to read.</b> Contrast ' + ratio.toFixed(1) +
        ':1, under the 4.5:1 floor. Buttons will still work, but some buyers will struggle. Try a darker shade.';
  }

  $$('[data-swatches] .swatch[data-hex]').forEach(function (sw) {
    sw.addEventListener('click', function () {
      $$('[data-swatches] .swatch').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
      sw.setAttribute('aria-pressed', 'true');
      applyBrand(sw.getAttribute('data-hex'));
    });
  });

  var custom = $('[data-custom-colour]');
  if (custom) {
    custom.addEventListener('input', function () {
      $$('[data-swatches] .swatch').forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
      applyBrand(custom.value);
    });
  }

  $$('[data-font]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      var family = radio.value === 'plex'
        ? "'IBM Plex Sans Arabic', sans-serif"
        : 'Tajawal, sans-serif';
      $$('[data-sf-name], [data-sf-hero]').forEach(function (el) { el.style.fontFamily = family; });
    });
  });

  /* ------------------------------------------------- step 5: templates */

  var tfilter = $('[data-tfilter]');
  if (tfilter) {
    tfilter.addEventListener('change', function () {
      var want = tfilter.value;
      var shown = 0;
      $$('[data-tgrid] .tcard').forEach(function (card) {
        var ok = !want || card.getAttribute('data-style') === want;
        card.hidden = !ok;
        if (ok) shown++;
      });
      var count = $('[data-tcount]');
      if (count) count.textContent = String(shown);
      var grid = $('[data-tgrid]');
      var empty = $('[data-tempty]');
      if (grid) grid.hidden = shown === 0;
      if (empty) empty.hidden = shown !== 0;
      tfilter.closest('.fselect').classList.toggle('fselect--on', !!want);
    });
  }

  /* --------------------------------------------------- step 6: domain */

  var domain = $('[data-domain]');
  if (domain) {
    // A handful of names are already taken, so the check can actually fail —
    // an availability check that always says yes teaches nothing.
    var TAKEN = ['kamal', 'estates', 'test', 'demo', 'admin', 'sodic', 'mivida'];

    var check = function () {
      var value = domain.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (value !== domain.value) domain.value = value;

      var avail = $('[data-avail]');
      var text = $('[data-avail-text]');
      var full = (value || 'yourname') + '.alfmaskan.com';

      $$('[data-sf-url], [data-wa-url]').forEach(function (el) { el.textContent = full; });

      if (!value) {
        avail.className = 'availability availability--checking';
        text.textContent = 'Type something to check it';
        return;
      }
      if (value.length < 3) {
        avail.className = 'availability availability--taken';
        text.textContent = 'Too short — at least three characters';
        return;
      }
      var taken = TAKEN.indexOf(value) !== -1;
      avail.className = 'availability availability--' + (taken ? 'taken' : 'free');
      text.textContent = taken
        ? full + ' is already taken — try adding your area, like ' + value + '-newcairo'
        : full + ' is free';
    };

    domain.addEventListener('input', check);
    check();
  }

  /* ----------------------------------------------- step 7: how to add */

  $$('[data-how]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      $$('[data-howpane]').forEach(function (pane) {
        pane.hidden = pane.getAttribute('data-howpane') !== radio.value;
      });
      var cta = $('[data-unit-cta]');
      if (cta) {
        cta.textContent = radio.value === 'csv' ? 'Import 34 units'
          : radio.value === 'portal' ? 'Fetch and publish'
          : 'Save and publish';
      }
    });
  });

  /* --------------------------------------------------- step 8: copy */

  var copyBtn = $('[data-copy-url]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = $('[data-live-url]').textContent.trim();
      var done = function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        done();
      }
    });
  }
})();
