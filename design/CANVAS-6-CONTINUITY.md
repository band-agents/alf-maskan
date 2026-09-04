# Canvas 6 continuity brief

What to give a fresh Claude Design account so it draws artboards 03–10 of the
storefront builder in the same hand as everything already built.

---

## 1. What actually exists on disk

Audited from the six `.dc.html` files, not from the prompt pack.

| Canvas | Pack asked for | On disk | File |
| --- | --- | --- | --- |
| 1 · Design system | 8 sheets | **2** drawn — 01 Brand, 02 Color. Sheets 03–08 exist instead as a living styleguide in code | `design/Aqarly Design System.dc.html` + `src/pages/app/styleguide.html` |
| 2 · Marketing | 5 screens | **6** ✓ complete | `design/Aqarly Marketing Site.dc.html` (= `Downloads/am-marketing.dc.html`, identical) |
| 3 · Onboarding | 7 steps + variants | **11** ✓ complete | `Downloads/am-onboarding.dc.html` |
| 4 · Dashboard core | 5 + dark | **7** ✓ complete — Home light/dark, listings table, listings grid, editor details, editor media, collections | `design/Aqarly Dashboard.dc.html`, boards 03–07 by `tools/draw-dashboard-boards.js` |
| 5 · Leads, deals, marketing, analytics | 5 | **none found** | — |
| 6 · Storefront builder | 10 | **2** — 01 default, 02 section selected | `Downloads/am-builder.dc.html` |

Two things follow from this:

- **Canvas 6 is already started.** You are not starting it, you are extending it.
  New artboards number from **03**.
- **Canvas 5 is not a blocker.** The pack says "do not run 6 before 1–5 exist,"
  but the builder inherits from canvas 1 (tokens), 2 (what a storefront looks
  like) and 4 (dashboard shell). Leads and deals never appear in the builder.
  Go straight to 6.

---

## 2. Attach the file. Do not describe it.

The single highest-fidelity move: **upload `Downloads/am-builder.dc.html` into the
new Claude Design chat.** It already holds artboards 01 and 02 at 1600px in the
exact target style. No prose brief will ever match "here is the file, continue it."

Attach two more as reference:

- `Downloads/am-onboarding.dc.html` — the most complete canvas (11 artboards); it
  shows the breadth and consistency bar.
- `design/Aqarly Design System.dc.html` — the palette, as rendered.

---

## 3. Do not paste the original BLOCK A

Block A describes what you **asked for**. The canvases record what actually got
**built**, and they diverge in three ways that a fresh account will get wrong:

| Block A says | Every canvas actually does |
| --- | --- |
| "Real Egyptian property photography … warm daylight, 4:3 and 16:9" | **Zero `<img>` in all six files.** Every photo is a hatched CSS placeholder labelled with what belongs there |
| "Icons: Lucide, 1.5px stroke, 20px default" | **Zero `<svg>`** outside the dashboard's chart polylines. Icons are drawn from divs and borders |
| "canvas #F6F7F9 app background" | The stage between artboards is **`#EDEFF3`**. `#F6F7F9` is only the in-app background *inside* an artboard |

And Block A never mentions four things every canvas does: **IBM Plex Mono** as the
annotation face, the mono caption line above each artboard, the artboard wrapper
style, and inline-styles-only construction.

Paste **Block A′** below instead.

---

## 4. Settle the brand name first

**Settled: Alf Maskan wins**, as HANDOFF already recorded for the code. The
dashboard canvas has been renamed throughout — title, sidebar brand and
`kamal-estates.alfmaskan.com`. The other four canvases still say **Aqarly**
(`kamal-estates.aqarly.com`); rename the builder canvas before you run 6, or
artboards 03–10 will disagree with 01–02 on the store's own domain.

---

## BLOCK A′ — paste this at the top of the canvas 6 prompt

```
You are continuing an existing Claude Design project, not starting one. I have
attached the canvas file. Read it before you draw anything — it already contains
artboards 01 and 02 of this exact canvas, in the exact style you must match.
Your job is to add artboards 03–10, indistinguishable in construction from 01
and 02.

The conventions below are observed from that file. They are not preferences.

─────────────── FILE SHAPE ───────────────

One <helmet> block loading Tajawal, IBM Plex Sans Arabic, Inter and IBM Plex Mono
from Google Fonts, then:
  html,body{margin:0;padding:0;background:#EDEFF3;-webkit-font-smoothing:antialiased}
  *{box-sizing:border-box}
  a{color:#0F5E4E;text-decoration:none}  a:hover{color:#127A64}

#EDEFF3 is the stage colour BETWEEN artboards. It is not the app background
(#F6F7F9). Do not confuse the two.

Root container:
  padding:72px; display:flex; flex-direction:column; gap:72px;
  font-family:Inter,sans-serif

Canvas header, once, at the very top:
  title  Tajawal 36/44/700 #0C1017            "Aqarly — storefront builder"
  spec   IBM Plex Mono 13/20 #6B7484          the layout metrics, verbatim:
         "1600px artboards · top bar 56 · tree 320 · canvas 920 · settings 360"

Artboards sit in horizontal flex rows — display:flex; gap:72px;
align-items:flex-start. Each artboard is wrapped in its own column div
(display:flex; flex-direction:column; gap:12px) holding its caption, then the
board itself.

Caption above every artboard — IBM Plex Mono 12px, letter-spacing:.04em,
color:#6B7484, upper case, in this exact form:
  03 · MID-DRAG — SECTION MOVING IN THE TREE

Every artboard is a section whose data-screen-label echoes the caption's words:
  <section data-screen-label="03 Builder mid-drag" style="…">

Artboards in THIS canvas are the dark editor chrome:
  width:1600px; height:<explicit px>; background:#0C1017; border-radius:16px;
  overflow:hidden; box-shadow:0 12px 32px rgba(12,16,23,.18);
  display:flex; flex-direction:column
(01 is 1140px tall, 02 is 1220px. Set each board's height to its real content.)

Light documentation-style boards, if any, use instead:
  width:1440px; background:#FFFFFF; border:1px solid #E6E9EF; border-radius:24px;
  padding:48px; box-shadow:0 1px 2px rgba(12,16,23,.06),0 1px 3px rgba(12,16,23,.04)

Close the file with this stub, unchanged:
  <script type="text/x-dc" data-dc-script>
  class Component extends DCLogic { renderVals() { return {}; } }
  </script>

─────────────── CONSTRUCTION LAWS ───────────────
These are where a fresh account goes wrong. They override any generic guidance.

1. INLINE STYLES ONLY. No classes, no CSS rules beyond the helmet reset above.
   Every element carries its own style attribute. The entire project is built
   this way; a class-based artboard will not match.

2. NO IMAGES. There is not a single <img> in any canvas of this project. Every
   photo, screenshot, avatar, logo, floor plan and map is a hatched placeholder:
     background:repeating-linear-gradient(135deg,#DCE0E6 0 9px,#E7EAF0 9px 18px)
   Large areas use 12px/24px stops; lighter recessed ones #E6E9EF/#EFF1F5.
   Every placeholder is LABELLED, in IBM Plex Mono 10–11px #6B7484, with what
   belongs there — "hero · New Cairo compound exterior · 16:9",
   "agent portrait · 1:1", "zone map", "og:image · 1200 × 630".
   Ignore any instruction to use real photography. It does not apply here.

3. NO SVG ICONS. No Lucide, no icon font, no <svg> except chart polylines.
   Icons are drawn in CSS from divs: a chevron is a 7px box with two 1.5px
   borders rotated 45°, a status dot is a 5px pill, a drag handle is a dot grid,
   an avatar is initials on a palm square. Keep them at that level of
   abstraction — they read correctly at artboard scale and that is enough.

4. REAL CONTENT ONLY. Egyptian zones, compounds, developers and agent names.
   EGP amounts in Western digits with thousands separators. "Delivery Q4 2027".
   No lorem, no "Section title", no "Lorem ipsum", no greeked paragraphs.

─────────────── TOKENS (exact values, already in the file) ───────────────

LIGHT   ink-900 #0C1017 · ink-700 #1A212D · slate-500 #6B7484 · slate-400 #9AA1AE
        line #E6E9EF · canvas #F6F7F9 · surface #FFFFFF
PALM    700 #0B4A3E · 600 #0F5E4E (primary) · 500 #127A64 · 100 #E7F3F0
SAND    600 #A87A1E · 500 #C9962B · 100 #FBF3E2
        Sand is premium / featured / deal ONLY. Never a general highlight.
SEMANTIC success #127A4B · warning #B4740E · danger #C2402F · info #2563A8
DARK    canvas #0C1017 · surface #141A24 · elevated #1B2331 · line #232B38
        text #ECEFF4 · secondary #9BA5B4 · palm #3EA98F · sand #E2B457
        (The builder chrome is dark. The storefront inside the canvas is light.)

TYPE    display Tajawal · UI Inter (Latin) / IBM Plex Sans Arabic (Arabic)
        annotations, code, metrics, placeholder labels IBM Plex Mono
        48/56/700 · 36/44/700 · 28/36/600 · 22/30/600 · 18/26/600
        16/26/400 · 14/22/400 · 13/20/400 · micro 12/16/500 +.04em LATIN ONLY
        Western digits always, even in Arabic. Never letter-space Arabic.
        Never ALL-CAPS Arabic. Add +8% line-height on Arabic.

SPACING 4pt base · rhythm 24/32/48/64
RADII   sm 8 · md 12 · lg 16 · xl 24 · pill 999
SHADOW  sm 0 1px 2px rgba(12,16,23,.06),0 1px 3px rgba(12,16,23,.04)
        md 0 4px 12px rgba(12,16,23,.08) · lg 0 12px 32px rgba(12,16,23,.12)

─────────────── WHAT 01 AND 02 ALREADY ESTABLISH ───────────────
Every new artboard must agree with these. Do not re-invent them.

Store        Kamal Estates · initials KE on a #3EA98F square · "Live" chip
Domain       kamal-estates.aqarly.com
Page         "Home page ▾" — 6 sections, "edited 2 min ago"
Top bar 56   ← Dashboard | divider | KE Kamal Estates · Live | Home page ▾
             ─ centre ─ Desktop / Tablet / Mobile · EN / ع
             ─ right ─ Preview ↗ · Save (palm)
Left rail    320px, tabs: Sections · Theme · Pages
  HEADER     Announcement bar · Header
  TEMPLATE 6 Search hero · Featured units · Map explorer ·
             Payment plan calculator · Team / agents · Testimonials
  FOOTER     Footer · WhatsApp float
Inspector    360px, right. Page settings when nothing is selected; section
             settings when something is. "Saved · 2s ago" and "⌘Z to undo" in
             the footer of the panel.
Storefront   Announcement "Delivery Q4 2027 · payment plans up to 8 years —
             talk to us on WhatsApp" · nav Units / Compounds / Payment plans /
             About / WhatsApp · hero "Find your unit in New Cairo" with a
             Zone / Type / Beds / Budget search bar · "Featured units —
             Hand-picked this week by our team" with a sand FEATURED badge.
```

---

## Canvas 6 body — paste under Block A′

```
Add artboards 03–10 to the attached storefront-builder canvas. 01 and 02 exist;
match them exactly and continue the numbering.

03 · MID-DRAG. "Map explorer" being dragged in the left tree: the row lifts with
   a shadow and ~2° rotation, a 2px palm insertion line marks the drop target
   between two rows, and the canvas dims the moving section while showing a
   matching drop indicator. This board has to make the drag feel physical.

04 · ADD SECTION PANEL. A slide-over over the tree, with search and category
   tabs — Hero · Listings · Trust · Content · Conversion · Media · Layout. Each
   section is a card: a small hatched thumbnail sketching its layout, a name,
   and a one-line description. Show the full real-estate library:
     Hero        Search hero, Video hero, Split hero, Slideshow, Compound hero
     Listings    Featured units, Unit grid, Unit carousel, Filterable search
                 results, Map explorer, Compare units, Recently viewed,
                 Collection row
     Trust       Developer logos, Stats counters, Testimonials, Awards,
                 Team/agents, About us, Certifications
     Content     Rich text, Image + text, Area/zone guide, FAQ accordion,
                 Blog posts, Gallery, Timeline (project phases)
     Conversion  Lead form, Book a viewing, WhatsApp CTA band, Payment-plan
                 calculator, Mortgage calculator, Limited-offer countdown,
                 Newsletter, Download brochure
     Media       Image banner, Video, 360° tour, Floor plans,
                 Before/after finishing
     Layout      Spacer, Divider, Multi-column, Custom HTML, Announcement

05 · THEME SETTINGS TAB. Left rail switched to Theme; inspector open on Colors —
   brand pickers with live palette generation and a storefront light/dark toggle.
   The tree lists the other groups: Typography (AR + EN font pickers with live
   specimens, scale slider), Layout (page width, grid gap, section spacing,
   corner radius), Buttons, Cards, Unit card (which fields show), Header, Footer,
   Social, Language & RTL, Currency & units (EGP, m²), Favicon, Custom CSS.

06 · MOBILE PREVIEW. Device toggle on Mobile: the canvas becomes a phone frame
   centred on the stage, the tree is unchanged, and the inspector shows
   mobile-specific overrides — mobile padding, mobile columns, hide-on-mobile.

07 · ARABIC RTL — two boards side by side, annotated:
   07a the canvas content in Arabic RTL with the editor chrome still LTR
   07b the whole editor mirrored — rail on the right, inspector on the left
   Mark with red annotation what mirrored and what did not. Numbers, EGP
   amounts, the domain and Latin brand names stay LTR.

08 · BLOCK-LEVEL EDITING. "Payment plan calculator" expanded in the tree to show
   its blocks — Heading, Down payment slider, Years selector, Result card,
   Disclaimer, CTA — with one block selected, indented under a connector line,
   and its settings open in the inspector.

09 · SAVE / PUBLISH. The Save click state → a publish popover listing what
   changed ("3 sections edited, 1 added"), a schedule option, and "Publish to
   live site". Beside it, the version-history drawer with previous versions and
   restore.

10 · TEMPLATE LIBRARY. A full-screen modal over a dimmed editor: the 10
   storefront templates as hatched live previews (Nile, Cascade, Compound,
   Sahel, Broker, Vitrine, Solo, Blueprint, Rental, Souq), the current one
   marked, with Preview / Customize, and a warning explaining what carries over
   when switching.

Show at least two ⓘ tooltips OPEN across these boards, in the established
pattern: "[What it is]. [Why it matters, in one clause]."

Make the builder feel fast: crisp 1px lines, tight controls, no wasted chrome,
strong hover feedback, and a canvas that is clearly the star of the screen.
```

---

## After canvas 6

The gaps worth closing, in the order they pay off:

1. ~~**Canvas 4 finish**~~ — done. Boards 03–07 cover the listings index (table
   and grid), the listing editor (details and media) and collections. They are
   generated by `tools/draw-dashboard-boards.js`, which lifts the shell out of
   board 01 and derives every figure from the shipped pages.
2. ~~**Canvas 1 finish**~~ — done differently. Sheets 03–08 are a living
   styleguide at `app/styleguide.html`, rendered from the product's own
   stylesheets, so a component that drifts there has drifted in the product.
   Boards 01 Brand and 02 Color remain drawn.
3. **Canvas 5** — leads, deals, marketing, analytics. Nothing else depends on it.
   All five pages exist in code with no design behind them, so this is now the
   largest code-ahead-of-design gap.

### If you generate rather than draw

`tools/draw-dashboard-boards.js` is worth copying as a pattern for canvas 5. Two
properties are what make a generated board trustworthy:

- **Lift the shell, do not copy it.** The sidebar and top bar are sliced out of
  board 01 by byte range and re-emitted with the active nav row rewritten by
  offset. A hand-copied shell drifts within one edit.
- **Derive every number.** Match counts, instalments and selection counts are
  computed from the same rows the shipped pages ship in HTML. An artboard that
  states a total it did not compute will eventually contradict the product.
