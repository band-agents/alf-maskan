/* Alf Maskan — collections.
   The conditions actually run. Change a rule and the matched-unit grid below
   re-filters immediately, so you can see what a collection will contain before
   you save it rather than after. */

(function () {
  'use strict';

  var form = document.querySelector('[data-collection]');
  if (!form) return;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  var dirty = function () { document.dispatchEvent(new Event('am:dirty')); };

  var rulesBox = $('[data-rules]');
  var cards = $$('[data-matched] .ucard');
  var emptyState = $('[data-matched-empty]');
  var grid = $('[data-matched]');
  var match = 'all';
  var mode = 'auto';

  // The values each field can be compared against. Changing the field swaps the
  // value list, so you can never build a condition like "Delivery is Villa".
  var VALUES = {
    zone: ['North Coast', 'New Cairo', 'Ain Sokhna', 'Sheikh Zayed', 'Zamalek'],
    compound: ['Marassi', 'Mivida', 'Il Monte Galala', 'Sodic East', 'Palm Hills'],
    type: ['Chalet', 'Penthouse', 'Apartment', 'Villa', 'Twin house', 'Studio'],
    price: ['Under EGP 10M', 'EGP 10M – 20M', 'Over EGP 20M'],
    beds: ['1', '2', '3', '4', '5'],
    delivery: ['2027', 'Ready', '2026', '2028'],
    status: ['Live', 'Draft', 'Reserved', 'Sold', 'Rented']
  };

  /* ------------------------------------------------------------ matching */

  function cardValue(card, field) {
    if (field === 'price') {
      var p = Number(card.getAttribute('data-price')) || 0;
      if (p < 10000000) return 'Under EGP 10M';
      if (p <= 20000000) return 'EGP 10M – 20M';
      return 'Over EGP 20M';
    }
    if (field === 'status') {
      var s = card.getAttribute('data-status') || '';
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    if (field === 'beds') {
      var spec = card.querySelector('.ucard__specs span:nth-child(2)');
      return spec ? spec.textContent.replace(/\D/g, '') : '';
    }
    if (field === 'compound') {
      var where = card.querySelector('.ucard__where');
      return where ? where.textContent.split('·').pop().trim() : '';
    }
    return card.getAttribute('data-' + field) || '';
  }

  function readRules() {
    return $$('[data-rule]', rulesBox).map(function (row) {
      return {
        field: $('[data-rule-field]', row).value,
        op: $('[data-rule-op]', row).value,
        value: $('[data-rule-value]', row).value
      };
    });
  }

  function apply() {
    var rules = readRules();
    var shown = 0;

    cards.forEach(function (card) {
      var ok;
      if (mode === 'manual' || !rules.length) {
        ok = true;                       // a manual collection is whatever you put in it
      } else {
        var results = rules.map(function (r) {
          var hit = cardValue(card, r.field) === r.value;
          return r.op === 'isnot' ? !hit : hit;
        });
        ok = match === 'all'
          ? results.every(Boolean)
          : results.some(Boolean);
      }
      card.hidden = !ok;
      if (ok) shown++;
    });

    $$('[data-match-count]').forEach(function (el) { el.textContent = String(shown); });
    if (emptyState) emptyState.hidden = shown !== 0;
    if (grid) grid.hidden = shown === 0;
  }

  /* --------------------------------------------------------- rule editing */

  function fillValues(row) {
    var field = $('[data-rule-field]', row).value;
    var select = $('[data-rule-value]', row);
    var previous = select.value;
    select.textContent = '';
    (VALUES[field] || []).forEach(function (v) {
      var opt = document.createElement('option');
      opt.textContent = v;
      select.appendChild(opt);
    });
    // Keep the choice if the new field still offers it.
    if (Array.prototype.some.call(select.options, function (o) { return o.value === previous; })) {
      select.value = previous;
    }
  }

  function wireRow(row) {
    $('[data-rule-field]', row).addEventListener('change', function () {
      fillValues(row);
      apply();
    });
    $('[data-rule-op]', row).addEventListener('change', apply);
    $('[data-rule-value]', row).addEventListener('change', apply);

    $('[data-rule-remove]', row).addEventListener('click', function () {
      var join = row.previousElementSibling;
      if (join && join.hasAttribute('data-join')) join.remove();
      row.remove();
      // A single remaining rule must not be preceded by a stray "and".
      var first = $('[data-join]', rulesBox);
      if (first && !first.previousElementSibling) first.remove();
      renumber();
      apply();
      dirty();
    });
  }

  // Screen-reader labels say "condition 3", so they have to keep counting right
  // after a removal.
  function renumber() {
    $$('[data-rule]', rulesBox).forEach(function (row, i) {
      var n = i + 1;
      $('[data-rule-remove] .visually-hidden', row).textContent = 'Remove condition ' + n;
      [['field', 'field'], ['op', 'operator'], ['value', 'value']].forEach(function (pair) {
        var control = $('[data-rule-' + pair[0] + ']', row);
        var label = control.parentNode.querySelector('label');
        var id = 'r' + n + '-' + pair[0].charAt(0);
        control.id = id;
        if (label) {
          label.setAttribute('for', id);
          label.textContent = 'Condition ' + n + ' ' + pair[1];
        }
      });
    });
  }

  $$('[data-rule]', rulesBox).forEach(wireRow);

  var addBtn = $('[data-rule-add]');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var last = $$('[data-rule]', rulesBox).pop();
      var row = last.cloneNode(true);

      var join = document.createElement('span');
      join.className = 'rule__join';
      join.setAttribute('data-join', '');
      join.textContent = match === 'all' ? 'and' : 'or';

      rulesBox.appendChild(join);
      rulesBox.appendChild(row);
      wireRow(row);
      renumber();
      apply();
      dirty();
      $('[data-rule-field]', row).focus();
    });
  }

  /* ------------------------------------------------------------- toggles */

  var matchSeg = $('[data-match]');
  if (matchSeg) {
    $$('[data-match-btn]', matchSeg).forEach(function (btn) {
      btn.addEventListener('click', function () {
        match = btn.getAttribute('data-match-btn');
        $$('[data-match-btn]', matchSeg).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        // The joining word between rules is the rule, spelled out.
        $$('[data-join]', rulesBox).forEach(function (j) {
          j.textContent = match === 'all' ? 'and' : 'or';
        });
        apply();
      });
    });
  }

  var typeSeg = $('[data-coltype]');
  var rulesSection = $('[data-rules-section]');
  if (typeSeg && rulesSection) {
    $$('[data-coltype-btn]', typeSeg).forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-coltype-btn');
        $$('[data-coltype-btn]', typeSeg).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        // A manual collection has no conditions to show.
        rulesSection.hidden = mode === 'manual';
        apply();
      });
    });
  }

  /* --------------------------------------------------- collection switch */

  $$('[data-col]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('[data-col]').forEach(function (b) { b.setAttribute('aria-current', String(b === btn)); });
    });
  });

  apply();
})();
