'use client';

import Link from 'next/link';
import { isBuilt } from '@/lib/routes';
import { usePathname } from 'next/navigation';

/**
 * The dashboard sidebar. 264px, collapsing to a 72px icon rail; below 900px it
 * becomes an off-canvas drawer, which dashboard.css already handles — this
 * component only has to produce the same markup the static build did.
 *
 * The active item is derived from the pathname rather than passed in, so no
 * page can forget to say where it is.
 */

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: string;
  badge?: string;
  sub?: { href: string; label: string }[];
};

const NAV: Item[] = [
  {
    href: '/dash',
    label: 'Home',
    icon: (
      <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden="true">
        <path d="M1 7l8-6 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 8.5V15a1 1 0 001 1h10a1 1 0 001-1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dash/listings',
    label: 'Listings',
    count: '42',
    icon: (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
        <path d="M1 1.75h16M1 7h16M1 12.25h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    sub: [
      { href: '/dash/listings', label: 'All units' },
      { href: '/dash/collections', label: 'Collections' },
    ],
  },
  {
    href: '/dash/leads',
    label: 'Leads',
    badge: '7',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
        <path d="M1.75 1.75h13.5v9.5a1 1 0 01-1 1H5l-3.25 3.25V1.75z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dash/builder',
    label: 'Storefront',
    icon: (
      <svg width="18" height="15" viewBox="0 0 18 15" fill="none" aria-hidden="true">
        <rect x=".75" y=".75" width="16.5" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M.75 5h16.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/dash/marketing',
    label: 'Marketing',
    icon: (
      <svg width="17" height="15" viewBox="0 0 17 15" fill="none" aria-hidden="true">
        <path d="M1.5 5.5h3l8-4v12l-8-4h-3a1 1 0 01-1-1v-2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dash/analytics',
    label: 'Analytics',
    icon: (
      <svg width="17" height="16" viewBox="0 0 17 16" fill="none" aria-hidden="true">
        <rect x="1" y="8" width="3.5" height="7" rx="1.25" fill="currentColor" />
        <rect x="6.75" y="2" width="3.5" height="13" rx="1.25" fill="currentColor" />
        <rect x="12.5" y="5" width="3.5" height="10" rx="1.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/dash/team',
    label: 'Team',
    icon: (
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/dash/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.25" fill="currentColor" />
      </svg>
    ),
  },
];

function Soon({ label }: { label: string }) {
  return (
    <span aria-disabled="true" style={{ opacity: 0.5, cursor: 'default' }}>
      {label} <span className="nav-count">Soon</span>
    </span>
  );
}

export function AppRail({ storeName }: { storeName: string }) {
  const pathname = usePathname();

  // Longest match wins, so /dash/listings does not also light up /dash.
  const activeHref = NAV.map((i) => i.href)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <aside className="rail" id="rail">
      <div className="rail__head">
        <Link className="rail__brand" href="/">
          <svg className="mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
            <rect className="mark__plate" width="32" height="32" rx="10" />
            <path className="mark__arch" d="M7 30V19a9 9 0 0 1 18 0v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" />
            <rect className="mark__bar" x="9.5" y="23" width="3" height="5" rx="1" />
            <rect className="mark__bar" x="14.5" y="20" width="3" height="8" rx="1" />
            <rect className="mark__bar mark__bar--accent" x="19.5" y="16" width="3" height="12" rx="1" />
          </svg>
          <span className="brand__word">Alf Maskan</span>
        </Link>
      </div>

      <nav className="rail__nav" aria-label="Dashboard">
        {NAV.map((item) =>
          item.sub ? (
            <details className="nav-group" key={item.href} open={activeHref === item.href}>
              <summary className="nav-item" {...(activeHref === item.href ? { 'aria-current': 'page' as const } : {})}>
                <span className="nav-item__icon">{item.icon}</span>
                <span className="nav-item__label">{item.label}</span>
                {item.count && <span className="nav-count">{item.count}</span>}
                <svg className="nav-caret" width="8" height="8" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="nav-sub">
                {item.sub.map((s) =>
                  isBuilt(s.href) ? (
                    <Link key={s.href} href={s.href}>
                      {s.label}
                    </Link>
                  ) : (
                    <Soon key={s.href} label={s.label} />
                  )
                )}
              </div>
            </details>
          ) : !isBuilt(item.href) ? (
            // Not a link. The shape of the product is worth showing — an agency
             // should see that Analytics is coming — but a dead link that lands
             // on a 404 reads as broken rather than unfinished.
            <span className="nav-item" key={item.href} aria-disabled="true" style={{ opacity: 0.5, cursor: 'default' }}>
              <span className="nav-item__icon">{item.icon}</span>
              <span className="nav-item__label">{item.label}</span>
              <span className="nav-count">Soon</span>
            </span>
          ) : (
            <Link
              className="nav-item"
              key={item.href}
              href={item.href}
              {...(activeHref === item.href ? { 'aria-current': 'page' as const } : {})}
            >
              <span className="nav-item__icon">{item.icon}</span>
              <span className="nav-item__label">{item.label}</span>
              {item.count && <span className="nav-count">{item.count}</span>}
              {item.badge && (
                <span className="nav-badge">
                  {item.badge}
                  <span className="visually-hidden"> unanswered</span>
                </span>
              )}
            </Link>
          )
        )}
      </nav>

      <div className="rail__foot">
        <button className="workspace" type="button">
          <span className="workspace__avatar">
            {storeName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </span>
          <span className="workspace__meta">
            <b>{storeName}</b>
            <span>2 stores</span>
          </span>
          <svg width="9" height="14" viewBox="0 0 10 16" aria-hidden="true">
            <path d="M2 6l3-3 3 3M2 10l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
          </svg>
        </button>
        <div className="rail__plan">
          <Link className="plan-pill" href="/dash/billing">
            Pro · EGP 990/mo
          </Link>
          <Link className="help-dot" href="/dash/help" aria-label="Help and support">
            ?
          </Link>
        </div>
      </div>
    </aside>
  );
}
