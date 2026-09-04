import { headers } from 'next/headers';
import { storeForHost } from '@/lib/tenant';
import { brandFor } from '@/lib/brand';
import { storeFontVars } from '@/lib/fonts';

import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/alf-maskan.css';
import '../styles/store.css';
import '../styles/templates.css';

/**
 * Root layout for every tenant storefront. Deliberately no theme script: a
 * buyer's OS dark-mode preference must not repaint a seller's brand.
 *
 * The tenant is resolved *here*, not only in the nested `[host]` layout,
 * because `data-template` has to sit on `<html>`. `templates.css` says so in
 * its own header — "set data-template on the storefront root and the whole page
 * re-skins" — and the reason is `body.storefront { background: var(--nile-paper) }`:
 * body resolves that token against `:root`, so a template block on any element
 * *inside* body re-colours the cards and leaves the page behind them painted in
 * whatever the default template happened to be. It looks nearly right, which is
 * what makes it worth a comment.
 *
 * `storeForHost` is wrapped in React's `cache`, so resolving here and again
 * below is one query per request, not two.
 */
export default async function StorefrontRootLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts puts the original hostname here precisely so a route never has to
  // parse one itself.
  const host = (await headers()).get('x-am-host') ?? '';
  const store = await storeForHost(host);
  const brand = brandFor(store?.brandHex);

  // Two things combine, and the split is the product: the **template** sets the
  // shape — ground, ink, rules, radius, display face — and the **agency** sets
  // the colour. Ten templates, and no two agencies looking like one company.
  const skin: React.CSSProperties | undefined = brand.accent
    ? ({ '--tpl-accent': brand.accent, '--tpl-on-accent': brand.ink } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang={store?.storeLangs === 'AR' ? 'ar' : 'en'}
      dir={store?.storeLangs === 'AR' ? 'rtl' : 'ltr'}
      className={storeFontVars}
      data-template={store?.template}
      data-branded={brand.accent ? '' : undefined}
      style={skin}
    >
      {/* No --font-serif override here, deliberately. next/font registers the
          face under its literal name, so store.css's own `Newsreader, Georgia,
          serif` already resolves to the self-hosted copy. Re-pointing the token
          at next/font's variable would add the metric-matched fallback — but it
          would also outrank every [data-template] block, and six of the ten
          templates pick a different display face on purpose. One small load
          shift is worth less than five templates that stop looking like
          themselves. */}
      <body className="storefront">
        {/* Scoped to branded storefronts so the ten templates keep their own
            defaults untouched. These are the only elements that put text ON the
            accent, and `brandFor` has already measured whether white survives
            there — a light-gold logo would otherwise ship an unreadable
            "WhatsApp us" button. */}
        {brand.accent && (
          <style>{`[data-branded] .st-btn--primary,[data-branded] .st-wa,[data-branded] .hero-search__go,[data-branded] .sfhero__btn,[data-branded] .st-announce{color:var(--tpl-on-accent)}`}</style>
        )}
        {children}
      </body>
    </html>
  );
}
