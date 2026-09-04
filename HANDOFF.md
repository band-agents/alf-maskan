# Alf Maskan — handoff

> **The project has two halves now.**
>
> - **`web/`** is the real product: Next 16 + Prisma, multi-tenant. Read
>   **`web/HANDOFF.md`** for it. That is where active work happens.
> - **This file** covers the 41-page static build in `src/` and `assets/`,
>   which is now the **specification** the product is ported from. Its CSS is
>   literally the product's CSS, and its conventions below still bind.
>
> If you were asked to continue building the application, you want
> **`web/HANDOFF.md`** first. If you were asked to finish the remaining static
> pages, the prompt and checklist below are still current.

---

Read this file first. It is the single source of truth for where the build is,
how the code works, and what to do next. Keep the **Build status** table at the
bottom current — it is what makes the next session possible.

---

## The prompt to paste into a fresh account

Current as of 3 September 2026 · 38 pages · canvases 2, 3, 4, 5, 8 and 9 complete.

```
I've made a lot of changes to a project called Alf Maskan. Another Claude session
built most of it and I want you to carry on exactly where it stopped.

The project is at:  C:\Users\DANNN\alf-maskan

Read these before you touch anything, in this order:

  HANDOFF.md                      state, conventions, traps, and a per-item
                                  build checklist. Read all of it — the
                                  "Traps worth knowing" section will save you
                                  a day.
  README.md                       architecture, and why the dashboard chart
                                  and the eleventh template are the way they are
  assets\css\tokens.css           the whole design system in 177 lines
  design\CANVAS-6-CONTINUITY.md   which design canvases exist, which artboards
                                  each one actually has, and the brief for the
                                  next design session

Then open src\pages\app\listing-editor.html, src\pages\app\leads.html and
src\pages\store\unit.html and read them properly. That is the house style. Do
not write any markup until you have.

WHAT IT IS
A multi-tenant SaaS where Egyptian brokers, agencies and developers sign up,
list units, and get their own branded storefront they customise through a
Shopify-style drag-and-drop builder. EGP 990 a month, Arabic-first. Four
surfaces: the marketing site, onboarding, the dashboard + builder, and the
buyer-facing storefront the builder produces.

HOW TO RUN IT
Zero dependencies. No package.json, no install step, no framework.

  cd C:\Users\DANNN\alf-maskan
  node build.js --serve          builds and serves on 127.0.0.1:4321

Do not start a second copy on the same port — two builds both wipe dist/ and
race on Windows. If another session is already serving, use:

  PORT=4331 node build.js --serve

This is NOT a git repository. There is no undo. Copy the folder before any
large refactor.

RULES THAT ARE NOT PREFERENCES
1. Derive every total, never author one. A page shipped with a hand-written
   "9 deals worth EGP 104,700,000" that was actually 8 / 113,950,000, and only
   the JavaScript that computed it caught the error. Where a number summarises
   rows on the page, compute it — and make the markup's initial value match
   what the script will produce, so the no-JS state is not a lie.
2. Never write a hex value in a component. Everything comes from tokens.css,
   and from the semantic roles (--panel, --rule, --text, --accent), not the raw
   ramp. That is what makes dark mode a token swap instead of a second
   stylesheet. Palm is the only action colour; sand is for premium, featured
   and deals only.
3. No second stylesheet for RTL, ever. Logical properties only —
   padding-inline, inset-inline-start, border-inline-end, text-align: start.
   Numbers, EGP amounts, phone numbers, domains and Latin brand names carry
   dir="ltr" so they do not mirror.
4. There is not one real image in the project, by design. Every photo is a
   hatched .ph placeholder labelled with what belongs there — 173 of them. Do
   not add real images.
5. JavaScript is progressive enhancement. Every page must work with it off:
   tables ship their rows in HTML and JS only filters, tabs are real anchors or
   <details>, forms have action="#" until an API exists.

WHERE IT STANDS
38 pages, all returning 200, no console errors, no horizontal overflow at
1440 / 900 / 390. Complete: the marketing site, onboarding (8 steps), dashboard
core, leads + deals + marketing + analytics + notifications, the 8-page buyer
storefront, and team + roles + audit + settings + billing.

Seven items remain, listed in HANDOFF.md's Build status table:
  - app/help.html — the last Canvas 9 page. The "?" in the sidebar footer is
    still a dead link. Small, do it first.
  - Three builder panels — block-level editing, publish popover + version
    history, template library modal. These want their design canvas drawn
    first; the brief is already written in design/CANVAS-6-CONTINUITY.md.
  - The 10 storefront templates (Canvas 7). Only Nile exists, as store.css.
  - Arabic copy across the product, and a mobile dashboard with a bottom tab
    bar (Canvas 10). The layout work is done — logical properties throughout —
    so this is a copy job, not an engineering one. A data-i18n / data-ar swap
    already exists on src/pages/onboarding/language.html; extend that pattern.

START HERE
Do app/help.html first, then the Arabic copy pass. Tell me what you are
starting before you start it, and update the Build status table in HANDOFF.md
when you finish something.

TWO DECISIONS THAT ARE MINE, NOT YOURS
Do not silently resolve either of these — ask me:
  - The dashboard chart plots views and leads on two y-axes in one frame, so
    the crossing point means nothing. Options are: split leads into its own
    small multiple, plot leads per 100 views on a single axis, or leave it and
    treat it as decorative.
  - Two canvases disagree on the setup checklist: the dashboard board draws it
    inline between the greeting and the KPI tiles, the onboarding board draws
    it as a floating dismissible widget. It is currently floating.

ONE WARNING
More than one session has been editing this project. Before you edit a shared
file — src/partials/*.html, build.js, or any of the stylesheets — check its
current contents rather than trusting anything I or a previous session told
you. Edit by matching content, never by line number; line numbers have already
gone stale once.
```
---

## What this is

A multi-tenant SaaS where Egyptian brokers, agencies and developers sign up, list
units, and get their own branded storefront that they customise through a
Shopify-style drag-and-drop editor. EGP 990/month.

Three audiences, three surfaces:

| Surface | Who uses it | Lives in |
| --- | --- | --- |
| Marketing site | Prospective customers | `src/pages/*.html` |
| Dashboard + builder | The agency (the tenant) | `src/pages/app/*.html` |
| Storefront | The agency's own buyers | `src/pages/store/*.html` |

The design source is six Claude Design canvases in `design/` and `~/Downloads`.
See `design/CANVAS-6-CONTINUITY.md` for a full audit of which canvases exist and
which artboards each one actually contains.

---

## How the build works

`build.js` is ~150 lines of plain Node with no dependencies.

```bash
node build.js           # build once into dist/
node build.js --watch   # rebuild on save
node build.js --serve   # build, watch, serve dist/ on 127.0.0.1:4321
```

**Pages** live in `src/pages/`. The path under `pages/` becomes the URL, so
`src/pages/app/listings.html` → `/app/listings.html`.

**Front matter** is an HTML comment at the very top of a page:

```html
<!--
title: Listings — Alf Maskan
desc: Every unit you have, filterable.
nav: listings
lang: en
dir: ltr
css: dashboard
js: dashboard, listings
theme: yes
-->
```

- `css:` / `js:` are comma-separated names resolving to
  `assets/css/<name>.css` and `assets/js/<name>.js`.
- `theme: yes` injects the pre-paint script that applies the stored theme before
  first paint, so dark mode never flashes white. Every `app/` page needs it.
- `nav:` stamps `aria-current="page"` on the matching nav link at build time.
- **Any front-matter key is a template variable.** `step: 4` in a page becomes
  `{{step}}` in that page *and* in any partial it includes — that is how the
  onboarding rail knows which step it is on. The computed values (`base`,
  `title`, `content`…) win over a front-matter key of the same name.
- `fonts:` loads extra Google Fonts for one page only, as a raw css2 query —
  `fonts: family=Newsreader:opsz,wght@6..72,400;6..72,600`. The storefront uses
  a serif the dashboard never downloads.

**Templating** is two things only: `{{> partial}}` includes
`src/partials/<name>.html`, and `{{var}}` substitutes a front-matter value.
`{{base}}` is the relative path back to the root (`""` at the root, `"../"` one
level down) — **always prefix internal links and assets with it**.

---

## House style

Read `assets/css/tokens.css` before writing a line of CSS. It is the design
system, transcribed from the canvas.

**Colour.** Never write a hex value in a component. Paint from the semantic roles
(`--bg`, `--panel`, `--rule`, `--text`, `--text-3`, `--accent`, `--accent-2`),
not from the raw ramp. That is what makes dark mode a token swap instead of a
second stylesheet. Palm is the only action colour; **sand is for premium,
featured, deals and limited offers only** — never a general highlight.

**Type.** `--font-display` (Tajawal) for headings, `--font-ui` (Inter) for UI,
`--font-mono` for metrics, codes, reference numbers and placeholder labels,
`--font-arabic` for Arabic. Sizes come from the `--t-*` scale. Western digits
always, even in Arabic UI — Egyptian market convention.

**RTL.** There is no second stylesheet and there must never be one. Use
`padding-inline`, `margin-inline-start`, `inset-inline-start`, `border-inline-end`
and logical `text-align: start/end`. Things that must **not** mirror — phone
numbers, the `+20` prefix, EGP amounts, domains, Latin brand names — carry
`dir="ltr"`.

**Images.** Every photo is a placeholder, labelled with what belongs there:

```html
<div class="ph ph--4x3">compound exterior · New Cairo · 4:3</div>
```

Swapping in real photography means replacing the element with an `<img>` of the
same aspect ratio. Nothing else changes. Do not add real images.

**JavaScript.** Enhancement only — every page works with it disabled. Tables ship
their rows in HTML and JS only filters them; tabs are real anchors or
`<details>`; forms have `action="#"` until the API exists.

**Content.** Never lorem. Real Egyptian zones (New Cairo, Sheikh Zayed, 6th of
October, New Capital, North Coast, Ain Sokhna, Zamalek, Maadi, Mostakbal City),
compounds (Mivida, Hyde Park, Palm Hills, Zed East, Marassi, Il Monte Galala,
Badya, Sodic East), developers (Emaar Misr, SODIC, Palm Hills, TMG, Ora), and
agents (Youssef Kamal, Nourhan Adel, Karim ElSayed, Mai Farouk, Omar Hegazy).

**Tooltips.** Every non-obvious control carries an ⓘ. The copy pattern is fixed:
*[What it is]. [Why it matters, in one clause].*

---

## File map

```
build.js                    the whole build system
design/                     imported .dc.html canvases (reference, never built)
  CANVAS-6-CONTINUITY.md    audit of which canvases exist + the prompt to extend them
src/
  layout.html               <head>, fonts, body attributes
  partials/
    nav.html                marketing site header
    footer.html             marketing site footer
    mark.html               the logo SVG
    tick.html               checklist tick
    app-rail.html           dashboard sidebar (264 / 72 collapsed)
    app-topbar.html         dashboard top bar
    store-head.html         storefront header (announce bar, nav, WhatsApp)
    store-foot.html         storefront footer
    onboard-rail.html       onboarding step rail (takes `step:` front matter)
  pages/                    one file per page, front matter on top
assets/
  css/tokens.css            the design system
  css/alf-maskan.css        marketing site
  css/dashboard.css         dashboard shell + the overview page
  css/app.css               tables, filter bars, unit cards, status pills,
                            bulk bar — every data page in the app
  css/editor.css            form controls, payment calculator, media gallery,
                            live storefront preview, sticky save bar
  css/builder.css           storefront builder
  css/store.css             the buyer-facing storefront (Nile template)
  css/crm.css               leads inbox (3 panes) + deals board
  css/reports.css           marketing, analytics charts, notifications
  css/onboard.css           onboarding rail, choice cards, live preview
  js/alf-maskan.js          marketing enhancement
  js/dashboard.js           rail, theme, chart
  js/forms.js               AR/EN field switch + autosave chip, every long form
  js/listings.js            filter, sort, select, table/grid swap
  js/editor.js              payment calculator, live card, gallery reorder
  js/collections.js         the condition builder
  js/leads.js               segments, selection, stages, quick replies
  js/deals.js               drag between stages + derived pipeline totals
  js/marketing.js           offer/broadcast previews, form-field reorder
  js/analytics.js           date range switching
  js/notifications.js       feed filters + derived unread count
  js/onboard.js             RTL flip, live preview, contrast check, availability
  js/builder.js             the builder's state machine
  js/store.js               storefront header menu + saved units, all store pages
  js/store-unit.js          unit page: plan calculator, gallery, AR/EN switch
  js/store-search.js        search page: filter, sort, compare
  js/store-compare.js       sameness detection + extreme flags
  js/store-compound.js      unit-type tabs
  js/store-contact.js       slot picker with per-day availability
  js/store-map.js           pin/card linking, draw-an-area
dist/                       build output — plain static, drop on any host
```

---

## Decisions already made (don't relitigate)

- **The dashboard chart has two y-axes.** Views run in the hundreds, leads in
  single digits. The crossing point is decorative and means nothing; the readout
  and the "View as table" toggle carry the real numbers. If this ever goes in
  front of customers, split leads into a small multiple or plot leads per 100
  views instead.
- **Light-mode sand is 2.6:1 on white** — under the 3:1 floor. Identity is never
  carried by colour alone: the chart ships a table view and every hover readout
  names both figures in text.
- **Muted grey on dark was lifted** from the artboard's `#6B7484` (3.70:1) to
  `#838D9C` (5.20:1) for the 11px timestamps. Same hue, passes AA.
- **The gallery has 11 templates and the copy says ten.** Every count derives
  from the list, so nothing reads wrong either way.
- **Only sign-up exists in Arabic** so far, because that is the only Arabic
  artboard in the marketing canvas. The full RTL pass is Canvas 10.
- **The canvases say "Aqarly", the code says "Alf Maskan".** The code name wins.
  Any new canvas should be prompted with "Alf Maskan".

---

## Build status

Tick a row only when the page is built, styled in both themes, keyboard
accessible, and verified in the browser at 1440 / 900 / 390.

### Canvas 2 — marketing site
- [x] `index.html` — home
- [x] `pricing.html`
- [x] `templates.html` — gallery, 11 cards, filter + search + sort
- [x] `template-zamalek.html` — template detail
- [x] `signup.html`
- [x] `ar/signup.html` — Arabic RTL

### Canvas 4 — dashboard core ✅
- [x] `app/index.html` — overview, light + dark
- [x] `app/listings.html` — table/grid toggle, 9 filters, saved views, sort,
      selection + bulk bar, active-filter chips, empty state
- [x] `app/listing-editor.html` — 9 collapsible sections, live storefront card,
      working payment calculator, AR/EN field switch, drag-reorder gallery,
      Google preview with length counters
- [x] `app/collections.html` — manual vs rules-based with a working condition
      builder; the rules actually filter the matched-unit grid
- [x] **the canvas itself** — `design/Aqarly Dashboard.dc.html` now holds all 7
      artboards its spec line promises. 01/02 Home light and dark were drawn;
      03–07 are generated by `node tools/draw-dashboard-boards.js` (idempotent).
      The whole file was renamed Aqarly → Alf Maskan at the same time.

### Canvas 5 — leads, deals, marketing, analytics ✅
- [x] `app/leads.html` — three-pane inbox: derived segment counts, search,
      AR/EN conversation, stage stepper that writes back to the list, bilingual
      quick replies that drop into the composer
- [x] `app/deals.html` — kanban with drag between stages; every column total,
      the pipeline value, commission and weighted forecast recompute from the
      cards on each move
- [x] `app/marketing.html` — offer builder whose badge, countdown and
      before/after price all recompute in the live card; WhatsApp broadcast with
      a bilingual composer feeding a real message preview; drag-to-reorder form
      builder that reorders the buyer-facing form too
- [x] `app/analytics.html` — range switcher, derived views-per-lead, views by
      unit, leads-by-source donut, zone cartogram, filters used, leaderboard
- [x] `app/notifications.html` — filterable feed with derived unread count,
      7 × 3 per-channel preference matrix, quiet hours

### Canvas 6 — storefront builder ✅
- [x] `app/builder.html` — default, section selected, drag, add-section, theme
      tab, mobile preview, RTL preview
- [x] Block-level editing — a section expands to its blocks, each selects and
      takes over the inspector with its own fields
- [x] Add-section library — 45 sections, 7 categories, search; adding one lands
      in the tree and in the unpublished-changes list
- [x] Save/publish popover with what actually changed, plus scheduling, and a
      version-history drawer where restoring makes a new version
- [x] Template library modal — 10 templates, current marked, honest warning
      about what a switch does not carry over

### Canvas 3 — onboarding ✅
- [x] `onboarding/language.html` — picking العربية mirrors the flow instantly
- [x] `onboarding/profile.html` — four business kinds
- [x] `onboarding/business.html` — AR + EN name, areas chips, live preview
- [x] `onboarding/branding.html` — extracted logo colours with a **real WCAG
      contrast check** (sand 2.0:1 warns, navy 8.3:1 passes), font pair with
      both scripts specimened
- [x] `onboarding/template.html` — 10 templates, style filter
- [x] `onboarding/domain.html` — availability that can actually fail, input
      sanitising, plain-words DNS explainer
- [x] `onboarding/first-unit.html` — type it in / CSV column mapping / portal pull
- [x] `onboarding/live.html` — URL with copy, WhatsApp share, progress ring

### Canvas 8 — storefront (buyer-facing, Nile template) ✅
- [x] `store/unit.html` — gallery with plan/tour/map tabs, working payment
      calculator, key specs, AR/EN description, amenities, nearby, compound,
      agent card, sticky phone CTA bar, similar-units rail
- [x] `store/search.html` — 8 filters + search, sort, map/list split, save,
      two-up compare bar, empty state
- [x] `store/index.html` — hero with a working search, featured row, zone
      tiles, stat band, testimonials, CTA band
- [x] `store/map.html` — price pins tied to cards both ways, draw-an-area
- [x] `store/compound.html` — masterplan, five-phase timeline, unit-type tabs,
      amenities, developer with an honest handover record
- [x] `store/compare.html` — three units, identical rows dimmed, factual
      extremes flagged, columns removable
- [x] `store/agent.html` — profile, facts, listings, reviews
- [x] `store/contact.html` — day and time slots with real per-day availability,
      in-place confirmation

### Canvas 9 — team, roles, settings, billing ✅
- [x] `app/team.html` — member table, invite dialog whose role description and
      scope field follow the role you pick
- [x] `app/roles.html` — 7 roles × 9 capability groups, 63 cycling cells, a
      running change list, and the owner column locked on purpose
- [x] `app/audit.html` — filterable log with before/after values
- [x] `app/settings.html` — profile, domains with the two DNS lines, language
      and region, integrations, import/export, danger zone
- [x] `app/billing.html` — plan with derived annual figures, usage meters,
      Fawry / Paymob / InstaPay / card rails, invoices, honest cancel flow
- [x] `app/help.html` — 12 searchable guides, 4 guided tours, changelog

### Canvas 7 — the 10 storefront templates ✅
- [x] All ten as **token layers over store.css**, not ten stylesheets —
      `assets/css/templates.css`, switched by `data-template` on the root.
      Verified distinct: 10 unique accents, 10 unique radii, 9 unique grounds,
      5 display faces.
- [x] `store/templates.html` — all ten as live miniature storefronts (not
      screenshots), filterable by style, plus the same unit rendered three ways

### Canvas 10 — Arabic-first and mobile pass
- [x] Mobile dashboard — bottom tab bar on all 15 app pages, five destinations,
      raised add button, lead badge, hamburger retired below 860px
- [x] `ar/store/unit.html` — the buyer's money page, fully Arabic and mirrored.
      Proves the engine: one stylesheet, sidebar swaps sides, calculator speaks
      Arabic with Western digits and a ج.م mark.
- [ ] Arabic copy for the other 39 pages. **This is a translator's job, not a
      code one** — the layout already mirrors everywhere. Two mechanisms exist:
      a whole RTL page (`ar/store/unit.html`, `ar/signup.html`) for pages worth
      hand-writing, and the `data-i18n` / `data-ar` swap on
      `onboarding/language.html` for in-place switching.

---

## How this was verified

Not by eye. An iframe harness loads every route at a set width and measures
`documentElement.scrollWidth - clientWidth`; a second pass stamps
`data-theme="dark"` and computes real contrast ratios for anything with its own
text. Re-run it from the browser console on any page of the site — it is worth
rebuilding after a big change:

- **41 routes × 6 widths (390 / 600 / 760 / 900 / 1100 / 1440) — 246
  combinations, zero horizontal overflow.**
- Every solid-sand badge measured for contrast: worst 5.68:1, best 7.15:1.

Three real bugs came out of that sweep and are fixed:

1. **The save bar bled 32px into 20px of padding.** `editor.css` hard-coded the
   bleed; `dashboard.css` drops `.content` padding to 20px between 760 and
   900px. Four form pages overflowed. The bleed now reads `--content-pad` from
   `.content` itself, so the two cannot drift again.
2. **The builder's `.bx` grid had no explicit column**, so the implicit one was
   `max-content` and the top bar sized the whole editor — 102px past a 900px
   viewport.
3. **White on solid sand was 2.66:1** on 10px bold type — the FEATURED badge, on
   12 pages. Ink on sand is 7.15:1 and reads more like a gold badge anyway.

## Traps worth knowing

- **Measure overflow with a harness, not by looking.** Every one of the three
  bugs above was invisible at the widths a person happens to test. Two of them
  only appeared in a 140px band between breakpoints.
- **A bleed must read the padding it is bleeding into.** Any full-width element
  inside `.content` uses `var(--content-pad)`; never write the number twice.

- **Ten templates are ten token layers, not ten stylesheets.** `templates.css`
  overrides the same eight variables per template — ground, ink, line, accent,
  display face, radius, card treatment, header weight — and `store.css` does
  the rest. That is what makes the product's promise true: switching a template
  keeps every unit because nothing structural changes.

- **`el.textContent = x` on a element wipes its children.** The roles matrix set
  the glyph with `btn.textContent`, which destroyed the `.visually-hidden` label
  the very next line wrote to — every cell threw. Write into a child span, never
  into a control that also carries an accessible name.
- **`.tablescroll` needs `position: relative` too, not just `.tablewrap`.**
  Five pages use the scroll container on its own, and the hidden labels inside
  row-action buttons escape it exactly the way they escaped `.tablewrap`.
- **The browser pane can report `clientWidth: 0`.** When it does, every
  `scrollWidth - clientWidth` reading is a fake overflow. Re-set the viewport
  with `resize_window` and measure again before chasing a layout bug.

- **`overflow: hidden` on a rounded panel eats what escapes it.** Two components
  had this and neither showed any error. `.fset` clipped the hint tooltip, which
  opens at `top: calc(100% + 10px)` — outside a 56px collapsed row entirely, so
  three of the four hints on the listing editor rendered an 11px black sliver.
  `.gal__item` clipped the drag insertion line, which sits at
  `inset-inline-start: -6px` in the gutter, so it never painted at all. Both are
  now `overflow: visible`, with the summary and the photo rounding their own
  corners. **If a box is round and something inside it is meant to stick out,
  clipping the box is the wrong tool.**

- **The same unit can drift between two pages.** AM-1038 delivered in 2026 on
  `listings.html` and 2027 on `collections.html`, and the collection it belongs
  to is called "Sahel 2027 delivery" — so the listings delivery filter and the
  collection's rule engine disagreed about the same unit. Listings now says 2027.
  Whenever a unit appears on more than one page, its facts have to match, because
  two different bits of JavaScript derive from them independently.

- **`getBoundingClientRect()` lies inside a closed `<details>`.** The body of a
  collapsed `.fset` still reports a 420px height, so an overflow audit will
  report huge escapes that are not painted at all. Filter on
  `el.checkVisibility()`, or hit-test with `elementFromPoint` — both say
  correctly that nothing is there.

- **Do not draw a map you do not have.** The analytics zone chart is a
  cartogram — labelled blocks laid out roughly the way Egypt sits, shaded in
  five steps — and the page says in plain words that it is not a map and the
  sizes mean nothing. A shape that looks geographic and is not is a lie a reader
  cannot detect. If real governorate boundaries arrive later, swap it and drop
  the disclaimer.

- **Derive every total; never author one.** The deals page shipped with a
  hand-written "9 live deals worth EGP 104,700,000" in the page head. The
  moment `deals.js` recomputed from the cards it came out 8 / EGP 113,950,000 —
  the authored number had been wrong from the first commit and only the JS
  caught it. Where a number summarises rows on the page, compute it, and make
  the markup's initial value match what the script will produce so the no-JS
  state is not a lie.

- **Highlighting the differences highlighted nothing.** The compare table first
  tinted every row where the units differed — with three genuinely different
  units that was 14 of 16 rows, so the highlight covered the table and pointed
  at nothing. It is inverted now: the few identical rows are dimmed. If you add
  a comparison view anywhere else, mark the exception, not the rule.
- **`node build.js` while `--serve` is running races itself.** Both wipe
  `dist/`, and on Windows that throws ENOTEMPTY. `clean()` now retries and then
  gives up quietly, overwriting in place — a stale file is a cheaper failure
  than a dead build. You rarely need a manual build with the watcher up.

- **`.store` was already taken.** `alf-maskan.css` uses it for the fake demo
  storefront inside a browser frame on the marketing pages, floored at
  `min-width: 640px` so it scrolls sideways in the frame rather than being
  crushed. The real storefront's body class is **`storefront`** — using
  `store` gave every storefront page 265px of horizontal overflow on a phone.
  Grep `alf-maskan.css` for a class name before reusing it as a body class.

- **The storefront is a third visual world, not a variant.** `store.css` has its
  own ground, serif and scale, and is deliberately separate from both
  `dashboard.css` and `builder.css`'s `.sf__*` — the last is the same storefront
  drawn at thumbnail scale inside the editor. One is a page, the other a picture
  of a page. Do not merge them.
- **The storefront never follows the viewer's dark mode.** A buyer's browser
  setting must not repaint a seller's brand, so `body.store` states its own
  background and colours and no `[data-theme]` block touches them.

- **`.visually-hidden` escapes `overflow: hidden`.** It is `position: absolute`
  with no offsets, so without a *positioned* ancestor it resolves against the
  initial containing block and is not clipped by an intermediate scroll
  container. In the listings table that stretched the document 325px wider than
  the viewport. Any new scroll container holding hidden labels needs
  `position: relative` on the clipping box. See `.tablewrap` in `app.css`.
- **Filter selects label themselves.** The filter's name is the empty option's
  own text ("Status" until you pick "Live"). An absolutely-positioned label over
  a native select overlaps its value at any label longer than ~4 characters.
- **A flex/grid item defaults to `min-width: auto`** and refuses to shrink below
  its content. `.shell` and `.main` already carry the `minmax(0, 1fr)` /
  `min-width: 0` guards; keep them on anything new that wraps a table.

## Known issues

- Forms post nowhere (`action="#"`). Wire them when an API exists.
- `app/help.html` is the last unbuilt Canvas 9 page. Nothing links to it yet.
- `assets/js/dashboard.js` generates its sample series deterministically in
  `makeSeries()`. Swap that for the API and everything else holds.
