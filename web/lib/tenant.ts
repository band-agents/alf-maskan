import { cache } from 'react';
import { db } from './db';

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
export const storeForHost = cache(async (host: string) => {
  const hostname = host.split(':')[0].toLowerCase();

  const slug =
    hostname.endsWith(`.${ROOT}`) ? hostname.slice(0, -(ROOT.length + 1))
    : hostname.endsWith('.localhost') ? hostname.slice(0, -'.localhost'.length)
    : null;

  if (slug && slug !== 'app' && slug !== 'www') {
    return db.store.findUnique({ where: { slug } });
  }

  const domain = await db.domain.findUnique({
    where: { hostname },
    include: { store: true },
  });

  return domain?.status === 'VERIFIED' ? domain.store : null;
});
