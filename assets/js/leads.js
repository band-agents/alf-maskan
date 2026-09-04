/* Alf Maskan — leads inbox.
   Enhancement only. Without JavaScript every lead is in the list, the whole
   conversation is readable, and the composer is a real textarea. This adds
   segment filtering, selecting a lead, the stage stepper and quick replies. */

(function () {
  'use strict';

  var list = document.querySelector('[data-leadlist]');
  if (!list) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var items = $$('.leaditem', list);
  var segs = $$('[data-seg]');
  var q = $('[data-lead-q]');
  var empty = $('[data-lead-empty]');
  var seg = 'all';

  /* ---------------------------------------------------------- filtering */

  function inSegment(item) {
    switch (seg) {
      case 'unread':     return item.hasAttribute('data-unread');
      case 'mine':       return item.getAttribute('data-agent') === 'mine';
      case 'unassigned': return item.getAttribute('data-agent') === 'unassigned';
      case 'wa':
      case 'form':
      case 'call':
      case 'fb':         return item.getAttribute('data-src') === seg;
      default:           return true;
    }
  }

  function render() {
    var term = q ? q.value.trim().toLowerCase() : '';
    var shown = 0;

    items.forEach(function (item) {
      var ok = inSegment(item) && (!term || item.textContent.toLowerCase().indexOf(term) !== -1);
      item.hidden = !ok;
      if (ok) shown++;
    });

    if (empty) empty.hidden = shown !== 0;

    // Every segment count is derived, so a filtered list can never disagree
    // with the number printed beside it.
    segs.forEach(function (btn) {
      var key = btn.getAttribute('data-seg');
      var n = items.filter(function (item) {
        var was = seg;
        seg = key;
        var hit = inSegment(item);
        seg = was;
        return hit;
      }).length;
      var out = $('.seg-item__n', btn);
      if (out) out.textContent = String(n);
    });

    // If the selected lead just got filtered out, move to the first visible one
    // rather than leaving the pane showing something the list no longer offers.
    var current = items.filter(function (i) { return i.getAttribute('aria-current') === 'true'; })[0];
    if (current && current.hidden) {
      var first = items.filter(function (i) { return !i.hidden; })[0];
      if (first) select(first);
    }
  }

  /* ---------------------------------------------------------- selecting */

  function select(item) {
    items.forEach(function (i) { i.setAttribute('aria-current', String(i === item)); });
    // Opening a lead is reading it.
    item.removeAttribute('data-unread');
    var hidden = $('.visually-hidden', $('.leaditem__name', item));
    if (hidden) hidden.remove();

    var name = $('.leaditem__name', item);
    var out = $('[data-lead-name]');
    if (name && out) out.textContent = name.textContent.trim();

    var stage = item.getAttribute('data-status');
    if (stage) setStage(stage, false);
    render();
  }

  items.forEach(function (item) {
    item.addEventListener('click', function () { select(item); });
  });

  /* ------------------------------------------------------------- stages */

  var STAGES = ['new', 'contacted', 'viewing', 'negotiating', 'won', 'lost'];
  var pills = $$('[data-stage]');

  function setStage(stage, writeBack) {
    var at = STAGES.indexOf(stage);
    pills.forEach(function (pill, i) {
      var key = pill.getAttribute('data-stage');
      var isCurrent = key === stage;
      if (isCurrent) pill.setAttribute('aria-current', 'step');
      else pill.removeAttribute('aria-current');
      // Won and Lost are outcomes, not steps on the way — never shown as passed.
      var passed = i < at && at < 4 && i < 4;
      if (passed) pill.setAttribute('data-done', ''); else pill.removeAttribute('data-done');
    });

    if (!writeBack) return;
    var current = items.filter(function (i) { return i.getAttribute('aria-current') === 'true'; })[0];
    if (!current) return;
    current.setAttribute('data-status', stage);

    var LABEL = {
      new: ['New', 'st--live'], contacted: ['Contacted', 'st--reserved'],
      viewing: ['Viewing booked', 'st--live'], negotiating: ['Negotiating', 'st--reserved'],
      won: ['Won', 'st--sold'], lost: ['Lost', 'st--paused']
    };
    var pill = $('.st', current);
    if (pill && LABEL[stage]) {
      pill.className = 'st ' + LABEL[stage][1];
      pill.textContent = LABEL[stage][0];
    }
  }

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      setStage(pill.getAttribute('data-stage'), true);
    });
  });

  /* ------------------------------------------------------ quick replies */

  var composer = $('[data-composer]');
  $$('[data-reply]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (!composer) return;
      // Dropped in, not sent — the agent edits before it goes.
      composer.value = chip.getAttribute('data-reply');
      composer.dir = chip.getAttribute('dir') || 'ltr';
      composer.lang = chip.getAttribute('lang') || 'en';
      composer.focus();
      composer.setSelectionRange(composer.value.length, composer.value.length);
    });
  });

  var send = $('[data-send]');
  if (send && composer) {
    send.addEventListener('click', function () {
      var text = composer.value.trim();
      if (!text) { composer.focus(); return; }

      var convo = $('.convo');
      var msg = document.createElement('div');
      msg.className = 'msg msg--out';

      var avatar = document.createElement('span');
      avatar.className = 'avatar avatar--sm msg__avatar';
      avatar.setAttribute('aria-hidden', 'true');

      var bubble = document.createElement('div');
      bubble.className = 'msg__bubble';
      if (composer.dir === 'rtl') { bubble.dir = 'rtl'; bubble.lang = 'ar'; }
      bubble.appendChild(document.createTextNode(text));

      var when = document.createElement('span');
      when.className = 'msg__when';
      when.dir = 'ltr';
      when.textContent = 'Just now';
      bubble.appendChild(when);

      msg.appendChild(avatar);
      msg.appendChild(bubble);

      // The "waiting on your reply" marker is no longer true once you reply.
      var waiting = $$('.convo-event', convo).pop();
      if (waiting && /waiting/i.test(waiting.textContent)) waiting.remove();
      convo.appendChild(msg);

      composer.value = '';
      composer.dir = 'ltr';
      msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  /* -------------------------------------------------------------- input */

  segs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      seg = btn.getAttribute('data-seg');
      segs.forEach(function (b) { b.setAttribute('aria-current', String(b === btn)); });
      render();
    });
  });

  if (q) q.addEventListener('input', render);

  render();
})();
