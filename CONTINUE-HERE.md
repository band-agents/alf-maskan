# Paste this into the new Claude account

Everything between the lines is the prompt. Open this file, select it all, paste.

---

```
I'm continuing a project called Alf Maskan — a multi-tenant real-estate storefront
SaaS for the Egyptian market (agencies sign up, list units, and get their own
branded website they customise in a Shopify-style editor; EGP 990/month).

Another session built 33 pages of it. I want you to carry on exactly where it
stopped, in the same style, without redesigning anything that already works.

═══════════ 1. READ THESE FIRST, IN THIS ORDER ═══════════

  C:\Users\DANNN\alf-maskan\HANDOFF.md
      State, conventions, decisions already made, traps, and a build-status
      checklist. This is the single source of truth. Read all of it.

  C:\Users\DANNN\alf-maskan\assets\css\tokens.css
      The entire design system — colour, dark palette, type scale, radii,
      shadows, motion. 177 lines. Never write a hex value outside this file.

  C:\Users\DANNN\alf-maskan\README.md
      Architecture and the design decisions behind the dashboard chart.

Then open two or three built pages to absorb the house style before writing any
markup. The best references are:
  src/pages/app/listing-editor.html   (the biggest form)
  src/pages/app/leads.html            (three-pane layout)
  src/pages/store/unit.html           (the buyer-facing world)

═══════════ 2. HOW TO RUN IT ═══════════

Zero dependencies. No package.json, no npm install, no framework.

  cd C:\Users\DANNN\alf-maskan
  node build.js --serve          → http://127.0.0.1:4321
  PORT=4331 node build.js --serve   → a second copy on another port

`node build.js` alone builds once into dist/. Do NOT run a manual build while
--serve is running; both wipe dist/ and race each other on Windows (it now
recovers, but it is slow and noisy).

IMPORTANT: this is not a git repository. Before you change anything, run
`git init && git add -A && git commit -m "checkpoint before continuing"` so I
have an undo. Ask me first if you would rather not.

═══════════ 3. HOW THE BUILD WORKS ═══════════

build.js is ~170 lines of plain Node. Pages live in src/pages/ and the path
under pages/ becomes the URL, so src/pages/app/team.html → /app/team.html.

Front matter is an HTML comment at the very top of each page:

    <!--
    title: Team — Alf Maskan
    desc: One sentence for the meta description.
    nav: team                 ← stamps aria-current on the matching rail item
    bodyClass: app
    css: dashboard, app       ← resolves to assets/css/<name>.css
    js: dashboard, team       ← resolves to assets/js/<name>.js
    theme: yes                ← pre-paint dark-mode script; every app/ page needs it
    step: 4                   ← any key becomes {{step}} in the page AND its partials
    fonts: family=...         ← extra Google Fonts for this page only
    -->

Templating is two things only: {{> partial}} includes src/partials/<name>.html,
and {{var}} substitutes a front-matter value. {{base}} is the relative path back
to the root — ALWAYS prefix internal links and asset paths with it.

═══════════ 4. NON-NEGOTIABLE HOUSE RULES ═══════════

COLOUR   Never a hex in a component. Paint from the semantic roles
         (--bg, --panel, --rule, --text, --text-3, --accent, --accent-2).
         That is what makes dark mode a token swap, not a second stylesheet.
         Palm is the only action colour. Sand (--accent-2) is for premium,
         featured, deals and limited offers ONLY — never a general highlight.

RTL      There is no second stylesheet and there must never be one. Use
         padding-inline, margin-inline-start, inset-inline-start,
         border-inline-end, text-align: start/end. Things that must NOT mirror
         — phone numbers, the +20 prefix, EGP amounts, domains, Latin brand
         names — carry dir="ltr".

IMAGES   There is not one <img> in this project, by design. Every photo is a
         hatched placeholder labelled with what belongs there:
             <div class="ph ph--4x3">compound exterior · New Cairo · 4:3</div>
         Do not add real images.

JS       Progressive enhancement only. Every page must work with JavaScript
         disabled. Tables ship their rows in HTML and JS only filters them;
         tabs are real anchors or <details>; forms use action="#".

NUMBERS  Derive every total, never author one. If a number summarises rows on
         the page, compute it in JS — and make the markup's initial value match
         what the script will produce, so the no-JS state is not a lie. This
         rule exists because a hand-written "9 deals worth EGP 104,700,000"
         turned out to be wrong the moment it was computed (it was 8 / 113.95M).

CONTENT  Never lorem. Real Egyptian zones (New Cairo, Sheikh Zayed, 6th of
         October, New Capital, North Coast, Ain Sokhna, Zamalek, Maadi,
         Mostakbal City), compounds (Mivida, Hyde Park, Palm Hills, Zed East,
         Marassi, Il Monte Galala, Badya, Sodic East), developers (Emaar Misr,
         SODIC, Palm Hills, TMG, Ora), agents (Youssef Kamal, Nourhan Adel,
         Karim ElSayed, Mai Farouk, Omar Hegazy). Western digits always, even
         in Arabic UI.

TOOLTIPS Every non-obvious control gets an ⓘ. Fixed copy pattern:
         "[What it is]. [Why it matters, in one clause]."

═══════════ 5. WHAT IS ALREADY BUILT (do not rebuild) ═══════════

33 pages, all working, all verified in both themes at 1440 / 900 / 390.

MARKETING SITE   index · pricing · templates · template-zamalek · signup ·
                 ar/signup

DASHBOARD        app/index (light + dark) · app/listings (9 filters, sort,
                 bulk bar, table/grid) · app/listing-editor (9 sections, live
                 payment calculator, drag gallery) · app/collections (working
                 condition builder) · app/leads (3-pane inbox, AR/EN
                 conversation, stage stepper) · app/deals (kanban with drag,
                 derived pipeline totals) · app/marketing (offers, broadcasts,
                 form builder) · app/analytics · app/notifications ·
                 app/builder (partial — see below) · app/styleguide (the
                 living design system: 45 specimens rendered from the real
                 stylesheets, with theme and RTL toggles)

ONBOARDING       8 steps: language (flips to RTL live) · profile · business ·
                 branding (real WCAG contrast check) · template · domain
                 (availability that can fail) · first-unit (+ CSV mapping) ·
                 live

STOREFRONT       store/index · search · unit (payment calculator) · compound ·
                 compare · agent · contact (slot picker) · map

CSS: tokens, alf-maskan (marketing), dashboard, app (tables/filters),
editor (forms), crm (leads/deals), reports (marketing/analytics), onboard,
builder, store, styleguide. 11 files.
JS: 21 files, all progressive enhancement.
DESIGN: 5 canvases in design/. Canvases 2, 3 and 4 are complete; 4s boards
03-07 are generated by tools/draw-dashboard-boards.js — edit that script,
not the .dc.html.

═══════════ 6. WHERE I STOPPED — START HERE ═══════════

WHAT THE LAST SESSION DID (so you neither redo it nor undo it):

  · Built the design system as CODE, not artboards — app/styleguide.html, 45
    specimens rendered from the product's own stylesheets, so a component that
    drifts there has drifted in the product. It replaces canvas 1 sheets 03-08.
  · Finished the dashboard canvas — design/Aqarly Dashboard.dc.html now holds
    all 7 artboards its spec line promised. Boards 03-07 (listings table,
    listings grid, editor details, editor media, collections) are GENERATED by
    tools/draw-dashboard-boards.js, which is idempotent. It lifts the sidebar
    and top bar out of board 01 byte-for-byte and computes every number from
    the rows the shipped pages ship in HTML. Change the script, never the
    .dc.html by hand.
  · Fixed four real bugs those two passes exposed: a .chk class collision that
    made 13 checkboxes position:fixed; .fset and .gal__item both clipping
    something they were meant to let through (see trap 5 below); and one unit
    whose delivery year differed between listings.html and collections.html,
    which two separate bits of JS derive from.
  · Added six missing primitives: destructive button, busy state, modal, toast,
    skeleton, dropdown menu.
  · Renamed the dashboard canvas Aqarly -> Alf Maskan. The other four canvases
    still say Aqarly; rename one before you extend it.

THREE THINGS YOU COULD DO NEXT. Pick one and tell me which:

  A. The CANVAS 9 build block below — six pages, the most product value.
  B. Builder boards 03-10 — already specced word-for-word in
     design/CANVAS-6-CONTINUITY.md. Attach the builder canvas to a design
     session and paste that brief; it needs no further thought from you.
  C. Canvas 5 — leads, deals, marketing, analytics and notifications are five
     finished pages with no design behind them at all. Largest remaining gap
     between code and design.

Unless I say otherwise, do A. It is the block below.

The next block is CANVAS 9. Build these six pages, in this order:

  1. src/pages/app/team.html
     Member table (avatar, name, email, role pill, zones/listing count, last
     active, status) with an "Invite member" primary action. Invite modal:
     email or phone, role select with an inline description of what each role
     can do, optional scope (limit to specific zones / compounds / collections).

  2. src/pages/app/roles.html   ← the interesting one
     A full permission matrix. Roles as columns, capability groups as rows,
     tri-state controls (full / limited / none).
     ROLES: Owner (everything incl. billing and deleting the store) · Admin
     (everything except billing and ownership transfer) · Sales manager (all
     listings + all leads + team assignment + analytics; no storefront design,
     no billing) · Agent (only their own listings and leads; can create drafts;
     cannot publish storefront or see other agents' pipelines) · Content editor
     (storefront builder, pages, blog, media; no leads, no price editing) ·
     Accountant (deals, commissions, invoices, billing; read-only listings) ·
     Viewer (read-only everything).
     CAPABILITY ROWS: Listings (view / create / edit / publish / delete /
     price) · Leads (view all / view own / assign / export) · Storefront (edit /
     publish / templates) · Marketing (offers / broadcasts) · Analytics · Team ·
     Billing · Settings · API.
     Add a "Create custom role" affordance and a per-role ⓘ.
     NOTE: this table is wide. Read the ".visually-hidden escapes overflow"
     trap in HANDOFF.md before you build it — it bit the listings table hard.

  3. src/pages/app/audit.html
     Who changed what, when, with filters and a diff preview.

  4. src/pages/app/settings.html + detail screens
     Store profile · Branding (same controls as the builder's theme tab) ·
     Domains (subdomain + custom domain, DNS instructions written for a
     non-technical Egyptian user, SSL status) · Language & region (dashboard
     language, storefront languages, default RTL, currency EGP, area unit m²,
     date format, timezone Africa/Cairo) · Notifications · Integrations
     (WhatsApp Business, Facebook/Instagram lead ads, Google Analytics, Meta
     Pixel, Property Finder / OLX sync, Zapier, webhooks, API keys) ·
     Import & export · Danger zone.

  5. src/pages/app/billing.html
     Current plan card (EGP 990/mo), next invoice, payment method with LOCAL
     rails (Visa/Mastercard, Fawry, Paymob, InstaPay, bank transfer), invoice
     history with download, usage meters (storefronts, listings, team seats,
     storage) each with an ⓘ, upgrade/add-on modal, and a cancel flow with a
     retention offer.

  6. src/pages/app/help.html
     In-app help: searchable articles, guided tours, "What's new" changelog,
     contact support with a WhatsApp option.

FOR EACH PAGE: reuse assets/css/app.css (tables, filters, pills, empty states)
and assets/css/editor.css (form controls, switches, save bar). Only write new
CSS for something genuinely new — put it in a new file and add it to the page's
`css:` front matter. Then link the page in src/partials/app-rail.html (the Team
and Settings items are currently href="#") and tick its row in HANDOFF.md.

AFTER CANVAS 9, in priority order:
  · Canvas 6 gaps — add-section library panel, full theme-settings groups,
    block-level editing, publish popover + version history, template library
    modal. All inside src/pages/app/builder.html and assets/js/builder.js.
  · Canvas 7 — the 10 storefront templates (Nile exists as store.css; the other
    nine are Cascade, Compound, Sahel, Broker, Vitrine, Solo, Blueprint,
    Rental, Souq).
  · Canvas 10 — Arabic RTL versions of the dashboard pages, and a mobile
    dashboard set with a bottom tab bar.

═══════════ 7. TRAPS THAT ALREADY COST TIME ═══════════

Read the full "Traps worth knowing" section in HANDOFF.md. The five that matter
most:

  · .visually-hidden is position:absolute with no offsets. Without a POSITIONED
    ancestor it resolves against the initial containing block, escapes any
    overflow:hidden clip, and stretches the document wider than the viewport.
    Any new scroll container holding hidden labels needs position:relative.

  · .store was already taken by alf-maskan.css (the fake demo storefront inside
    a browser frame on the marketing pages, floored at min-width:640px). Grep
    alf-maskan.css for a class name before reusing it as a body class.

  · A flex/grid item defaults to min-width:auto and refuses to shrink below its
    content. Anything wrapping a wide table needs min-width:0 or minmax(0,1fr).

  · Highlighting the exception, not the rule. The compare table first tinted
    every differing row — 14 of 16 — which highlighted nothing. It is inverted
    now. Same logic applies to any new comparison or diff view.

  · overflow:hidden on a rounded panel eats whatever is meant to stick out, and
    reports no error. .fset clipped its own hint tooltip (which opens BELOW the
    summary, so on a collapsed 56px row it was entirely outside the box) and
    .gal__item clipped the drag insertion line (which sits at -6px, in the
    gutter). Both showed nothing at all and nobody noticed for weeks. If a box
    is round and something inside it must escape, clip the child, not the box.
    Related: getBoundingClientRect() still reports a full-size box for content
    inside a CLOSED <details>, so an overflow audit will report huge phantom
    escapes. Filter on el.checkVisibility(), or hit-test with elementFromPoint.

═══════════ 8. HOW I WANT YOU TO WORK ═══════════

  · Tell me which page you are starting before you start it.
  · Build it, then VERIFY it in a browser: no console errors, no horizontal
    overflow (document.scrollWidth === clientWidth), correct in both light and
    dark, and every interactive control actually does what it claims.
  · Report honestly. If something does not work, say so with the evidence.
  · Update the build-status checklist in HANDOFF.md when a page is done.
  · Do not redesign or "improve" pages that already work unless I ask.
  · Do not add dependencies, a framework, a package.json, or real images.
```

---

## What to attach alongside it

Nothing is strictly required — the prompt points at absolute paths and the new
session can read them. But if the account cannot reach the filesystem, attach:

- `HANDOFF.md` — the reference doc the prompt depends on
- `assets/css/tokens.css` — the design system
- `src/pages/app/listing-editor.html` — the best single example of house style
