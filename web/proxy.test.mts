/**
 * Host routing, checked rather than assumed.
 *
 * Every one of these is a real address this product answers on, and getting one
 * wrong fails silently: a tenant's storefront becomes the marketing site, or a
 * fresh deployment 404s on every path. Run it with `npx tsx proxy.test.ts`.
 *
 * `resolveTarget` reads its env at module load, so the Vercel variables are set
 * before the import below — which is why this is a dynamic import.
 */
process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'alfmaskan.com';
process.env.NEXT_PUBLIC_APP_HOST = 'app.alfmaskan.com';
process.env.VERCEL_PROJECT_PRODUCTION_URL = 'alf-maskan.vercel.app';
process.env.VERCEL_URL = 'alf-maskan-git-main-dan.vercel.app';

const { resolveTarget } = await import('./proxy');

type Expected = 'app' | 'marketing' | { store: string | null };

const CASES: [string, Expected, string][] = [
  ['localhost', 'marketing', 'bare localhost is the marketing site'],
  ['127.0.0.1', 'marketing', 'and so is the loopback address'],
  ['app.localhost', 'app', 'app.localhost is the dashboard in development'],
  ['kamal-estates.localhost', { store: 'kamal-estates' }, 'a slug subdomain is that tenant'],
  ['alfmaskan.com', 'marketing', 'the apex sells the product'],
  ['www.alfmaskan.com', 'marketing', 'so does www'],
  ['app.alfmaskan.com', 'app', 'the configured app host is the dashboard'],
  ['kamal-estates.alfmaskan.com', { store: 'kamal-estates' }, 'the free storefront address'],
  ['kamalestates.com', { store: null }, "a tenant's own domain, slug unknown until the lookup"],
  // The two that were 404ing every path before DEPLOY_HOSTS existed.
  ['alf-maskan.vercel.app', 'marketing', "the deployment's production URL is not a tenant"],
  ['alf-maskan-git-main-dan.vercel.app', 'marketing', 'nor is a preview URL'],
];

let failed = 0;
for (const [host, expected, why] of CASES) {
  const got = resolveTarget(host);
  const ok =
    typeof expected === 'string'
      ? got.kind === expected
      : got.kind === 'store' && got.slug === expected.store;

  const shown = got.kind === 'store' ? `store(slug=${got.slug ?? 'null'})` : got.kind;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${host.padEnd(34)} → ${shown.padEnd(22)} ${why}`);
  if (!ok) failed++;
}

console.log(failed === 0 ? `\n${CASES.length} routes correct` : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
