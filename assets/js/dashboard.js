/* Alf Maskan — dashboard behaviour.
   Enhancement only: the page renders complete and readable without this file.
   The chart paths are drawn here because they depend on the selected range. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------- theme
     The inline script in <head> has already applied the stored theme; this
     only handles the toggle and keeps the button's label honest. */

  var root = document.documentElement;
  var themeBtn = $('[data-theme-toggle]');

  var syncThemeButton = function () {
    if (!themeBtn) return;
    var dark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    $('.visually-hidden', themeBtn).textContent = dark ? 'Switch to light mode' : 'Switch to dark mode';
  };

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.dataset.theme === 'dark';
      if (dark) delete root.dataset.theme;
      else root.dataset.theme = 'dark';
      try { localStorage.setItem('am-theme', dark ? 'light' : 'dark'); } catch (e) {}
      syncThemeButton();
      if (chart) chart.draw();
    });
    syncThemeButton();
  }

  /* ---------------------------------------------------------- sidebar */

  var shell = $('#shell');
  var collapseBtn = $('[data-rail-collapse]');
  if (shell && collapseBtn) {
    try {
      if (localStorage.getItem('am-rail') === 'collapsed') shell.classList.add('is-collapsed');
    } catch (e) {}
    collapseBtn.addEventListener('click', function () {
      var collapsed = shell.classList.toggle('is-collapsed');
      collapseBtn.setAttribute('aria-expanded', String(!collapsed));
      try { localStorage.setItem('am-rail', collapsed ? 'collapsed' : 'open'); } catch (e) {}
    });
  }

  // Off-canvas rail below 900px.
  var openBtn = $('[data-rail-open]');
  var scrim = $('[data-rail-close]');
  var setOpen = function (open) {
    if (!shell) return;
    shell.classList.toggle('is-open', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
  };
  if (openBtn) openBtn.addEventListener('click', function () { setOpen(!shell.classList.contains('is-open')); });
  if (scrim) scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && shell && shell.classList.contains('is-open')) {
      setOpen(false);
      if (openBtn) openBtn.focus();
    }
  });

  /* ---------------------------------------------------------- ⌘K */

  var omnibox = $('[data-omnibox]');
  if (omnibox) {
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        omnibox.focus();
        omnibox.select();
      }
    });
  }

  /* ---------------------------------------------------------- hint tooltips */

  $$('[data-hint]').forEach(function (btn) {
    var body = btn.parentElement.querySelector('.hint__body');
    if (!body) return;
    var show = function (on) {
      body.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
      btn.parentElement.toggleAttribute('data-open', on);
    };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      show(body.hidden);
    });
    btn.parentElement.addEventListener('mouseenter', function () { show(true); });
    btn.parentElement.addEventListener('mouseleave', function () { show(false); });
    btn.addEventListener('blur', function () { show(false); });
  });
  document.addEventListener('click', function () {
    $$('.hint__body').forEach(function (b) { b.hidden = true; });
    $$('[data-hint]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  });

  var dismiss = $('[data-dismiss-setup]');
  if (dismiss) {
    dismiss.addEventListener('click', function () {
      var card = dismiss.closest('.setup');
      if (card) card.remove();
    });
  }

  /* ---------------------------------------------------------- chart
     Two series over time. Views run in the hundreds and leads in single
     digits, so each is scaled to its own extent — see the README note; the
     readout and the table always show the real figures, which is what makes
     the comparison honest. */

  var chart = null;
  var chartEl = $('[data-chart]');

  if (chartEl) {
    var W = 700, TOP = 20, BOTTOM = 190;

    // Deterministic sample data so the page is self-contained.
    var makeSeries = function (days) {
      var out = [];
      var now = new Date(2026, 8, 2);
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(now);
        d.setDate(d.getDate() - i);
        var t = (days - i) / days;
        var wobble = Math.sin(i * 1.7) * 0.12 + Math.sin(i * 0.6) * 0.07;
        var views = Math.round(300 + 380 * t + 380 * t * wobble);
        var leads = Math.max(0, Math.round(3 + 8 * t + 8 * t * wobble * 1.4));
        out.push({ date: d, views: views, leads: leads });
      }
      return out;
    };

    var scale = function (vals) {
      var max = Math.max.apply(null, vals);
      var min = Math.min.apply(null, vals);
      var span = max - min || 1;
      return function (v) { return BOTTOM - ((v - min) / span) * (BOTTOM - TOP - 20); };
    };

    var pathFor = function (pts) {
      return pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    };

    var fmtDate = function (d) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    chart = {
      days: 30,
      data: [],
      pts1: [],
      pts2: [],
      draw: function () {
        this.data = makeSeries(this.days);
        var n = this.data.length;
        var yV = scale(this.data.map(function (d) { return d.views; }));
        var yL = scale(this.data.map(function (d) { return d.leads; }));
        var x = function (i) { return (i / (n - 1)) * W; };

        this.pts1 = this.data.map(function (d, i) { return { x: x(i), y: yV(d.views) }; });
        this.pts2 = this.data.map(function (d, i) { return { x: x(i), y: yL(d.leads) + 28 }; });

        var line1 = pathFor(this.pts1);
        var line2 = pathFor(this.pts2);
        $('[data-line="1"]', chartEl).setAttribute('d', line1);
        $('[data-line="2"]', chartEl).setAttribute('d', line2);
        $('[data-area="1"]', chartEl).setAttribute('d', line1 + ' L' + W + ',' + BOTTOM + ' L0,' + BOTTOM + ' Z');
        $('[data-area="2"]', chartEl).setAttribute('d', line2 + ' L' + W + ',' + BOTTOM + ' L0,' + BOTTOM + ' Z');

        // x-axis: five evenly spaced dates
        var axis = $('[data-axis]', chartEl);
        axis.innerHTML = '';
        for (var k = 0; k < 5; k++) {
          var d = this.data[Math.round((k / 4) * (n - 1))].date;
          var s = document.createElement('span');
          s.textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          axis.appendChild(s);
        }

        this.select(Math.round(n * 0.66));
        this.fillTable();
      },
      select: function (i) {
        i = Math.max(0, Math.min(this.data.length - 1, i));
        var row = this.data[i];
        var p1 = this.pts1[i], p2 = this.pts2[i];
        $('[data-crosshair]', chartEl).setAttribute('x1', p1.x);
        $('[data-crosshair]', chartEl).setAttribute('x2', p1.x);
        $('[data-dot="1"]', chartEl).setAttribute('cx', p1.x);
        $('[data-dot="1"]', chartEl).setAttribute('cy', p1.y);
        $('[data-dot="2"]', chartEl).setAttribute('cx', p2.x);
        $('[data-dot="2"]', chartEl).setAttribute('cy', p2.y);
        $('[data-readout-date]').textContent = fmtDate(row.date);
        $('[data-readout-views]').textContent = row.views.toLocaleString('en-GB');
        $('[data-readout-leads]').textContent = row.leads;
      },
      fillTable: function () {
        var body = $('[data-table-body]');
        if (!body) return;
        body.innerHTML = '';
        this.data.forEach(function (r) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<th scope="row">' + fmtDate(r.date) + '</th><td>' +
            r.views.toLocaleString('en-GB') + '</td><td>' + r.leads + '</td>';
          body.appendChild(tr);
        });
      },
    };

    // Hover / focus crosshair. The hit rect spans the plot so the target is
    // far bigger than the marks themselves.
    var hit = $('[data-hit]', chartEl);
    var svg = $('svg', chartEl);
    var indexFromEvent = function (clientX) {
      var box = svg.getBoundingClientRect();
      var ratio = (clientX - box.left) / box.width;
      if (document.body.dir === 'rtl') ratio = 1 - ratio;
      return Math.round(ratio * (chart.data.length - 1));
    };
    hit.addEventListener('mousemove', function (e) { chart.select(indexFromEvent(e.clientX)); });
    hit.addEventListener('touchmove', function (e) {
      if (e.touches[0]) chart.select(indexFromEvent(e.touches[0].clientX));
    }, { passive: true });

    var range = $('[data-range]');
    if (range) {
      range.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-days]');
        if (!btn) return;
        $$('button', range).forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
        chart.days = Number(btn.dataset.days);
        chart.draw();
      });
    }

    var tableToggle = $('[data-table-toggle]');
    var table = $('[data-table]');
    if (tableToggle && table) {
      tableToggle.addEventListener('click', function () {
        var open = table.hidden;
        table.hidden = !open;
        tableToggle.setAttribute('aria-expanded', String(open));
        tableToggle.textContent = open ? 'Hide table' : 'View as table';
      });
    }

    chart.draw();
  }
})();

/* ---------------------------------------------------------- setup checklist
   Artboard "Setup checklist widget". Four states, and it remembers which one
   it was in: expanded on the first session, a pill after that, gone once
   dismissed or completed. */

(function () {
  'use strict';
  var chk = document.querySelector('[data-setupchk]');
  if (!chk) return;

  var KEY = 'am-setup';
  var read = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var write = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };

  var show = function (name) {
    Array.prototype.forEach.call(chk.querySelectorAll('[data-setupchk-state]'), function (s) {
      s.hidden = s.dataset.setupchkState !== name;
    });
    chk.hidden = false;
  };

  var stored = read();
  if (stored === 'hidden' || stored === 'done') { chk.hidden = true; return; }
  // Expanded the first time, a pill on every visit after that.
  show(stored === 'seen' ? 'pill' : 'open');
  if (!stored) write('seen');

  chk.addEventListener('click', function (e) {
    if (e.target.closest('[data-setupchk-collapse]')) { show('pill'); return; }
    if (e.target.closest('[data-setupchk-expand]')) { show('open'); return; }
    if (e.target.closest('[data-setupchk-ask-dismiss]')) { show('confirm'); return; }
    if (e.target.closest('[data-setupchk-keep]')) { show('open'); return; }
    if (e.target.closest('[data-setupchk-hide]')) { write('hidden'); chk.hidden = true; }
  });

  // Completing the last step celebrates, then takes the widget away.
  chk.complete = function () {
    show('done');
    write('done');
    setTimeout(function () { chk.hidden = true; }, 6000);
  };
})();
