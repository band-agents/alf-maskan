import type { Metadata } from 'next';
import Link from 'next/link';
import { fontVars } from '@/lib/fonts';
import { PENDING } from '@/lib/routes';

import './styles/tokens.css';
import './styles/fonts.css';
import './styles/alf-maskan.css';

/**
 * The 404 for any URL that matches no route at all.
 *
 * It has to exist as `global-not-found` rather than `not-found` because this
 * app has three root layouts — (marketing), (dashboard), (storefront) — so an
 * unmatched URL belongs to none of them and Next has no layout to compose a
 * 404 from. That is the documented case for this file, and it is why it renders
 * its own <html> and <body>.
 *
 * It is also the honest place to say what is going on. A third of this product
 * is ported; the rest is a finished static page waiting to be moved across. A
 * blank "This page could not be found" makes that look like a broken deploy.
 * Naming the screen and saying it is coming is the difference between
 * unfinished and broken, and only one of those is true.
 */

export const metadata: Metadata = {
  title: 'Not here — Alf Maskan',
  description: 'That page does not exist, or has not been built yet.',
};

export default function GlobalNotFound() {
  const soon = Object.values(PENDING);

  return (
    <html lang="en" dir="ltr" className={fontVars}>
      <body style={{ background: 'var(--bg)', color: 'var(--text-2)', margin: 0 }}>
        <main
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 20,
            maxWidth: 620,
            marginInline: 'auto',
            padding: '48px 24px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--t-pico)',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--text-4)',
            }}
          >
            404 · not here
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 40px)',
              lineHeight: 1.15,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-.02em',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            This page has not been built yet
          </h1>

          <p style={{ fontSize: 'var(--t-body)', lineHeight: 1.65, color: 'var(--text-3)', margin: 0 }}>
            Alf Maskan is mid-port: the design and the static build are finished, and the screens
            are being moved across one at a time. If you followed a link from the sidebar, that is
            what happened — it is not broken, it is not here yet.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
            <Link className="btn btn--go" href="/dash">Dashboard</Link>
            <Link className="btn btn--app" href="/dash/listings">Listings</Link>
            <Link className="btn btn--app" href="/dash/leads">Leads</Link>
            <Link className="btn btn--app" href="/">Marketing site</Link>
          </div>

          <p
            style={{
              fontSize: 'var(--t-micro)',
              lineHeight: 1.7,
              color: 'var(--text-4)',
              borderTop: '1px solid var(--rule)',
              paddingTop: 16,
              margin: 0,
            }}
          >
            <b style={{ color: 'var(--text-3)', fontWeight: 600 }}>Still to come:</b>{' '}
            {soon.join(' · ')}.
          </p>
        </main>
      </body>
    </html>
  );
}
