/**
 * What is actually built.
 *
 * The dashboard rail and the storefront header were both written against the
 * finished product — nine nav items, five footer columns — while six of the
 * nine dashboard destinations and half the storefront's do not exist yet. Every
 * one of them was a link, so the most ordinary thing a person can do, clicking
 * the sidebar, dropped them on a bare 404. That reads as broken, not as
 * unfinished, and it is the first impression a deployment gives.
 *
 * So navigation asks this list first. A destination that is not here renders as
 * text with a "Soon" marker rather than a link: still visible, because the
 * shape of the product is worth showing, but not pretending to work.
 *
 * Delete an entry from `PENDING` the moment its page lands. The two lists are
 * checked against each other by `routes.test.mts`, so a route that exists and
 * is still marked pending fails the test rather than quietly staying dim.
 */

/** Live routes, by the path a link would use. */
export const BUILT = new Set([
  '/',
  '/dash',
  '/dash/leads',
  '/dash/listings',
  // storefront, relative to a tenant host
  '/units',
  '/contact',
]);

/** Everything navigation currently offers that is not built. Kept explicit
 *  rather than inferred, so adding a nav item to a page that does not exist is
 *  a deliberate act with a visible consequence. */
export const PENDING: Record<string, string> = {
  // marketing — the other four pages of the static build
  '/templates': 'Templates',
  '/pricing': 'Pricing',
  '/signup': 'Sign up',
  '/dash/collections': 'Collections',
  '/dash/deals': 'Pipeline board',
  '/dash/builder': 'Storefront builder',
  '/dash/marketing': 'Marketing',
  '/dash/analytics': 'Analytics',
  '/dash/team': 'Team',
  '/dash/settings': 'Settings',
  '/dash/billing': 'Billing',
  '/dash/help': 'Help',
  '/dash/notifications': 'Notifications',
  '/dash/listings/new': 'Add a listing',
  '/compounds': 'Compounds',
  '/team': 'Our team',
  '/compare': 'Compare units',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
};

/** A path with a dynamic segment is built if its pattern is. */
export function isBuilt(href: string): boolean {
  const path = href.split('?')[0].split('#')[0];
  if (BUILT.has(path)) return true;
  // /dash/listings/<id> and /units/<ref> are real pages.
  if (/^\/dash\/listings\/[^/]+$/.test(path)) return path !== '/dash/listings/new';
  if (/^\/units\/[^/]+$/.test(path)) return true;
  return false;
}
