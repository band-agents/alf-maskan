/* Alf Maskan storefront — map explorer.
   Enhancement only: the list is a complete, linked set of units on its own.
   This ties each pin to its card in both directions, which is the whole point
   of putting a map next to a list. */

(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };

  var pins = $$('[data-pin]');
  var cards = $$('[data-unit]');
  if (!pins.length || !cards.length) return;

  var byId = {};
  cards.forEach(function (c) { byId[c.getAttribute('data-unit')] = c; });

  function highlight(id, on) {
    var card = byId[id];
    var pin = pins.filter(function (p) { return p.getAttribute('data-pin') === id; })[0];
    if (card) card.classList.toggle('is-active', on);
    if (pin) pin.setAttribute('aria-pressed', String(on));
  }

  function clearAll() {
    cards.forEach(function (c) { c.classList.remove('is-active'); });
    pins.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
  }

  pins.forEach(function (pin) {
    var id = pin.getAttribute('data-pin');
    pin.addEventListener('mouseenter', function () { highlight(id, true); });
    pin.addEventListener('mouseleave', function () { highlight(id, false); });
    pin.addEventListener('focus', function () { highlight(id, true); });
    pin.addEventListener('blur', function () { highlight(id, false); });
    // Tapping a pin has no hover to rely on, so it scrolls the card into view.
    pin.addEventListener('click', function () {
      clearAll();
      highlight(id, true);
      var card = byId[id];
      if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  cards.forEach(function (card) {
    var id = card.getAttribute('data-unit');
    card.addEventListener('mouseenter', function () { highlight(id, true); });
    card.addEventListener('mouseleave', function () { highlight(id, false); });
  });

  /* ------------------------------------------------------ draw an area */

  var draw = $('[data-draw]');
  var clearDraw = $('[data-clear-draw]');
  var stage = $('.mapx__stage');
  var countEl = $('[data-map-n]');
  var box = null;

  if (draw && stage) {
    draw.addEventListener('click', function () {
      if (box) return;
      // A stand-in for a real polygon tool: it demonstrates the interaction and
      // the count it drives. Swap for a map library's draw control.
      box = document.createElement('div');
      box.setAttribute('aria-hidden', 'true');
      box.style.cssText = 'position:absolute;left:20%;top:26%;width:36%;height:34%;' +
        'border:2px dashed var(--palm-600);background:rgba(15,94,78,.1);border-radius:12px;pointer-events:none';
      stage.appendChild(box);

      var inside = ['u1', 'u3', 'u5'];
      cards.forEach(function (c) {
        c.hidden = inside.indexOf(c.getAttribute('data-unit')) === -1;
      });
      pins.forEach(function (p) {
        p.hidden = inside.indexOf(p.getAttribute('data-pin')) === -1;
      });
      if (countEl) countEl.textContent = String(inside.length);
      draw.hidden = true;
      if (clearDraw) clearDraw.hidden = false;
    });
  }

  if (clearDraw) {
    clearDraw.addEventListener('click', function () {
      if (box) { box.remove(); box = null; }
      cards.forEach(function (c) { c.hidden = false; });
      pins.forEach(function (p) { p.hidden = false; });
      if (countEl) countEl.textContent = String(cards.length);
      clearDraw.hidden = true;
      if (draw) draw.hidden = false;
    });
  }
})();
