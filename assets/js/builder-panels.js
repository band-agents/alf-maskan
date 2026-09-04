/* Alf Maskan — the builder's four panels.
   Loaded after builder.js, which owns the state, the tree and the preview.
   This adds the pieces the artboards call for and nothing else:

     · the section library that "Add section" opens
     · block-level editing under a section in the tree
     · the publish popover, with what actually changed
     · version history, and the template library

   Enhancement only. With JavaScript off none of these panels exist, and the
   builder is still a readable picture of the storefront. */

(function () {
  'use strict';

  var bx = document.getElementById('bx');
  if (!bx) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  /* ================================================== the section library
     The whole real-estate library from the brief. Each entry carries the
     wireframe shape its thumbnail draws, so a card looks like what it adds. */

  var LIBRARY = [
    ['Hero', 'Search hero', 'Headline over a photo with a zone, type and budget search bar', 'stack'],
    ['Hero', 'Video hero', 'A looping walkthrough behind your headline', 'block'],
    ['Hero', 'Split hero', 'Text one side, one large photo the other', 'split'],
    ['Hero', 'Slideshow', 'Three or four photos that cross-fade', 'block'],
    ['Hero', 'Compound hero', 'A single project with its masterplan and delivery date', 'stack'],

    ['Listings', 'Featured units', 'The three or four you most want to sell this month', 'grid'],
    ['Listings', 'Unit grid', 'Every unit in a collection, in rows', 'grid'],
    ['Listings', 'Unit carousel', 'A scrolling row that fits more units in less height', 'row'],
    ['Listings', 'Filterable search results', 'The full search, embedded in a page', 'split'],
    ['Listings', 'Map explorer', 'Price pins on a map beside the matching cards', 'split'],
    ['Listings', 'Compare units', 'Two or three side by side, differences marked', 'grid'],
    ['Listings', 'Recently viewed', 'What this buyer looked at last time', 'row'],
    ['Listings', 'Collection row', 'One collection as a titled row with a link to all of it', 'row'],

    ['Trust', 'Developer logos', 'Emaar, SODIC, Palm Hills — who you sell for', 'row'],
    ['Trust', 'Stats counters', 'Units listed, years trading, families moved in', 'row'],
    ['Trust', 'Testimonials', 'What buyers said, with their photo and compound', 'grid'],
    ['Trust', 'Awards', 'Certificates and rankings, if you have them', 'row'],
    ['Trust', 'Team / agents', 'Your agents with their zones and WhatsApp', 'grid'],
    ['Trust', 'About us', 'The paragraph that explains who you are', 'stack'],
    ['Trust', 'Certifications', 'Your brokerage licence and registration number', 'row'],

    ['Content', 'Rich text', 'A heading and body copy, in either script', 'stack'],
    ['Content', 'Image + text', 'One photo beside one paragraph, alternating', 'split'],
    ['Content', 'Area / zone guide', 'What it is like to live in New Cairo or Sahel', 'stack'],
    ['Content', 'FAQ accordion', 'The questions buyers ask before they call', 'stack'],
    ['Content', 'Blog posts', 'Your latest three articles', 'grid'],
    ['Content', 'Gallery', 'A photo grid with a fullscreen viewer', 'grid'],
    ['Content', 'Timeline', 'Project phases and when each one hands over', 'stack'],

    ['Conversion', 'Lead form', 'Name, mobile, budget — routed to an agent', 'stack'],
    ['Conversion', 'Book a viewing', 'Day and time slots against your office hours', 'stack'],
    ['Conversion', 'WhatsApp CTA band', 'A full-width strip with one green button', 'block'],
    ['Conversion', 'Payment-plan calculator', 'Down payment and years sliders, live monthly figure', 'split'],
    ['Conversion', 'Mortgage calculator', 'For the banks that lend on your compounds', 'split'],
    ['Conversion', 'Limited-offer countdown', 'A gold badge and a clock, ending itself on the date', 'block'],
    ['Conversion', 'Newsletter', 'Email capture for new releases', 'row'],
    ['Conversion', 'Download brochure', 'A PDF behind a name and a number', 'row'],

    ['Media', 'Image banner', 'One wide photo, optionally with text over it', 'block'],
    ['Media', 'Video', 'An embedded walkthrough or drone shot', 'block'],
    ['Media', '360° tour', 'Matterport or Kuula, inline', 'block'],
    ['Media', 'Floor plans', 'Plans per unit type, zoomable', 'grid'],
    ['Media', 'Before / after finishing', 'A slider between core-and-shell and finished', 'split'],

    ['Layout', 'Spacer', 'Empty height where a section needs room', 'row'],
    ['Layout', 'Divider', 'A hairline between two sections', 'row'],
    ['Layout', 'Multi-column', 'Two or three columns of anything', 'grid'],
    ['Layout', 'Custom HTML', 'For a widget we do not have yet', 'stack'],
    ['Layout', 'Announcement', 'The thin strip above your header', 'row']
  ];

  var CATEGORIES = ['All', 'Hero', 'Listings', 'Trust', 'Content', 'Conversion', 'Media', 'Layout'];

  var libPanel = $('[data-library]');
  var libList = $('[data-lib-list]');
  var libTabs = $('[data-lib-tabs]');
  var libQ = $('[data-lib-q]');
  var libEmpty = $('[data-lib-empty]');
  var libCat = 'All';

  function thumb(shape) {
    var t = document.createElement('span');
    t.className = 'libcard__thumb' + (shape === 'grid' ? ' grid' : '');
    t.setAttribute('aria-hidden', 'true');
    var bars = {
      stack: ['h', 'w', 'w'],
      block: ['tall'],
      split: ['w', 'w'],
      row: ['w'],
      grid: ['w', 'w', 'w']
    }[shape] || ['w'];
    bars.forEach(function (cls) {
      var i = document.createElement('i');
      i.className = cls;
      t.appendChild(i);
    });
    return t;
  }

  function renderLibrary() {
    if (!libList) return;
    var term = libQ ? libQ.value.trim().toLowerCase() : '';
    libList.textContent = '';
    var shown = 0;

    LIBRARY.forEach(function (row) {
      var cat = row[0], name = row[1], desc = row[2], shape = row[3];
      if (libCat !== 'All' && cat !== libCat) return;
      if (term && (name + ' ' + desc + ' ' + cat).toLowerCase().indexOf(term) === -1) return;
      shown++;

      var card = document.createElement('button');
      card.className = 'libcard';
      card.type = 'button';
      card.appendChild(thumb(shape));

      var txt = document.createElement('span');
      txt.className = 'libcard__txt';
      var b = document.createElement('b');
      b.textContent = name;
      var s = document.createElement('span');
      s.textContent = desc;
      txt.appendChild(b);
      txt.appendChild(s);
      card.appendChild(txt);

      card.addEventListener('click', function () { addSection(name); });
      libList.appendChild(card);
    });

    if (libEmpty) libEmpty.hidden = shown !== 0;
  }

  if (libTabs) {
    CATEGORIES.forEach(function (cat) {
      var tab = document.createElement('button');
      tab.className = 'libtab';
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(cat === 'All'));
      tab.textContent = cat;
      tab.addEventListener('click', function () {
        libCat = cat;
        $$('.libtab', libTabs).forEach(function (t) {
          t.setAttribute('aria-selected', String(t === tab));
        });
        renderLibrary();
      });
      libTabs.appendChild(tab);
    });
  }
  if (libQ) libQ.addEventListener('input', renderLibrary);

  function openLibrary(open) {
    if (!libPanel) return;
    libPanel.hidden = !open;
    var trigger = $('[data-open-library]');
    if (trigger) trigger.setAttribute('aria-expanded', String(open));
    if (open && libQ) libQ.focus();
  }

  $$('[data-open-library]').forEach(function (b) {
    b.addEventListener('click', function () { openLibrary(true); });
  });
  $$('[data-close-library]').forEach(function (b) {
    b.addEventListener('click', function () { openLibrary(false); });
  });

  /* Adding a section is a real edit: it lands in the tree, in the canvas and
     in the list of unpublished changes. */
  var added = [];

  function addSection(name) {
    added.push(name);
    openLibrary(false);
    markDirty('added', name);

    var list = $('[data-sections]');
    if (list) {
      var row = document.createElement('button');
      row.className = 'srow';
      row.type = 'button';
      row.innerHTML = '<span class="srow__grip" aria-hidden="true"><svg width="9" height="12" viewBox="0 0 9 12">' +
        '<circle cx="2" cy="2" r="1.1" fill="currentColor"/><circle cx="7" cy="2" r="1.1" fill="currentColor"/>' +
        '<circle cx="2" cy="6" r="1.1" fill="currentColor"/><circle cx="7" cy="6" r="1.1" fill="currentColor"/>' +
        '<circle cx="2" cy="10" r="1.1" fill="currentColor"/><circle cx="7" cy="10" r="1.1" fill="currentColor"/></svg></span>';
      var nm = document.createElement('span');
      nm.className = 'srow__name';
      nm.textContent = name;
      row.appendChild(nm);
      list.appendChild(row);

      var count = $('[data-section-count]');
      if (count) count.textContent = String($$('.srow', list).length);
    }
  }

  /* ================================================== block-level editing
     Blocks per section, as the artboard draws the payment-plan calculator. */

  var BLOCKS = {
    'Search hero': ['Heading', 'Subheading', 'Search fields', 'Background image'],
    'Featured units': ['Heading', 'Unit cards', 'Browse-all link'],
    'Map explorer': ['Heading', 'Map', 'Result list'],
    'Payment plan calculator': ['Heading', 'Down payment slider', 'Years selector', 'Result card', 'Disclaimer', 'CTA'],
    'Team / agents': ['Heading', 'Agent cards'],
    'Testimonials': ['Heading', 'Quote cards']
  };

  function wireTree() {
    $$('.srow', $('[data-sections]')).forEach(function (row) {
      if (row.hasAttribute('data-blocks-wired')) return;
      row.setAttribute('data-blocks-wired', '');

      var name = $('.srow__name', row);
      var blocks = name && BLOCKS[name.textContent.trim()];
      if (!blocks) return;

      var caret = document.createElement('span');
      caret.className = 'srow__caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.innerHTML = '<svg width="8" height="8" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
      row.appendChild(caret);
      row.setAttribute('aria-expanded', 'false');

      var wrap = document.createElement('div');
      wrap.className = 'blist';
      wrap.hidden = true;

      blocks.forEach(function (label) {
        var b = document.createElement('button');
        b.className = 'brow';
        b.type = 'button';
        var dot = document.createElement('span');
        dot.className = 'brow__dot';
        dot.setAttribute('aria-hidden', 'true');
        b.appendChild(dot);
        b.appendChild(document.createTextNode(label));
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          $$('.brow').forEach(function (o) { o.removeAttribute('aria-current'); });
          b.setAttribute('aria-current', 'true');
          showBlock(name.textContent.trim(), label);
        });
        wrap.appendChild(b);
      });

      var add = document.createElement('button');
      add.className = 'badd';
      add.type = 'button';
      add.textContent = '+ Add block';
      wrap.appendChild(add);

      row.parentNode.insertBefore(wrap, row.nextSibling);

      caret.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = wrap.hidden;
        wrap.hidden = !open;
        row.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* A selected block takes over the inspector, and says which section it
     belongs to so you are never editing something you cannot place. */
  function showBlock(section, block) {
    var pane = $('[data-insp="section"]') || $('[data-insp="page"]');
    if (!pane) return;

    var existing = $('[data-block-pane]');
    if (existing) existing.remove();

    var host = pane.parentNode;
    var panel = document.createElement('div');
    panel.className = 'insp__pane';
    panel.setAttribute('data-block-pane', '');
    panel.style.cssText = 'display:flex;flex-direction:column;min-height:0;flex:1';

    var head = document.createElement('div');
    head.className = 'insp__head';
    head.innerHTML = '<b>' + block + '</b><span>Block in ' + section + '</span>';

    var body = document.createElement('div');
    body.className = 'bx__scroll';
    body.style.padding = '14px';

    var FIELDS = {
      'Down payment slider': [
        ['Label', 'text', 'Down payment'],
        ['Lowest', 'number', '5'],
        ['Highest', 'number', '50'],
        ['Starts at', 'number', '10']
      ],
      'Years selector': [
        ['Label', 'text', 'Over'],
        ['Most years', 'number', '8'],
        ['Starts at', 'number', '8']
      ],
      'Result card': [
        ['Label', 'text', 'Monthly instalment'],
        ['Note under it', 'text', 'Payments start on delivery']
      ],
      'Disclaimer': [
        ['Text', 'text', 'Quoted without interest, the way Egyptian developer plans are written.']
      ],
      'CTA': [
        ['Button text', 'text', 'Talk to us on WhatsApp'],
        ['Links to', 'text', 'WhatsApp']
      ]
    };
    var fields = FIELDS[block] || [['Text', 'text', block]];

    fields.forEach(function (f) {
      var wrap = document.createElement('div');
      wrap.className = 'fld';
      var lab = document.createElement('label');
      lab.textContent = f[0];
      var input = document.createElement('input');
      input.className = 'inp';
      input.type = f[1];
      input.value = f[2];
      input.addEventListener('input', function () { markDirty('edited', block); });
      wrap.appendChild(lab);
      wrap.appendChild(input);
      body.appendChild(wrap);
    });

    var back = document.createElement('button');
    back.className = 'btn btn--app';
    back.type = 'button';
    back.textContent = '← Back to the section';
    back.style.marginTop = '12px';
    back.addEventListener('click', function () {
      panel.remove();
      pane.style.display = '';
      $$('.brow').forEach(function (o) { o.removeAttribute('aria-current'); });
    });
    body.appendChild(back);

    panel.appendChild(head);
    panel.appendChild(body);
    pane.style.display = 'none';
    host.appendChild(panel);
  }

  /* ========================================================= publish flow */

  var changes = [];

  function markDirty(kind, what) {
    changes.push({ kind: kind, what: what });
    var save = $('[data-save]');
    if (save) save.disabled = false;
    var state = $('[data-save-state]');
    if (state) {
      state.textContent = 'Unsaved changes';
      state.className = 'bx__status';
    }
  }

  // builder.js marks its own edits dirty; watching the chip keeps this list in
  // step without the two scripts having to share a variable.
  var stateChip = $('[data-save-state]');
  if (stateChip && window.MutationObserver) {
    new MutationObserver(function () {
      if (/unsaved/i.test(stateChip.textContent) && !changes.length) {
        changes.push({ kind: 'edited', what: 'a section' });
      }
    }).observe(stateChip, { childList: true, characterData: true, subtree: true });
  }

  var pubpop = $('[data-pubpop]');
  var save = $('[data-save]');

  function renderPub() {
    var list = $('[data-pubpop-list]');
    if (!list) return;
    list.textContent = '';

    var edits = changes.filter(function (c) { return c.kind === 'edited'; }).length;
    var adds = changes.filter(function (c) { return c.kind === 'added'; });

    var rows = [];
    if (edits) rows.push(['', edits + (edits === 1 ? ' section edited' : ' sections edited')]);
    adds.forEach(function (a) { rows.push(['add', a.what + ' added']); });
    if (!rows.length) rows.push(['', 'Nothing has changed since the last publish']);

    rows.forEach(function (r) {
      var row = document.createElement('span');
      row.className = 'pubpop__item';
      var dot = document.createElement('i');
      if (r[0]) dot.className = r[0];
      dot.setAttribute('aria-hidden', 'true');
      row.appendChild(dot);
      row.appendChild(document.createTextNode(r[1]));
      list.appendChild(row);
    });
  }

  if (save && pubpop) {
    save.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pubpop.hidden;
      renderPub();
      pubpop.hidden = !open;
      save.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function (e) {
      if (!pubpop.hidden && !pubpop.contains(e.target) && e.target !== save) {
        pubpop.hidden = true;
        save.setAttribute('aria-expanded', 'false');
      }
    });

    var sched = $('[data-pub-schedule]');
    var when = $('[data-pub-when]');
    if (sched && when) {
      sched.addEventListener('change', function () {
        when.hidden = !sched.checked;
        var go = $('[data-pub-go]');
        if (go) go.textContent = sched.checked ? 'Schedule' : 'Publish';
      });
    }

    var cancel = $('[data-pub-cancel]');
    if (cancel) cancel.addEventListener('click', function () {
      pubpop.hidden = true;
      save.setAttribute('aria-expanded', 'false');
    });

    var go = $('[data-pub-go]');
    if (go) go.addEventListener('click', function () {
      var scheduled = sched && sched.checked;
      changes = [];
      pubpop.hidden = true;
      save.setAttribute('aria-expanded', 'false');
      save.disabled = true;
      var chip = $('[data-save-state]');
      if (chip) {
        chip.textContent = scheduled ? 'Scheduled' : 'Live';
        chip.className = 'bx__status bx__status--live';
      }
      var note = $('[data-saved-note]');
      if (note) note.textContent = scheduled ? 'Goes live 4 Sep, 09:00' : 'Published · just now';
    });
  }

  /* ====================================================== version history */

  var drawer = $('[data-versions]');
  var scrim = $('[data-scrim]');

  function openDrawer(open) {
    if (!drawer) return;
    drawer.hidden = !open;
    if (scrim) scrim.hidden = !open;
  }

  $$('[data-open-versions]').forEach(function (b) {
    b.addEventListener('click', function () { openDrawer(true); });
  });
  $$('[data-close-versions]').forEach(function (b) {
    b.addEventListener('click', function () { openDrawer(false); });
  });
  if (scrim) scrim.addEventListener('click', function () { openDrawer(false); closeTpl(); });

  $$('[data-restore]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.vrow');
      $$('.vrow').forEach(function (r) { r.removeAttribute('data-current'); });
      row.setAttribute('data-current', '');
      // Restoring makes a new version rather than deleting anything.
      markDirty('edited', 'restored version');
      var chip = $('[data-save-state]');
      if (chip) chip.textContent = 'Restored — not published';
    });
  });

  /* ====================================================== template library */

  var TEMPLATES = [
    ['Nile', 'Editorial agency classic. Serif headlines, wide margins, warm paper.', true],
    ['Cascade', 'Luxury minimal. Near-full-bleed photography, very small type.', false],
    ['Compound', 'One project, one site. Masterplan, phases, brochure download.', false],
    ['Sahel', 'Coastal and warm. Season badges and delivery countdowns.', false],
    ['Broker', 'Search-first portal. Dense filter rail, map split. For 500+ units.', false],
    ['Vitrine', 'Charcoal and gold hairlines. One hero unit at a time.', false],
    ['Solo', 'Personal brand. Big portrait, WhatsApp-forward, small portfolio.', false],
    ['Blueprint', 'Developer corporate. Projects, timeline, investor stats.', false],
    ['Rental', 'Long and short lets. Calendars, monthly pricing, quick enquiry.', false],
    ['Souq', 'Multi-agent marketplace. Directory, verified badges, high volume.', false]
  ];

  var tplModal = $('[data-tplmodal]');
  var tplGrid = $('[data-tplgrid]');

  if (tplGrid) {
    TEMPLATES.forEach(function (t) {
      var card = document.createElement('button');
      card.className = 'tpl';
      card.type = 'button';
      card.setAttribute('aria-current', String(t[2]));

      if (t[2]) {
        var now = document.createElement('span');
        now.className = 'tpl__now';
        now.textContent = 'CURRENT';
        card.appendChild(now);
      }

      var ph = document.createElement('span');
      ph.className = 'ph';
      ph.textContent = t[0].toLowerCase() + ' · home page · 4:3';
      card.appendChild(ph);

      var body = document.createElement('span');
      body.className = 'tpl__body';
      var b = document.createElement('b');
      b.textContent = t[0];
      var s = document.createElement('span');
      s.textContent = t[1];
      body.appendChild(b);
      body.appendChild(s);
      card.appendChild(body);

      card.addEventListener('click', function () {
        $$('.tpl', tplGrid).forEach(function (c) {
          c.setAttribute('aria-current', 'false');
          var flag = $('.tpl__now', c);
          if (flag) flag.remove();
        });
        card.setAttribute('aria-current', 'true');
        var flag = document.createElement('span');
        flag.className = 'tpl__now';
        flag.textContent = 'CURRENT';
        card.insertBefore(flag, card.firstChild);
        markDirty('edited', 'template');
        closeTpl();
      });

      tplGrid.appendChild(card);
    });
  }

  function closeTpl() { if (tplModal) tplModal.hidden = true; }
  $$('[data-close-tpl]').forEach(function (b) { b.addEventListener('click', closeTpl); });

  // The Pages tab is where a template swap belongs, so open it from there.
  var pagesPanel = $('[data-rail-panel="pages"]');
  if (pagesPanel && tplModal) {
    var open = document.createElement('button');
    open.className = 'add-section';
    open.type = 'button';
    open.style.marginTop = '10px';
    open.textContent = 'Change template';
    open.addEventListener('click', function () { tplModal.hidden = false; });
    pagesPanel.appendChild(open);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    openDrawer(false);
    closeTpl();
    openLibrary(false);
    if (pubpop && !pubpop.hidden) {
      pubpop.hidden = true;
      if (save) save.setAttribute('aria-expanded', 'false');
    }
  });

  /* ------------------------------------------------------------------ go */

  renderLibrary();
  wireTree();
})();
