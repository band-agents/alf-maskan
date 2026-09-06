import Link from 'next/link';
import { isBuilt } from '@/lib/routes';
import { Mark } from './Mark';

/**
 * The marketing footer.
 *
 * Four of its five columns pointed at pages that do not exist — the static
 * build's `href="#"` placeholders and the templates and pricing pages that are
 * not ported. A footer full of links that go nowhere is the cheapest possible
 * way to look unfinished, so only the anchors into this page survive as links.
 * The rest keep their labels, dimmed, because the shape of the product is
 * still worth showing.
 */

const PRODUCT: [string, string][] = [
  ['/#builder', 'Storefront builder'],
  ['/#listings', 'Listings'],
  ['/#leads', 'Leads & WhatsApp'],
  ['/#team', 'Team & roles'],
  ['/pricing', 'Custom domain'],
];

const TEMPLATES = ['Luxury', 'Coastal', 'Portal', 'Single-project', 'Solo agent'];
const RESOURCES = ['Help centre', 'Listing photo guide', 'Zones & compounds', 'Broker blog', 'Status'];
const COMPANY = ['About', 'Careers', 'Contact', 'Terms', 'Privacy'];

/** Dimmed, inert, and honest about it. */
function Soon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-disabled="true" title="Not built yet" style={{ opacity: 0.45, cursor: 'default' }}>
      {children}
    </span>
  );
}

function Column({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <nav className="site-footer__col" aria-labelledby={id}>
      <h2 className="kicker" id={id}>{title}</h2>
      {items.map((label) => (
        <Soon key={label}>{label}</Soon>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__grid">
          <div className="site-footer__brandcol">
            <Link className="brand mark--dark" href="/">
              <Mark />
              <span className="brand__word">Alf Maskan</span>
            </Link>
            <p className="site-footer__about">
              Websites for Egyptian real-estate professionals. Built in Cairo.
            </p>
            <div className="social">
              <Soon>f</Soon>
              <Soon>in</Soon>
              <Soon>ig</Soon>
            </div>
          </div>

          <nav className="site-footer__col" aria-labelledby="ft-product">
            <h2 className="kicker" id="ft-product">Product</h2>
            {PRODUCT.map(([href, label]) =>
              isBuilt(href) ? (
                <Link key={label} href={href}>{label}</Link>
              ) : (
                <Soon key={label}>{label}</Soon>
              )
            )}
          </nav>

          <Column id="ft-templates" title="Templates" items={TEMPLATES} />
          <Column id="ft-resources" title="Resources" items={RESOURCES} />
          <Column id="ft-company" title="Company" items={COMPANY} />
        </div>

        <div className="site-footer__base">
          <p>
            © {new Date().getFullYear()} Alf Maskan · Nasr City, Cairo ·{' '}
            <a href="tel:+201002448817" dir="ltr">+20 100 244 8817</a>
          </p>
          <div className="row row-gap-14">
            <span className="micro" style={{ color: 'var(--on-dark-dim)' }}>EGP · مصر</span>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
