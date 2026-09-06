/**
 * The navigation registry, checked against the filesystem.
 *
 * `lib/routes.ts` decides whether a nav item renders as a link or as dimmed
 * "Soon" text, and it is a hand-kept list — which means it goes stale in the
 * one direction nobody notices. A page lands, its PENDING entry is forgotten,
 * and the product keeps telling agencies that a screen they can already use is
 * still coming. Nothing breaks, so nothing reports it.
 *
 * So both directions are checked here: every BUILT path must have a page on
 * disk, and every PENDING path must not. Run it with `npx tsx routes.test.mts`.
 */
import { existsSync } from 'node:fs';
import { BUILT, PENDING, isBuilt } from './lib/routes.js';

/** Where a link's path lives in the App Router. Storefront paths are relative
 *  to a tenant host, so they resolve under the [host] segment. */
function pageFor(path: string): string {
  if (path === '/') return 'app/(marketing)/page.tsx';
  if (path === '/dash' || path.startsWith('/dash/')) return `app/(dashboard)${path}/page.tsx`;
  return `app/(storefront)/s/[host]${path}/page.tsx`;
}

let failed = 0;
function check(ok: boolean, label: string, why: string) {
  console.log(`${ok ? '  ok  ' : '  FAIL'}  ${label.padEnd(34)} ${why}`);
  if (!ok) failed++;
}

console.log('BUILT — must exist on disk');
for (const path of [...BUILT].sort()) {
  const file = pageFor(path);
  check(existsSync(file), path, file);
}

console.log('\nPENDING — must not exist on disk');
for (const path of Object.keys(PENDING).sort()) {
  const file = pageFor(path);
  check(!existsSync(file), path, existsSync(file) ? `${file} EXISTS — drop it from PENDING` : 'not built');
}

console.log('\nno path is both built and pending');
for (const path of Object.keys(PENDING)) {
  check(!BUILT.has(path), path, BUILT.has(path) ? 'in BUILT and PENDING at once' : 'listed once');
}

console.log('\ndynamic segments');
const DYNAMIC: [string, boolean, string][] = [
  ['/dash/listings/am-1038', true, 'a listing id is a real page'],
  ['/dash/listings/new', false, 'except "new", which is the pending create screen'],
  ['/units/am-1042', true, "a unit reference is the buyer's page"],
  ['/dash/listings?view=live', true, 'a query string does not change the destination'],
  ['/dash/analytics', false, 'an unbuilt screen stays unbuilt'],
];
for (const [href, expected, why] of DYNAMIC) {
  check(isBuilt(href) === expected, href, why);
}

console.log(failed === 0 ? '\nnavigation matches the filesystem' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
