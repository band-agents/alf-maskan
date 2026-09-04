import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { storeForHost } from '@/lib/tenant';
import { listUnits, publicZonesFor, compoundsFor, type UnitRow } from '@/lib/queries/units';
import { egpShort } from '@/lib/pricing';
import { StoreHead, waLink } from '@/components/store/StoreHead';
import { StoreFoot } from '@/components/store/StoreFoot';
import { UnitCard } from '@/components/store/UnitCard';
import { HeroSearch } from '@/components/store/HeroSearch';

/**
 * The storefront home — ported from `src/pages/store/index.html`.
 *
 * This is the page an agency shares: on their Facebook page, in a WhatsApp
 * status, on a business card. The unit page is where a buyer decides; this is
 * where they decide whether this is a real firm. Everything on it is derived
 * from the tenant's own inventory rather than written down, because an agency
 * with nine units must not have a homepage claiming eleven compounds.
 */

const ALL: Parameters<typeof listUnits>[0] = {
  q: '', status: null, purpose: null, zone: null, compound: null, type: null,
  beds: null, max: null, view: 'live', sort: 'views-desc',
};

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }): Promise<Metadata> {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) return {};

  const zones = publicZonesFor(store.id);
  const { units } = await listUnits(ALL, store.id);

  return {
    title: `${store.nameEn} — units in ${zones.slice(0, 3).join(', ')}`,
    description:
      `${units.length} units across ${compoundsFor(store.id).length} compounds, ` +
      `with the payment plan written on every card.`,
  };
}

/** Cheapest live unit in a zone — the figure a buyer scans a tile for. */
function fromPrice(units: UnitRow[], zone: string): number | null {
  const prices = units.filter((u) => u.zone === zone).map((u) => u.price);
  return prices.length ? Math.min(...prices) : null;
}

export default async function StoreHome({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  const { units } = await listUnits(ALL, store.id);
  const zones = publicZonesFor(store.id);
  const compounds = compoundsFor(store.id);
  const wa = waLink(store.whatsapp ?? store.phone);

  // Featured is the agency's own pick; if nobody has picked, the most-viewed
  // stand in rather than leaving the shelf empty.
  const picked = units.filter((u) => u.featured);
  const featured = (picked.length >= 3 ? picked : units).slice(0, 3);

  const developers = Array.from(
    new Set(units.map((u) => u.compound).filter((c): c is string => Boolean(c)))
  ).slice(0, 5);

  return (
    <>
      <StoreHead store={store} />

      <main id="main">
        {/* ─────────────────────────────────────────────────────── hero */}
        <section className="store-wrap hero">
          <div className="hero__inner">
            <span className="st-eyebrow">{zones.slice(0, 4).join(' · ')}</span>
            <h1 className="hero__title">
              The unit you want, <em>on terms you can carry.</em>
            </h1>
            <p className="st-lede">
              We list primary and resale units across {compounds.length}{' '}
              {compounds.length === 1 ? 'compound' : 'compounds'}, with the payment plan written on
              every card — so you know the monthly number before you call.
            </p>
          </div>

          <HeroSearch zones={zones} />

          {developers.length > 0 && (
            <div className="trust" style={{ marginTop: 36 }}>
              <span className="trust__label">We sell in</span>
              {developers.map((d) => (
                <span className="ph" key={d}>{d}</span>
              ))}
            </div>
          )}
        </section>

        {/* ───────────────────────────────────────────────────── featured */}
        {featured.length > 0 && (
          <section className="store-wrap st-sec" style={{ paddingBlock: '8px 56px' }}>
            <div className="st-sec__head">
              <div>
                <span className="st-eyebrow">
                  {picked.length >= 3 ? 'Hand-picked this week' : 'Most viewed this week'}
                </span>
                <h2 className="st-h2" style={{ marginTop: 6 }}>
                  {picked.length >= 3 ? 'Featured units' : 'Getting the most attention'}
                </h2>
              </div>
              <Link href="/units" style={{ fontSize: 'var(--t-micro)', fontWeight: 600, color: 'var(--tpl-accent, var(--palm-600))' }}>
                See all {units.length} units →
              </Link>
            </div>

            <div className="st-grid">
              {featured.map((u) => (
                <UnitCard key={u.id} unit={u} showFeaturedFlag={picked.length >= 3} />
              ))}
            </div>
          </section>
        )}

        {/* ──────────────────────────────────────────────────────── zones */}
        {zones.length > 1 && (
          <section className="store-wrap st-sec" style={{ paddingBlock: '8px 56px' }}>
            <div className="st-sec__head">
              <div>
                <span className="st-eyebrow">By where you want to live</span>
                <h2 className="st-h2" style={{ marginTop: 6 }}>Browse by zone</h2>
              </div>
            </div>
            <div className="zones">
              {zones.slice(0, 4).map((z) => {
                const n = units.filter((u) => u.zone === z).length;
                const from = fromPrice(units, z);
                return (
                  <Link className="zone-tile" href={`/units?zone=${encodeURIComponent(z)}`} key={z}>
                    <span className="ph">{z} · 4:3</span>
                    <span className="zone-tile__cap">
                      <b>{z}</b>
                      <span>
                        {n} {n === 1 ? 'unit' : 'units'}
                        {from != null && ` · from ${egpShort(from)}`}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ──────────────────────────────────────────────────────── stats */}
        <section className="stat-band" aria-label={`${store.nameEn} in numbers`}>
          <div className="store-wrap" style={{ display: 'contents' }}>
            <div className="stat-band__i">
              <b>{units.length}</b><span>Units listed right now</span>
            </div>
            <div className="stat-band__i">
              <b>{compounds.length}</b><span>Compounds we sell in</span>
            </div>
            <div className="stat-band__i">
              <b>{zones.length}</b><span>Areas covered</span>
            </div>
            <div className="stat-band__i">
              <b>{egpShort(Math.min(...units.map((u) => u.price)))}</b><span>Lowest asking price</span>
            </div>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────── CTA */}
        <section className="store-wrap" style={{ padding: '56px 0 64px' }}>
          <div className="cta-band">
            <div>
              <h2>Tell us what you are looking for</h2>
              <p>
                Send us the zone, the budget and when you want to move in. We will come back with
                three units that fit, usually the same day.
              </p>
            </div>
            <span className="cta-band__acts">
              {wa && <a className="st-btn st-btn--primary" href={wa}>WhatsApp us</a>}
              <Link className="st-btn st-btn--ghost" href="/contact">Book a viewing</Link>
            </span>
          </div>
        </section>
      </main>

      <StoreFoot store={store} zones={zones} compounds={compounds} />
    </>
  );
}

