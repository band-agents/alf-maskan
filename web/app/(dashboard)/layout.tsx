import type { Metadata } from 'next';
import { fontVars, THEME_SCRIPT } from '@/lib/fonts';

import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/alf-maskan.css';
import '../styles/dashboard.css';
import '../styles/app.css';
import '../styles/editor.css';
import '../styles/crm.css';
import '../styles/reports.css';
import '../styles/admin.css';

export const metadata: Metadata = { title: 'Dashboard — Alf Maskan' };

/**
 * Root layout for the dashboard. Its own <html>/<body> is the whole reason the
 * three surfaces are route groups: the design system keys off `body.app`, and
 * only a root layout can set that. Route groups are invisible in the URL, so
 * this is still /dash.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is load-bearing, not a paper-over: the theme
    // script below deliberately stamps data-theme on <html> before React
    // hydrates, so server and client HTML are *meant* to differ on that one
    // attribute. Without this React logs a mismatch on every dashboard load.
    <html lang="en" dir="ltr" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="app">{children}</body>
    </html>
  );
}
