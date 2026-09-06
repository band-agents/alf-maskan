/**
 * The addresses this product hands out, checked at each stage of a deploy.
 *
 * `proxy.test.mts` checks the way in — a hostname arrives, what serves it.
 * This is the way out: a slug is in hand, what URL reaches it. Both links these
 * feed are ones a person clicks and no test exercises, and both were literal
 * `http://localhost:3000` until recently, which is a dead link nobody sees
 * until it is in front of a customer.
 *
 * The failure mode is specifically that development looks correct. Every case
 * below is production; the values are captured at module load, so each scenario
 * imports a fresh copy. Run it with `npx tsx urls.test.mts`.
 */
type Env = Record<string, string | undefined>;

const BASE: Env = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_ROOT_DOMAIN: undefined,
  VERCEL_PROJECT_PRODUCTION_URL: undefined,
  VERCEL_URL: undefined,
  PORT: undefined,
};

let bust = 0;
async function load(env: Env) {
  for (const [k, v] of Object.entries({ ...BASE, ...env })) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import(`./lib/tenant.js?case=${bust++}`);
}

type Case = { name: string; env: Env; marketing: string; storefront: string };

const CASES: Case[] = [
  {
    name: 'local development',
    env: { NODE_ENV: 'development', NEXT_PUBLIC_ROOT_DOMAIN: 'alfmaskan.com' },
    marketing: 'http://localhost:3000',
    storefront: 'http://kamal-estates.localhost:3000',
    // A root domain is set in .env locally too, so this is the case that proves
    // the switch is NODE_ENV and not "is a domain configured".
  },
  {
    name: 'first Vercel deploy, no domain owned yet',
    env: { VERCEL_PROJECT_PRODUCTION_URL: 'alf-maskan.vercel.app' },
    marketing: 'https://alf-maskan.vercel.app',
    // No wildcard DNS exists, so the subdomain would not resolve. The rewrite
    // path does, from the very first deploy.
    storefront: 'https://alf-maskan.vercel.app/s/kamal-estates.alfmaskan.com',
  },
  {
    name: 'a preview deployment',
    env: { VERCEL_URL: 'alf-maskan-git-main-dan.vercel.app' },
    marketing: 'https://alf-maskan-git-main-dan.vercel.app',
    storefront: 'https://alf-maskan-git-main-dan.vercel.app/s/kamal-estates.alfmaskan.com',
  },
  {
    name: 'domain owned, wildcard pointed at Vercel',
    env: {
      NEXT_PUBLIC_ROOT_DOMAIN: 'alfmaskan.com',
      VERCEL_PROJECT_PRODUCTION_URL: 'alf-maskan.vercel.app',
    },
    // A configured root outranks the deployment host: once the wildcard exists,
    // the branded address is the one an agency should ever be shown.
    marketing: 'https://alfmaskan.com',
    storefront: 'https://kamal-estates.alfmaskan.com',
  },
];

let failed = 0;
function check(got: string, want: string, label: string) {
  const ok = got === want;
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${label.padEnd(12)} ${got}`);
  if (!ok) {
    console.log(`        expected ${want}`);
    failed++;
  }
}

for (const c of CASES) {
  const { marketingUrl, storefrontUrl } = await load(c.env);
  console.log(`\n${c.name}`);
  check(marketingUrl(), c.marketing, 'marketing');
  check(storefrontUrl('kamal-estates'), c.storefront, 'storefront');
}

console.log(
  failed === 0
    ? `\nevery address resolves at every stage of a deploy`
    : `\n${failed} FAILED`
);
process.exit(failed === 0 ? 0 : 1);
