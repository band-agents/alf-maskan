import { storeFontVars } from '@/lib/fonts';

import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/alf-maskan.css';
import '../styles/store.css';
import '../styles/templates.css';

/**
 * Root layout for every tenant storefront. Deliberately no theme script: a
 * buyer's OS dark-mode preference must not repaint a seller's brand.
 */
export default function StorefrontRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={storeFontVars}>
      {/* store.css names Newsreader literally, which next/font does still answer
          to — but only the literal face. Pointing the token at next/font's own
          variable adds "Newsreader Fallback", the metric-matched stand-in that
          holds the layout still while the real face loads; the literal name
          falls straight through to Georgia and reflows. It goes on <body>, not
          :root, because store.css loads after fonts.css and wins on :root. */}
      <body
        className="storefront"
        style={{ '--font-serif': 'var(--f-serif), Georgia, "Times New Roman", serif' } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
