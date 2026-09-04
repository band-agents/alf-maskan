/* Alf Maskan — deals pipeline.
   Enhancement only. Without JavaScript the board is a readable set of columns
   with every deal, its value and its age. This adds dragging between stages,
   and makes every total recompute from the cards rather than sitting as a
   number that drifts out of date the first time something moves. */

(function () {
  'use strict';

  var board = document.querySelector('[data-board]');
  if (!board) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var egp = function (v) { return 'EGP ' + Math.round(v).toLocaleString('en-US'); };
  var short = function (v) {
    return 'EGP ' + (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  };

  // Flat close rate per stage. Real rates need a year of this store's own data;
  // these are a shape, and the panel says so.
  var CLOSE = { contacted: 0.20, viewing: 0.35, negotiating: 0.60, reserved: 0.85, won: 1 };
  var COMMISSION = 0.025;

  /* ------------------------------------------------------------- totals */

  function recount() {
    var openValue = 0;
    var openCount = 0;
    var weighted = 0;
    var commission = 0;

    $$('.col', board).forEach(function (col) {
      var stage = col.getAttribute('data-col');
      var deals = $$('.deal', col);
      var sum = deals.reduce(function (t, d) {
        return t + (Number(d.getAttribute('data-value')) || 0);
      }, 0);

      var n = $('[data-col-n]', col);
      var s = $('[data-col-sum]', col);
      if (n) n.textContent = String(deals.length);
      if (s) s.textContent = deals.length ? short(sum) : '—';

      // Won is banked, not pipeline — counting it as forecast would inflate it.
      if (stage !== 'won') {
        openValue += sum;
        openCount += deals.length;
        weighted += sum * (CLOSE[stage] || 0) * COMMISSION;
      }
      commission += stage === 'won' ? 0 : sum * COMMISSION;
    });

    var setText = function (sel, text) {
      var el = $(sel);
      if (el) el.textContent = text;
    };
    setText('[data-total-n]', String(openCount));
    setText('[data-total-egp]', egp(openValue));
    setText('[data-pipe-value]', short(openValue));
    setText('[data-pipe-comm]', egp(commission));
    setText('[data-pipe-weighted]', egp(weighted));

    var stale = $$('.deal[data-stale]', board).length;
    var note = $('[data-total-n]');
    if (note) {
      var p = note.closest('p');
      if (p) {
        p.lastChild.textContent = ' · ' + (stale === 0 ? 'nothing has stalled.'
          : stale + (stale === 1 ? ' has' : ' have') + ' gone quiet.');
      }
    }
  }

  /* -------------------------------------------------------------- drag */

  var dragged = null;

  board.addEventListener('dragstart', function (e) {
    dragged = e.target.closest('.deal');
    if (!dragged) return;
    dragged.setAttribute('data-dragging', '');
    e.dataTransfer.effectAllowed = 'move';
    // Firefox will not start a drag without data on the transfer.
    e.dataTransfer.setData('text/plain', '');
  });

  board.addEventListener('dragover', function (e) {
    if (!dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var col = e.target.closest('.col');
    $$('.col', board).forEach(function (c) { c.classList.toggle('is-target', c === col); });
  });

  board.addEventListener('drop', function (e) {
    if (!dragged) return;
    e.preventDefault();
    var col = e.target.closest('.col');
    if (col) {
      var body = $('.col__body', col);
      var over = e.target.closest('.deal');
      if (over && over !== dragged && over.parentNode === body) {
        var cards = $$('.deal', body);
        body.insertBefore(dragged, cards.indexOf(over) > cards.indexOf(dragged) ? over.nextSibling : over);
      } else {
        body.appendChild(dragged);
      }
      // Moving a deal is activity, so it is no longer stalled.
      dragged.removeAttribute('data-stale');
      var age = $('.deal__age', dragged);
      if (age) { age.textContent = 'Today'; }
    }
    end();
  });

  board.addEventListener('dragend', end);

  function end() {
    $$('.col', board).forEach(function (c) { c.classList.remove('is-target'); });
    if (dragged) dragged.removeAttribute('data-dragging');
    dragged = null;
    recount();
  }

  recount();
})();
