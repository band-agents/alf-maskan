/* Alf Maskan — marketing.
   Enhancement only. Without JavaScript all three panes are in the DOM and every
   form is submittable; this adds the tab switch and makes the previews follow
   what you type, so nothing on screen is a picture of a thing that does not
   match the settings above it. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var egp = function (v) { return 'EGP ' + Math.round(v).toLocaleString('en-US'); };

  /* -------------------------------------------------------------- tabs */

  var tabs = $$('[data-mtab]');
  var panes = $$('[data-mpane]');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var want = tab.getAttribute('data-mtab');
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-mpane') !== want; });
    });
  });

  // Without this a pane hidden on load never gets its first render.
  function ready(fn) { fn(); }

  /* ------------------------------------------------------------ offers */

  var UNIT_PRICE = 8450000;
  var UNIT_DOWN_PCT = 10;

  function offer() {
    var badge = $('[data-badge]');
    if (!badge) return;

    var style = $('[data-offer-badge]').value;
    badge.className = 'offer-badge offer-badge--' + style;
    badge.textContent = $('[data-offer-text]').value || 'OFFER';

    var kind = $('[data-offer-kind]').value;
    var amount = Number($('[data-offer-amount]').value) || 0;
    var unit = $('[data-offer-unit]');
    // Years is a count, not a percentage — the suffix has to follow the kind.
    unit.textContent = kind === 'years' ? 'yrs' : kind === 'finish' ? 'EGP' : '%';

    var was = $('[data-was]');
    var down = UNIT_PRICE * UNIT_DOWN_PCT / 100;
    if (kind === 'down') {
      var after = down * (1 - amount / 100);
      was.innerHTML = 'Down payment ' + egp(down) + ' → <b style="color:var(--accent-2-ink);text-decoration:none">' + egp(after) + '</b>';
    } else if (kind === 'price') {
      var newPrice = UNIT_PRICE * (1 - amount / 100);
      was.innerHTML = egp(UNIT_PRICE) + ' → <b style="color:var(--accent-2-ink);text-decoration:none">' + egp(newPrice) + '</b>';
    } else if (kind === 'years') {
      was.innerHTML = '<b style="color:var(--accent-2-ink);text-decoration:none">' + amount + ' extra years on the plan</b>';
    } else {
      was.innerHTML = '<b style="color:var(--accent-2-ink);text-decoration:none">Finishing included, worth ' + egp(amount) + '</b>';
    }

    var countdown = $('[data-countdown]');
    var on = $('[data-offer-countdown]').checked;
    countdown.hidden = !on;
    if (on) {
      var end = new Date($('[data-offer-end]').value);
      var days = Math.max(0, Math.ceil((end - new Date('2026-09-03')) / 86400000));
      $('[data-countdown-days]').textContent = days + (days === 1 ? ' day' : ' days');
    }

    var picked = $$('[data-offer-picker] input:checked').length;
    var out = $('[data-offer-units]');
    if (out) out.textContent = String(picked);
  }

  $$('[data-offer-badge], [data-offer-text], [data-offer-kind], [data-offer-amount], [data-offer-countdown], [data-offer-end]')
    .forEach(function (el) {
      el.addEventListener('input', offer);
      el.addEventListener('change', offer);
    });
  var picker = $('[data-offer-picker]');
  if (picker) picker.addEventListener('change', offer);

  /* -------------------------------------------------------- broadcasts */

  function broadcast() {
    var seg = $('[data-bc-segment]');
    if (!seg) return;

    var n = seg.value;
    $$('[data-bc-count]').forEach(function (el) { el.textContent = n; });
    $('[data-bc-note]').textContent = seg.options[seg.selectedIndex].text.replace(/\s*\(\d+\)$/, '') +
      ', minus anyone who opted out.';

    // The pane you are typing in is the one that counts.
    var pane = $$('[data-mpane="broadcasts"] [data-lang-pane]').filter(function (p) { return !p.hidden; })[0];
    var box = pane && $('[data-bc-msg]', pane);
    if (box) {
      var bubble = $('[data-bc-bubble]');
      bubble.textContent = box.value;
      bubble.dir = pane.getAttribute('data-lang-pane') === 'ar' ? 'rtl' : 'ltr';
      var chars = $('[data-bc-chars]');
      chars.textContent = String(box.value.length);
      chars.classList.toggle('is-over', box.value.length > 300);
    }

    var unit = $('[data-bc-unit]');
    var card = $('[data-bc-card]');
    if (unit && card) {
      card.hidden = unit.value === '';
      if (!card.hidden) {
        var label = unit.options[unit.selectedIndex].text;
        $('[data-bc-card-title]').textContent = label.split('—')[0].trim();
        $('[data-bc-card-ph]').textContent = label.split('—').pop().trim().toLowerCase() + ' · 16:9';
      }
    }
  }

  $$('[data-bc-segment], [data-bc-msg], [data-bc-unit]').forEach(function (el) {
    el.addEventListener('input', broadcast);
    el.addEventListener('change', broadcast);
  });
  // Switching script switches which box the preview reads from.
  $$('[data-mpane="broadcasts"] [data-lang-tab]').forEach(function (t) {
    t.addEventListener('click', function () { setTimeout(broadcast, 0); });
  });

  /* ------------------------------------------------------ field reorder */

  var fieldlist = $('[data-fieldlist]');
  if (fieldlist) {
    var dragged = null;

    fieldlist.addEventListener('dragstart', function (e) {
      dragged = e.target.closest('.fieldrow');
      if (!dragged) return;
      dragged.setAttribute('data-dragging', '');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    fieldlist.addEventListener('dragover', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var over = e.target.closest('.fieldrow');
      $$('.fieldrow', fieldlist).forEach(function (r) { r.removeAttribute('data-over'); });
      if (over && over !== dragged) over.setAttribute('data-over', '');
    });

    fieldlist.addEventListener('drop', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var over = e.target.closest('.fieldrow');
      if (over && over !== dragged) {
        var rows = $$('.fieldrow', fieldlist);
        fieldlist.insertBefore(dragged, rows.indexOf(over) > rows.indexOf(dragged) ? over.nextSibling : over);
      }
      cleanup();
      mirrorForm();
    });

    fieldlist.addEventListener('dragend', cleanup);

    function cleanup() {
      $$('.fieldrow', fieldlist).forEach(function (r) {
        r.removeAttribute('data-over');
        r.removeAttribute('data-dragging');
      });
      dragged = null;
    }

    // Reordering the builder reorders the form a buyer will actually fill in.
    function mirrorForm() {
      var preview = $('[data-formpreview]');
      if (!preview) return;
      var order = $$('.fieldrow', fieldlist).map(function (r) { return $('b', r).textContent.trim(); });
      var fields = $$('.f', preview);
      order.forEach(function (name) {
        var match = fields.filter(function (f) {
          return $('.f__label', f).textContent.trim().indexOf(name) === 0;
        })[0];
        if (match) preview.insertBefore(match, preview.lastElementChild);
      });
    }
  }

  ready(function () { offer(); broadcast(); });
})();
