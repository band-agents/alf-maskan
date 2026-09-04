import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Tenant resolution.
 *
 * Three kinds of host reach this app and they must not be confused:
 *
 *   app.alfmaskan.com          the dashboard the agency logs into
 *   alfmaskan.com              the marketing site we sell from
 *   kamal-estates.alfmaskan.com  a tenant storefront, by slug
 *   kamalestates.com             the same storefront, on the tenant's own domain
 *
 * Everything except the first two is a storefront. Rather than let every page
 * re-derive that, this rewrites storefront traffic under /s/<host> and
 * puts the resolved identity in a header, so a route handler reads one value
 * and never parses a hostname itself.
 *
 * Note for anyone arriving from Next 15 or earlier: this file is `proxy.ts`,
 * not `middleware.ts`. Next 16 renamed the convention and the exported
 * function. The behaviour is otherwise unchanged.
 */

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'alfmaskan.com';
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? `app.${ROOT}`;

/** Strip the port so localhost:3000 and a preview host behave alike. */
function hostnameOf(request: NextRequest): string {
  const raw = request.headers.get('host') ?? '';
  return raw.split(':')[0].toLowerCase();
}

type Target =
  | { kind: 'app' }
  | { kind: 'marketing' }
  | { kind: 'store'; slug: string | null; customDomain: string | null };

export function resolveTarget(hostname: string): Target {
  if (hostname === APP_HOST) return { kind: 'app' };

  // Local development: app.localhost is the dashboard, <slug>.localhost is a
  // storefront, bare localhost is the marketing site. Wildcard DNS is not
  // needed because browsers resolve *.localhost themselves.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { kind: 'marketing' };
  }
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub === 'app'
      ? { kind: 'app' }
      : { kind: 'store', slug: sub, customDomain: null };
  }

  if (hostname === ROOT || hostname === `www.${ROOT}`) return { kind: 'marketing' };

  if (hostname.endsWith(`.${ROOT}`)) {
    const slug = hostname.slice(0, -(ROOT.length + 1));
    return { kind: 'store', slug, customDomain: null };
  }

  // Anything else is a domain a tenant pointed at us. The slug is unknown here
  // — proxy runs at the edge with no database — so the lookup happens in the
  // route, which is why the hostname travels with the request.
  return { kind: 'store', slug: null, customDomain: hostname };
}

export function proxy(request: NextRequest) {
  const hostname = hostnameOf(request);
  const target = resolveTarget(hostname);
  const url = request.nextUrl.clone();

  const headers = new Headers(request.headers);
  headers.set('x-am-host', hostname);
  headers.set('x-am-target', target.kind);

  if (target.kind === 'store') {
    if (target.slug) headers.set('x-am-store-slug', target.slug);
    if (target.customDomain) headers.set('x-am-store-domain', target.customDomain);

    // A storefront's own paths are its own. /units/am-1042 on a tenant host is
    // that tenant's unit, not a route in the marketing site.
    // NOT /_store — a folder starting with an underscore is a *private folder*
    // in the App Router and is excluded from routing entirely, so that rewrite
    // would 404 every storefront. The host travels in the path so a route can
    // resolve the tenant without re-reading headers.
    url.pathname = `/s/${hostname}${url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (target.kind === 'app') {
    url.pathname = `/dash${url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next's own assets and the files a crawler asks for by
  // exact name. Those are served the same whichever host asked.
  matcher: ['/((?!_next/|api/health|favicon.ico|robots.txt|sitemap.xml).*)'],
};
