/* Alf Maskan — billing.
   Enhancement only. The plan, usage, methods and invoices are all in the HTML.
   This makes the billing-cycle figures recompute rather than sit hard-coded,
   and runs the cancel flow. */

(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };
  var egp = function (v) { return 'EGP ' + Math.round(v).toLocaleString('en-US'); };

  var MONTHLY = 990;
  var MONTHS_FREE = 2;

  /* ------------------------------------------------------------- cycle */

  var seg = $('[data-cycle]');
  if (seg) {
    var note = $('[data-cycle-note]');
    var swap = $('[data-switch-cycle]');

    var render = function (mode) {
      var annual = MONTHLY * (12 - MONTHS_FREE);
      var saving = MONTHLY * MONTHS_FREE;
      // Derived from one price and one free-months figure, so the three numbers
      // in this paragraph can never drift apart.
      note.innerHTML = mode === 'annual'
        ? '<b style="color:var(--text)">' + egp(annual) + '</b> charged once a year on 3 September, which is ' +
          egp(saving) + ' less than paying monthly. Switching back to monthly takes effect at the next renewal.'
        : '<b style="color:var(--text)">' + egp(MONTHLY) + '</b> charged on the 3rd of each month. Switching to annual would cost <b style="color:var(--text)">' +
          egp(annual) + '</b> once and save you <b style="color:var(--text)">' + egp(saving) + '</b> a year.';
      if (swap) swap.textContent = mode === 'annual' ? 'Switch to monthly' : 'Switch to annual';
    };

    $$('[data-cycle-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-cycle-btn]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        render(btn.getAttribute('data-cycle-btn'));
      });
    });

    if (swap) {
      swap.addEventListener('click', function () {
        var current = $$('[data-cycle-btn]').filter(function (b) {
          return b.getAttribute('aria-pressed') === 'true';
        })[0];
        var other = $$('[data-cycle-btn]').filter(function (b) { return b !== current; })[0];
        if (other) other.click();
      });
    }
  }

  /* ------------------------------------------------------------ method */

  var payNote = $('[data-pay-note]');
  var COPY = {
    card: 'Charged automatically on the 3rd. If a card fails we retry twice over five days and email you before anything switches off.',
    fawry: 'We send a Fawry code three days before the 3rd. Pay it at any outlet or in your banking app — the storefront stays up while the code is open.',
    paymob: 'A payment request arrives on your wallet number three days before the 3rd. Vodafone Cash, Etisalat and Orange all work.',
    instapay: 'We send an InstaPay request three days before the 3rd. Transfers usually clear the same hour.'
  };
  $$('.rail-opt input').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (payNote && COPY[radio.value]) payNote.textContent = COPY[radio.value];
    });
  });

  /* ------------------------------------------------------------ cancel */

  var cancel = $('[data-cancel]');
  var retain = $('[data-retain]');
  if (cancel && retain) {
    cancel.addEventListener('click', function () {
      retain.hidden = false;
      retain.scrollIntoView({ block: 'center', behavior: 'smooth' });
      cancel.disabled = true;
    });
  }

  var pause = $('[data-pause]');
  if (pause) {
    pause.addEventListener('click', function () {
      retain.innerHTML = '<h2 class="panel__title" style="margin-bottom:8px">Paused until 3 November 2026</h2>' +
        '<p style="font-size:var(--t-micro);color:var(--text-2);line-height:1.7;max-width:60ch">' +
        'Nothing is charged until then and your storefront keeps working. We will email you a week before it restarts.</p>';
    });
  }

  var confirm = $('[data-confirm-cancel]');
  if (confirm) {
    confirm.addEventListener('click', function () {
      retain.innerHTML = '<h2 class="panel__title" style="margin-bottom:8px">Cancelled</h2>' +
        '<p style="font-size:var(--t-micro);color:var(--text-2);line-height:1.7;max-width:60ch">' +
        'Your storefront stays up until 3 October 2026, which you have already paid for. Your units, leads and deals are kept for ninety days after that. ' +
        'Nothing else will be charged.</p>';
    });
  }
})();
