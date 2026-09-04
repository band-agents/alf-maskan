'use client';

import { useMemo, useState } from 'react';
import { computePlan, egp } from '@/lib/pricing';
import type { UnitRow } from '@/lib/queries/units';
import { Placeholder, TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The listing editor.
 *
 * One piece of state, and every number on screen is derived from it. The
 * instalment, the price per m² and the preview card all read the same
 * `computePlan` the storefront does, so the figure an agent sets here is by
 * construction the figure a buyer sees.
 */
export function Editor({ unit }: { unit: UnitRow }) {
  const [form, setForm] = useState({
    titleEn: unit.titleEn,
    titleAr: unit.titleAr,
    type: unit.type as string,
    zone: unit.zone,
    compound: unit.compound ?? '',
    areaSqm: unit.areaSqm,
    bedrooms: unit.bedrooms ?? 0,
    price: unit.price,
    downPct: unit.downPct ?? 10,
    years: unit.years ?? 8,
    featured: unit.featured,
  });
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const plan = useMemo(
    () => computePlan({ price: form.price, downPct: form.downPct, years: form.years }, form.areaSqm),
    [form.price, form.downPct, form.years, form.areaSqm]
  );

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__form">
        {/* ---------------------------------------------- basics */}
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">1</span>
            <span className="fset__title">Basics</span>
            <span className="fset__meta">
              <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="fset__body">
            <div className="lang-field">
              <div className="lang-field__top">
                <span className="f__label">Title</span>
                <span className="lang-tabs">
                  <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                  <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
                </span>
              </div>
              {lang === 'en' ? (
                <input
                  className="inp"
                  aria-label="Title in English"
                  value={form.titleEn}
                  onChange={(e) => set('titleEn', e.target.value)}
                />
              ) : (
                <input
                  className="inp"
                  aria-label="Title in Arabic"
                  lang="ar"
                  dir="rtl"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                  value={form.titleAr}
                  onChange={(e) => set('titleAr', e.target.value)}
                />
              )}
            </div>

            <div className="fgrid fgrid--3">
              <Field label="Unit type">
                <span className="selwrap">
                  <select className="sel" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <Caret />
                </span>
              </Field>
              <Field label="Zone">
                <input className="inp" value={form.zone} onChange={(e) => set('zone', e.target.value)} />
              </Field>
              <Field label="Compound">
                <input className="inp" value={form.compound} onChange={(e) => set('compound', e.target.value)} />
              </Field>
            </div>
          </div>
        </details>

        {/* ---------------------------------------------- specs */}
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">2</span>
            <span className="fset__title">Specs</span>
            <span className="fset__meta">
              {form.areaSqm} m² · {form.bedrooms || 'studio'}
              <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="fset__body">
            <div className="fgrid">
              <Field label="Area">
                <span className="inp-unit">
                  <input className="inp" type="number" value={form.areaSqm}
                    onChange={(e) => set('areaSqm', Number(e.target.value))} />
                  <span className="inp-unit__u">m²</span>
                </span>
              </Field>
              <Field label="Bedrooms">
                <input className="inp" type="number" value={form.bedrooms}
                  onChange={(e) => set('bedrooms', Number(e.target.value))} />
              </Field>
            </div>
          </div>
        </details>

        {/* ---------------------------------------------- money */}
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">3</span>
            <span className="fset__title">Price &amp; payment plan</span>
            <span className="fset__meta">
              <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="fset__body">
            <div className="fgrid">
              <Field label="Total price">
                <span className="inp-unit inp-unit--lead">
                  <input className="inp" type="number" value={form.price}
                    onChange={(e) => set('price', Number(e.target.value))} />
                  <span className="inp-unit__u">EGP</span>
                </span>
              </Field>
              <Field label="Price per m²" hint="Calculated from price and area. Buyers compare it constantly.">
                <span className="inp-unit inp-unit--lead">
                  <input className="inp inp--computed" readOnly
                    value={plan.pricePerSqm ? Math.round(plan.pricePerSqm).toLocaleString('en-US') : '—'} />
                  <span className="inp-unit__u">EGP</span>
                </span>
              </Field>
            </div>

            <div className="calc">
              <div className="calc__controls">
                <div className="range-row">
                  <span className="range-row__top">
                    <label htmlFor="e-down">Down payment</label>
                    <b>{form.downPct}% · {egp(plan.downPayment)}</b>
                  </span>
                  <input id="e-down" type="range" min={0} max={50} step={1} value={form.downPct}
                    onChange={(e) => set('downPct', Number(e.target.value))} />
                </div>
                <div className="range-row">
                  <span className="range-row__top">
                    <label htmlFor="e-years">Instalment years</label>
                    <b>{form.years} years</b>
                  </span>
                  <input id="e-years" type="range" min={1} max={12} step={1} value={form.years}
                    onChange={(e) => set('years', Number(e.target.value))} />
                </div>
              </div>

              <div className="calc__result" role="status" aria-live="polite">
                <small>Monthly instalment</small>
                <b>{egp(plan.monthly)}</b>
                <span>{plan.months} payments after {egp(plan.downPayment)} down</span>
                <div className="calc__breakdown">
                  <div><span>Down payment</span><b>{egp(plan.downPayment)}</b></div>
                  <div><span>Financed</span><b>{egp(plan.financed)}</b></div>
                  <div><span>Over</span><b>{form.years} years</b></div>
                </div>
              </div>
            </div>

            <p className="f__hint">
              Instalments are shown without interest, which is how Egyptian developer plans are
              quoted. This is the same calculation the storefront runs, so the two cannot disagree.
            </p>
          </div>
        </details>

        {/* ---------------------------------------------- visibility */}
        <details className="fset">
          <summary>
            <span className="fset__n" aria-hidden="true">4</span>
            <span className="fset__title">Visibility</span>
            <span className="fset__meta">
              <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <div className="fset__body">
            <div className="sw-row">
              <input className="sw sw--sand" type="checkbox" id="e-featured"
                checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
              <span className="sw-row__txt">
                <b><label htmlFor="e-featured">Featured unit</label></b>
                <span>
                  Featured units appear first on your homepage and get a gold badge — use it for the
                  three or four units you most want to sell this month.
                </span>
              </span>
            </div>
          </div>
        </details>

        <div className="savebar" style={{ gridColumn: '1 / -1' }}>
          <span className="savebar__chip" {...(dirty ? { 'data-dirty': '' } : {})}>
            <i aria-hidden="true" />
            <span>{dirty ? 'Unsaved changes' : 'Saved · 2s ago'}</span>
          </span>
          <span className="savebar__end">
            <button className="btn btn--app" type="button">Preview</button>
            <button className="btn btn--go" type="button" onClick={() => setDirty(false)}>
              Publish changes
            </button>
          </span>
        </div>
      </div>

      {/* ------------------------------------------------ live preview */}
      <aside className="ed__side" aria-label="Storefront preview">
        <div className="pcard">
          <div className="pcard__chrome">
            <span className="pcard__dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="pcard__url" dir="ltr">kamal-estates.alfmaskan.com/units/{unit.reference.toLowerCase()}</span>
          </div>
          <div className="pcard__body">
            <div className="pcard__ph">
              <Placeholder label={`${TYPE_LABEL[form.type]?.toLowerCase()} · ${form.compound || form.zone} · 4:3`} />
            </div>
            {form.featured && <span className="badge badge--solid-sand">FEATURED</span>}
            <span className="pcard__title">{form.titleEn || 'Untitled unit'}</span>
            <span className="pcard__where">
              {form.compound ? `${form.compound} · ${form.zone}` : form.zone}
            </span>
            <span className="pcard__specs">
              <span>{form.areaSqm} m²</span>
              <span>{form.bedrooms ? `${form.bedrooms} bed` : 'Studio'}</span>
              <span>{TYPE_LABEL[form.type]}</span>
            </span>
            <span className="pcard__price">{egp(form.price)}</span>
            <span className="pcard__plan">
              {form.downPct}% down · {egp(plan.monthly)}/mo over {form.years} years
            </span>
          </div>
        </div>
        <p className="f__hint">
          The real card component, not a picture of one. Every figure comes from the same
          <code style={{ fontFamily: 'var(--font-mono)' }}> computePlan </code> the buyer&rsquo;s page uses.
        </p>
      </aside>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="f">
      <span className="f__label">{label}</span>
      {children}
      {hint && <span className="f__hint">{hint}</span>}
    </div>
  );
}

function Caret() {
  return (
    <span className="selwrap__caret">
      <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
