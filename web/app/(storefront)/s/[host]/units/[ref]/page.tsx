import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { storeForHost } from '@/lib/tenant';
import { getUnitDetail, headlinePlan, similarUnits } from '@/lib/queries/storefront';
import { unitTerms, publicZonesFor, compoundsFor } from '@/lib/queries/units';
import { egp } from '@/lib/pricing';
import { TYPE_LABEL, PURPOSE_LABEL } from '@/components/ui/atoms';

import { StoreHead, prettyPhone, waLink } from '@/components/store/StoreHead';
import { StoreFoot } from '@/components/store/StoreFoot';
import { Gallery } from '@/components/store/Gallery';
import { Description } from '@/components/store/Description';
import { PlanCalculator } from '@/components/store/PlanCalculator';
import { CtaBar } from '@/components/store/CtaBar';
import {
  AreaIcon, BedIcon, BathIcon, FloorIcon, FinishIcon, DeliveryIcon,
  Chevron, Tick, HeartOutline, WhatsAppMark,
} from '@/components/store/icons';

/**
 * The buyer's money page — ported from `src/pages/store/unit.html`.
 *
 * This is the first screen in the product where the two halves meet: the agent
 * sets a price and a plan in `/dash/listings/[id]`, and this is what the buyer
 * reads. Both sides call `computePlan`, so the instalment quoted on the phone
 * and the instalment on this page are the same number by construction.
 */

type Params = { host: string; ref: string };

/**
 * A buyer's words, not the database's. RESERVED is 'Under offer' because that
 * is what an Egyptian agent says on the phone, and it is the one that still
 * invites a call — a reservation falls through often enough to be worth an
 * enquiry, a completed sale does not.
 */
const STATUS_WORD: Record<string, string> = {
  LIVE: 'Available',
  RESERVED: 'Under offer',
  SOLD: 'Sold',
  RENTED: 'Rented',
  DRAFT: 'Draft',
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { host, ref } = await params;
  // Sequential, not Promise.all: the unit lookup is tenant-scoped, so it needs
  // the store id. storeForHost is React-cached, so the page below pays nothing.
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) return {};
  const unit = await getUnitDetail(ref, store.id);
  if (!unit) return {};

  const where = unit.compound ? `${unit.compound}, ${unit.zone}` : unit.zone;
  const { monthly } = headlinePlan(unit);

  return {
    title: `${unit.titleEn}, ${where} — ${store.nameEn}`,
    description:
      `${unit.areaSqm} m² ${TYPE_LABEL[unit.type].toLowerCase()} in ${where}. ` +
      `Delivery ${unit.delivery}, ${egp(unit.price)}` +
      (unit.downPct != null ? ` with a ${unit.years}-year plan from ${egp(monthly)} a month.` : '.'),
  };
}

export default async function UnitPage({ params }: { params: Promise<Params> }) {
  const { host, ref } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  const unit = await getUnitDetail(ref, store.id);
  // A draft is not published. Reaching one by URL must read as "not here",
  // never as a preview — the agency has not decided to sell it yet.
  if (!unit || unit.status === 'DRAFT') notFound();

  const similar = await similarUnits(unit, store.id);
  const plan = headlinePlan(unit);
  const hasPlan = unit.downPct != null && unit.years != null;
  const where = unit.compound ? `${unit.compound}, ${unit.zone}` : unit.zone;
  const wa = waLink(unit.agentPhone);
  const compounds = compoundsFor(store.id);

  return (
    <>
      <StoreHead store={store} />

      <main id="main">
        <div className="store-wrap">
          <nav className="st-crumb" style={{ paddingBlock: '20px 0' }} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <Chevron />
            <Link href={`/units?zone=${encodeURIComponent(unit.zone)}`}>{unit.zone}</Link>
            {unit.compound && (
              <>
                <Chevron />
                <Link href={`/units?compound=${encodeURIComponent(unit.compound)}`}>{unit.compound}</Link>
              </>
            )}
            <Chevron />
            <span className="ref" dir="ltr">{unit.reference}</span>
          </nav>

          <div className="unit">
            {/* ─────────────────────────────────────────────── main column */}
            <div className="unit__main">
              <Gallery
                gallery={unit.gallery}
                photoCount={unit.photos}
                areaSqm={unit.areaSqm}
                bedrooms={unit.bedrooms}
                where={where}
                badges={
                  <>
                    {/* A sold or reserved unit keeps its page — the link is in
                        someone's WhatsApp history and 404ing it is worse than
                        answering. But it must say so on the photo, not only in
                        the sidebar: a full sales page with a price and a "Book
                        a viewing" button, on a unit that is gone, is a lie a
                        reader cannot detect. The static build never drew this
                        state, because its one artboard is a live unit. */}
                    {unit.status !== 'LIVE' && (
                      <span className="badge badge--neutral">{STATUS_WORD[unit.status]}</span>
                    )}
                    {unit.featured && unit.status === 'LIVE' && (
                      <span className="badge badge--solid-sand">FEATURED</span>
                    )}
                    <span className="badge badge--palm">Delivery {unit.delivery}</span>
                  </>
                }
              />

              <header className="unit__head">
                <span className="unit__flags">
                  <span className="badge badge--palm">{PURPOSE_LABEL[unit.purpose]}</span>
                  <span className="badge badge--neutral">{TYPE_LABEL[unit.type]}</span>
                  <span className="st-eyebrow" dir="ltr">{unit.reference}</span>
                </span>
                <h1 className="st-h1">{unit.titleEn}</h1>
                <p className="st-crumb" style={{ fontSize: 'var(--t-micro)' }}>
                  {[unit.compound, unit.zone, unit.developer].filter(Boolean).join(' · ')}
                </p>
                <div className="unit__price-row">
                  <span className="unit__price">{egp(unit.price)}</span>
                  {plan.pricePerSqm != null && (
                    <span className="unit__ppm">{egp(plan.pricePerSqm)} / m²</span>
                  )}
                  {unit.negotiable && <span className="badge badge--neutral">Negotiable</span>}
                </div>
              </header>

              <section aria-label="Key details">
                <ul className="specs">
                  <li className="spec">
                    <AreaIcon />
                    <b>{unit.areaSqm} m²</b>
                    <span>{unit.builtUpSqm ? `Built-up ${unit.builtUpSqm} m²` : 'Total area'}</span>
                  </li>
                  <li className="spec">
                    <BedIcon />
                    <b>{unit.bedrooms ? `${unit.bedrooms} bedrooms` : 'Studio'}</b>
                    <span>{unit.specNotes.beds ?? 'Sleeping areas'}</span>
                  </li>
                  {unit.bathrooms != null && (
                    <li className="spec">
                      <BathIcon />
                      <b>{unit.bathrooms} bathrooms</b>
                      <span>{unit.specNotes.baths ?? ''}</span>
                    </li>
                  )}
                  {unit.floor != null && (
                    <li className="spec">
                      <FloorIcon />
                      <b>Floor {unit.floor}{unit.totalFloors ? ` of ${unit.totalFloors}` : ''}</b>
                      <span>{unit.specNotes.floor ?? ''}</span>
                    </li>
                  )}
                  <li className="spec">
                    <FinishIcon />
                    <b>{unit.finishing}</b>
                    <span>{unit.specNotes.finishing ?? ''}</span>
                  </li>
                  <li className="spec">
                    <DeliveryIcon />
                    <b>{unit.delivery}</b>
                    <span>Delivery</span>
                  </li>
                </ul>
              </section>

              <hr className="st-rule" />

              {(unit.descEn.length > 0 || unit.descAr.length > 0) && (
                <Description en={unit.descEn} ar={unit.descAr} />
              )}

              {unit.amenities.length > 0 && (
                <section className="st-sec" aria-labelledby="amen-h">
                  <h2 className="st-h2" id="amen-h">Amenities</h2>
                  <ul className="amen">
                    {unit.amenities.map((a) => (
                      <li key={a}><Tick /> {a}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="st-sec" aria-labelledby="loc-h">
                <h2 className="st-h2" id="loc-h">Where it is</h2>
                <div className="gallery__stage">
                  <div className="ph ph--dark" style={{ aspectRatio: '16/7' }}>
                    map · {where} · exact pin shown to enquirers
                  </div>
                </div>
                {unit.nearby.length > 0 && (
                  <ul className="nearby">
                    {unit.nearby.map((n) => (
                      <li key={n.place}>{n.place} <b>{n.minutes} min</b></li>
                    ))}
                  </ul>
                )}
              </section>

              {unit.compound && unit.compoundBlurb && (
                <section className="st-sec" aria-labelledby="dev-h">
                  <h2 className="st-h2" id="dev-h">The compound</h2>
                  <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div className="ph" style={{ width: 132, height: 88, borderRadius: 'var(--r-12)', flex: 'none' }}>
                      {unit.compound} logo
                    </div>
                    <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <h3 className="st-h3">{unit.compound}, {unit.zone}</h3>
                      <p className="st-prose" style={{ fontSize: 'var(--t-micro)' }}>{unit.compoundBlurb}</p>
                      <Link
                        className="st-btn st-btn--ghost"
                        href={`/units?compound=${encodeURIComponent(unit.compound)}`}
                        style={{ alignSelf: 'flex-start', height: 38, fontSize: 'var(--t-micro)' }}
                      >
                        See other units in {unit.compound}
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {similar.length > 0 && (
                <>
                  <hr className="st-rule" />
                  <section className="st-sec" aria-labelledby="sim-h">
                    <div className="st-sec__head">
                      <h2 className="st-h2" id="sim-h">Similar units</h2>
                      <Link href="/units" style={{ fontSize: 'var(--t-micro)', fontWeight: 600, color: 'var(--palm-600)' }}>
                        See all units →
                      </Link>
                    </div>
                    <div className="st-rail">
                      {similar.map((u) => (
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
                </>
              )}
            </div>

            {/* ─────────────────────────────────────────────── sidebar */}
            <aside className="unit__side" aria-label="Payment plan and contact">
              {hasPlan ? (
                <PlanCalculator
                  price={unit.price}
                  downPct={plan.downPct}
                  years={plan.years}
                  maxYears={plan.years}
                  maintenanceFee={unit.maintenanceFee}
                  agentPhone={unit.agentPhone}
                  wa={wa}
                />
              ) : (
                // No instalment plan is a fact about the unit, not a missing
                // feature — showing a calculator here would invent terms the
                // seller never offered.
                <section className="plan" aria-labelledby="plan-h">
                  <div className="plan__head">
                    <h2 className="st-h3" id="plan-h" style={{ fontSize: 16 }}>Payment</h2>
                  </div>
                  <div className="plan__out">
                    <small>Asking price</small>
                    <b>{egp(unit.price)}</b>
                    <span>{unitTerms(unit)}</span>
                  </div>
                  <p className="plan__note">
                    This unit is not on an instalment plan. Ask {unit.agent} about terms.
                  </p>
                </section>
              )}
              {/* The calculator renders its own, with a live monthly figure.
                  A cash unit has no monthly figure to keep in step. */}
              {!hasPlan && (
                <CtaBar price={unit.price} monthly={null} phone={unit.agentPhone} wa={wa} />
              )}

              <section className="agent" aria-labelledby="agent-h">
                <div className="agent__who">
                  <span className="avatar" aria-hidden="true" />
                  <span>
                    <b id="agent-h">{unit.agent}</b>
                    <span>{unit.agentBlurb}</span>
                  </span>
                </div>
                <div className="agent__acts">
                  {wa && (
                    <a className="st-btn st-btn--primary st-btn--block" href={wa}>
                      <WhatsAppMark />
                      WhatsApp {unit.agent.split(' ')[0]}
                    </a>
                  )}
                  <Link className="st-btn st-btn--dark st-btn--block" href={`/contact?unit=${unit.reference}`}>
                    Book a viewing
                  </Link>
                  <a className="st-btn st-btn--ghost st-btn--block" href={`tel:${unit.agentPhone}`}>Call</a>
                </div>
                <span className="agent__tel" dir="ltr">{prettyPhone(unit.agentPhone)}</span>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <StoreFoot store={store} zones={publicZonesFor(store.id)} compounds={compounds} />
    </>
  );
}
