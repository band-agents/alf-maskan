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
- `<slug>.localhost:3000` — a tenant storefront

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

## What is not

- **No database.** `DATABASE_URL` in `.env` points at a localhost Postgres that
  does not exist. Nothing has run `prisma db push`. `/s/[host]` will throw,
  because resolving a tenant is a query.
- **No auth.** Nobody logs in; the dashboard assumes one hard-coded store.
- **No writes.** The editor's Publish button sets a flag and nothing else.
- 36 of the static build's 41 pages are not ported yet.

---

## Five decisions you should not undo without a reason

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

5. **Three route groups, three root layouts.** `(marketing)`, `(dashboard)`,
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

---

## Next, in the order that unblocks the most

1. **A Postgres URL.** Neon or Supabase free tier, five minutes. Then
   `npx prisma db push`, write `prisma/seed.ts` from `lib/queries/units.ts`'s
   mock array, and swap `listUnits` to a real query. Everything above it is
   already the right shape.
2. **Auth.** Real decision to make first: phone-OTP matters more than email in
   this market, which rules out some providers' cheap tiers.
3. **Port the remaining screens.** Leads inbox and collections are the two the
   dashboard most obviously lacks; the storefront unit page is the first real
   proof that an agent and a buyer see the same instalment.
4. **Writes.** Server actions, then the audit log the schema already models.

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
