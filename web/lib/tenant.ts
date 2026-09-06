import { cache } from 'react';
import { db, orMock } from './db';
import { mockStores, type TenantStore } from './mock';

export type { TenantStore };

/** The columns a storefront route reads, and the only ones it is handed. */
const TENANT_FIELDS = {
  id: true, slug: true, nameEn: true, nameAr: true, brandHex: true,
  template: true, storeLangs: true, whatsapp: true, phone: true,
  email: true, address: true,
} as const;

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'alfmaskan.com';

/**
 * Where this product lives, as a browser can actually reach it.
 *
 * Two links were written as literal `http://localhost:3000`. The dashboard's
 * "View storefront" is the cheap one — an agency sees a dead link. The credit
 * in the storefront footer is not: it ships on the page an agency shows its own
 * customers, so in production every buyer got pointed at their own machine.
 *
 * The discriminator is NODE_ENV rather than whether a root domain is
 * configured, because .env sets one locally too — keying off its presence would
 * have sent `next dev` to https://alfmaskan.com.
 */
const DEV = process.env.NODE_ENV !== 'production';
const DEV_PORT = process.env.PORT ?? '3000';

/** Set only once a real domain is pointed at the deployment. Until then the
 *  `ROOT` default is an aspiration, not an address that resolves. */
const CONFIGURED_ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

/** The deployment's own hostname, which is the only thing that certainly
 *  answers before DNS exists. Server-only, and both callers are server
 *  components. */
const DEPLOY_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

/** The marketing site — what "Alf Maskan" links to from inside a tenant's page. */
export function marketingUrl(): string {
  if (DEV) return `http://localhost:${DEV_PORT}`;
  if (CONFIGURED_ROOT) return `https://${CONFIGURED_ROOT}`;
  if (DEPLOY_HOST) return `https://${DEPLOY_HOST}`;
  return `https://${ROOT}`;
}

/**
 * A tenant's storefront, at an address that actually answers today.
 *
 * The free subdomain needs a wildcard domain pointed at the deployment, which
 * a fresh Vercel project does not have — so linking to
 * `https://<slug>.alfmaskan.com` before that DNS exists is the same class of
 * dead link as the `localhost:3000` this replaced, just less obvious. Without a
 * configured root the link goes through the path the proxy rewrites to instead,
 * on the deployment's own host, which resolves from the first deploy.
 *
 * Custom domains are deliberately not used here: this address is always
 * available, where a tenant's own domain may still be unverified.
 */
export function storefrontUrl(slug: string): string {
  if (DEV) return `http://${slug}.localhost:${DEV_PORT}`;
  if (CONFIGURED_ROOT) return `https://${slug}.${CONFIGURED_ROOT}`;
  if (DEPLOY_HOST) return `https://${DEPLOY_HOST}/s/${slug}.${ROOT}`;
  return `https://${slug}.${ROOT}`;
}

/**
 * Turn a hostname into the store it belongs to.
 *
 * Two ways in, and the free subdomain is checked first because it is the one
 * that cannot be wrong: the slug is in the hostname. A custom domain needs a
 * lookup, and only counts once it is VERIFIED — otherwise anyone could point
 * their DNS at us and claim to be someone else's storefront.
 *
 * Wrapped in React's `cache` so a page, its layout and its metadata all share
 * one query per request rather than three.
 */
export const storeForHost = cache(async (host: string): Promise<TenantStore | null> => {
  const hostname = host.split(':')[0].toLowerCase();

  const slug =
    hostname.endsWith(`.${ROOT}`) ? hostname.slice(0, -(ROOT.length + 1))
    : hostname.endsWith('.localhost') ? hostname.slice(0, -'.localhost'.length)
    : null;

  if (slug && slug !== 'app' && slug !== 'www') {
    return orMock(
      () => db.store.findUnique({ where: { slug }, select: TENANT_FIELDS }),
      // Only a seeded slug resolves, so an unknown host still 404s rather than
      // every subdomain silently becoming whichever store happens to be first.
      () => mockStores.find((s) => s.slug === slug) ?? null
    );
  }

  const domain = await orMock(
    () => db.domain.findUnique({
      where: { hostname },
      select: { status: true, store: { select: TENANT_FIELDS } },
    }),
    () => null
  );

  return domain?.status === 'VERIFIED' ? domain.store : null;
});
