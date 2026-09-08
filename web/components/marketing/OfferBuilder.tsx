'use client';

import { useState } from 'react';
import { computePlan, egp } from '@/lib/pricing';
import type { UnitRow } from '@/lib/queries/units';
import { Hint, Placeholder, TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The offer builder.
 *
 * The preview card is the point of this screen: an agency is deciding whether a
 * discount is worth giving, and the only way to answer that is to see the
 * number the buyer will see. So the "was → now" line runs `computePlan` on the
 * selected unit and applies the discount to its result — the same function the
 * listing editor and the buyer's page use. The static build wrote
 * "EGP 845,000 → EGP 802,750" as text, which was right for one unit, one kind
 * of offer and one amount.
 */

type Kind = 'down' | 'price' | 'years' | 'finish';

const KINDS: { value: Kind; label: string; unit: string }[] = [
  { value: 'down', label: 'Discount on the down payment', unit: '%' },
  { value: 'price', label: 'Discount on the price', unit: '%' },
  { value: 'years', label: 'Extra instalment years', unit: 'yrs' },
  { value: 'finish', label: 'Free finishing', unit: 'EGP' },
];

const BADGES = [
  { value: 'sand', label: 'Solid gold pill' },
  { value: 'outline', label: 'Gold outline' },
  { value: 'corner', label: 'Gold corner flag' },
];

export function OfferBuilder({ units }: { units: UnitRow[] }) {
  // Sold and rented units are not offered at all: an offer on something nobody
  // can buy costs an agency trust for nothing.
  const sellable = units.filter((u) => u.status === 'LIVE' || u.status === 'DRAFT' || u.status === 'RESERVED');

  const [nameEn, setNameEn] = useState('Autumn launch — 5% off the down payment');
  const [nameAr, setNameAr] = useState('عرض الخريف — خصم 5% على المقدم');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [kind, setKind] = useState<Kind>('down');
  const [amount, setAmount] = useState(5);
  const [badge, setBadge] = useState('sand');
  const [badgeText, setBadgeText] = useState('5% OFF DOWN PAYMENT');
  const [end, setEnd] = useState('2026-09-30');
  const [countdown, setCountdown] = useState(true);
  const [picked, setPicked] = useState<string[]>(sellable.slice(0, 4).map((u) => u.id));

  const unit = sellable.find((u) => picked.includes(u.id)) ?? sellable[0];

  // A cash unit carries no plan, so the percentages default rather than being
  // passed through as null — computePlan takes numbers and a discount on a down
  // payment of "nothing" is correctly nothing.
  const effect = (() => {
    if (!unit) return null;
    const downPct = unit.downPct ?? 0;
    const years = unit.years ?? 1;
    const base = computePlan({ price: unit.price, downPct, years }, unit.areaSqm);

    switch (kind) {
      case 'down':
        return { label: 'Down payment', was: base.downPayment, now: base.downPayment * (1 - amount / 100) };
      case 'price':
        return { label: 'Price', was: unit.price, now: unit.price * (1 - amount / 100) };
      case 'years': {
        const longer = computePlan({ price: unit.price, downPct, years: years + amount }, unit.areaSqm);
        return { label: 'Monthly instalment', was: base.monthly, now: longer.monthly };
      }
      case 'finish':
        return { label: 'Finishing', was: amount, now: 0 };
    }
  })();

  // Counted to the end date rather than typed beside it, so changing the date
  // moves the number the buyer is being hurried by.
  const daysLeft = (() => {
    const today = new Date('2026-09-03T00:00:00Z').getTime();
    const target = new Date(`${end}T00:00:00Z`).getTime();
    return Math.max(0, Math.round((target - today) / 86_400_000));
  })();

  const kindMeta = KINDS.find((k) => k.value === kind)!;

  return (
    <form className="two-col" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__form">
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">1</span>
            <span className="fset__title">What the offer is</span>
            <span className="fset__meta">
              <Hint about="About offers">
                An offer puts a gold badge and a countdown on every unit you attach it to, and
                ends itself on the date you set — nobody has to remember to switch it off.
              </Hint>
              <Caret />
            </span>
          </summary>
          <div className="fset__body">
            <div className="lang-field">
              <div className="lang-field__top">
                <span className="f__label">Offer name</span>
                <span className="lang-tabs">
                  <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                  <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
                </span>
              </div>
              {lang === 'en' ? (
                <input className="inp" aria-label="Offer name in English" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              ) : (
                <input
                  className="inp" aria-label="Offer name in Arabic" lang="ar" dir="rtl"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                  value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                />
              )}
            </div>

            <div className="fgrid fgrid--3">
              <div className="f">
                <label className="f__label" htmlFor="o-kind">Kind of offer</label>
                <span className="selwrap">
                  <select className="sel" id="o-kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                    {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                  <SelCaret />
                </span>
              </div>
              <div className="f">
                <label className="f__label" htmlFor="o-amount">Amount</label>
                <span className="inp-unit">
                  <input className="inp" id="o-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                  <span className="inp-unit__u">{kindMeta.unit}</span>
                </span>
              </div>
              <div className="f">
                <label className="f__label" htmlFor="o-badge">Badge style</label>
                <span className="selwrap">
                  <select className="sel" id="o-badge" value={badge} onChange={(e) => setBadge(e.target.value)}>
                    {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                  <SelCaret />
                </span>
              </div>
            </div>

            <div className="f">
              <label className="f__label" htmlFor="o-badge-text">Badge text</label>
              <input className="inp" id="o-badge-text" maxLength={28} value={badgeText} onChange={(e) => setBadgeText(e.target.value)} />
              <span className="f__hint">
                Short enough to read at card size. Twenty-eight characters is the ceiling.
              </span>
            </div>
          </div>
        </details>

        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">2</span>
            <span className="fset__title">When it runs</span>
            <span className="fset__meta">{daysLeft} days left<Caret /></span>
          </summary>
          <div className="fset__body">
            <div className="fgrid">
              <div className="f">
                <label className="f__label" htmlFor="o-start">Starts</label>
                <input className="inp" id="o-start" type="date" defaultValue="2026-09-03" />
              </div>
              <div className="f">
                <label className="f__label" htmlFor="o-end">Ends</label>
                <input className="inp" id="o-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="sw-row">
              <input className="sw" type="checkbox" id="o-countdown" checked={countdown} onChange={(e) => setCountdown(e.target.checked)} />
              <span className="sw-row__txt">
                <b><label htmlFor="o-countdown">Show a countdown on the card</label></b>
                <span>Counts down to the end date. It disappears on its own when the offer closes.</span>
              </span>
            </div>
          </div>
        </details>

        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">3</span>
            <span className="fset__title">Which units</span>
            <span className="fset__meta">{picked.length} selected<Caret /></span>
          </summary>
          <div className="fset__body">
            <div className="chipset">
              {sellable.map((u) => (
                <label key={u.id}>
                  <input
                    type="checkbox"
                    checked={picked.includes(u.id)}
                    onChange={(e) =>
                      setPicked((p) => (e.target.checked ? [...p, u.id] : p.filter((x) => x !== u.id)))
                    }
                  />
                  <span className="chipset__tick" aria-hidden="true">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {TYPE_LABEL[u.type]} · {u.compound ?? u.zone}
                </label>
              ))}
            </div>
            <p className="f__hint">
              Sold and rented units are left out automatically — an offer on a unit nobody can buy
              just costs you trust.
            </p>
          </div>
        </details>

        <div className="savebar">
          <span className="savebar__chip"><i aria-hidden="true" /><span>Draft · not live yet</span></span>
          <span className="savebar__end">
            <button className="btn btn--app" type="button">Save draft</button>
            <button className="btn btn--go" type="button">Start the offer</button>
          </span>
        </div>
      </div>

      <aside className="two-col__side" aria-label="Offer preview">
        <section className="panel panel--pad">
          <h2 className="panel__title" style={{ marginBottom: 12 }}>On the storefront card</h2>
          {unit ? (
            <div className="badge-preview">
              <span className={`offer-badge offer-badge--${badge}`}>{badgeText}</span>
              <Placeholder label={`${TYPE_LABEL[unit.type]?.toLowerCase()} · ${unit.compound ?? unit.zone} · 4:3`} />
              {countdown && (
                <div className="countdown">
                  <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M6.5 3.5v3.2l2 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Offer ends in <b>{daysLeft} days</b>
                </div>
              )}
              <div className="badge-preview__body">
                <b>{unit.titleEn}</b>
                <span>{unit.zone} · {unit.compound ?? '—'} · {unit.areaSqm} m²</span>
                <span className="badge-preview__price">{egp(unit.price)}</span>
                {effect && (
                  <span className="badge-preview__was">
                    {effect.label} {egp(effect.was)} →{' '}
                    <b style={{ color: 'var(--accent-2-ink)', textDecoration: 'none' }}>{egp(effect.now)}</b>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="f__hint">No sellable unit to preview an offer against.</p>
          )}
          <p className="f__hint" style={{ marginTop: 12 }}>
            The real card component, not a picture of one — and the discounted figure comes from
            the same <code style={{ fontFamily: 'var(--font-mono)' }}>computePlan</code> the buyer
            sees, so it cannot promise a number the unit page will not honour.
          </p>
        </section>
      </aside>
    </form>
  );
}

function Caret() {
  return (
    <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SelCaret() {
  return (
    <span className="selwrap__caret">
      <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
