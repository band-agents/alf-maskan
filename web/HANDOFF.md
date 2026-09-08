# Alf Maskan — the product build

This is the real application. The static build one directory up (`../src`,
`../assets`, `../build.js`) is **the specification**, not dead weight: 41 pages
of finished, verified UI that this app is being ported from. When you need to
know what a screen looks like, open the static page — do not invent it.

Read `../HANDOFF.md` for the static build's own conventions. They still apply,
because its CSS *is* this app's CSS.

---

## Run it

```bash
cd C:\Users\DANNN\alf-maskan\web
npm run dev
```

- `localhost:3000` — the marketing site
- `app.localhost:3000` — the dashboard (also reachable at `localhost:3000/dash`)
- `kamal-estates.localhost:3000` — a tenant storefront
- `el-masria.localhost:3000` — **a second tenant, and the thing to look at first.**
  Open both. Different inventory, template, brand colour, ground, display face
  and derived stats, from one codebase. That is the product; if a change makes
  these two look alike, the change is wrong.

No wildcard DNS needed: browsers resolve `*.localhost` themselves.

The static build still runs separately with `node ../build.js --serve`. Do not
run two copies of that one — they race on `dist/`.

---

## What is done

Four commits. `git log --oneline` is the honest record.

| | |
| --- | --- |
| **Scaffold** | Next **16** (not 15 — `create-next-app` moved on), React 19, TypeScript, Prisma 6. No Tailwind, deliberately: the design system is already 8,567 lines of considered CSS. |
| **Schema** | `prisma/schema.prisma`, validated. The whole domain: stores, memberships with role + zone scope, units, collections, leads/messages/deals, offers, storefront pages with section JSON, subscriptions, audit log. |
| **Tenant routing** | `proxy.ts` resolves a hostname to dashboard / marketing / storefront and rewrites accordingly. |
| **Design system** | All 12 stylesheets copied across unchanged into `app/styles/`. Fonts self-hosted via `next/font`. |
| **Shell** | `components/AppRail.tsx`, `components/AppTopbar.tsx`. Dark mode works and persists. |
| **Screens** | `/dash`, `/dash/listings`, `/dash/listings/[id]` — all on typed mock data. |
| **Multi-tenancy** | Two seeded stores, and every unit query scoped by `storeId`. `kamal-estates.localhost:3000` and `el-masria.localhost:3000` render different inventory, template, brand colour, ground and display face from one codebase. Cross-tenant unit access 404s in both directions. |
| **Branding** | `brandHex` finally does something: it overrides `--tpl-accent`, the single token every accent rule in `templates.css` reads. `lib/brand.ts` measures white-on-brand and picks the ink, so a light logo cannot ship an unreadable call to action. |
| **Leads inbox** | `/dash/leads` — segments, search and the selected lead all URL state, so an agent can paste a colleague a link to one enquiry. Every segment count and the page-head figures derive from the same predicate the list uses. Quick replies are generated from the unit via `computePlan`, not hard-coded. |
| **Lead capture** | `/contact`, and the first write in the product. A server action validates, re-checks the slot against what was actually offered, and writes a Lead + Task. It reports two outcomes and never a third: **filed** (the row was written) or **handoff** (it was not, so the buyer gets a prepared WhatsApp message and is told plainly). No name or number ever enters a URL. |
| **Storefront** | The buyer's unit page, `<slug>.localhost:3000/units/<ref>`, ported from `src/pages/store/unit.html`. Gallery, both-scripts description, key specs, amenities, location, compound, similar units, agent card, sticky phone bar — and the payment calculator, which imports the same `computePlan` the listing editor uses. |

## What is not

- **No database.** `DATABASE_URL` in `.env` points at a localhost Postgres that
  does not exist. Nothing has run `prisma db push`. The storefront no longer
  throws on that: `orMock` in `lib/db.ts` catches *connection* failures only and
  serves `lib/mock.ts` instead, warning once per process. A malformed query or a
  missing column still throws as itself — a fallback that swallowed those would
  turn every real bug into "the page renders, with the wrong data".
- **No auth.** Nobody logs in; the dashboard assumes one hard-coded store.
- **Writes are wired but land nowhere.** `saveUnit`, `createUnit` and
  `importUnits` in `app/(dashboard)/dash/listings/actions.ts` are real Prisma
  writes behind `orMock`, tenant-scoped in the `where` rather than by id alone.
  With no database they return `unsaved / no-database` and the screen says so —
  it never clears the unsaved marker on a failed save. Validation runs before
  the database is touched, so a missing title reports in a second rather than
  after a connection timeout.
- **Almost no other writes.** `requestViewing` is the only one. The editor's Publish
  button still sets a flag and nothing else.
- 31 of the static build's 41 pages are not ported yet. Home, browse and contact
  are real ports; `/compounds`, `/team` and `/compare` still 404 from the header.
- **Sending a reply still leaves the site.** There is no WhatsApp Business
  integration and no message store, so the inbox composer opens wa.me with the
  text prefilled rather than pretending to send. The static build appended the
  message to the DOM, which looks exactly like sending and is not.
- **Assign, Add task and the task checkboxes do nothing yet.** They are the
  next writes after the stage change, and each needs the same saved/unsaved
  treatment.
- **Which slots are already taken is not modelled.** The picker offers every
  in-hours slot and the office confirms. The static build hard-coded a busy map;
  that was deliberately not carried across, because inventing availability for a
  real agency is the same class of lie as drawing a map you do not have.
  `takenSlots(storeId, date)` is the one function to add.
- **`/units` is the list half of `store/search.html`.** The map/list split, the
  two-up compare bar and the delivery/finishing filters are not ported — left
  out rather than stubbed, because a fake map is the trap the static HANDOFF
  spends a paragraph on.
- **Nunito and Fraunces are not loaded.** Four of the ten templates name them as
  their display face and currently fall back to system-ui/Georgia. Add them to
  `lib/fonts.ts` when those templates matter.

---

## Eight decisions you should not undo without a reason

1. **Money is `Decimal`, never `Float`.** EGP 34,000,000 in piastres overflows
   Int32, and a float cannot hold a payment plan exactly.

2. **Every buyer-facing field has `Ar` and `En`, both non-null.** The product is
   sold as Arabic-first. A nullable Arabic column is how that quietly stops
   being true.

3. **`lib/pricing.ts` is the only place that knows the payment formula.** The
   static build computed it in four files that agreed by luck. A buyer who sees
   one instalment on a card and a different one on the unit page stops trusting
   the site. Import `computePlan`; never re-derive it.

4. **Filters live in the URL, not in client state.** `lib/queries/units.ts`
   parses `searchParams` into a typed object that becomes a Prisma `where`
   clause without translation. It also makes a filtered list shareable and the
   back button correct.

5. **A unit that is gone keeps its page, and says so.** `DRAFT` 404s — the
   agency has not decided to sell it. `SOLD`, `RESERVED` and `RENTED` render,
   because the link is in someone's WhatsApp history and 404ing it is worse
   than answering, but the status is a badge on the photo rather than a line in
   the sidebar. The static build never drew this state; its one unit artboard is
   live. **This one is a judgement call, not an inheritance** — say so if you
   would rather a sold unit 404'd, or lost its price and its enquiry buttons.

6. **The template sets the shape; the agency sets the colour.** A tenant does
   not get a bespoke design, it gets one of ten templates — ground, ink, rules,
   radius, display face — with its own `brandHex` overriding a single token,
   `--tpl-accent`. That is what lets ten stylesheets serve every agency without
   two of them looking like the same company, and it is why the brand colour is
   *not* allowed to set the ground: an agency that picks a dark navy would get a
   navy page, not a navy brand. Ink on the accent is measured, never assumed.

7. **Never tell a buyer their request arrived unless it did.** `requestViewing`
   returns `filed` or `handoff`, and the confirmation copy differs — one
   promises a reply, the other promises nothing and hands over a prepared
   WhatsApp message instead. The static build shipped `action="#"` with an
   in-place "Requested." and that was a lie the buyer could not detect, on the
   one screen the subscription depends on. If you add a second lead path, it
   gets the same two-outcome treatment; a spinner that resolves to a
   reassuring sentence is not a delivery mechanism.

8. **Three route groups, three root layouts.** `(marketing)`, `(dashboard)`,
   `(storefront)`. The design system keys off `body.app` and `body.storefront`,
   and only a root layout can set the body class. Route groups are invisible in
   the URL, so `/dash` is still `/dash`. The theme script runs on the dashboard
   only — a storefront is a fixed light world, and a buyer's OS dark-mode
   preference must not repaint a seller's brand.

---

## Traps already paid for

- **Next 16 renamed `middleware.ts` to `proxy.ts`** and renamed the export.
  `npm run dev` writes an `AGENTS.md` telling you to read
  `node_modules/next/dist/docs/` before assuming anything. It is right.
- **App Router treats `_folder` as private** and excludes it from routing. The
  first version of `proxy.ts` rewrote storefronts to `/_store/<host>`, which
  would have 404'd every tenant. It is `/s/<host>`.
- **`<html>` needs `suppressHydrationWarning`.** The pre-paint theme script
  stamps `data-theme` before React hydrates, so the two are *meant* to differ.
- **The browser console buffer survives navigation.** A fixed error keeps
  reappearing and looks unfixed. Open a fresh tab to confirm.
- **`npm i` may fail with `Cannot read properties of null (reading 'edgesOut')`.**
  Declare the dependency in `package.json`, delete `node_modules` and
  `package-lock.json`, then `npm install`.
- **The browser pane reports `clientWidth: 0` until you set a viewport.** Every
  `scrollWidth - clientWidth` reading is then a fake overflow — the unit page
  "overflowed" by 318px until `resize_window` ran. Measure `clientWidth` first
  and throw the reading away if it is zero.
- **`.st-head` and `.cta-bar` use `backdrop-filter`, which stalls the screenshot
  tool.** The page is fine; the capture times out at 5s. Inject
  `*{backdrop-filter:none!important}` before capturing, and remove it after.
- **`.visually-hidden` escapes a scroll container — and it bit again.** The
  booking radios are visually hidden inside `.slot-days`, which scrolls
  horizontally. Without `position: relative` on `.slot-day`, the absolutely
  positioned inputs resolved against the initial containing block and stretched
  the document 99px at 390px. Same trap as the listings table's 325px. Any new
  scroll container holding hidden labels needs a positioned box.
- **A `'use server'` module may only export async functions.** Exporting the
  action's initial-state const from `actions.ts` fails the build with
  "found object", and the message names the value rather than the rule. Types
  are fine (they are erased); values are not. State shapes live in
  `lib/queries/booking.ts` for exactly this reason.
- **Do not `redirect()` from a server action to a proxy-rewritten path.** It
  looks right and half-works: the action runs, the RSC request for the new URL
  returns 200, and the router never navigates — the URL stays put and nothing
  re-renders. Return the result and drive the view from `useActionState`, which
  also works before hydration and keeps the payload out of the address bar.
- **An unchecked radio omits its key from `FormData` entirely**, so a Zod
  `z.string()` on it reports the generic "Required" and your own message never
  runs. Make those fields optional with a default and let the domain check
  produce the wording.
- **React resets an uncontrolled form after its action returns.** A validation
  error therefore wipes everything typed unless the values come back in the
  action's state *and* the form is keyed so it remounts. On a lead-capture
  screen that reset is a lost sale, not a papercut.
- **The ⓘ was a dead button for two sessions.** `atoms.tsx` rendered the dot and
  a `hidden` body and nothing toggled them, so every hint in the app — the
  dashboard KPIs included — looked interactive and did nothing. It is a client
  component now (`components/ui/Hint.tsx`, re-exported from `atoms`). When you
  port a control the static build wires up in JavaScript, port the wiring too;
  the markup alone renders a lie.
- **`data-template` belongs on `<html>`, not on a div inside `<body>`.**
  `templates.css` says so in its own header, and the reason is one line in
  `store.css`: `body.storefront { background: var(--nile-paper) }`. Body
  resolves that token against `:root`, so a template block on any element
  *inside* body re-skins the cards and leaves the page behind them painted in
  the default template's ground. Every tenant got nile's warm cream under
  broker's cool grey cards — it looks nearly right, which is what makes it
  expensive to spot. The storefront root layout reads `x-am-host` (which
  `proxy.ts` sets) so it can resolve the tenant that high up; `storeForHost` is
  React-cached, so doing it there and again below is still one query.
- **Do not re-point `--font-serif` at next/font's variable.** It is tempting —
  it adds the metric-matched fallback — but an inline style on `<body>` outranks
  every `[data-template]` block, and six of the ten templates choose a different
  display face on purpose. next/font registers the face under its literal name,
  so `store.css`'s own `Newsreader, Georgia, serif` already resolves to the
  self-hosted copy. Check a template's face with
  `getComputedStyle(el).fontFamily`, not `document.fonts.check()` — that
  defaults to weight 400 and reports `false` for a page using only 500 and 600.
- **A component that renders a `position: fixed` bar can live anywhere in the
  tree.** The sticky phone bar is rendered *by* `PlanCalculator` precisely so
  its monthly figure and the sliders share one state. Rendering it from the page
  instead — the obvious structure — left two different instalments on screen at
  once, which is the exact failure `lib/pricing.ts` exists to prevent.

---

## Next, in the order that unblocks the most

1. **A Postgres URL — and nothing else.** Neon or Supabase free tier, five
   minutes. Everything downstream of it is written and waiting:

   ```
   DATABASE_URL="postgresql://…"    in web/.env
   npm run db:push                  creates the tables
   npm run db:seed                  writes both agencies, 12 units, media, collections, people
   ```

   `prisma/seed.ts` is idempotent (upsert on store slug, store+reference,
   store+collection slug), so re-running corrects drift rather than doubling an
   inventory, and it never deletes — a unit added by hand survives it.

   **The test is that nothing changes.** The screens are built from the same data
   the seed writes, so if a page looks different after seeding, the mock and the
   schema disagreed and the seed is where that shows.

   Then convert the reads. `listUnits`, `getUnit` and `getUnitByRef` are already
   async and `orMock` already exists, so each is a Prisma `where` plus the mapper
   in `lib/queries/unit-map.ts`. The synchronous helpers — `unitsForStore`,
   `zonesFor`, `compoundsFor` — have about twenty call sites and have to go async
   together; do that in the session that first runs `db push`, not before, or it
   is untested query code that looks finished.
2. **Auth.** Real decision to make first: phone-OTP matters more than email in
   this market, which rules out some providers' cheap tiers.
3. **Writes, in the order an agent notices them missing.** Stage changes are
   done; Assign, Add task and the task checkboxes are not, and each needs the
   same saved/unsaved treatment the stepper has. Then the audit log the schema
   already models.

4. **Port the remaining screens.** Collections is the other one the dashboard
   obviously lacks. On the storefront, `/compounds`, `/team` and `/compare`
   still 404 from the header, and `store/search.html`'s map and compare halves
   are still missing from `/units`.

   The unit page already proved what it was there to prove: **EGP 79,219** is
   what the listings table, the listing editor and the buyer's calculator all
   say for AM-1042, from one `computePlan` and three callers.

---

## House style

Inherited from the static build and still binding:

- Never write a hex value in a component. Paint from the semantic roles in
  `app/styles/tokens.css` (`--panel`, `--rule`, `--text`, `--accent`).
- Logical properties only — `padding-inline`, `inset-inline-start`. That is what
  makes `dir="rtl"` work with no second stylesheet.
- Every photo is a hatched `.ph` placeholder labelled with what belongs there.
  There are no real images in this project by design.
- Western digits always, even in Arabic copy. Egyptian market convention.
- Derive every total; never author one. A hand-written figure in the static
  build read "9 deals worth EGP 104,700,000" and was wrong from the first
  commit — only the computed version caught it.
