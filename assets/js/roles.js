/* Alf Maskan — roles matrix.
   Enhancement only: without JavaScript the table is a complete, readable
   statement of who can reach what. This makes the cells editable, keeps a
   running list of what you changed, and refuses the one edit that could lock
   a store out of its own billing. */

(function () {
  'use strict';

  var body = document.querySelector('[data-caps]');
  if (!body) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  var ORDER = ['none', 'limited', 'full'];
  var GLYPH = { none: '—', limited: '◐', full: '●' };
  var WORD = { none: 'none', limited: 'limited to their own records', full: 'full access' };

  var ROLE_LABEL = {
    owner: 'Owner', admin: 'Admin', manager: 'Sales manager', agent: 'Agent',
    editor: 'Content editor', accountant: 'Accountant', viewer: 'Viewer'
  };

  var defaults = {};
  var changed = {};

  /* --------------------------------------------------------- rendering */

  function paint(cell) {
    var level = cell.getAttribute('data-level');
    var btn = $('button', cell);
    btn.setAttribute('data-level', level);

    // Write into the glyph span, never into the button: btn.textContent would
    // wipe every child, including the screen-reader label written next.
    $('.cap__g', btn).textContent = GLYPH[level];

    var role = cell.getAttribute('data-role');
    var cap = capLabel(cell);
    // The accessible name carries the state as a word — the glyph and the tint
    // are both unusable to a screen reader, and the tint alone to some readers.
    $('.visually-hidden', btn).textContent = ROLE_LABEL[role] + ', ' + cap + ': ' + WORD[level] +
      (btn.disabled ? '. Locked.' : '. Click to change.');
  }

  function capLabel(cell) {
    var row = cell.closest('tr');
    var th = $('th', row);
    return th.firstChild.textContent.trim().toLowerCase();
  }

  /* ---------------------------------------------------------- building */

  $$('td[data-role]', body).forEach(function (cell) {
    var key = cell.closest('tr').getAttribute('data-cap') + '|' + cell.getAttribute('data-role');
    defaults[key] = cell.getAttribute('data-level');

    var btn = document.createElement('button');
    btn.className = 'cap';
    btn.type = 'button';
    var glyph = document.createElement('span');
    glyph.className = 'cap__g';
    glyph.setAttribute('aria-hidden', 'true');
    var sr = document.createElement('span');
    sr.className = 'visually-hidden';
    btn.appendChild(glyph);
    btn.appendChild(sr);
    cell.appendChild(btn);

    // The owner column never moves. A store whose owner cannot reach billing
    // has nobody who can pay for it or close it.
    if (cell.getAttribute('data-role') === 'owner') btn.disabled = true;

    paint(cell);

    btn.addEventListener('click', function () {
      var now = cell.getAttribute('data-level');
      var next = ORDER[(ORDER.indexOf(now) + 1) % ORDER.length];
      cell.setAttribute('data-level', next);
      paint(cell);

      if (next === defaults[key]) delete changed[key];
      else changed[key] = next;
      summarise();
    });
  });

  /* ---------------------------------------------------------- summary */

  function summarise() {
    var out = $('[data-changes]');
    if (!out) return;

    var keys = Object.keys(changed);
    if (!keys.length) {
      out.textContent = 'Nothing yet. Cells you change are listed here before you save, so you can see the whole edit at once rather than trusting your memory of nine clicks.';
      return;
    }

    out.textContent = '';
    keys.forEach(function (key) {
      var parts = key.split('|');
      var row = $('tr[data-cap="' + parts[0] + '"]', body);
      var cap = $('th', row).firstChild.textContent.trim();
      var line = document.createElement('span');
      line.style.display = 'block';
      line.textContent = ROLE_LABEL[parts[1]] + ' · ' + cap + ' · ' +
        WORD[defaults[key]] + ' → ' + WORD[changed[key]];
      out.appendChild(line);
    });

    var count = document.createElement('b');
    count.style.cssText = 'display:block;margin-top:8px;color:var(--text)';
    count.textContent = keys.length + (keys.length === 1 ? ' change' : ' changes') + ' not saved yet.';
    out.appendChild(count);
  }

  /* ------------------------------------------------------------ actions */

  var reset = $('[data-reset-caps]');
  if (reset) {
    reset.addEventListener('click', function () {
      $$('td[data-role]', body).forEach(function (cell) {
        var key = cell.closest('tr').getAttribute('data-cap') + '|' + cell.getAttribute('data-role');
        cell.setAttribute('data-level', defaults[key]);
        paint(cell);
      });
      changed = {};
      summarise();
    });
  }

  var save = $('[data-save-caps]');
  if (save) {
    save.addEventListener('click', function () {
      var n = Object.keys(changed).length;
      // Saving makes the current state the new baseline, so the summary is
      // always "since you last saved" rather than "since the page loaded".
      $$('td[data-role]', body).forEach(function (cell) {
        var key = cell.closest('tr').getAttribute('data-cap') + '|' + cell.getAttribute('data-role');
        defaults[key] = cell.getAttribute('data-level');
      });
      changed = {};
      summarise();
      var out = $('[data-changes]');
      if (out && n) {
        out.textContent = n + (n === 1 ? ' change is' : ' changes are') +
          ' live. Everyone holding those roles sees the difference on their next page load.';
      }
    });
  }

  summarise();
})();
