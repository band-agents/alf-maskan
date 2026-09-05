import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { storeForHost } from '@/lib/tenant';
import { listUnits, publicZonesFor, compoundsFor } from '@/lib/queries/units';
import { bookableDays } from '@/lib/queries/booking';
import { StoreHead, prettyPhone, waLink } from '@/components/store/StoreHead';
import { StoreFoot } from '@/components/store/StoreFoot';
import { BookingForm } from '@/components/store/BookingForm';

/**
 * Book a viewing — ported from `src/pages/store/contact.html`.
 *
 * The form and its confirmation both live in `BookingForm`, driven by what the
 * server action returns. Nothing about the request goes into the URL: no name,
 * no number, not even the slot. The confirmation is not a page you can link to,
 * which is correct — it is a receipt, not a document.
 */

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }): Promise<Metadata> {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) return {};
  return {
    title: `Book a viewing — ${store.nameEn}`,
    description: `Pick a day and a time and we will meet you at the unit.${store.address ? ` Office at ${store.address}.` : ''}`,
  };
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ host: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  const sp = await searchParams;
  const wanted = Array.isArray(sp.unit) ? sp.unit[0] : sp.unit;

  const { units } = await listUnits(
    { q: '', status: null, purpose: null, zone: null, compound: null, type: null, beds: null, max: null, view: 'live', sort: 'views-desc' },
    store.id
  );

  const wa = waLink(store.whatsapp ?? store.phone);
  const options = units.map((u) => ({
    reference: u.reference,
    label: `${u.titleEn} — ${u.compound ?? u.zone}, ${u.reference}`,
  }));

  return (
    <>
      <StoreHead store={store} />

      <main id="main">
        <div className="store-wrap">
          <nav className="st-crumb" style={{ paddingBlock: '20px 0' }} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
              <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Book a viewing</span>
          </nav>

          {/* The design system styles `.slot-day` / `.slot-time` selection off
              [aria-pressed="true"], which suits the static build's buttons.
              These are radios — the only markup that carries a selection into a
              form post without JavaScript — so the same look is mapped onto
              :has(:checked). Painted from the same tokens; no new colours. */}
          <style>{`
            /* Load-bearing. The radios are .visually-hidden, which is
               position:absolute with no offsets — without a positioned
               ancestor they resolve against the initial containing block,
               escape .slot-days' overflow-x clip and stretch the document
               (99px at 390px before this line). The same trap cost the
               listings table 325px; see "Traps worth knowing". */
            .slot-day, .slot-time { position: relative; }
            .slot-day:has(input:checked) { background: var(--palm-700); border-color: var(--palm-700); }
            .slot-day:has(input:checked) span, .slot-day:has(input:checked) b { color: #fff; }
            .slot-day:has(input:disabled) { opacity: .4; cursor: not-allowed; }
            .slot-time { display: inline-flex; align-items: center; }
            .slot-time:has(input:checked) { background: var(--palm-700); border-color: var(--palm-700); color: #fff; font-weight: 600; }
            .slot-day:has(input:focus-visible), .slot-time:has(input:focus-visible) { outline: 2px solid var(--palm-500); outline-offset: 2px; }
          `}</style>

          <div className="book">
            <BookingForm
              host={host}
              storeName={store.nameEn}
              storePhone={store.phone ? prettyPhone(store.phone) : null}
              whatsapp={wa}
              days={bookableDays()}
              units={options}
              defaultUnit={units.find((u) => u.reference === wanted)?.reference}
            />

            <aside className="book__side" aria-label="Our office">
              <div className="gallery__stage">
                <div className="ph ph--dark" style={{ aspectRatio: '4/3' }}>
                  map · {store.address ?? store.nameEn}
                </div>
              </div>

              <div className="agent">
                <div className="agent__who">
                  <span className="avatar" aria-hidden="true" />
                  <span>
                    <b>{store.nameEn}</b>
                    {store.address && <span>{store.address}</span>}
                  </span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 'var(--t-micro)', color: 'var(--nile-ink-2)' }}>
                  <li><b style={{ color: 'var(--nile-ink)' }}>Saturday to Thursday</b><br />10:00 – 19:00</li>
                  <li><b style={{ color: 'var(--nile-ink)' }}>Friday</b><br />Closed</li>
                </ul>
                <div className="agent__acts">
                  {wa && <a className="st-btn st-btn--primary st-btn--block" href={wa}>WhatsApp instead</a>}
                  {store.phone && <a className="st-btn st-btn--ghost st-btn--block" href={`tel:${store.phone}`}>Call the office</a>}
                </div>
                {store.phone && <span className="agent__tel" dir="ltr">{prettyPhone(store.phone)}</span>}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <StoreFoot store={store} zones={publicZonesFor(store.id)} compounds={compoundsFor(store.id)} />
    </>
  );
}
