import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { storeForHost } from '@/lib/tenant';
import { listUnits, parseUnitFilters, publicZonesFor, compoundsFor, activeFilterCount } from '@/lib/queries/units';
import { StoreHead } from '@/components/store/StoreHead';
import { StoreFoot } from '@/components/store/StoreFoot';
import { UnitCard } from '@/components/store/UnitCard';
import { StoreFilters } from '@/components/store/StoreFilters';

/**
 * Browse — the list half of `src/pages/store/search.html`.
 *
 * Everything the rest of the storefront points at lands here: the hero search,
 * the zone tiles, every "see all", the breadcrumb's zone and compound links and
 * the footer. It is the connective tissue, which is why it comes before the
 * richer halves of the static page.
 *
 * NOT ported yet, and deliberately so rather than half-drawn: the map/list
 * split, the two-up compare bar, and the delivery and finishing filters. Those
 * are the parts of `search.html` that need their own decisions, and a stubbed
 * map is worse than no map — see the cartogram note in the static HANDOFF.
 *
 * Filters are URL state parsed by the same `parseUnitFilters` the dashboard
 * uses, so a buyer's shared link and an agent's saved view speak one language.
 */

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }): Promise<Metadata> {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  return store ? { title: `Units — ${store.nameEn}` } : {};
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ host: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  // A buyer never sees a draft, whatever the URL says. `view: 'live'` is set
  // last so a hand-edited `?view=all` cannot widen it.
  const filters = { ...parseUnitFilters(await searchParams), view: 'live' as const };
  const { units, total } = await listUnits(filters, store.id);

  const zones = publicZonesFor(store.id);
  const compounds = compoundsFor(store.id);
  const active = activeFilterCount(filters);

  return (
    <>
      <StoreHead store={store} />

      <main id="main">
        <div className="store-wrap">
          <header style={{ paddingBlock: '32px 4px' }}>
            <span className="st-eyebrow">{store.nameEn}</span>
            <h1 className="st-h1" style={{ marginTop: 6 }}>
              {filters.compound ?? filters.zone ?? 'Every unit we have'}
            </h1>
            <p className="st-lede" style={{ marginTop: 10 }}>
              {units.length} of {total} units
              {active > 0 && ` match ${active === 1 ? 'this filter' : 'these filters'}`}
              {active === 0 && ' for sale right now'}.
            </p>
          </header>

          <StoreFilters filters={filters} zones={zones} compounds={compounds} />

          {units.length === 0 ? (
            <section className="st-sec" style={{ paddingBlock: '8px 64px' }}>
              <div className="empty">
                <h3>Nothing matches that yet</h3>
                <p>
                  We have {total} other {total === 1 ? 'unit' : 'units'} listed. Widen the budget or
                  clear the area — or tell us what you are after and we will look for you.
                </p>
                <div className="empty__acts">
                  <Link className="st-btn st-btn--ghost" href="/units">Clear filters</Link>
                  <Link className="st-btn st-btn--primary" href="/contact">Tell us what you want</Link>
                </div>
              </div>
            </section>
          ) : (
            <section className="st-sec" style={{ paddingBlock: '8px 64px' }} aria-label="Units">
              <div className="st-grid">
                {units.map((u) => <UnitCard key={u.id} unit={u} />)}
              </div>
            </section>
          )}
        </div>
      </main>

      <StoreFoot store={store} zones={zones} compounds={compounds} />
    </>
  );
}
