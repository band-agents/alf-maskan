'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isBuilt } from '@/lib/routes';
import { Mark } from './Mark';

const LINKS: { href: string; label: string }[] = [
  { href: '/#features', label: 'Features' },
  { href: '/templates', label: 'Templates' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'Resources' },
];

/**
 * The marketing header.
 *
 * The static build's nav sells a finished product: Templates, Pricing, Sign in
 * and a trial button. Three of those pages are not ported, so they go through
 * the same gate the dashboard rail uses rather than becoming 404s on the page
 * that is supposed to make the first impression.
 *
 * The trial button is the exception, and it is a judgement call: a marketing
 * page whose only call to action is dimmed has no call to action. Signup does
 * not exist, but the dashboard does and it is the better demonstration anyway,
 * so the button points there and says so.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`site-nav${open ? ' is-open' : ''}`} id="siteNav">
      <div className="wrap site-nav__inner">
        <Link className="brand" href="/">
          <Mark />
          <span className="brand__word">Alf Maskan</span>
        </Link>

        {/* An in-page link closes the menu, which is the whole reason the
            handler sits on the container rather than on each anchor. */}
        <nav className="nav-links" aria-label="Main" onClick={() => setOpen(false)}>
          {LINKS.map((l) =>
            isBuilt(l.href) ? (
              <Link className="nav-link" key={l.href} href={l.href}>
                {l.label}
              </Link>
            ) : (
              <span
                className="nav-link"
                key={l.href}
                aria-disabled="true"
                title="Not built yet"
                style={{ opacity: 0.45, cursor: 'default' }}
              >
                {l.label}
              </span>
            )
          )}
        </nav>

        <div className="nav-end">
          {/* EN is the page you are on, and Arabic is not ported — the static
              build's /ar/ pages have no Next route yet. Both are href-less
              anchors: `.lang a` is styled by tag, and a link to the page you
              are already on is not a link. */}
          <div className="lang">
            <a lang="en" hrefLang="en" aria-current="true">EN</a>
            <a
              lang="ar"
              hrefLang="ar"
              aria-disabled="true"
              title="The Arabic site is not ported yet"
              style={{ opacity: 0.45, cursor: 'default' }}
            >
              ع
            </a>
          </div>
          <Link className="btn btn--sm btn--primary" href="/dash">
            Open the dashboard
          </Link>
        </div>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="siteNav"
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <span className="visually-hidden">Menu</span>
        </button>
      </div>
    </header>
  );
}
