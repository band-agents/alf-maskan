import type { Metadata } from 'next';
import { fontVars, THEME_SCRIPT } from '@/lib/fonts';

import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/alf-maskan.css';
import '../styles/dashboard.css';
import '../styles/app.css';
import '../styles/editor.css';
import '../styles/builder.css';
import '../styles/store.css';
import '../styles/templates.css';

export const metadata: Metadata = { title: 'Storefront builder — Alf Maskan' };

/**
 * A fourth root layout, for the builder alone.
 *
 * Every other dashboard screen sits inside the rail and topbar. The builder
 * replaces them: it is full-bleed chrome around a canvas, and wrapping it in
 * the shell would give an agency two navigations and half the screen. A
 * separate route group is the only way to opt out of a layout in the App
 * Router, and the group is invisible in the URL, so this is still /dash/builder.
 *
 * suppressHydrationWarning for the same reason as the dashboard: the theme
 * script stamps <html> before React hydrates, deliberately.
 */
export default function BuilderRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="app">{children}</body>
    </html>
  );
}
