# Alf Maskan — marketing site

Implementation of `Alf Maskan Marketing Site.dc.html`, the six-artboard Claude Design
canvas in [`design/`](design/). Static HTML/CSS/JS, no framework, no npm install.

| Artboard | Page |
| --- | --- |
| 01 Home | `index.html` |
| 02 Pricing | `pricing.html` |
| 03 Templates gallery | `templates.html` |
| 04 Template detail | `template-zamalek.html` |
| 05 Sign up EN | `signup.html` |
| 06 Sign up AR (RTL) | `ar/signup.html` |

And from `Aqarly Dashboard.dc.html`:

| Artboard | Page |
| --- | --- |
| 01 Home / overview — light | `app/index.html` |
| 02 Home / overview — dark | same page, `data-theme="dark"` |

The rest of the dashboard's core screens are built from the same brief, ahead of
their artboards:

| Screen | Page |
| --- | --- |
| Listings index — table and grid | `app/listings.html` |
| Listing editor — 9 sections + live preview | `app/listing-editor.html` |
| Collections — rules-based and manual | `app/collections.html` |

And from `Aqarly Storefront Builder.dc.html`:

| Artboard | Page |
| --- | --- |
| 01 Builder default | `app/builder.html` |
| 02 Section selected | same page, with a section selected |

The two dashboard artboards are the same layout under two palettes, so they are
one page. The theme toggle lives in the top bar, persists in `localStorage`, and
is applied by a tiny inline script in `<head>` so dark never flashes white on
load. Absent a stored choice it follows `prefers-color-scheme`.

## Run it

```bash
node build.js --serve
```

Serves `dist/` on <http://127.0.0.1:4321> and rebuilds on save. `node build.js`
builds once; `--watch` rebuilds without serving. `dist/` is plain static output —
drop it on any host.

## Layout

```
design/     the imported .dc.html canvases + support.js (reference, not built)
src/
  layout.html      page shell: <head>, fonts, body attributes
  partials/        nav, footer, mark (logo SVG), tick
  pages/           one file per page, front matter on top
assets/
  css/tokens.css   design tokens
  css/alf-maskan.css   everything else
  js/alf-maskan.js     progressive enhancement only
build.js           ~150 lines, zero dependencies
```

Pages start with an HTML-comment front matter block (`title`, `desc`, `nav`,
`lang`, `dir`). `{{> nav}}` includes a partial, `{{base}}` resolves relative
depth so `ar/signup.html` finds its assets. The build also stamps
`aria-current="page"` on the nav link matching each page's `nav` value, so the
active-nav underline is static HTML rather than a JS effect.

## Tokens

`assets/css/tokens.css` transcribes board 02 COLOR from the design-system sheet —
same names, same hex. Palm is the primary; **sand is accent for premium/featured
only**, never a general highlight.

| | |
| --- | --- |
| palm | `--palm-700` `#0B4A3E` · `--palm-600` `#0F5E4E` · `--palm-500` `#127A64` · `--palm-100` `#E7F3F0` |
| sand | `--sand-600` `#A87A1E` · `--sand-500` `#C9962B` · `--sand-100` `#FBF3E2` |
| ink / slate | `--ink-900` `#0C1017` · `--ink-700` `#1A212D` · `--slate-500` `#6B7484` · `--slate-400` `#9AA1AE` |
| surfaces | `--line` `#E6E9EF` · `--paper` `#F6F7F9` · `--surface` `#FFFFFF` |
| status | success `#127A4B` · warning `#B4740E` · danger `#C2402F` · info `#2563A8` |

Type sizes are `clamp()`ed with the artboard value as the maximum, so a 1440px
viewport matches the design exactly and smaller ones scale down.

## Swapping in real photography

Every hatched block is a `.ph` marking where a photo goes, labelled with what
belongs there:

```html
<div class="ph ph--4x3">listings table screenshot · 4:3</div>
```

Replace the whole element with an `<img>` carrying the same aspect — nothing else
changes:

```html
<img src="assets/img/listings.png" alt="The Alf Maskan listings table"
     width="1200" height="900" style="aspect-ratio:4/3;object-fit:cover">
```

There are 40-odd of them: compound exteriors, interiors, agent portraits,
template screenshots, and the product demo video still.

## RTL

There is no second stylesheet. Layout uses logical properties throughout
(`padding-inline`, `margin-inline-start`, `inset-inline-start`,
`border-inline-end`), so `dir="rtl"` on `<body>` mirrors the page. The Arabic
sign-up switches to IBM Plex Sans Arabic via `body[dir="rtl"]`, and things that
must **not** mirror — phone numbers, the `+20` prefix, domains, the logo — are
marked `dir="ltr"`.

Only the sign-up screen exists in Arabic, because that is the only Arabic
artboard in the design. The EN/ع switcher therefore points at `ar/signup.html`
from every page. Translating the four marketing pages is a copy job, not a
layout one.

## JavaScript

`assets/js/alf-maskan.js` is enhancement only — every page works with it disabled.
FAQ is `<details>`/`<summary>`; the gallery ships all cards in the HTML and JS
only filters them; the pricing card renders monthly by default.

It adds: mobile nav, one-at-a-time FAQ, monthly/annual pricing swap, gallery
filter + search + sort (with `?tag=Coastal` deep links from the footer), the
Desktop/Mobile/Arabic preview tabs, and the password show/hide + strength meter.

## Notes on the design

Three things worth a decision:

1. **The gallery has 11 template cards, but the copy says ten.** Marassi,
   Zamalek, Mostakbal, Sokna, Hegazy, Badya, Zed, Maadi, Galala, Sodic East,
   Mivida. I kept all eleven and made every count derive from the list — the
   filter chip reads "All 11" and the home teaser says "+7 more" — so nothing on
   the page is wrong either way. Drop a card or bless the eleventh and the
   numbers follow.
2. **Four of the five home FAQ answers are mine.** The artboard only shows the
   answer to "Do I need a developer or a domain first?"; the rest are collapsed
   with no body text. I wrote answers consistent with the rest of the site
   (Instapay/Vodafone Cash, the two-month pause, real RTL). Worth a read before
   this goes live.
3. **The phone-field tooltip on sign-up overlaps the storefront preview.** That
   is what the artboard does — it sits at `left: 100% + 16px` from a field that
   already fills its column. Kept as designed; below 900px it drops under the
   field instead.

Forms post nowhere (`action="#"`) and CTAs link between pages — wire them to the
real endpoints when the app exists.

## The dashboard chart

Two series over time: views (palm) and leads (sand). Both palettes were checked
with a colour validator rather than by eye — **CVD separation passes in both
modes** (ΔE 24.6 light, 12.0 dark, against a target of 8), so the two lines stay
distinguishable for colourblind readers.

Two things came out of that check and shaped the build:

- **Light-mode sand is 2.6:1 against white** — under the 3:1 floor. That
  obligates relief, so the chart ships a **"View as table"** toggle and the
  hover readout always names both figures in text. Identity is never carried by
  colour alone.
- **Views and leads are on separate scales.** Views run in the hundreds, leads
  in single digits; on one axis the leads line would flatline along the bottom,
  which is plainly not what the artboard draws. Two y-scales in one frame is the
  classic misleading-chart pattern, so treat the crossing point as decorative —
  it means nothing. The readout and table carry the real numbers. If you want it
  strictly honest, the fix is to split leads into its own small multiple, or
  plot **leads per 100 views** as a conversion rate on a single axis. Worth a
  decision before this goes in front of customers.

Sample data is generated deterministically in `dashboard.js` so the page is
self-contained; swap `makeSeries()` for your API and everything else holds.

## Dashboard notes

- The rail collapses 264 → 72 and remembers it. Collapsed, the chevron becomes a
  disc on the rail's outer edge so it is still the control that brings it back.
- Below 900px the rail becomes an off-canvas drawer with a scrim, opened from a
  hamburger in the top bar and closed with Escape.
- `⌘K` / `Ctrl+K` focuses the search field.
- **One accessibility change from the artboard:** its muted grey on dark
  (`#6B7484`) lands at 3.70:1 on the panel, under AA for the 11px timestamps
  that use it. Lifted to `#838D9C` (5.20:1), same hue. Everything else is the
  artboard's own value.

## Storefront builder

Shell per the artboard's own note: top bar 56, sections rail 320, stage,
inspector 360, at 1600 wide.

The two artboards are **two states of one screen** — nothing selected (page
settings) and a section selected (section settings) — so there is one page and
one state object. The rail, the inspector and the preview all render from it,
which means the controls actually drive the storefront rather than posing next
to a picture of one:

- heading, subheading and link text type through live, in English or Arabic
- cards-per-row, layout (grid / carousel / masonry) and card style re-lay the grid
- the four "Show on card" switches add and remove fields from every card
- padding, background and the FEATURED badge apply to the selected section
- sections drag to reorder, hide behind the eye, duplicate, rename and delete
- clicking a section **in the canvas** selects it in the rail, and vice versa
- the save chip goes Live → Unsaved changes on the first edit; Save or Cmd/Ctrl+S
  puts it back

Only the Featured-units section has a designed inspector in the artboard. The
others select and outline correctly but fall back to page settings rather than
inventing panels the design never specified — worth filling in when those boards
exist.

Below 1120 the inspector becomes a drawer over the stage, below 860 the rail does
too, and below 720 the device and language switchers leave the top bar (a phone
cannot usefully preview a 1440 device frame). Escape closes either drawer.

## Chart series colours

`--series-1..4` in `tokens.css` are the categorical chart palette: palm, sand,
blue, terracotta, with lighter steps of the same four on dark. **Assign them in
order and never cycle**, and do not reach for `--warn` or `--info` instead —
status colours are reserved, and that substitution is exactly what failed here:
palm against blue measured ΔE 14.9 (light) and 14.0 (dark), under the 15 floor
where readers with ordinary colour vision stop telling a pair apart. The current
order was validated in both themes — worst adjacent pair ΔE 25.1 normal / 19.2
protan on light, 19.3 / 12.0 on dark.

## Tooltips inside headings

A heading's accessible name is its text content, so a hint nested inside one
gets announced as part of the heading — "Storefront visits i About visits One
person opening your storefront…". `aria-labelledby` pointing at a descendant
span did not survive the accessibility tree in testing. The pattern that does:
keep the hint a **sibling** of the heading, inside `.titlerow` (or inside
`.kpi__label`, which carries the label typography while a bare `<h2>` sits in
it). Copy that shape for any new metric or panel title with a hint.

## Onboarding canvas

`design/Aqarly Onboarding.dc.html` holds 11 artboards. Eight are the wizard
steps, already built as `onboarding/*.html` in the same order the artboard's own
step rail shows: language, who you are, your business, branding, template, your
address, first unit, you're live. The other three are variants:

| Artboard | Where it lives |
| --- | --- |
| Step 0 language **RTL** | same page — picking العربية flips direction *and* swaps every `[data-i18n]` string, and the Arabic option moves first |
| Step 6 **CSV mapping** | the `csv` pane of `first-unit.html` |
| **Setup checklist widget** | `partials/setup-checklist.html`, mounted on the dashboard |

The canvas draws the RTL step as a separate board because a canvas cannot be
interactive; in code it is one page with a live toggle, which is what the LTR
board's own copy promises ("flips this whole setup to right-to-left straight
away").

### One conflict between canvases, worth a decision

The **dashboard** artboard draws the setup checklist as an inline card in the
content flow, between the greeting and the KPI tiles. The **onboarding** canvas
draws it as a floating widget — "lives bottom-right of the dashboard until it is
finished or dismissed, collapsed by default after the first session" — and
annotates the placement as *bottom-right, 24px inset*, with four states.

I built the floating version, because that artboard is specifically about this
component and documents its behaviour; the dashboard board only shows it sitting
there. The inline card has been removed so there are not two setup prompts. If
the dashboard board is the authority instead, the inline markup is in this file's
history and the widget can go.

States persist in `localStorage` under `am-setup`: expanded on the first visit,
a pill on every visit after, gone once hidden or completed. `chk.complete()`
shows the celebration and auto-hides it after six seconds.

## Design system — the living styleguide

`app/styleguide.html` is sheets 03–08 of the design-system canvas, rendered from
the product's own stylesheets rather than redrawn. Every specimen carries only
product classes, so **a component that drifts here has drifted in the product** —
which is the whole point, and what a static canvas sheet cannot do.

| Sheet | What it covers |
| --- | --- |
| 03 Type | The scale twice at identical sizes, Latin and Arabic, plus a paragraph specimen in both |
| 04 Components I | Buttons (4 variants × 3 sizes × 3 states), inputs, selects, textarea, switch, checkbox, radio cards, segmented control, slider, chipset, search + filter chips, dropzone |
| 05 Components II | Status and badges, avatars and stacks, hint/callout/toast, modal, menu, skeleton, empty state, breadcrumb, saved views, pagination, progress steps |
| 06 Data | Sortable table with selection and bulk bar, KPI tile, donut, funnel, ranked bars, listing card in three densities |
| 07 RTL mirror | Six components LTR above and RTL below, with what must **not** mirror called out |
| 08 Elevation & motion | Shadow, radius and spacing ladders, and the three durations running live |

Two toggles at the top flip **theme** and **writing direction** for the whole
page, so any component can be checked in all four combinations without leaving
it.

### What building it surfaced

- **`.chk` meant two different things.** A checkbox in `app.css` and the setup
  checklist widget in `dashboard.css` — and 16 pages load both, so every
  checkbox on those pages was inheriting `position: fixed; z-index: 45`. The
  widget is now `.setupchk`.
- **Missing primitives.** The library had no destructive button, no busy state,
  no modal, no toast, no skeleton and no dropdown menu, so pages improvised.
  All six are now in `alf-maskan.css` / `app.css`.
- **A page ground painted from a raw ramp step.** `--paper` is a fixed light
  value; the dark theme redefines the *semantic* roles. Use `--bg` for a page
  ground, `--panel` for a surface — never the ramp step directly, or the page
  keeps its light background in dark mode.

## Dashboard canvas — artboards 03–07

`design/Aqarly Dashboard.dc.html` shipped with 2 of the 7 artboards its own spec
line promises: Home light and Home dark. The other five now exist, covering the
three screens that had 60KB of working code and no design behind them.

| Board | What it shows |
| --- | --- |
| 03 Listings table | Filtered to Zone: New Cairo, two rows selected, bulk bar up, pager gone |
| 04 Listings grid | The grid view rendered from the same rows, plus the no-results state |
| 05 Listing editor | Nine sections, Basics and Price open, live storefront card beside it |
| 06 Listing editor · media | The gallery mid-drag: lifted tile, insertion line, dirty save bar |
| 07 Collections | An automatic collection, its two conditions, and what they select |

They are generated, not hand-written: `node tools/draw-dashboard-boards.js`
redraws them in place and is safe to re-run. Two things make that worth doing.

**The shell is lifted, not copied.** The sidebar and top bar are sliced out of
board 01 byte-for-byte and re-emitted with the active nav row moved by byte
offset. A hand-copied shell drifts from the original within one edit.

**Numbers are derived, not typed.** The instalment on board 05, the match count
on board 07 and the selection count on board 03 are computed in the generator
from the same rows the shipped pages ship in HTML. If a figure on an artboard
is wrong, the script is wrong — you cannot get there by mistyping.

The boards also carry a second mono caption line under each frame saying what
the board is showing. 01 and 02 carry the label only; this is an addition, and
it applies to 03–07 consistently.

The canvas said **Aqarly** in three places and `kamal-estates.aqarly.com` in two.
HANDOFF records that the code name wins, so the whole file now says Alf Maskan.
The other four canvases still say Aqarly.

### What drawing them surfaced

Both of these were confirmed by hit-testing the live pages, not by reading CSS.

- **A tooltip on a collapsed section was a black sliver.** `.fset` had
  `overflow: hidden`, and `.hint__body` opens at `top: calc(100% + 10px)` — which
  on a 56px collapsed row is entirely outside the box. Three of the four hints
  on the listing editor are on collapsed sections, so three of four showed
  nothing. `.fset` is now `overflow: visible` and the summary carries its own
  radius, which is all the clipping was ever for.
- **The drag-and-drop insertion line never painted.** `.gal__item[data-over]::before`
  sits at `inset-inline-start: -6px`, in the gutter between two tiles, and
  `.gal__item` had `overflow: hidden` — so the one piece of feedback telling you
  where a photo will land was clipped away completely. The tile no longer clips;
  the photo rounds its own top corners instead.

A third finding stayed a drawing decision rather than a code change: an open
tooltip always occludes something, and on a dense board it lands on the control
it explains. Board 05's sits on a collapsed row instead of over the computed
instalment, board 06's is well clear of the gallery, and board 07's opens
*upward* so the rule's value select stays readable.
