import { fontVars } from '@/lib/fonts';

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
    <html lang="en" dir="ltr" className={fontVars}>
      <body className="storefront">{children}</body>
    </html>
  );
}
