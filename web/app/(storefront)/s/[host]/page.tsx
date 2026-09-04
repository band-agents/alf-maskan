import Link from 'next/link';
import { notFound } from 'next/navigation';

import { storeForHost } from '@/lib/tenant';
import { listUnits, unitTerms, ZONES } from '@/lib/queries/units';
import { egp } from '@/lib/pricing';
import { TYPE_LABEL } from '@/components/ui/atoms';
import { StoreHead } from '@/components/store/StoreHead';
import { StoreFoot } from '@/components/store/StoreFoot';
import { HeartOutline } from '@/components/store/icons';

/**
 * NOT the ported home page.
 *
 * `src/pages/store/index.html` is a full editorial home — hero with a working
 * search, featured row, zone tiles, stat band, testimonials, CTA band — and it
 * is still on the list. This is a plain index of what is for sale, so the unit
 * page below it is reachable and the tenant routing is demonstrable. Replace it
 * wholesale when the real home is ported; nothing else links here expecting
 * this shape.
 */
export default async function StoreHome({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  const { units } = await listUnits({
    q: '', status: null, purpose: null, zone: null, type: null,
    beds: null, view: 'live', sort: 'views-desc',
  });
  const compounds = Array.from(
    new Set(units.map((u) => u.compound).filter((c): c is string => Boolean(c)))
  );

  return (
    <>
      <StoreHead store={store} />

      <main id="main">
        <div className="store-wrap">
          <header style={{ paddingBlock: '40px 8px' }}>
            <h1 className="st-h1">{store.nameEn}</h1>
            <p className="st-crumb" style={{ fontSize: 'var(--t-micro)', marginTop: 6 }} lang="ar" dir="rtl">
              {store.nameAr}
            </p>
            <p className="st-prose" style={{ marginTop: 14, maxWidth: '52ch' }}>
              {units.length} units for sale across {ZONES.length} areas.
            </p>
          </header>

          <section className="st-sec" aria-label="Units for sale">
            <div className="st-rail" style={{ flexWrap: 'wrap' }}>
              {units.map((u) => (
                <article className="st-card" key={u.id}>
                  <div className="st-card__media">
                    <div className="ph">
                      {TYPE_LABEL[u.type].toLowerCase()} · {u.compound ?? u.zone} · 4:3
                    </div>
                    <button className="st-card__save" type="button" aria-pressed="false">
                      <HeartOutline />
                      <span className="visually-hidden">Save {u.titleEn}</span>
                    </button>
                  </div>
                  <div className="st-card__body">
                    <Link className="st-card__title" href={`/units/${u.reference}`}>{u.titleEn}</Link>
                    <span className="st-card__where">
                      {u.zone}{u.compound && ` · ${u.compound}`}
                    </span>
                    <span className="st-card__specs">
                      <span>{u.areaSqm} m²</span>
                      <span>{u.bedrooms ? `${u.bedrooms} bed` : 'Studio'}</span>
                      <span>{u.delivery}</span>
                    </span>
                    <span className="st-card__price">{egp(u.price)}</span>
                    <span className="st-card__plan">{unitTerms(u)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <StoreFoot store={store} zones={ZONES} compounds={compounds} />
    </>
  );
}
