/* Alf Maskan — storefront builder.
   The artboards show two states of one screen: nothing selected (page settings)
   and a section selected (section settings). So there is one state object, and
   the rail, the inspector and the preview all render from it. Editing a field
   re-renders the preview — that is the whole point of a builder, as opposed to
   a picture of one. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var bx = $('#bx');
  if (!bx) return;

  /* ---------------------------------------------------------- state */

  var UNITS = [
    { name: 'Penthouse · Mivida', area: '240 m²', beds: '4 beds', extra: 'Fully finished', price: 'EGP 12,400,000', terms: '10% down · EGP 38,400/mo', badge: true },
    { name: 'Chalet · Marassi', area: '160 m²', beds: '3 beds', extra: 'Sea view', price: 'EGP 9,750,000', terms: '10% down · 8 years', badge: false },
    { name: 'Villa · Hyde Park', area: '420 m²', beds: '5 beds', extra: 'Garden', price: 'EGP 18,900,000', terms: 'Delivery Q4 2027', badge: false },
    { name: 'Twin house · Sodic East', area: '300 m²', beds: '4 beds', extra: 'Corner', price: 'EGP 15,200,000', terms: '12% down · 7 years', badge: false },
  ];

  var state = {
    dirty: false,
    device: 'desktop',
    zoom: 72,
    selected: null,
    page: {
      title: 'Kamal Estates — New Cairo & Sahel',
      meta: '42 units in New Cairo, Mostakbal City and the North Coast, with payment plans up to 8 years.',
      contentWidth: 1200,
      spacing: 64,
    },
    sections: [
      { id: 'hero', name: 'Search hero', blocks: 4, hidden: false },
      {
        id: 'featured', name: 'Featured units', blocks: 3, hidden: false,
        heading: 'Featured units', sub: 'Hand-picked this week by our team',
        headingAr: 'وحدات مختارة', subAr: 'اختارها فريقنا هذا الأسبوع',
        collection: 'Sahel 2027 Delivery',
        layout: 'grid', cards: 3, cardStyle: 'image',
        fields: { price: true, terms: true, area: true, beds: true },
        badge: 'featured', linkText: 'Browse all units',
        bg: '#FFFFFF', pad: 64,
      },
      { id: 'map', name: 'Map explorer', blocks: 2, hidden: false },
      { id: 'calc', name: 'Payment plan calculator', blocks: 3, hidden: false },
      { id: 'team', name: 'Team / agents', blocks: 2, hidden: false },
      { id: 'testimonials', name: 'Testimonials', blocks: 3, hidden: false },
    ],
    contentLang: 'en',
  };

  var find = function (id) { return state.sections.filter(function (s) { return s.id === id; })[0]; };

  /* ---------------------------------------------------------- dirty flag */

  var saveBtn = $('[data-save]');
  var stateChip = $('[data-save-state]');
  var markDirty = function () {
    if (state.dirty) return;
    state.dirty = true;
    stateChip.textContent = 'Unsaved changes';
    stateChip.className = 'bx__status bx__status--dirty';
    saveBtn.disabled = false;
  };
  var markSaved = function () {
    state.dirty = false;
    stateChip.textContent = 'Live';
    stateChip.className = 'bx__status bx__status--live';
    saveBtn.disabled = true;
    var note = $('[data-saved-note]');
    if (note) note.textContent = 'Saved · just now';
  };
  saveBtn.addEventListener('click', markSaved);
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); markSaved(); }
  });

  /* ---------------------------------------------------------- rail */

  var railEl = $('[data-sections]');

  var grip = '<span class="srow__grip" aria-hidden="true"><svg width="9" height="12" viewBox="0 0 9 12">' +
    '<circle cx="2" cy="2" r="1.1" fill="currentColor"/><circle cx="7" cy="2" r="1.1" fill="currentColor"/>' +
    '<circle cx="2" cy="6" r="1.1" fill="currentColor"/><circle cx="7" cy="6" r="1.1" fill="currentColor"/>' +
    '<circle cx="2" cy="10" r="1.1" fill="currentColor"/><circle cx="7" cy="10" r="1.1" fill="currentColor"/></svg></span>';

  var eyeOpen = '<svg width="14" height="11" viewBox="0 0 16 12" fill="none"><path d="M1 6s2.5-4.5 7-4.5S15 6 15 6s-2.5 4.5-7 4.5S1 6 1 6z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6" r="2" stroke="currentColor" stroke-width="1.3"/></svg>';
  var eyeShut = '<svg width="14" height="11" viewBox="0 0 16 12" fill="none"><path d="M1 6s2.5-4.5 7-4.5S15 6 15 6s-2.5 4.5-7 4.5S1 6 1 6z" stroke="currentColor" stroke-width="1.3"/><path d="M2 11L14 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

  function renderRail() {
    railEl.innerHTML = state.sections.map(function (s) {
      var sel = state.selected === s.id;
      var row =
        '<div class="srow' + (s.hidden ? ' is-hidden' : '') + '" role="button" tabindex="0" draggable="true"' +
        ' data-section="' + s.id + '" aria-selected="' + sel + '">' +
        grip +
        '<span class="srow__name">' + esc(s.name) + '</span>' +
        '<span class="srow__eye" role="button" tabindex="0" data-toggle-hide="' + s.id + '" ' +
        'aria-label="' + (s.hidden ? 'Show' : 'Hide') + ' ' + esc(s.name) + '">' + (s.hidden ? eyeShut : eyeOpen) + '</span>' +
        '</div>';

      if (!sel) return row;

      return row +
        '<div class="sdetail">' +
          '<div class="sdetail__menu">' +
            '<button type="button" data-act="duplicate">Duplicate</button>' +
            '<button type="button" data-act="rename">Rename</button>' +
            '<button type="button" data-act="hide">' + (s.hidden ? 'Show on this page' : 'Hide on this page') + '</button>' +
            '<button type="button" class="is-danger" data-act="remove">Remove section</button>' +
          '</div>' +
          '<ul class="blocks">' +
            '<li><button type="button">Heading</button></li>' +
            '<li><button type="button">Unit card · ' + (s.cards || 3) + '</button></li>' +
            '<li><button type="button">“See all” link</button></li>' +
            '<li><button type="button" class="blocks__add">+ Add block</button></li>' +
          '</ul>' +
        '</div>';
    }).join('');

    $$('[data-section-count]').forEach(function (el) { el.textContent = String(state.sections.length); });
  }

  railEl.addEventListener('click', function (e) {
    var eye = e.target.closest('[data-toggle-hide]');
    if (eye) {
      e.stopPropagation();
      var s = find(eye.dataset.toggleHide);
      s.hidden = !s.hidden;
      markDirty(); renderRail(); renderPreview();
      return;
    }
    var act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      doAction(act.dataset.act);
      return;
    }
    var row = e.target.closest('[data-section]');
    if (row) select(row.dataset.section);
  });

  railEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var row = e.target.closest('[data-section]');
    if (row && !e.target.closest('[data-toggle-hide]')) { e.preventDefault(); select(row.dataset.section); }
  });

  function doAction(act) {
    var s = find(state.selected);
    if (!s) return;
    if (act === 'duplicate') {
      var copy = JSON.parse(JSON.stringify(s));
      copy.id = s.id + '-' + Date.now();
      copy.name = s.name + ' copy';
      state.sections.splice(state.sections.indexOf(s) + 1, 0, copy);
    } else if (act === 'rename') {
      var name = prompt('Rename section', s.name);
      if (name) s.name = name;
    } else if (act === 'hide') {
      s.hidden = !s.hidden;
    } else if (act === 'remove') {
      state.sections.splice(state.sections.indexOf(s), 1);
      state.selected = null;
    }
    markDirty(); renderRail(); renderInspector(); renderPreview();
  }

  /* ---------------------------------------------------------- drag to reorder */

  var dragId = null;
  railEl.addEventListener('dragstart', function (e) {
    var row = e.target.closest('[data-section]');
    if (!row) return;
    dragId = row.dataset.section;
    row.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {}
  });
  railEl.addEventListener('dragend', function () {
    dragId = null;
    $$('.srow', railEl).forEach(function (r) { r.classList.remove('is-dragging', 'is-over'); });
  });
  railEl.addEventListener('dragover', function (e) {
    if (!dragId) return;
    e.preventDefault();
    var row = e.target.closest('[data-section]');
    $$('.srow', railEl).forEach(function (r) { r.classList.remove('is-over'); });
    if (row && row.dataset.section !== dragId) row.classList.add('is-over');
  });
  railEl.addEventListener('drop', function (e) {
    if (!dragId) return;
    e.preventDefault();
    var row = e.target.closest('[data-section]');
    if (!row) return;
    var from = state.sections.indexOf(find(dragId));
    var to = state.sections.indexOf(find(row.dataset.section));
    if (from < 0 || to < 0 || from === to) return;
    state.sections.splice(to, 0, state.sections.splice(from, 1)[0]);
    markDirty(); renderRail(); renderPreview();
  });

  /* ---------------------------------------------------------- selection */

  function select(id) {
    state.selected = state.selected === id ? null : id;
    renderRail();
    renderInspector();
    renderPreview();
    if (state.selected && window.matchMedia('(max-width: 1120px)').matches) bx.classList.add('is-inspecting');
  }

  /* ---------------------------------------------------------- inspector */

  var pagePane = $('[data-insp="page"]');
  var sectionPane = $('[data-insp="section"]');

  function renderInspector() {
    var s = find(state.selected);
    var showSection = !!(s && s.id === 'featured');
    // Only the Featured-units section has a designed inspector; others fall
    // back to page settings rather than inventing panels.
    pagePane.hidden = showSection;
    sectionPane.hidden = !showSection;
    if (!showSection) return;

    $('[data-insp-title]').textContent = s.name;
    $('[data-insp-blocks]').textContent = String(s.blocks);
    var ar = state.contentLang === 'ar';
    $('[data-bind="heading"]').value = ar ? s.headingAr : s.heading;
    $('[data-bind="sub"]').value = ar ? s.subAr : s.sub;
    $('[data-bind="collection"]').value = s.collection;
    $('[data-bind="cards"]').value = s.cards;
    $('[data-bind="pad"]').value = s.pad;
    $('[data-bind="linkText"]').value = s.linkText;
    setSeg('[data-layout]', 'lay', s.layout);
    setSeg('[data-cardstyle]', 'cs', s.cardStyle);
    setSeg('[data-badge]', 'bd', s.badge);
    Object.keys(s.fields).forEach(function (k) {
      var input = $('[data-field-toggle="' + k + '"]');
      if (input) input.checked = s.fields[k];
    });
    $$('[data-bg] button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.style.background.toUpperCase().indexOf(s.bg.slice(1).toUpperCase()) >= 0 || rgbToHex(b.style.background) === s.bg));
    });
  }

  function rgbToHex(v) {
    var m = String(v).match(/\d+/g);
    if (!m) return v.toUpperCase();
    return '#' + m.slice(0, 3).map(function (n) { return ('0' + Number(n).toString(16)).slice(-2); }).join('').toUpperCase();
  }

  function setSeg(sel, key, value) {
    var root = $(sel);
    if (!root) return;
    $$('button', root).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset[key] === value)); });
  }

  // Segmented controls inside the inspector
  [['[data-layout]', 'lay', 'layout'], ['[data-cardstyle]', 'cs', 'cardStyle'], ['[data-badge]', 'bd', 'badge']].forEach(function (cfg) {
    var root = $(cfg[0]);
    if (!root) return;
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-' + cfg[1] + ']');
      if (!b) return;
      var s = find(state.selected);
      if (!s) return;
      s[cfg[2]] = b.dataset[cfg[1]];
      setSeg(cfg[0], cfg[1], s[cfg[2]]);
      markDirty(); renderPreview();
    });
  });

  var langSeg = $('[data-content-lang]');
  if (langSeg) {
    langSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-clang]');
      if (!b) return;
      state.contentLang = b.dataset.clang;
      setSeg('[data-content-lang]', 'clang', state.contentLang);
      renderInspector();
      renderPreview();
    });
  }

  // Text + select bindings
  document.addEventListener('input', function (e) {
    var el = e.target.closest('[data-bind]');
    if (!el) return;
    var key = el.dataset.bind;
    var s = find(state.selected);

    if (key === 'pageTitle') { state.page.title = el.value; var m = $('[data-mirror="pageTitle"]'); if (m) m.textContent = el.value; }
    else if (key === 'pageMeta') { state.page.meta = el.value; updateCount(); }
    else if (key === 'contentWidth') { state.page.contentWidth = clamp(parseInt(el.value, 10) || 1200, 960, 1600); }
    else if (s && key === 'heading') { if (state.contentLang === 'ar') s.headingAr = el.value; else s.heading = el.value; }
    else if (s && key === 'sub') { if (state.contentLang === 'ar') s.subAr = el.value; else s.sub = el.value; }
    else if (s && key === 'collection') { s.collection = el.value; }
    else if (s && key === 'cards') { s.cards = clamp(parseInt(el.value, 10) || 3, 1, 4); }
    else if (s && key === 'pad') { s.pad = clamp(parseInt(el.value, 10) || 64, 0, 160); }
    else if (s && key === 'linkText') { s.linkText = el.value; }

    markDirty();
    renderPreview();
  });

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function updateCount() {
    var c = $('[data-count-for="pgMeta"]');
    if (!c) return;
    var n = state.page.meta.length;
    c.textContent = n + ' / 160';
    c.classList.toggle('is-over', n > 160);
  }

  // Steppers
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-step]');
    if (!b) return;
    var key = b.dataset.step, by = Number(b.dataset.by);
    var s = find(state.selected);
    if (key === 'cards' && s) s.cards = clamp(s.cards + by, 1, 4);
    else if (key === 'pad' && s) s.pad = clamp(s.pad + by, 0, 160);
    else if (key === 'contentWidth') state.page.contentWidth = clamp(state.page.contentWidth + by, 960, 1600);
    markDirty(); renderInspector(); renderPreview();
    if (key === 'contentWidth') $('[data-bind="contentWidth"]').value = state.page.contentWidth;
  });

  // Field toggles
  document.addEventListener('change', function (e) {
    var t = e.target.closest('[data-field-toggle]');
    if (!t) return;
    var s = find(state.selected);
    if (!s) return;
    s.fields[t.dataset.fieldToggle] = t.checked;
    markDirty(); renderPreview();
  });

  // Background swatches
  var bgRoot = $('[data-bg]');
  if (bgRoot) {
    bgRoot.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var s = find(state.selected);
      if (!s) return;
      s.bg = rgbToHex(getComputedStyle(b).backgroundColor);
      $$('button', bgRoot).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      markDirty(); renderPreview();
    });
  }

  var spacing = $('[data-spacing]');
  if (spacing) {
    spacing.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-space]');
      if (!b) return;
      state.page.spacing = Number(b.dataset.space);
      setSeg('[data-spacing]', 'space', b.dataset.space);
      markDirty(); renderPreview();
    });
  }

  var removeBtn = $('[data-remove-section]');
  if (removeBtn) removeBtn.addEventListener('click', function () { doAction('remove'); });

  var resetBtn = $('[data-reset-section]');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      var s = find(state.selected);
      if (!s) return;
      s.layout = 'grid'; s.cards = 3; s.cardStyle = 'image'; s.pad = 64; s.bg = '#FFFFFF';
      s.fields = { price: true, terms: true, area: true, beds: true };
      s.badge = 'featured';
      markDirty(); renderInspector(); renderPreview();
    });
  }

  /* ---------------------------------------------------------- preview */

  var preview = $('[data-preview]');

  function unitCard(u, s) {
    var f = s.fields;
    var specs = [f.area ? u.area : null, f.beds ? u.beds : null, u.extra].filter(Boolean).join(' · ');
    return '<article class="sf__card">' +
      (s.badge === 'featured' && u.badge ? '<span class="sf__badge">FEATURED</span>' : '') +
      '<div class="ph ph--fine"></div>' +
      '<div class="sf__card-body">' +
        '<b>' + esc(u.name) + '</b>' +
        '<p class="spec">' + esc(specs) + '</p>' +
        (f.price ? '<p class="price">' + esc(u.price) + '</p>' : '') +
        (f.terms ? '<p class="terms">' + esc(u.terms) + '</p>' : '') +
      '</div></article>';
  }

  function sectionMarkup(s) {
    var sel = state.selected === s.id;
    var open = '<section class="sf__section' + (sel ? ' is-selected' : '') + '" data-selectable data-sec="' + s.id + '"' + (s.hidden ? ' hidden' : '') + '>' +
      '<span class="sf__tag">' + esc(s.name) + '</span>';
    var close = '</section>';
    var pad = state.page.spacing;

    if (s.id === 'hero') {
      return open +
        '<div class="sf__hero"><div class="ph ph--dark ph--label"><span>hero · New Cairo compound exterior · 16:9</span></div>' +
        '<div class="sf__hero-inner">' +
          '<p class="sf__hero-title">Find your unit in New Cairo</p>' +
          '<div class="sf__search">' +
            '<div class="sf__field"><label>Zone</label><b>New Cairo</b></div>' +
            '<div class="sf__field"><label>Type</label><b>Apartment</b></div>' +
            '<div class="sf__field"><label>Beds</label><b>3+</b></div>' +
            '<div class="sf__field"><label>Budget</label><b>Up to 12M</b></div>' +
            '<span class="sf__go">Search</span>' +
          '</div>' +
        '</div></div>' + close;
    }

    if (s.id === 'featured') {
      var ar = state.contentLang === 'ar';
      var heading = ar ? s.headingAr : s.heading;
      var sub = ar ? s.subAr : s.sub;
      var cards = UNITS.slice(0, Math.max(s.cards, 3)).map(function (u) { return unitCard(u, s); }).join('');
      return '<section class="sf__section' + (sel ? ' is-selected' : '') + '" data-selectable data-sec="' + s.id + '"' +
        (s.hidden ? ' hidden' : '') + ' style="background:' + s.bg + '">' +
        '<span class="sf__tag">' + esc(s.name) + '</span>' +
        '<div class="sf__band" style="--sf-pad:' + s.pad + 'px"' + (ar ? ' dir="rtl"' : '') + '>' +
          '<div class="sf__band-head">' +
            '<div><h2>' + esc(heading) + '</h2><p>' + esc(sub) + '</p></div>' +
            '<a href="#">' + esc(s.linkText) + ' →</a>' +
          '</div>' +
          '<div class="sf__grid sf__grid--' + s.layout + '" data-style="' + s.cardStyle + '" style="--cards:' + s.cards + '">' + cards + '</div>' +
        '</div>' + close;
    }

    var labels = { map: 'Explore by zone', calc: 'Work out your payment plan', team: 'Meet the team', testimonials: 'What buyers say' };
    return open +
      '<div class="sf__band" style="--sf-pad:' + pad + 'px;background:var(--paper)">' +
        '<div class="sf__band-head"><div><h2>' + esc(labels[s.id] || s.name) + '</h2></div></div>' +
        '<div class="ph" style="height:150px;border-radius:12px">' + esc(s.name) + ' · placeholder</div>' +
      '</div>' + close;
  }

  function renderPreview() {
    var w = state.page.contentWidth;
    var html =
      '<div class="sf__announce">Delivery Q4 2027 · payment plans up to 8 years · talk to us on WhatsApp</div>' +
      '<div class="sf__header">' +
        '<span class="sf__brand">Kamal Estates</span>' +
        '<nav class="sf__nav"><span>Units</span><span>Compounds</span><span>Payment plans</span><span>About</span><span class="sf__wa">WhatsApp</span></nav>' +
      '</div>' +
      '<div style="max-width:' + w + 'px;margin-inline:auto">' +
        state.sections.map(sectionMarkup).join('') +
      '</div>';
    preview.innerHTML = html;
  }

  preview.addEventListener('click', function (e) {
    var sec = e.target.closest('[data-sec]');
    if (sec) select(sec.dataset.sec);
  });

  /* ---------------------------------------------------------- chrome */

  $('[data-device-switch]').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-device]');
    if (!b) return;
    state.device = b.dataset.device;
    setSeg('[data-device-switch]', 'device', state.device);
    $('[data-device-frame]').dataset.device = state.device;
    var dims = { desktop: '1440 × 900', tablet: '834 × 1112', mobile: '414 × 896' };
    $('[data-dims]').textContent = dims[state.device];
  });

  $('[data-lang-switch]').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lang]');
    if (!b) return;
    state.contentLang = b.dataset.lang;
    setSeg('[data-lang-switch]', 'lang', state.contentLang);
    setSeg('[data-content-lang]', 'clang', state.contentLang);
    renderInspector();
    renderPreview();
  });

  var zoomEl = $('[data-zoom-value]');
  $$('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.zoom = clamp(state.zoom + (b.dataset.zoom === '+' ? 10 : -10), 30, 130);
      zoomEl.textContent = state.zoom + '%';
      var frame = $('[data-device-frame]');
      frame.style.transform = state.zoom === 100 ? '' : 'scale(' + (state.zoom / 100) + ')';
    });
  });

  var railTabs = $('[data-rail-tabs]');
  railTabs.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-panel]');
    if (!b) return;
    setSeg('[data-rail-tabs]', 'panel', b.dataset.panel);
    $$('[data-rail-panel]').forEach(function (p) { p.hidden = p.dataset.railPanel !== b.dataset.panel; });
  });

  // Off-canvas panes on narrow screens
  var railToggle = $('[data-rail-toggle]');
  if (railToggle) railToggle.addEventListener('click', function () {
    var on = bx.classList.toggle('is-railing');
    railToggle.setAttribute('aria-expanded', String(on));
  });
  var inspToggle = $('[data-insp-toggle]');
  if (inspToggle) inspToggle.addEventListener('click', function () {
    var on = bx.classList.toggle('is-inspecting');
    inspToggle.setAttribute('aria-expanded', String(on));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') bx.classList.remove('is-railing', 'is-inspecting');
  });

  /* ---------------------------------------------------------- go */

  setSeg('[data-spacing]', 'space', String(state.page.spacing));
  renderRail();
  renderInspector();
  renderPreview();
  updateCount();
})();
