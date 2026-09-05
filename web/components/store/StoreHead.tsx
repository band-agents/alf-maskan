import Link from 'next/link';
import type { TenantStore } from '@/lib/mock';
import { isBuilt } from '@/lib/routes';
import { StoreBurger } from './StoreBurger';
import { WhatsAppMark } from './icons';

/**
 * The storefront header, from `src/partials/store-head.html`.
 *
 * Every string that was the demo agency's in the static build now comes off the
 * tenant row — that is the whole difference between a page and a storefront.
 * The announcement bar is still hard-coded here; it is a builder section
 * (`announcement`) in the schema, and belongs to the storefront page model
 * rather than to this component, so it moves when that lands.
 */

/** Kept whole and unspaced: wa.me rejects a number with anything but digits. */
export function waLink(phone: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

/** +201002448817 → +20 100 244 8817. Always rendered dir="ltr". */
export function prettyPhone(phone: string | null): string {
  const d = (phone ?? '').replace(/\D/g, '');
  if (d.length !== 12 || !d.startsWith('20')) return phone ?? '';
  return `+20 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
}

export function StoreHead({ store }: { store: TenantStore }) {
  const wa = waLink(store.whatsapp ?? store.phone);
  const [first, ...rest] = store.nameEn.split(' ');

  return (
    <>
      <div className="st-announce">
        Delivery Q4 2027 · payment plans up to 8 years —{' '}
        {wa && <a href={wa} dir="ltr">talk to us on WhatsApp</a>}
      </div>

      <header className="st-head">
        <div className="store-wrap st-head__inner">
          <Link className="st-brand" href="/">
            {first} {rest.length > 0 && <span>{rest.join(' ')}</span>}
          </Link>

          {/* Only what exists. This nav is on the page an agency shows its own
              customers; a buyer clicking "Compounds" into a 404 costs the
              agency the enquiry, not us. */}
          <nav className="st-nav" aria-label="Main">
            {[
              { href: '/units', label: 'Units' },
              { href: '/compounds', label: 'Compounds' },
              { href: '/units#plans', label: 'Payment plans' },
              { href: '/team', label: 'Our team' },
              { href: '/contact', label: 'Contact' },
            ]
              .filter((l) => isBuilt(l.href))
              .map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
          </nav>

          <div className="st-head__end">
            {store.storeLangs === 'BOTH' && (
              <span className="st-lang">
                <a href="#" lang="en" hrefLang="en" aria-current="true">EN</a>
                <a href="#" lang="ar" hrefLang="ar">ع</a>
              </span>
            )}
            {wa && (
              <a className="st-wa" href={wa}>
                <WhatsAppMark />
                <span>WhatsApp</span>
              </a>
            )}
            <StoreBurger />
          </div>
        </div>
      </header>
    </>
  );
}
