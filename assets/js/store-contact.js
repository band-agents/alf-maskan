/* Alf Maskan storefront — book a viewing.
   Enhancement only. Without JavaScript the form still submits with a name,
   phone and unit; day and time become a note the office reads. This makes the
   slot picker behave, and confirms in place rather than on a new page. */

(function () {
  'use strict';

  var form = document.querySelector('[data-booking]');
  if (!form) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var days = $$('[data-day]');
  var times = $$('[data-time]');

  // Which hours are actually free differs by day — a picker that offers a slot
  // the office cannot take is worse than no picker.
  var BUSY = {
    'Thu 4 Sep': ['13:00'],
    'Sat 6 Sep': ['10:00', '11:30'],
    'Sun 7 Sep': ['18:00'],
    'Mon 8 Sep': ['15:00', '16:30'],
    'Wed 10 Sep': ['10:00']
  };

  function pick(list, chosen) {
    list.forEach(function (b) { b.setAttribute('aria-pressed', String(b === chosen)); });
  }

  function chosen(list) {
    return list.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || null;
  }

  function applyDay() {
    var day = chosen(days);
    var busy = (day && BUSY[day.getAttribute('data-day')]) || [];
    times.forEach(function (t) {
      var taken = busy.indexOf(t.getAttribute('data-time')) !== -1;
      t.disabled = taken;
      // A slot that just became unavailable must not stay selected.
      if (taken && t.getAttribute('aria-pressed') === 'true') t.setAttribute('aria-pressed', 'false');
    });
  }

  days.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      pick(days, btn);
      applyDay();
    });
  });

  times.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      pick(times, btn);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var day = chosen(days);
    var time = chosen(times);
    var box = $('[data-booked]');
    var text = $('[data-booked-text]');
    var name = $('#b-name').value.trim();
    var unit = $('#b-unit');

    if (!time) {
      box.hidden = false;
      box.style.background = 'var(--warning-bg)';
      box.style.borderColor = 'color-mix(in srgb, var(--warning) 30%, transparent)';
      text.textContent = 'Pick a time as well as a day, then send it.';
      $('[data-times]').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    box.hidden = false;
    box.style.background = '';
    box.style.borderColor = '';
    text.innerHTML = '<b>Requested.</b> ' + (name ? name + ', we' : 'We') +
      ' will confirm ' + day.getAttribute('data-day') + ' at ' + time.getAttribute('data-time') +
      ' on WhatsApp, usually within the hour. Unit: ' +
      unit.options[unit.selectedIndex].text.split('—')[0].trim() + '.';

    $('[data-book-submit]').textContent = 'Request sent';
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  applyDay();
})();
