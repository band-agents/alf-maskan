# Deploying Alf Maskan to Vercel

The repository holds two things. `src/`, `assets/` and `build.js` are the
41-page static build, which is the **specification** — it is not deployed.
`web/` is the Next.js application, and it is the only thing Vercel should look
at.

---

## 1. Import the repository

**Set Root Directory to `web`.** This is the one setting that is not optional
and not guessable: Vercel scans the repository root, finds no `package.json`
there, and either fails or builds the wrong thing.

Everything else can stay on its default — the framework is detected as Next.js,
the build command is `next build`, the output is handled for you.

`package.json` carries a `postinstall: prisma generate`. Leave it. Vercel
caches `node_modules` and Prisma's generated client lives inside it, so without
that hook a cold install builds against a client that was never generated and
fails with *"Prisma Client did not initialize yet"*.

---

## 2. Environment variables

| Variable | Needed | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_ROOT_DOMAIN` | once you own a domain | The apex the free storefront addresses hang off — `<slug>.alfmaskan.com`. Defaults to `alfmaskan.com`. |
| `NEXT_PUBLIC_APP_HOST` | once you own a domain | Where the dashboard lives. Defaults to `app.<root>`. |
| `DATABASE_URL` | when you have Postgres | Until then, leave it unset. See below. |
| `PAYMOB_*`, `S3_*` | not yet | Nothing reads them; they are in `.env.example` as a record of what is coming. |

`.env` is git-ignored and has never been committed. `.env.example` holds
placeholders only.

---

## 3. It deploys without a database, on purpose

`DATABASE_URL` currently points at a Postgres nobody has started, and on Vercel
it will simply be unset. That is a supported state, not an accident:

- `new PrismaClient()` does not throw when the variable is missing — the first
  *query* does, as `PrismaClientInitializationError`.
- `orMock` in `web/lib/db.ts` catches that, and only that, and serves
  `web/lib/mock.ts` instead. It warns once per process in the logs.
- A malformed query or a missing column still throws as itself. The fallback is
  deliberately narrow, because one that swallowed real errors would turn every
  bug into "the page renders, with the wrong data".

So the first deploy is a working demonstration on seeded data: two tenants,
both storefronts, the dashboard, the leads inbox. The one thing that changes
behaviour is `/contact` — a viewing request cannot be filed, so it takes the
**handoff** branch and hands the buyer a prepared WhatsApp message instead of
promising a reply nobody recorded. That is the honest outcome, and it still
delivers the lead.

When Postgres arrives: set `DATABASE_URL`, then `npm run db:push` and
`npm run db:seed`. The seed is written and idempotent — it writes both agencies,
their people, twelve units with media, and their collections. The screens should
not change, because they are built from the same data.

---

## 4. Hostnames

The product is multi-tenant by hostname. `web/proxy.ts` resolves every request
before it reaches a route, and `web/proxy.test.mts` checks all eleven cases —
run `npx tsx proxy.test.mts` after touching it.

| Host | Serves |
| --- | --- |
| `alfmaskan.com`, `www.alfmaskan.com` | the marketing site |
| `app.alfmaskan.com` | the dashboard |
| `kamal-estates.alfmaskan.com` | that tenant's storefront |
| `kamalestates.com` | the same storefront on the tenant's own domain, once the `Domain` row is `VERIFIED` |
| `*.vercel.app` | the marketing site |

That last row matters on day one. A `vercel.app` address is not a tenant, and
before it was handled explicitly the final branch treated it as somebody's
custom domain, looked for a `Domain` row that cannot exist, and 404'd every
path on a brand new deployment.

### Seeing a storefront before you own a domain

Storefronts need a wildcard domain (`*.alfmaskan.com` pointed at Vercel), which
`.vercel.app` will not give you. Until then, reach one directly through the
route the proxy rewrites to:

```
https://<your-deployment>.vercel.app/s/kamal-estates.alfmaskan.com
https://<your-deployment>.vercel.app/s/kamal-estates.alfmaskan.com/units/AM-1042
https://<your-deployment>.vercel.app/s/el-masria.alfmaskan.com
```

Everything works there — the second address is the one to open first, because
two tenants rendering as different companies from one codebase is the product.

### When you do own the domain

In Vercel → Domains, add:

- `alfmaskan.com` and `www.alfmaskan.com`
- `app.alfmaskan.com`
- `*.alfmaskan.com` — the wildcard, which is what makes every tenant's free
  address resolve without adding a DNS record per customer

Then set `NEXT_PUBLIC_ROOT_DOMAIN` and `NEXT_PUBLIC_APP_HOST` and redeploy.

---

## 5. Before you point real customers at it

Not blockers for a deploy; blockers for a paying agency.

- **No authentication.** The dashboard assumes one hard-coded store
  (`mockStore.id`, one line in each page). Anyone with the URL sees it.
- **Almost no writes.** `requestViewing` and `setLeadStage` are the only two,
  and both report honestly when they cannot save.
- **No real photography.** Every image is a labelled placeholder, by design.
- 31 of the 41 static pages are not ported yet.

`web/HANDOFF.md` is the current, detailed version of all of this.
