import Link from 'next/link';
import type { TenantStore } from '@/lib/mock';
import { prettyPhone } from './StoreHead';

/**
 * The storefront footer, from `src/partials/store-foot.html`.
 *
 * The zone and compound columns are built from the store's own inventory rather
 * than a fixed list, so a footer can never offer a zone the agency has nothing
 * in — the same rule the listings filter follows.
 */
export function StoreFoot({
  store,
  zones,
  compounds,
}: {
  store: TenantStore;
  zones: string[];
  compounds: string[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="st-foot">
      <div className="store-wrap">
        <div className="st-foot__grid">
          <div>
            <div className="st-foot__brand">{store.nameEn}</div>
            <p className="st-foot__blurb">
              Primary and resale units across {zones.slice(0, 3).join(', ')}
              {zones.length > 3 && ' and more'}. Licensed brokerage since 2011.
            </p>
          </div>

          <div>
            <h3>Browse</h3>
            <ul>
              <li><Link href="/units">All units</Link></li>
              {zones.slice(0, 3).map((z) => (
                <li key={z}>
                  <Link href={`/units?zone=${encodeURIComponent(z)}`}>{z}</Link>
                </li>
              ))}
              <li><Link href="/compare">Compare units</Link></li>
            </ul>
          </div>

          <div>
            <h3>Compounds</h3>
            <ul>
              {compounds.slice(0, 4).map((c) => (
                <li key={c}>
                  <Link href={`/units?compound=${encodeURIComponent(c)}`}>{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Reach us</h3>
            <ul>
              {store.phone && (
                <li>
                  {/* A phone number never mirrors, whatever the page direction. */}
                  <a href={`tel:${store.phone}`} dir="ltr">{prettyPhone(store.phone)}</a>
                </li>
              )}
              {store.email && <li><a href={`mailto:${store.email}`} dir="ltr">{store.email}</a></li>}
              <li><Link href="/contact">Book a viewing</Link></li>
              {store.address && <li>{store.address}</li>}
            </ul>
          </div>
        </div>

        <div className="st-foot__legal">
          <span>© {year} {store.nameEn}</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span className="made">
            Built with <a href="http://localhost:3000">Alf Maskan</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
