#!/usr/bin/env node
/* =====================================================================
   draw-dashboard-boards.js — finishes canvas 4 (dashboard core).

   The canvas shipped with 2 of the 7 artboards its own spec line promises:
   01 Home light and 02 Home dark. This adds 03-07, covering the three
   screens that exist in code with no design behind them:

     03  listings, table view, filtered, with a selection
     04  listings, grid view, and the no-results state
     05  listing editor, details, with the live storefront card
     06  listing editor, media, mid-drag
     07  collections, an automatic collection and its rules

   Two rules govern everything below.

   1. The shell is LIFTED, not redrawn. The sidebar and top bar are sliced
      out of board 01 byte-for-byte and re-emitted with the active nav item
      moved. A hand-copied shell drifts from the original within one edit.

   2. Every number and string comes from the shipped page it documents, not
      from imagination. Match counts, instalments and price-per-m2 are
      computed here (see derive() calls) so the canvas cannot claim a total
      the product would not produce.

   Run:  node tools/draw-dashboard-boards.js
   Idempotent — it strips any boards it wrote before and redraws them.
   ===================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'design', 'Aqarly Dashboard.dc.html');

/* ------------------------------------------------------------ parser */
/* Balanced-tag scanner. Returns byte ranges so a subtree can be lifted
   verbatim rather than re-serialised. */
const VOID = new Set(['meta', 'link', 'br', 'hr', 'img', 'input', 'source',
  'area', 'base', 'col', 'embed', 'track', 'wbr']);

function parse(s, from, to) {
  const re = /<(\/?)([a-zA-Z][-a-zA-Z0-9:]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  re.lastIndex = from;
  const root = { tag: '#root', children: [], contentStart: from };
  const stack = [root];
  let m;
  while ((m = re.exec(s))) {
    if (m.index >= to) break;
    const closing = m[1] === '/', tag = m[2].toLowerCase(), self = m[4] === '/';
    if (closing) {
      let k = -1;
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { k = i; break; }
      if (k > 0) {
        for (let i = stack.length - 1; i >= k; i--) {
          stack[i].contentEnd = m.index;
          stack[i].end = re.lastIndex;
        }
        stack.length = k;
      }
      continue;
    }
    const n = { tag, attrs: m[3], start: m.index, contentStart: re.lastIndex, children: [] };
    stack[stack.length - 1].children.push(n);
    if (self || VOID.has(tag)) { n.end = re.lastIndex; n.contentEnd = re.lastIndex; }
    else stack.push(n);
  }
  return root;
}

/* ------------------------------------------------------------ tokens */
/* Verbatim from assets/css/tokens.css. Never invent a hex here: if a value
   is missing, it is missing from the product too. */
const T = {
  ink: '#0C1017', ink7: '#1A212D', slate: '#6B7484', slate4: '#9AA1AE',
  line: '#E6E9EF', lineStrong: '#DCE0E6', canvas: '#F6F7F9', surface: '#FFFFFF',
  palm7: '#0B4A3E', palm6: '#0F5E4E', palm5: '#127A64', palm1: '#E7F3F0',
  sand6: '#A87A1E', sand5: '#C9962B', sand1: '#FBF3E2',
  ok: '#127A4B', okBg: '#E6F4EC',
  warn: '#B4740E', warnBg: '#FCF3E3',
  bad: '#C2402F', badBg: '#FBECEA',
  info: '#2563A8', infoBg: '#E9F0FA', infoInk: '#1B4B85',
  onDark: '#ECEFF4'
};
const MONO = "'IBM Plex Mono',monospace";
const ARABIC = "'IBM Plex Sans Arabic',sans-serif";
const DISPLAY = 'Tajawal,sans-serif';
const SH_XS = '0 1px 2px rgba(12,16,23,.06)';
const SH_SM = '0 4px 12px rgba(12,16,23,.08)';
const SH_MD = '0 12px 32px rgba(12,16,23,.12)';
const SH_PALM = '0 4px 12px rgba(15,94,78,.2)';

/* No <img> anywhere in this project. Every photo is a labelled hatch. */
const hatch = (a, b, step) =>
  `repeating-linear-gradient(135deg,${a} 0 ${step}px,${b} ${step}px ${step * 2}px)`;
const HATCH = hatch('#DCE0E6', '#E7EAF0', 9);
const HATCH_BIG = hatch('#DCE0E6', '#E7EAF0', 12);
const HATCH_FINE = hatch('#E6E9EF', '#EFF1F5', 8);
const HATCH_AV = hatch('#DDE1E7', '#E9ECF1', 5);

/* ------------------------------------------------------------ helpers */
const d = (style, inner) => `<div style="${style}">${inner === undefined ? '' : inner}</div>`;
const row = (style, inner) => d(`display:flex;align-items:center;${style}`, inner);
const col = (style, inner) => d(`display:flex;flex-direction:column;${style}`, inner);
const mono = (text, style) =>
  d(`font-family:${MONO};font-size:11px;color:${T.slate};${style || ''}`, text);

/* A labelled hatched placeholder — the label says what belongs there. */
const ph = (label, style, fill) => d(
  `background:${fill || HATCH};display:grid;place-items:center;text-align:center;` +
  `font-family:${MONO};font-size:10px;line-height:14px;color:${T.slate};padding:6px;${style || ''}`,
  label);

/* Status pill. Colour is never the only signal — each one is also a word. */
const ST = {
  Live: [T.okBg, T.ok], Draft: [T.canvas, T.slate], Reserved: [T.warnBg, T.warn],
  Sold: [T.sand1, T.sand6], Rented: [T.infoBg, T.infoInk]
};
function st(word) {
  const [bg, fg] = ST[word];
  return row(
    `gap:6px;height:22px;padding:0 9px;border-radius:999px;background:${bg};color:${fg};` +
    `font-size:11px;font-weight:600;white-space:nowrap;display:inline-flex`,
    d('width:5px;height:5px;border-radius:999px;background:currentColor;flex:none') + word);
}
const badgeSand = text => d(
  `display:inline-grid;place-items:center;height:22px;padding:0 9px;border-radius:999px;` +
  `background:${T.sand1};color:${T.sand6};font-size:11px;font-weight:600;white-space:nowrap`, text);

/* Buttons — .btn--app and .btn--go at their in-app 40px height. */
const btnApp = (label, h) => row(
  `justify-content:center;gap:8px;height:${h || 40}px;padding:0 18px;border-radius:12px;` +
  `background:${T.surface};border:1px solid ${T.line};box-shadow:${SH_XS};` +
  `font-size:14px;font-weight:600;color:${T.ink7};white-space:nowrap;display:inline-flex`, label);
const btnGo = (label, h) => row(
  `justify-content:center;gap:8px;height:${h || 40}px;padding:0 18px;border-radius:12px;` +
  `background:${T.palm6};box-shadow:${SH_PALM};` +
  `font-size:14px;font-weight:600;color:#FFFFFF;white-space:nowrap;display:inline-flex`, label);

/* Icons are drawn from divs and borders. No SVG, no icon font. */
const plus = (size, color, w) => d(
  `width:${size}px;height:${size}px;position:relative;flex:none`,
  d(`position:absolute;top:50%;left:0;width:100%;height:${w || 1.6}px;background:${color};` +
    `transform:translateY(-50%);border-radius:1px`) +
  d(`position:absolute;left:50%;top:0;height:100%;width:${w || 1.6}px;background:${color};` +
    `transform:translateX(-50%);border-radius:1px`));
const chevron = (dir, color, size) => {
  const rot = { down: 45, up: 225, right: -45, left: 135 }[dir];
  const s = size || 7;
  return d(`width:${s}px;height:${s}px;flex:none;border-right:1.5px solid ${color};` +
    `border-bottom:1.5px solid ${color};transform:rotate(${rot}deg)`);
};
const tick = (size, color) => d(
  `width:${size}px;height:${size * 0.55}px;flex:none;border-left:1.6px solid ${color};` +
  `border-bottom:1.6px solid ${color};transform:rotate(-45deg)`);
const xmark = (size, color) => d(
  `width:${size}px;height:${size}px;position:relative;flex:none`,
  d(`position:absolute;top:50%;left:0;width:100%;height:1.5px;background:${color};transform:rotate(45deg)`) +
  d(`position:absolute;top:50%;left:0;width:100%;height:1.5px;background:${color};transform:rotate(-45deg)`));
const dotGrid = color => d(
  'display:grid;grid-template-columns:1fr 1fr;gap:2.5px;width:9px;flex:none',
  d(`width:2px;height:2px;border-radius:999px;background:${color}`).repeat(6));
const avatar = (size) => d(
  `width:${size}px;height:${size}px;border-radius:999px;background:${HATCH_AV};flex:none`);

/* An open ⓘ tooltip, in the established pattern:
   "[What it is]. [Why it matters, in one clause]." */
function hint(text, pos) {
  const p = pos || {};
  return d('position:relative;display:inline-flex',
    d(`width:15px;height:15px;border-radius:999px;background:${T.ink};color:#FFFFFF;` +
      `display:grid;place-items:center;font-size:10px;font-weight:700`, 'i') +
    /* `up` flips the bubble above the dot. The product only ever opens downward;
       on a dense board that drops it straight onto the control it explains. */
    d(`position:absolute;${p.up ? 'bottom' : 'top'}:${p.top || 22}px;` +
      `left:${p.left == null ? -8 : p.left}px;` +
      `width:${p.w || 250}px;background:${T.ink};color:${T.onDark};border-radius:12px;` +
      `padding:12px 14px;font-size:13px;line-height:20px;box-shadow:0 12px 32px rgba(12,16,23,.28);z-index:5`,
      text +
      d(`position:absolute;${p.up ? 'bottom' : 'top'}:-5px;left:${p.arrow || 24}px;` +
        `width:10px;height:10px;background:${T.ink};transform:rotate(45deg)`)));
}
const hintDot = () => d(
  `width:15px;height:15px;border-radius:999px;border:1.5px solid ${T.slate4};` +
  `display:grid;place-items:center;font-size:10px;font-weight:700;color:${T.slate};flex:none`, 'i');

/* ---- form controls, at the geometry editor.css gives them ---- */
const label = text => d(
  `font-size:12px;font-weight:500;color:${T.ink7};display:flex;align-items:center;gap:6px`, text);
const input = (value, opts) => {
  const o = opts || {};
  return row(
    `height:38px;padding:0 11px;border:1px solid ${o.focus ? T.palm6 : T.line};border-radius:10px;` +
    `background:${T.surface};font-size:13px;color:${o.placeholder ? T.slate4 : T.ink};` +
    (o.focus ? `box-shadow:0 0 0 3px ${T.palm1};` : '') +
    (o.rtl ? `font-family:${ARABIC};direction:rtl;` : '') + 'position:relative',
    d('flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis', value) +
    (o.unit ? d(`font-family:${MONO};font-size:12px;color:${T.slate4};flex:none;margin-left:8px`, o.unit) : ''));
};
const select = (value, opts) => {
  const o = opts || {};
  const on = o.on;
  return row(
    `height:${o.h || 38}px;padding:0 11px;border:1px solid ${on ? T.palm6 : T.line};border-radius:10px;` +
    `background:${on ? T.palm1 : T.surface};font-size:13px;` +
    `color:${on ? T.palm7 : (o.dim ? T.slate : T.ink)};font-weight:${on ? 500 : 400};` +
    `gap:10px;white-space:nowrap;${o.w ? `width:${o.w}px;` : ''}${o.flex ? `flex:${o.flex};min-width:0;` : ''}`,
    d('flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis', value) +
    chevron('down', on ? T.palm7 : T.slate4));
};
const field = (lbl, control) => col('gap:6px;min-width:0', label(lbl) + control);
const radio = (on, text) => row(
  `gap:8px;font-size:13px;color:${on ? T.ink : T.ink7};font-weight:${on ? 600 : 400}`,
  d(`width:16px;height:16px;border-radius:999px;border:${on ? '5px' : '1.5px'} solid ` +
    `${on ? T.palm6 : T.lineStrong};background:${T.surface};flex:none;box-sizing:border-box`) + text);
const checkbox = (state) => {
  /* on | off | some — "some" is the header's indeterminate dash. */
  if (state === 'off') return d(
    `width:16px;height:16px;border-radius:5px;border:1.5px solid ${T.lineStrong};` +
    `background:${T.surface};flex:none;box-sizing:border-box`);
  return d(
    `width:16px;height:16px;border-radius:5px;background:${T.palm6};flex:none;` +
    'display:grid;place-items:center',
    state === 'some'
      ? d('width:8px;height:1.8px;background:#FFFFFF;border-radius:1px')
      : tick(7, '#FFFFFF'));
};

/* ---- panels ---- */
const panel = (inner, style) => d(
  `background:${T.surface};border:1px solid ${T.line};border-radius:14px;` +
  `box-shadow:${SH_XS};overflow:hidden;${style || ''}`, inner);

/* A collapsible section, closed. */
const fsetClosed = (n, title, meta, opts) => {
  const o = opts || {};
  return panel(row(
    `gap:10px;padding:15px 18px`,
    d(`width:22px;height:22px;border-radius:8px;background:${T.palm1};color:${T.palm7};` +
      `display:grid;place-items:center;font-family:${MONO};font-size:10px;font-weight:500;flex:none`, n) +
    d(`font-size:15px;font-weight:600;color:${T.ink}`, title) +
    row(`margin-left:auto;gap:10px;font-size:12px;color:${T.slate4}`,
      (o.pill ? o.pill : d('', meta)) + (o.openHint ? o.openHint : (o.hint ? hintDot() : '')) +
      chevron('down', T.slate4))),
    'overflow:visible');
};

/* A collapsible section, open. */
/* overflow:visible, matching the editor.css fix: a hint tooltip opens below the
   summary and a clipping panel eats it. Nothing in the body touches the edges. */
const fsetOpen = (n, title, metaHtml, body) => panel(
  row('gap:10px;padding:15px 18px',
    d(`width:22px;height:22px;border-radius:8px;background:${T.palm1};color:${T.palm7};` +
      `display:grid;place-items:center;font-family:${MONO};font-size:10px;font-weight:500;flex:none`, n) +
    d(`font-size:15px;font-weight:600;color:${T.ink}`, title) +
    row(`margin-left:auto;gap:10px;font-size:12px;color:${T.slate4};position:relative`,
      metaHtml + chevron('up', T.slate4))) +
  col(`gap:16px;padding:18px 18px 20px;border-top:1px solid ${T.line}`, body),
  'overflow:visible');

/* Page head: title, one line of context, and the actions. */
const pageHead = (title, sub, actions) => d(
  'display:flex;align-items:flex-start;justify-content:space-between;gap:24px',
  col('gap:4px',
    d(`font-family:${DISPLAY};font-size:28px;line-height:36px;font-weight:600;color:${T.ink}`, title) +
    d(`font-size:15px;line-height:26px;color:${T.slate}`, sub)) +
  row('gap:10px;flex:none', actions));

/* Breadcrumb. The chevron is the only thing in it that flips under RTL. */
const crumb = parts => row(`gap:7px;font-size:12px;color:${T.slate}`,
  parts.map((p, i) => (i ? chevron('right', T.slate4, 6) : '') +
    d(i === parts.length - 1 && p.mono ? `font-family:${MONO};font-size:11px;color:${T.slate}` : '', p.text || p))
    .join(''));

/* The sticky save bar at the foot of every editor. */
const saveBar = (chip, dirty, actions) => row(
  `gap:10px;padding:12px 32px;margin:8px -32px -32px;background:${T.surface};` +
  `border-top:1px solid ${T.line}`,
  row(`gap:6px;font-size:12px;color:${dirty ? T.warn : T.slate}`,
    d(`width:6px;height:6px;border-radius:999px;background:${dirty ? T.warn : T.ok};flex:none`) + chip) +
  row('gap:8px;margin-left:auto', actions));

/* ------------------------------------------------------------ data */
/* Lifted from src/pages/app/listings.html — the same 12 rows the shipped
   table ships in HTML. Anything drawn from these must agree with them. */
const UNITS = [
  { ref: 'AM-1042', title: 'Penthouse with roof garden', ar: 'بنتهاوس بحديقة خاصة', zone: 'New Cairo', compound: 'Mivida', type: 'Penthouse', area: 168, beds: 3, price: 8450000, plan: '10% down · 8 yrs', status: 'Live', views: 1204, leads: 7, agent: 'Youssef Kamal', updated: '2 hours ago', photos: 8, delivery: '2027' },
  { ref: 'AM-1038', title: 'Sea-view chalet, first row', ar: 'شاليه بفيو بحري · الصف الأول', zone: 'North Coast', compound: 'Marassi', type: 'Chalet', area: 122, beds: 2, price: 12200000, plan: '15% down · 6 yrs', status: 'Live', views: 986, leads: 5, agent: 'Mai Farouk', updated: 'Yesterday', photos: 12, delivery: '2027' },
  { ref: 'AM-1035', title: 'Studio, fully finished with AC', ar: 'استوديو متشطب بالتكييف', zone: 'New Cairo', compound: 'Zed East', type: 'Studio', area: 62, beds: 0, price: 4250000, plan: 'Cash or 5 yrs', status: 'Live', views: 742, leads: 3, agent: 'Karim ElSayed', updated: '2 days ago', photos: 6, delivery: 'Ready' },
  { ref: 'AM-1021', title: 'Standalone villa with garden', ar: 'فيلا مستقلة بحديقة 300 م²', zone: 'Sheikh Zayed', compound: 'Palm Hills', type: 'Villa', area: 420, beds: 5, price: 34000000, plan: 'Core &amp; shell', status: 'Reserved', views: 655, leads: 9, agent: 'Nourhan Adel', updated: '3 days ago', photos: 14, delivery: '2028' },
  { ref: 'AM-1030', title: 'Chalet overlooking the pool', ar: 'شاليه بفيو على البيسين', zone: 'Ain Sokhna', compound: 'Il Monte Galala', type: 'Chalet', area: 95, beds: 2, price: 7900000, plan: '10% down · 7 yrs', status: 'Live', views: 512, leads: 4, agent: 'Omar Hegazy', updated: '4 days ago', photos: 9, delivery: '2027' },
  { ref: 'AM-1044', title: 'Twin house, semi-finished', ar: 'توين هاوس نصف تشطيب', zone: 'New Cairo', compound: 'Sodic East', type: 'Twin house', area: 240, beds: 4, price: 15800000, plan: '12% down · 8 yrs', status: 'Draft', views: 0, leads: 0, agent: 'Youssef Kamal', updated: '1 hour ago', photos: 0, delivery: '2027' },
  { ref: 'AM-1027', title: 'Garden apartment, ready to move', ar: 'شقة بجاردن · استلام فوري', zone: 'New Cairo', compound: 'Hyde Park', type: 'Apartment', area: 144, beds: 3, price: 7100000, plan: 'Cash', status: 'Live', views: 498, leads: 6, agent: 'Nourhan Adel', updated: '5 days ago', photos: 11, delivery: 'Ready' },
  { ref: 'AM-1019', title: 'Duplex with private entrance', ar: 'دوبلكس بمدخل خاص', zone: '6th of October', compound: 'Badya', type: 'Duplex', area: 210, beds: 4, price: 9600000, plan: '10% down · 8 yrs', status: 'Draft', views: 0, leads: 0, agent: 'Karim ElSayed', updated: '6 days ago', photos: 2, delivery: '2028' }
];
const money = v => 'EGP ' + Number(v).toLocaleString('en-US');

/* Derived, never authored. If a count below is wrong, the page is wrong. */
function derive() {
  const inNewCairo = UNITS.filter(u => u.zone === 'New Cairo');
  /* The payment plan on AM-1042, the way editor.js computes it. */
  const u = UNITS[0], downPct = 10, years = 8;
  const down = u.price * downPct / 100;
  const financed = u.price - down;
  const monthly = Math.round(financed / (years * 12));
  return {
    newCairo: inNewCairo,
    plan: {
      down, financed, monthly, months: years * 12,
      perM2: Math.round(u.price / u.area)
    }
  };
}
const D = derive();

/* ------------------------------------------------------------ board 03 */
/* The shipped table's own computed column widths at a 1440 viewport: 1481px of
   table inside a 1097px frame, so it really does run off the right edge. Drawing
   it narrower would invent a layout the product does not have. */
const TABLE_COLS = '23px 296px 88px 191px 99px 88px 60px 136px 107px 73px 73px 61px 100px 86px';
const TABLE_W = 1481;

function tableHead() {
  const th = (text, align) => d(
    `display:flex;align-items:center;padding:0 14px;font-family:${MONO};font-size:10px;` +
    `font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:${T.slate4};` +
    `overflow:hidden;white-space:nowrap;${align === 'end' ? 'justify-content:flex-end;' : ''}`, text);
  const sortable = (text, align) => d(
    `display:flex;align-items:center;gap:5px;padding:0 14px;font-family:${MONO};font-size:10px;` +
    `font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:${T.slate4};` +
    `overflow:hidden;white-space:nowrap;${align === 'end' ? 'justify-content:flex-end;' : ''}`,
    text + d(`width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;` +
      `border-bottom:5px solid ${T.slate4};flex:none`));
  return d(
    `display:grid;grid-template-columns:${TABLE_COLS};width:${TABLE_W}px;height:38px;background:${T.canvas};` +
    `border-bottom:1px solid ${T.line}`,
    d('display:grid;place-items:center', checkbox('some')) +
    sortable('Unit') + th('Reference') + th('Zone / compound') + th('Type') +
    sortable('Area m²', 'end') + th('Beds', 'end') + sortable('Price', 'end') +
    th('Status') + sortable('Views', 'end') + sortable('Leads', 'end') +
    th('Agent') + th('Updated') + th(''));
}

function tableRow(u, opts) {
  const o = opts || {};
  const bg = o.selected ? T.palm1 : T.surface;
  const cell = (inner, extra) => d(
    `display:flex;align-items:center;padding:0 14px;min-width:0;overflow:hidden;${extra || ''}`, inner);
  const num = (text) => d(
    `display:flex;align-items:center;justify-content:flex-end;padding:0 14px;font-family:${MONO};` +
    `font-size:12px;color:${T.ink7};overflow:hidden`, text);
  return d(
    `display:grid;grid-template-columns:${TABLE_COLS};width:${TABLE_W}px;height:60px;background:${bg};` +
    `border-bottom:1px solid ${T.line}`,
    d('display:grid;place-items:center', checkbox(o.selected ? 'on' : 'off')) +
    /* The unit column is the one you scan, so it stays put while the rest scrolls. */
    cell(row('gap:11px;min-width:0',
      ph('', 'width:46px;height:36px;border-radius:8px;flex:none;padding:0') +
      col('gap:2px;min-width:0',
        d(`font-size:13px;font-weight:600;color:${T.ink};overflow:hidden;white-space:nowrap;` +
          'text-overflow:ellipsis', u.title) +
        d(`font-family:${ARABIC};font-size:12px;color:${T.slate};direction:rtl;overflow:hidden;` +
          'white-space:nowrap;text-overflow:ellipsis', u.ar))),
      `border-right:1px solid ${T.line}`) +
    cell(d(`font-family:${MONO};font-size:12px;color:${T.slate}`, u.ref)) +
    cell(col('gap:1px;min-width:0',
      d(`font-size:13px;color:${T.ink7};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`, u.zone) +
      d(`font-size:12px;color:${T.slate4};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`,
        u.compound === '—' ? '' : u.compound))) +
    cell(d(`font-size:13px;color:${T.ink7};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`, u.type)) +
    num(String(u.area)) + num(String(u.beds)) +
    d(`display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:1px;padding:0 14px`,
      d(`font-size:13px;font-weight:600;color:${T.ink};font-variant-numeric:tabular-nums;white-space:nowrap`,
        money(u.price)) +
      d(`font-family:${MONO};font-size:10px;color:${T.slate4};white-space:nowrap`, u.plan)) +
    cell(st(u.status)) +
    num(u.views.toLocaleString('en-US')) + num(String(u.leads)) +
    cell(avatar(22)) +
    cell(d(`font-size:12px;color:${T.slate4};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`, u.updated)) +
    d('display:grid;place-items:center', o.selected ? dotGrid(T.slate4) : ''));
}

function board03(shell) {
  const views = row(`gap:2px;border-bottom:1px solid ${T.line};padding-bottom:0`,
    [['All', 42, false], ['Live', 37, false], ['Needs photos', 5, false], ['Price drop candidates', 4, false]]
      .map(([name, n, on]) => row(
        `gap:7px;height:36px;padding:0 12px;font-size:13px;font-weight:${on ? 600 : 500};` +
        `color:${on ? T.palm7 : T.slate};border-bottom:2px solid ${on ? T.palm6 : 'transparent'};` +
        'white-space:nowrap',
        name + d(`font-family:${MONO};font-size:10px;color:${T.slate4};background:${T.canvas};` +
          'border-radius:999px;padding:2px 6px', String(n)))).join('') +
    row(`margin-left:auto;height:28px;padding:0 14px;border:1px dashed ${T.lineStrong};` +
      `border-radius:8px;font-size:12px;color:${T.slate};align-self:center`, '+ Save this view'));

  const toolbar = d('display:flex;flex-wrap:wrap;align-items:center;gap:8px',
    row(`flex:1 1 260px;min-width:200px;height:36px;padding:0 11px;gap:8px;background:${T.surface};` +
      `border:1px solid ${T.line};border-radius:10px;color:${T.slate4};font-size:13px`,
      d(`width:12px;height:12px;border-radius:999px;border:1.5px solid ${T.slate4};flex:none;position:relative`,
        d(`position:absolute;right:-4px;bottom:-3px;width:5px;height:1.5px;background:${T.slate4};` +
          'transform:rotate(45deg)')) +
      'Search by title, reference or compound…') +
    select('Status', { h: 36, dim: true }) +
    select('Zone: New Cairo', { h: 36, on: true }) +
    select('Type', { h: 36, dim: true }) +
    select('Beds', { h: 36, dim: true }) +
    select('Price', { h: 36, dim: true }) +
    select('Delivery', { h: 36, dim: true }) +
    select('Agent', { h: 36, dim: true }));

  const chip = (text) => row(
    `gap:6px;height:26px;padding:0 7px 0 10px;border-radius:999px;background:${T.palm1};` +
    `color:${T.palm7};font-size:12px;font-weight:500;white-space:nowrap`,
    text + d('width:15px;height:15px;border-radius:999px;display:grid;place-items:center;opacity:.65',
      xmark(8, T.palm7)));

  const resultline = d('display:flex;align-items:center;gap:10px;flex-wrap:wrap',
    d(`font-size:13px;color:${T.slate}`,
      `<strong style="color:${T.ink};font-weight:600">${D.newCairo.length}</strong> matching on this page`) +
    chip('Zone: New Cairo') +
    d(`font-size:12px;color:${T.palm7};text-decoration:underline`, 'Clear all') +
    row('margin-left:auto;gap:8px',
      row(`padding:3px;gap:2px;background:${T.canvas};border:1px solid ${T.line};border-radius:10px`,
        row(`gap:6px;height:28px;padding:0 11px;border-radius:8px;background:${T.surface};` +
          `box-shadow:${SH_XS};font-size:12px;font-weight:600;color:${T.ink}`,
          col('gap:2px;width:12px',
            d(`height:1.5px;background:currentColor;border-radius:1px`).repeat(3)) + 'Table') +
        row(`gap:6px;height:28px;padding:0 11px;border-radius:8px;font-size:12px;color:${T.slate}`,
          d('display:grid;grid-template-columns:1fr 1fr;gap:2px;width:12px',
            d(`width:5px;height:5px;border:1.4px solid currentColor;border-radius:1.5px`).repeat(4)) +
          'Grid'))));

  const table = panel(
    tableHead() +
    D.newCairo.map((u, i) => tableRow(u, { selected: i === 0 || i === 3 })).join(''),
    'box-shadow:' + SH_XS);

  /* Selection is derived from the rows drawn above, not typed in. */
  const nSelected = D.newCairo.filter((u, i) => i === 0 || i === 3).length;
  const bulkbar = d('display:flex;justify-content:center',
    row(`gap:10px;padding:9px 10px 9px 16px;border-radius:14px;background:${T.ink};` +
      `color:${T.onDark};box-shadow:0 12px 32px rgba(12,16,23,.18)`,
      d('font-size:13px;font-weight:600;white-space:nowrap', `${nSelected} selected`) +
      d('width:1px;height:22px;background:rgba(255,255,255,.16)') +
      ['Change status', 'Assign agent', 'Add to collection', 'Export CSV'].map(t => row(
        'height:30px;padding:0 12px;border-radius:8px;background:rgba(255,255,255,.1);' +
        'font-size:12px;font-weight:500;white-space:nowrap', t)).join('') +
      row(`height:30px;padding:0 12px;border-radius:8px;background:${T.bad};` +
        'font-size:12px;font-weight:500', 'Delete') +
      d('padding:0 8px;opacity:.6;display:grid;place-items:center', xmark(11, T.onDark))));

  return boardShell({
    label: '03 Listings table',
    caption: '03 · LISTINGS — TABLE, FILTERED, TWO SELECTED',
    note: 'Zone: New Cairo narrows 12 loaded rows to 4. The pager is hidden while a filter is on — ' +
      'client-side filtering only sees this page, so "of 42" would be a lie.',
    height: 780,
    shell,
    content: [pageHead('Listings', '42 units · 37 live, 5 drafts. Last import 2 days ago.',
      btnApp('Import units') + btnGo(row('gap:8px', plus(11, '#FFFFFF') + 'Add listing'))),
    views, toolbar, resultline, table,
    mono('14 columns · the Unit column is sticky and the rest scrolls horizontally below 1080px',
      `color:${T.slate4};font-size:10px`),
    bulkbar].join('')
  });
}

/* ------------------------------------------------------------ board 04 */
function ucard(u) {
  const flags = row('gap:6px;position:absolute;top:10px;left:10px',
    st(u.status) + (u.photos < 3 ? badgeSand('Needs photos') : ''));
  return panel(
    d('position:relative',
      ph(u.type.toLowerCase() + ' · ' + u.compound + ' · 4:3',
        'width:100%;aspect-ratio:4/3', HATCH_BIG) + flags) +
    col('gap:7px;padding:13px 14px 14px;flex:1',
      d(`font-size:15px;font-weight:600;color:${T.ink};line-height:1.35`, u.title) +
      d(`font-family:${ARABIC};font-size:12px;color:${T.slate};direction:rtl;text-align:right`, u.ar) +
      d(`font-size:12px;color:${T.slate}`, u.zone + (u.compound !== '—' ? ' · ' + u.compound : '')) +
      row(`gap:12px;font-family:${MONO};font-size:10.5px;color:${T.slate};padding:2px 0;flex-wrap:wrap`,
        [u.area + ' m²'].concat(u.beds ? [u.beds + ' bed'] : []).concat([u.ref])
          .map(s => d('', s)).join('')) +
      d(`font-size:15px;font-weight:700;color:${T.ink};font-variant-numeric:tabular-nums`, money(u.price)) +
      d(`font-family:${MONO};font-size:10.5px;color:${T.palm7}`, u.plan) +
      row(`margin-top:auto;padding-top:11px;border-top:1px solid ${T.line};gap:9px;` +
        `font-size:12px;color:${T.slate}`,
        avatar(22) + d('', u.updated) +
        row(`margin-left:auto;gap:10px;font-family:${MONO};font-size:10.5px`,
          d('', u.views + ' views') + d('', u.leads + ' leads')))),
    'display:flex;flex-direction:column');
}

function board04(shell) {
  const resultline = d('display:flex;align-items:center;gap:10px;flex-wrap:wrap',
    d(`font-size:13px;color:${T.slate}`,
      `<strong style="color:${T.ink};font-weight:600">12</strong> of ` +
      `<strong style="color:${T.ink};font-weight:600">42</strong> units`) +
    row('margin-left:auto;gap:8px',
      row(`padding:3px;gap:2px;background:${T.canvas};border:1px solid ${T.line};border-radius:10px`,
        row(`gap:6px;height:28px;padding:0 11px;border-radius:8px;font-size:12px;color:${T.slate}`,
          col('gap:2px;width:12px', d('height:1.5px;background:currentColor;border-radius:1px').repeat(3)) +
          'Table') +
        row(`gap:6px;height:28px;padding:0 11px;border-radius:8px;background:${T.surface};` +
          `box-shadow:${SH_XS};font-size:12px;font-weight:600;color:${T.ink}`,
          d('display:grid;grid-template-columns:1fr 1fr;gap:2px;width:12px',
            d('width:5px;height:5px;border:1.4px solid currentColor;border-radius:1.5px').repeat(4)) +
          'Grid'))));

  const grid = d('display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px',
    UNITS.map(ucard).join(''));

  const pager = row(`gap:10px;font-size:12px;color:${T.slate}`,
    d('', 'Showing <strong style="color:' + T.ink + ';font-weight:600">1–12</strong> of ' +
      '<strong style="color:' + T.ink + ';font-weight:600">42</strong>') +
    row('margin-left:auto;gap:2px',
      d(`width:28px;height:28px;display:grid;place-items:center;border-radius:8px`, chevron('left', T.slate4, 6)) +
      ['1', '2', '3', '4'].map((p, i) => d(
        `width:28px;height:28px;display:grid;place-items:center;border-radius:8px;font-size:12px;` +
        (i === 0 ? `background:${T.palm1};color:${T.palm7};font-weight:600` : `color:${T.slate}`), p)).join('') +
      d('width:28px;height:28px;display:grid;place-items:center;border-radius:8px', chevron('right', T.slate4, 6))));

  const emptyState = panel(
    col('gap:12px;align-items:center;text-align:center;padding:56px 24px',
      d(`width:46px;height:46px;border-radius:14px;background:${T.palm1};display:grid;place-items:center`,
        d(`width:20px;height:20px;border-radius:999px;border:1.6px solid ${T.palm6};position:relative`,
          d(`position:absolute;right:-6px;bottom:-4px;width:8px;height:1.6px;background:${T.palm6};` +
            'transform:rotate(45deg)'))) +
      d(`font-family:${DISPLAY};font-size:19px;font-weight:600;color:${T.ink}`, 'No units match these filters') +
      d(`font-size:13px;line-height:20px;color:${T.slate};max-width:38ch`,
        'Try widening the price range or clearing the zone. Your other 42 units are still there.') +
      row('gap:10px;margin-top:4px', btnApp('Clear all filters', 36) + btnGo('Add a listing', 36))));

  return boardShell({
    label: '04 Listings grid',
    caption: '04 · LISTINGS — GRID VIEW, AND THE NO-RESULTS STATE',
    note: 'The grid is rendered from the table above it, so the two views can never disagree. ' +
      'Cards with fewer than three photos carry a sand "Needs photos" badge.',
    height: 1560,
    shell,
    content: [pageHead('Listings', '42 units · 37 live, 5 drafts. Last import 2 days ago.',
      btnApp('Import units') + btnGo(row('gap:8px', plus(11, '#FFFFFF') + 'Add listing'))),
    resultline, grid, pager,
    d(`border-top:1px dashed ${T.lineStrong};margin-top:8px;padding-top:18px`,
      mono('STATE · EVERY ROW FILTERED OUT — REPLACES THE GRID', `color:${T.slate4};letter-spacing:.07em;margin-bottom:12px`) +
      emptyState)].join('')
  });
}

/* ------------------------------------------------------------ boards 05/06 */
const EDITOR_HEAD = () => pageHead(
  'Penthouse with roof garden',
  'Mivida, New Cairo · Live since 12 August 2026 · 1,204 views, 7 leads',
  btnApp('Duplicate') + btnApp('View on storefront ↗'));

function previewCard(coverLabel, planLine) {
  return panel(
    row(`gap:8px;padding:9px 12px;border-bottom:1px solid ${T.line};background:${T.canvas}`,
      row('gap:4px', d(`width:7px;height:7px;border-radius:999px;background:${T.lineStrong}`).repeat(3)) +
      d(`flex:1;min-width:0;font-family:${MONO};font-size:10px;color:${T.slate4};overflow:hidden;` +
        'white-space:nowrap;text-overflow:ellipsis;direction:ltr',
        'kamal-estates.alfmaskan.com/units/am-1042')) +
    col('gap:9px;padding:14px',
      d('border-radius:10px;overflow:hidden', ph(coverLabel, 'width:100%;aspect-ratio:4/3', HATCH_BIG)) +
      d(`font-size:15px;font-weight:600;color:${T.ink};line-height:1.35`, 'Penthouse with roof garden') +
      d(`font-size:12px;color:${T.slate}`, 'Mivida · New Cairo') +
      row(`gap:12px;font-family:${MONO};font-size:10.5px;color:${T.slate};flex-wrap:wrap`,
        d('', '168 m²') + d('', '3 bed') + d('', 'Penthouse')) +
      d(`font-size:17px;font-weight:700;color:${T.ink};font-variant-numeric:tabular-nums`, money(8450000)) +
      d(`font-family:${MONO};font-size:10.5px;color:${T.palm7};background:${T.palm1};border-radius:6px;` +
        'padding:5px 8px;align-self:flex-start', planLine)));
}

const sideNote = (title, body) => row(
  `gap:9px;padding:12px 13px;border-radius:12px;background:${T.warnBg};` +
  `border:1px solid rgba(180,116,14,.26);align-items:flex-start`,
  d(`width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;` +
    `border-bottom:12px solid ${T.warn};flex:none;margin-top:2px`) +
  col('gap:2px',
    d(`font-size:13px;font-weight:600;color:${T.ink}`, title) +
    d(`font-size:12px;line-height:18px;color:${T.ink7}`, body)));

function board05(shell) {
  const p = D.plan;
  const calc = d(`display:grid;grid-template-columns:minmax(0,1fr) 224px;gap:18px;align-items:start;` +
    `padding:16px;background:${T.canvas};border:1px solid ${T.line};border-radius:12px`,
    col('gap:16px',
      field('Price <span style="color:' + T.bad + '">*</span>',
        input('8,450,000', { unit: 'EGP', focus: true })) +
      d('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px',
        field('Down payment', input('10', { unit: '%' })) +
        field('Years', select('8', {}))) +
      field('Instalment frequency', select('Monthly', {}))) +
    col(`gap:3px;padding:16px;border-radius:12px;background:${T.palm6};color:#FFFFFF`,
      d(`font-family:${MONO};font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.8`,
        'Monthly instalment') +
      d('font-size:24px;line-height:1.2;font-weight:700;font-variant-numeric:tabular-nums',
        money(p.monthly)) +
      d('font-size:12px;line-height:1.5;opacity:.85;margin-top:4px',
        `10% down · 8 years, ${p.months} instalments`) +
      col('gap:5px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.22);font-size:12px',
        [['Down payment', money(p.down)], ['Financed', money(p.financed)],
        ['Price per m²', money(p.perM2)]]
          .map(([k, v]) => row('justify-content:space-between;gap:10px',
            d('', k) + d('font-weight:600', v))).join(''))));

  const basics = fsetOpen('1', 'Basics', hintDot(), [
    d('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px',
      field('Purpose <span style="color:' + T.bad + '">*</span>', select('Primary', {})) +
      field('Status', select('Live', {})) +
      field('Unit type <span style="color:' + T.bad + '">*</span>', select('Penthouse', {}))),
    d('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px',
      field('Title — English <span style="color:' + T.bad + '">*</span>',
        input('Penthouse with roof garden')) +
      field('العنوان — العربية', input('بنتهاوس بحديقة خاصة', { rtl: true }))),
    d('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px',
      field('Reference', input('AM-1042')) +
      field('Compound', select('Mivida', {})))
  ].join(''));

  const price = fsetOpen('5', 'Price &amp; payment plan', hintDot(), calc);

  return boardShell({
    label: '05 Listing editor details',
    caption: '05 · LISTING EDITOR — DETAILS, WITH THE LIVE STOREFRONT CARD',
    note: 'Nine sections, two open. Every figure in the palm result card is computed from the three ' +
      'fields beside it: 8,450,000 at 10% over 8 years is ' + money(D.plan.monthly) + ' a month.',
    height: 1460,
    shell,
    content: [
      crumb([{ text: 'Listings' }, { text: 'AM-1042', mono: true }]),
      EDITOR_HEAD(),
      d('display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:28px;align-items:start',
        col('gap:14px;min-width:0', [
          basics,
          fsetClosed('2', 'Location', 'Mivida, New Cairo', {
            /* Open here rather than on the price section: a tooltip anchored to the
               summary opens downwards, and on section 5 it landed squarely over the
               computed instalment — the one number the board exists to show. On a
               collapsed row it also documents the .fset overflow fix. */
            openHint: hint('Zone and compound drive your storefront’s search filters. Hiding the ' +
              'exact pin still shows the compound, which is what most sellers want.',
              { top: 24, left: -216, arrow: 218, w: 250 })
          }),
          fsetClosed('3', 'Specs', '168 m² · 3 bed · 3 bath'),
          fsetClosed('4', 'Finishing &amp; delivery', 'Fully finished · Q2 2027'),
          price,
          fsetClosed('6', 'Media', '8 photos · 1 floor plan', { hint: true }),
          fsetClosed('7', 'Amenities', '5 selected'),
          fsetClosed('8', 'Visibility &amp; SEO', '', { pill: st('Live') }),
          fsetClosed('9', 'Assignment', 'Youssef Kamal · 2.5%')
        ].join('')) +
        col('gap:16px',
          previewCard('roof terrace · 4:3', '10% down · ' + money(D.plan.monthly) + '/mo over 8 years') +
          sideNote('This unit has no floor plan on the Arabic page',
            'Buyers browsing in Arabic see the gallery but not the plan. Add an Arabic caption to the ' +
            'floor plan image to fix it.') +
          mono('the card re-renders on every keystroke — it is the same component the storefront ' +
            'featured row uses', `color:${T.slate4};font-size:10px;line-height:15px`))),
      saveBar('Saved · 2s ago', false,
        btnApp('Preview', 36) + btnApp('Save draft', 36) + btnGo('Publish changes', 36))
    ].join('')
  });
}

function board06(shell) {
  const tile = (name, label, opts) => {
    const o = opts || {};
    return d(
      'position:relative;border-radius:10px;overflow:visible;' +
      `border:1px solid ${T.line};background:${T.canvas};` +
      (o.dragging
        ? `opacity:.55;transform:rotate(2deg);box-shadow:${SH_MD};z-index:3;`
        : '') +
      (o.dropTarget ? 'z-index:2;' : ''),
      (o.dropTarget
        ? d(`position:absolute;left:-6px;top:0;bottom:0;width:3px;border-radius:2px;` +
          `background:${T.palm6};z-index:4`)
        : '') +
      d('position:relative;overflow:hidden;border-radius:9px 9px 0 0',
        ph(label, 'width:100%;aspect-ratio:4/3;font-size:10px', o.fine ? HATCH_FINE : HATCH) +
        (o.cover
          ? row(`position:absolute;top:7px;left:7px;height:19px;padding:0 7px;border-radius:999px;` +
            `background:${T.palm6};color:#FFFFFF;font-size:9.5px;font-weight:600`, 'Cover')
          : '') +
        /* The remove button is hover-only in the product, so it appears on the tile
           under the pointer and nowhere else. Drawing it on all five would document
           a resting state the gallery never has. */
        (o.dragging
          ? d('position:absolute;top:6px;right:6px;width:21px;height:21px;border-radius:999px;' +
            'background:rgba(12,16,23,.6);display:grid;place-items:center', xmark(9, '#FFFFFF'))
          : '')) +
      row(`gap:5px;padding:6px 8px;border-top:1px solid ${T.line};font-size:10px;color:${T.slate4}`,
        dotGrid(T.slate4) + d('overflow:hidden;white-space:nowrap;text-overflow:ellipsis', name)));
  };

  const dropzone = col(
    `gap:6px;align-items:center;text-align:center;padding:22px;border:1.5px dashed ${T.lineStrong};` +
    `border-radius:12px;background:${T.canvas}`,
    d('width:20px;height:18px;position:relative',
      d(`position:absolute;left:9px;top:0;width:1.5px;height:12px;background:${T.slate};border-radius:1px`) +
      d(`position:absolute;left:5px;top:0;width:8px;height:8px;border-left:1.5px solid ${T.slate};` +
        `border-top:1.5px solid ${T.slate};transform:rotate(45deg)`) +
      d(`position:absolute;left:0;bottom:0;width:20px;height:6px;border:1.5px solid ${T.slate};` +
        'border-top:0;border-radius:0 0 4px 4px')) +
    d(`font-size:13px;font-weight:600;color:${T.ink}`, 'Drag photos here, or browse') +
    d(`font-size:12px;color:${T.slate}`,
      'JPG or PNG, at least 1600px wide. The first one becomes the cover.'));

  /* The media hint stays a closed dot. Anchored to this summary it opens downwards,
     straight over the gallery — and the gallery mid-drag is the whole board. The open
     tooltip on this board sits on Basics instead, well clear of it. */
  const media = fsetOpen('6', 'Media',
    row('gap:10px', d('', '8 photos · 1 floor plan') + hintDot()),
    [
      d('display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px',
        tile('Roof terrace', 'roof terrace · 4:3', { cover: true }) +
        tile('Reception', 'reception · 4:3') +
        tile('Master bedroom', 'master bedroom · 4:3', { dragging: true }) +
        tile('Kitchen', 'kitchen · 4:3', { dropTarget: true }) +
        tile('Floor plan', 'floor plan · 4:3', { fine: true })),
      dropzone,
      d('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px',
        field('Video URL', input('https://youtube.com/watch?v=…', { placeholder: true })) +
        field('360° tour embed', input('Matterport or Kuula link', { placeholder: true })))
    ].join(''));

  return boardShell({
    label: '06 Listing editor media',
    caption: '06 · LISTING EDITOR — MEDIA, MID-DRAG',
    note: 'Master bedroom is lifted and will land before Kitchen. The palm insertion line marks the ' +
      'drop, and the cover only changes if a tile moves into first place — so the preview is unchanged.',
    height: 1280,
    shell,
    content: [
      crumb([{ text: 'Listings' }, { text: 'AM-1042', mono: true }]),
      EDITOR_HEAD(),
      d('display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:28px;align-items:start',
        col('gap:14px;min-width:0', [
          fsetClosed('1', 'Basics', 'Penthouse · Live', {
            openHint: hint('The title is what buyers see first on every card and in Google. Write it ' +
              'the way a buyer would search — unit type, the thing that makes it special, then ' +
              'the compound.', { top: 24, left: -216, arrow: 218, w: 250 })
          }),
          fsetClosed('2', 'Location', 'Mivida, New Cairo', { hint: true }),
          fsetClosed('3', 'Specs', '168 m² · 3 bed · 3 bath'),
          fsetClosed('4', 'Finishing &amp; delivery', 'Fully finished · Q2 2027'),
          fsetClosed('5', 'Price &amp; payment plan', money(8450000), { hint: true }),
          media,
          fsetClosed('7', 'Amenities', '5 selected'),
          fsetClosed('8', 'Visibility &amp; SEO', '', { pill: st('Live') }),
          fsetClosed('9', 'Assignment', 'Youssef Kamal · 2.5%')
        ].join('')) +
        col('gap:16px',
          previewCard('roof terrace · 4:3', '10% down · ' + money(D.plan.monthly) + '/mo over 8 years') +
          panel(col('gap:8px;padding:14px',
            d(`font-size:13px;font-weight:600;color:${T.ink}`, 'Gallery order') +
            col(`gap:6px;font-family:${MONO};font-size:10.5px;color:${T.slate}`,
              ['1 · Roof terrace — cover', '2 · Reception', '3 · Kitchen',
                '4 · Master bedroom', '5 · Floor plan']
                .map((t, i) => row('gap:7px',
                  d(`width:4px;height:4px;border-radius:999px;background:${i === 3 ? T.palm6 : T.lineStrong};flex:none`) +
                  d(i === 3 ? `color:${T.palm7};font-weight:500` : '', t))).join('')) +
            d(`font-size:12px;line-height:18px;color:${T.slate};padding-top:8px;border-top:1px solid ${T.line}`,
              'Order after the drop. The cover is unchanged, so the storefront card above stays as it is.'))))),
      saveBar('Unsaved changes', true,
        btnApp('Preview', 36) + btnApp('Save draft', 36) + btnGo('Publish changes', 36))
    ].join('')
  });
}

/* ------------------------------------------------------------ board 07 */
/* The two matched cards are the units that actually satisfy the drawn rules.
   Derived below rather than picked by hand. */
const COLLECTION_POOL = [
  { ref: 'AM-1038', title: 'Sea-view chalet, first row', zone: 'North Coast', compound: 'Marassi', type: 'Chalet', area: 122, beds: 2, price: 12200000, delivery: '2027', status: 'Live' },
  { ref: 'AM-1012', title: 'Chalet, summer let', zone: 'North Coast', compound: 'Marassi', type: 'Chalet', area: 88, beds: 1, price: 6750000, delivery: 'Ready', status: 'Rented' },
  { ref: 'AM-1030', title: 'Chalet overlooking the pool', zone: 'Ain Sokhna', compound: 'Il Monte Galala', type: 'Chalet', area: 95, beds: 2, price: 7900000, delivery: '2027', status: 'Live' },
  { ref: 'AM-1042', title: 'Penthouse with roof garden', zone: 'New Cairo', compound: 'Mivida', type: 'Penthouse', area: 168, beds: 3, price: 8450000, delivery: '2027', status: 'Live' },
  { ref: 'AM-1044', title: 'Twin house, semi-finished', zone: 'New Cairo', compound: 'Sodic East', type: 'Twin house', area: 240, beds: 4, price: 15800000, delivery: '2027', status: 'Draft' },
  { ref: 'AM-1051', title: 'Beachfront villa, Marassi Bay', zone: 'North Coast', compound: 'Marassi', type: 'Villa', area: 310, beds: 4, price: 21500000, delivery: '2027', status: 'Live' }
];
const MATCHED = COLLECTION_POOL.filter(u => u.zone === 'North Coast' && u.delivery === '2027');

function board07(shell) {
  const collItem = (name, kind, n, current) => row(
    `gap:10px;padding:10px 12px;border:1px solid ${current ? T.line : 'transparent'};border-radius:10px;` +
    `background:${current ? T.surface : 'transparent'};${current ? `box-shadow:${SH_XS};` : ''}`,
    d(`width:28px;height:28px;border-radius:8px;background:${current ? T.palm1 : T.canvas};` +
      'display:grid;place-items:center;flex:none',
      d(`width:12px;height:12px;transform:rotate(45deg);border:1.3px solid ${current ? T.palm6 : T.slate};` +
        'border-radius:2px')) +
    col('gap:1px;flex:1;min-width:0',
      d(`font-size:13px;font-weight:600;color:${T.ink};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`, name) +
      d(`font-size:12px;color:${T.slate4}`, kind)) +
    d(`font-family:${MONO};font-size:10px;color:${T.slate4};flex:none`, String(n)));

  const rule = (fieldName, op, value) => d(
    'display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr) minmax(0,1.2fr) 32px;gap:8px;align-items:center',
    select(fieldName, {}) + select(op, {}) + select(value, {}) +
    d('width:32px;height:38px;display:grid;place-items:center', xmark(11, T.slate4)));

  const rulesBody = [
    row('gap:14px;flex-wrap:wrap',
      radio(true, 'Automatic — a saved rule') + radio(false, 'Manual — a list you pick')),
    col('gap:9px',
      row(`gap:8px;font-size:13px;color:${T.ink7};flex-wrap:wrap`,
        d('', 'A unit joins when it matches') + select('all conditions', { w: 168 })) +
      rule('Zone', 'is', 'North Coast') +
      mono('AND', `font-size:10px;letter-spacing:.06em;color:${T.slate4};padding-left:2px`) +
      rule('Delivery', 'is', '2027') +
      row(`height:34px;padding:0 14px;border:1px dashed ${T.lineStrong};border-radius:8px;` +
        `font-size:12px;color:${T.slate};align-self:flex-start`, '+ Add condition')),
    row(`gap:10px;padding:11px 14px;border-radius:10px;background:${T.palm1};color:${T.palm7};font-size:13px`,
      tick(9, T.palm6) +
      d('', `<strong style="font-weight:600;font-variant-numeric:tabular-nums">${MATCHED.length}</strong>` +
        ' units match right now') +
      d('margin-left:auto', 'Updates by itself as units change'))
  ].join('');

  const matchCard = u => panel(
    d('position:relative',
      ph(u.type.toLowerCase() + ' · ' + u.compound + ' · 4:3', 'width:100%;aspect-ratio:4/3', HATCH_BIG) +
      row('gap:6px;position:absolute;top:10px;left:10px', st(u.status))) +
    col('gap:7px;padding:13px 14px 14px',
      d(`font-size:15px;font-weight:600;color:${T.ink};line-height:1.35`, u.title) +
      d(`font-size:12px;color:${T.slate}`, u.zone + ' · ' + u.compound) +
      row(`gap:12px;font-family:${MONO};font-size:10.5px;color:${T.slate};padding:2px 0`,
        d('', u.area + ' m²') + d('', u.beds + ' bed') + d('', u.ref)) +
      d(`font-size:15px;font-weight:700;color:${T.ink};font-variant-numeric:tabular-nums`, money(u.price)) +
      d(`font-family:${MONO};font-size:10.5px;color:${T.palm7}`, 'Delivery ' + u.delivery)));

  return boardShell({
    label: '07 Collections rules',
    caption: '07 · COLLECTIONS — AN AUTOMATIC COLLECTION AND ITS RULES',
    note: 'Zone is North Coast AND Delivery is 2027 selects ' + MATCHED.length + ' of the 6 candidate ' +
      'units — ' + MATCHED.map(u => u.ref).join(' and ') + '. The count is the rule’s output, not a label.',
    height: 1300,
    shell,
    subActive: 2,
    content: [
      crumb([{ text: 'Listings' }, { text: 'Collections' }]),
      pageHead('Collections',
        'A collection is a group of units you can drop onto your storefront as a row, a page, or a filter.',
        btnGo(row('gap:8px', plus(11, '#FFFFFF') + 'New collection'))),
      d('display:grid;grid-template-columns:280px minmax(0,1fr);gap:20px;align-items:start',
        col('gap:6px',
          collItem('Sahel 2027 delivery', 'Automatic', MATCHED.length, true) +
          collItem('Under EGP 10M', 'Automatic', 7, false) +
          collItem('Ready to move', 'Automatic', 4, false) +
          collItem('Youssef’s picks', 'Manual', 3, false)) +
        col('gap:14px;min-width:0', [
          fsetOpen('1', 'Collection details', d('', 'Shown on 2 storefront sections'),
            d('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px',
              field('Name — English', input('Sahel 2027 delivery')) +
              field('الاسم — العربية', input('ساحل · استلام 2027', { rtl: true })))),
          fsetOpen('2', 'How units get in',
            row('gap:10px',
              /* Opens upward, over the name fields. Anchored to this summary and opening
                 down, it landed on the rule's value select — the one control the board
                 exists to explain. */
              hint('An automatic collection is a saved rule, not a list. A unit joins or leaves the ' +
                'moment it stops matching, so the storefront never shows a sold unit.',
                { up: true, top: 24, left: -216, arrow: 218, w: 250 })),
            rulesBody),
          fsetOpen('3', 'Matched units', d('', MATCHED.length + ' units'),
            d('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px',
              MATCHED.map(matchCard).join(''))),
          saveBar('Saved · 2s ago', false, btnApp('Delete collection', 36) + btnGo('Save collection', 36))
        ].join(''))
      )
    ].join('')
  });
}

/* ------------------------------------------------------------ assembly */
let SHELL = null;   /* filled in by main() */

function boardShell(o) {
  const shell = o.shell;
  const sidebar = shell.sidebar(o.subActive == null ? null : o.subActive);
  const content = d(
    'flex:1;padding:32px;display:flex;flex-direction:column;gap:18px;overflow:hidden', o.content);
  const board =
    `<section data-screen-label="${o.label}" style="width:1440px;height:${o.height}px;` +
    `background:${T.canvas};border:1px solid ${T.line};border-radius:20px;overflow:hidden;` +
    `box-shadow:${SH_MD};display:grid;grid-template-columns:264px 1fr">\n` +
    sidebar + '\n' +
    d('display:flex;flex-direction:column;overflow:hidden', shell.topbar + content) +
    '\n</section>';

  /* Caption column: the numbered mono label, then one mono line of what the
     board is showing. 01 and 02 carry the label only; the second line is new
     here and applies to 03-07 consistently. */
  return d('display:flex;flex-direction:column;gap:12px',
    d(`font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${T.slate}`, o.caption) +
    board + '\n' +
    d(`font-family:${MONO};font-size:11px;line-height:17px;color:${T.slate4};max-width:1440px`, o.note));
}

const MARK_OPEN = '<!-- ===== boards 03-07, drawn by tools/draw-dashboard-boards.js ===== -->';
const MARK_CLOSE = '<!-- ===== end boards 03-07 ===== -->';

function main() {
  let src = fs.readFileSync(FILE, 'utf8');

  /* Drop a previous run so this is safe to re-run. */
  src = src.replace(
    /\n<!-- ===== boards 03-07[\s\S]*?end boards 03-07 ===== -->\n/, '\n');

  /* --- the code name wins: HANDOFF records Alf Maskan as the product name,
         and the canvas still said Aqarly in three places. --- */
  src = src
    .replace(/Aqarly — host dashboard/g, 'Alf Maskan — host dashboard')
    .replace(/>Aqarly</g, '>Alf Maskan<')
    .replace(/kamal-estates\.aqarly\.com/g, 'kamal-estates.alfmaskan.com');

  /* --- lift the shell out of board 01 --- */
  const i = src.indexOf('data-screen-label="01 Home light"');
  if (i < 0) throw new Error('board 01 not found — cannot lift the shell');
  const root = parse(src, src.lastIndexOf('<section', i), src.length);
  const sec = root.children[0];
  const side = sec.children[0];
  const main2 = sec.children[1];
  const top = main2.children[0];
  const nav = side.children[1];

  const topbar = src.slice(top.start, top.end);

  /* Sidebar with the active row moved from Home to Listings, and optionally a
     sub-item marked. Rewrites only the opening tags of the four nodes involved,
     by byte offset, so nothing else can drift. */
  function sidebar(subActive) {
    const open = n => src.slice(n.start, n.contentStart);
    const edits = [];
    const home = nav.children[0], homeLabel = home.children[1];
    edits.push([home.start, home.contentStart, open(home).replace(';background:' + T.palm1, '')]);
    edits.push([homeLabel.start, homeLabel.contentStart,
      open(homeLabel).replace('font-weight:600;color:' + T.palm7, 'font-weight:500;color:' + T.ink7)]);

    const tgt = nav.children[1], tgtLabel = tgt.children[1];
    edits.push([tgt.start, tgt.contentStart,
      open(tgt).replace('border-radius:10px', 'border-radius:10px;background:' + T.palm1)]);
    edits.push([tgtLabel.start, tgtLabel.contentStart,
      open(tgtLabel).replace('font-weight:500;color:' + T.ink7, 'font-weight:600;color:' + T.palm7)]);

    if (subActive != null) {
      const sub = nav.children[2].children[subActive];
      edits.push([sub.start, sub.contentStart,
        open(sub).replace('color:' + T.slate,
          `color:${T.palm7};font-weight:600;background:${T.palm1}`)]);
    }

    let out = src.slice(side.start, side.end);
    edits.sort((x, y) => y[0] - x[0]).forEach(([s, e, rep]) => {
      out = out.slice(0, s - side.start) + rep + out.slice(e - side.start);
    });
    return out;
  }

  SHELL = { sidebar, topbar };

  /* --- draw --- */
  const rowWrap = boards => d('display:flex;gap:72px;align-items:flex-start', boards.join('\n'));
  const drawn = [
    MARK_OPEN,
    rowWrap([board03(SHELL), board04(SHELL)]),
    rowWrap([board05(SHELL), board06(SHELL)]),
    rowWrap([board07(SHELL)]),
    MARK_CLOSE
  ].join('\n\n');

  /* --- splice in after the existing row of boards, inside the root wrapper --- */
  const anchor = '</section>\n</div>\n\n</div>\n</div>\n\n</x-dc>';
  if (src.indexOf(anchor) < 0) throw new Error('tail anchor not found — file shape changed');
  src = src.replace(anchor,
    '</section>\n</div>\n\n</div>\n' + drawn + '\n</div>\n\n</x-dc>');

  /* The header's own spec line counts the boards. Derive it. */
  const n = (src.match(/data-screen-label="/g) || []).length;
  src = src.replace(/· \d+ artboards/, '· ' + n + ' artboards');

  fs.writeFileSync(FILE, src);
  console.log('boards drawn — canvas now holds ' + n + ' artboards');
  console.log('  03 listings table      · ' + D.newCairo.length + ' matching rows, 2 selected');
  console.log('  04 listings grid       · ' + UNITS.length + ' cards + no-results state');
  console.log('  05 editor details      · instalment ' + money(D.plan.monthly));
  console.log('  06 editor media        · mid-drag');
  console.log('  07 collections         · ' + MATCHED.length + ' matched (' +
    MATCHED.map(u => u.ref).join(', ') + ')');
}

main();
