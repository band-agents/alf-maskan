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
