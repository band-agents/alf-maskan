'use client';

import { useState } from 'react';
import { computePlan, egp } from '@/lib/pricing';
import type { UnitRow } from '@/lib/queries/units';
import {
  AMENITIES, FINISHING, GOVERNORATES, VIEWS,
  checks, completeness, type MediaItem, type Positioning, type UnitDetail,
} from '@/lib/queries/unit-detail';
import { Hint, Placeholder, TYPE_LABEL } from '@/components/ui/atoms';
import { Gallery } from './Gallery';
import { ChecklistPanel, PlanBar, PricePositioning, Serp } from './visuals';

/**
 * The listing editor.
 *
 * One piece of state, and every number on screen is derived from it. The
 * instalment, the price per m², the completeness score, the price positioning
 * and the preview card all read the same `computePlan` the storefront does, so
 * the figure an agent sets here is by construction the figure a buyer sees.
 *
 * The three panels on the right are the reason to open this screen twice. A
 * form tells you what you have typed; those tell you whether the listing is
 * finished, whether it is priced where the rest of your stock is, and what a
 * buyer will actually be looking at.
 */

export type EditorContext = {
  zones: string[];
  compounds: string[];
  agents: string[];
  collections: { slug: string; name: string }[];
  storeSlug: string;
  rootDomain: string;
  positioning: Positioning | null;
};

const PURPOSES = [
  ['PRIMARY', 'Primary — from the developer'],
  ['RESALE', 'Resale — from an owner'],
  ['SALE', 'For sale'],
  ['RENT', 'For rent'],
] as const;

const STATUSES = [
  ['DRAFT', 'Draft'], ['LIVE', 'Live'], ['RESERVED', 'Reserved'],
  ['SOLD', 'Sold'], ['RENTED', 'Rented'],
] as const;

export function Editor({
  unit, detail, ctx, isNew = false,
}: {
  unit: UnitRow; detail: UnitDetail; ctx: EditorContext; isNew?: boolean;
}) {
  const [u, setU] = useState<UnitRow>(unit);
  const [d, setD] = useState<UnitDetail>(detail);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [dirty, setDirty] = useState(isNew);
  const [saved, setSaved] = useState(false);

  const setUnit = <K extends keyof UnitRow>(k: K, v: UnitRow[K]) => {
    setU((p) => ({ ...p, [k]: v }));
    setDirty(true); setSaved(false);
  };
  const setDet = <K extends keyof UnitDetail>(k: K, v: UnitDetail[K]) => {
    setD((p) => ({ ...p, [k]: v }));
    setDirty(true); setSaved(false);
  };

  const plan = computePlan(
    { price: u.price, downPct: u.downPct ?? 0, years: u.years ?? 1 },
    u.areaSqm
  );

  const list = checks(u, d);
  const score = completeness(list);
  const photos = d.media.filter((m) => m.kind === 'photo').length;
  const plans = d.media.filter((m) => m.kind === 'plan').length;
  const serpUrl = `${ctx.storeSlug}.${ctx.rootDomain} › units › ${u.reference.toLowerCase()}`;

  return (
    <form className="ed" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__form">
        {/* ------------------------------------------------ 1 basics */}
        <Fieldset n={1} title="Basics" meta={`${TYPE_LABEL[u.type]} · ${u.reference}`} open>
          <div className="fgrid fgrid--3">
            <Field label="Purpose" id="e-purpose" required>
              <Select id="e-purpose" value={u.purpose} onChange={(v) => setUnit('purpose', v as UnitRow['purpose'])}
                options={PURPOSES.map(([v, l]) => [v, l])} />
            </Field>
            <Field label="Unit type" id="e-type" required>
              <Select id="e-type" value={u.type} onChange={(v) => setUnit('type', v as UnitRow['type'])}
                options={Object.entries(TYPE_LABEL)} />
            </Field>
            <Field label="Reference code" id="e-ref" hint="Generated from your series. Change it if you keep your own.">
              <input className="inp" id="e-ref" value={u.reference} dir="ltr"
                onChange={(e) => setUnit('reference', e.target.value)} />
            </Field>
          </div>

          <LangField
            label="Title" required lang={lang} setLang={setLang}
            en={u.titleEn} ar={u.titleAr}
            onEn={(v) => setUnit('titleEn', v)} onAr={(v) => setUnit('titleAr', v)}
            hint="What a buyer reads first. Lead with the thing that sells it, not the unit type."
          />

          <LangField
            label="Description" textarea lang={lang} setLang={setLang}
            en={d.descriptionEn} ar={d.descriptionAr}
            onEn={(v) => setDet('descriptionEn', v)} onAr={(v) => setDet('descriptionAr', v)}
          />
        </Fieldset>

        {/* ------------------------------------------------ 2 location */}
        <Fieldset n={2} title="Location" meta={u.compound ? `${u.zone} · ${u.compound}` : u.zone}>
          <div className="fgrid fgrid--3">
            <Field label="Governorate" id="e-gov">
              <Select id="e-gov" value={d.governorate} onChange={(v) => setDet('governorate', v)}
                options={GOVERNORATES.map((g) => [g, g])} />
            </Field>
            <Field label="Zone" id="e-zone" required>
              <input className="inp" id="e-zone" list="zones" value={u.zone}
                onChange={(e) => setUnit('zone', e.target.value)} />
              <datalist id="zones">{ctx.zones.map((z) => <option key={z} value={z} />)}</datalist>
            </Field>
            <Field label="Compound" id="e-compound">
              <input className="inp" id="e-compound" list="compounds" value={u.compound ?? ''}
                onChange={(e) => setUnit('compound', e.target.value || null)} />
              <datalist id="compounds">{ctx.compounds.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
          </div>

          <div className="fgrid">
            <Field label="Developer" id="e-dev">
              <input className="inp" id="e-dev" value={d.developer ?? ''}
                onChange={(e) => setDet('developer', e.target.value || null)} />
            </Field>
            <Field label="Map pin" hint="Drop a pin so the storefront map and the zone filter agree.">
              <div style={{
                border: '1px solid var(--rule)', borderRadius: 'var(--r-10)', background: 'var(--panel-2)',
                padding: 12, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span aria-hidden="true" style={{ color: 'var(--accent)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 16.5S15 11.4 15 7A6 6 0 0 0 3 7c0 4.4 6 9.5 6 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                <span style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)' }}>
                  {u.compound ? `${u.compound}, ` : ''}{u.zone}, {d.governorate}
                </span>
              </div>
            </Field>
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 3 specs */}
        <Fieldset n={3} title="Specs" meta={`${u.areaSqm} m² · ${u.bedrooms || 'studio'}`} open>
          <div className="fgrid fgrid--3">
            <Field label="Area" id="e-area" required>
              <Unit suffix="m²">
                <input className="inp" id="e-area" type="number" value={u.areaSqm}
                  onChange={(e) => setUnit('areaSqm', Number(e.target.value))} />
              </Unit>
            </Field>
            <Field label="Built-up area" id="e-built" hint="Leave empty if it is the same as the area.">
              <Unit suffix="m²">
                <input className="inp" id="e-built" type="number" value={d.builtUpSqm ?? ''}
                  onChange={(e) => setDet('builtUpSqm', e.target.value ? Number(e.target.value) : null)} />
              </Unit>
            </Field>
            <Field label="Bedrooms" id="e-beds">
              <input className="inp" id="e-beds" type="number" min={0} value={u.bedrooms ?? 0}
                onChange={(e) => setUnit('bedrooms', Number(e.target.value))} />
            </Field>
          </div>

          <div className="fgrid fgrid--3">
            <Field label="Bathrooms" id="e-baths">
              <input className="inp" id="e-baths" type="number" min={0} value={d.bathrooms ?? 0}
                onChange={(e) => setDet('bathrooms', Number(e.target.value))} />
            </Field>
            <Field label="Floor" id="e-floor">
              <input className="inp" id="e-floor" type="number" value={d.floor ?? ''}
                onChange={(e) => setDet('floor', e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Total floors" id="e-floors">
              <input className="inp" id="e-floors" type="number" value={d.totalFloors ?? ''}
                onChange={(e) => setDet('totalFloors', e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>

          <div className="fgrid">
            <Field label="View" id="e-view">
              <Select id="e-view" value={d.view ?? ''} onChange={(v) => setDet('view', v || null)}
                options={[['', 'Not set'], ...VIEWS.map((v) => [v, v] as [string, string])]} />
            </Field>
            <Field label="Parking spots" id="e-parking">
              <input className="inp" id="e-parking" type="number" min={0} value={d.parking}
                onChange={(e) => setDet('parking', Number(e.target.value))} />
            </Field>
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 4 finishing */}
        <Fieldset n={4} title="Finishing & delivery" meta={`${u.finishing} · ${u.delivery}`}>
          <div className="fgrid fgrid--3">
            <Field label="Finishing level" id="e-finish">
              <Select id="e-finish" value={u.finishing} onChange={(v) => setUnit('finishing', v)}
                options={FINISHING.map((f) => [f, f])} />
            </Field>
            <Field label="Delivery" id="e-delivery" hint="“Ready” if a buyer can move in now.">
              <input className="inp" id="e-delivery" value={u.delivery}
                onChange={(e) => setUnit('delivery', e.target.value)} />
            </Field>
            <Field label="Maintenance fee" id="e-maint" hint="Annual, if the compound charges one.">
              <Unit suffix="EGP">
                <input className="inp" id="e-maint" type="number" value={d.maintenanceFee ?? ''}
                  onChange={(e) => setDet('maintenanceFee', e.target.value ? Number(e.target.value) : null)} />
              </Unit>
            </Field>
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 5 money */}
        <Fieldset n={5} title="Price & payment plan" meta={egp(u.price)} open>
          <div className="fgrid">
            <Field label="Total price" id="e-price" required>
              <Unit suffix="EGP" lead>
                <input className="inp" id="e-price" type="number" value={u.price}
                  onChange={(e) => setUnit('price', Number(e.target.value))} />
              </Unit>
            </Field>
            <Field
              label="Price per m²" id="e-ppm"
              hintNode={<Hint about="About price per m²">
                Calculated from price and area. Buyers compare it constantly, so it appears on
                every card — and it is what the positioning panel measures.
              </Hint>}
            >
              <Unit suffix="EGP" lead>
                <input className="inp inp--computed" id="e-ppm" readOnly
                  value={plan.pricePerSqm ? Math.round(plan.pricePerSqm).toLocaleString('en-US') : '—'} />
              </Unit>
            </Field>
          </div>

          <div className="calc">
            <div className="calc__controls">
              <Range
                id="e-down" label="Down payment" min={0} max={50} value={u.downPct ?? 0}
                display={`${u.downPct ?? 0}% · ${egp(plan.downPayment)}`}
                onChange={(v) => setUnit('downPct', v)}
              />
              <Range
                id="e-years" label="Instalment years" min={1} max={12} value={u.years ?? 1}
                display={`${u.years ?? 1} years`}
                onChange={(v) => setUnit('years', v)}
              />
              <div className="sw-row" style={{ paddingBottom: 0 }}>
                <input className="sw" type="checkbox" id="e-negotiable" checked={d.negotiable}
                  onChange={(e) => setDet('negotiable', e.target.checked)} />
                <span className="sw-row__txt">
                  <b><label htmlFor="e-negotiable">Price is negotiable</label></b>
                  <span>Shows &ldquo;Negotiable&rdquo; next to the price instead of hiding it.</span>
                </span>
              </div>
            </div>

            <div className="calc__result" role="status" aria-live="polite">
              <small>Monthly instalment</small>
              <b>{egp(plan.monthly)}</b>
              <span>{plan.months} payments after {egp(plan.downPayment)} down</span>
              <div className="calc__breakdown">
                <div><span>Down payment</span><b>{egp(plan.downPayment)}</b></div>
                <div><span>Financed</span><b>{egp(plan.financed)}</b></div>
                <div><span>Over</span><b>{u.years ?? 1} years</b></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <span className="f__label" style={{ marginBottom: 8, display: 'block' }}>What the buyer pays</span>
            <PlanBar
              price={u.price} downPayment={plan.downPayment} financed={plan.financed}
              monthly={plan.monthly} months={plan.months} years={u.years ?? 1}
            />
          </div>

          <p className="f__hint">
            Instalments are shown without interest, which is how Egyptian developer plans are
            quoted. This is the same calculation the storefront runs, so the two cannot disagree.
          </p>
        </Fieldset>

        {/* ------------------------------------------------ 6 media */}
        <Fieldset
          n={6} title="Media"
          meta={`${photos} photo${photos === 1 ? '' : 's'} · ${plans} floor plan${plans === 1 ? '' : 's'}`}
          hint={<Hint about="About media">
            The first image is the cover — the one buyers see in search, on your homepage and in
            WhatsApp shares. Drag any photo to the front to make it the cover.
          </Hint>}
        >
          <Gallery media={d.media} onChange={(m: MediaItem[]) => setDet('media', m)} />
          <div className="fgrid">
            <Field label="Video URL" id="e-video">
              <input className="inp" id="e-video" type="url" dir="ltr" value={d.videoUrl}
                placeholder="https://youtube.com/watch?v=…"
                onChange={(e) => setDet('videoUrl', e.target.value)} />
            </Field>
            <Field label="360° tour embed" id="e-tour">
              <input className="inp" id="e-tour" type="url" dir="ltr" value={d.tourUrl}
                placeholder="Matterport or Kuula link"
                onChange={(e) => setDet('tourUrl', e.target.value)} />
            </Field>
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 7 amenities */}
        <Fieldset n={7} title="Amenities" meta={`${d.amenities.length} selected`}>
          <div className="chipset">
            {AMENITIES.map((a) => (
              <label key={a}>
                <input
                  type="checkbox"
                  checked={d.amenities.includes(a)}
                  onChange={(e) =>
                    setDet('amenities', e.target.checked
                      ? [...d.amenities, a]
                      : d.amenities.filter((x) => x !== a))
                  }
                />
                <span className="chipset__tick" aria-hidden="true">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {a}
              </label>
            ))}
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 8 visibility */}
        <Fieldset n={8} title="Visibility & SEO" meta={u.status.charAt(0) + u.status.slice(1).toLowerCase()}>
          <div className="fgrid">
            <Field label="Status" id="e-status">
              <Select id="e-status" value={u.status} onChange={(v) => setUnit('status', v as UnitRow['status'])}
                options={STATUSES.map(([v, l]) => [v, l])} />
            </Field>
            <Field label="Collections" id="e-collections" hint="Automatic collections pick this up on their own.">
              <Select id="e-collections" value="" onChange={() => undefined}
                options={[['', 'Add to a collection…'], ...ctx.collections.map((c) => [c.slug, c.name] as [string, string])]} />
            </Field>
          </div>

          <div className="sw-row">
            <input className="sw sw--sand" type="checkbox" id="e-featured" checked={u.featured}
              onChange={(e) => setUnit('featured', e.target.checked)} />
            <span className="sw-row__txt">
              <b><label htmlFor="e-featured">Featured unit</label></b>
              <span>
                Featured units appear first on your homepage and get a gold badge — use it for the
                three or four units you most want to sell this month.
              </span>
            </span>
          </div>

          <Field label="Meta title" id="e-meta-title">
            <input className="inp" id="e-meta-title" maxLength={90} value={d.metaTitle}
              onChange={(e) => setDet('metaTitle', e.target.value)} />
          </Field>
          <Field label="Meta description" id="e-meta-desc">
            <textarea className="ta" id="e-meta-desc" maxLength={200} style={{ minHeight: 64 }}
              value={d.metaDesc} onChange={(e) => setDet('metaDesc', e.target.value)} />
          </Field>

          <div className="f">
            <span className="f__label">How it looks in Google</span>
            <Serp url={serpUrl} title={d.metaTitle} desc={d.metaDesc} />
          </div>
        </Fieldset>

        {/* ------------------------------------------------ 9 assignment */}
        <Fieldset n={9} title="Assignment" meta={`${u.agent} · ${d.commissionPct}%`}>
          <div className="fgrid fgrid--3">
            <Field label="Owner agent" id="e-owner">
              <Select id="e-owner" value={u.agent} onChange={(v) => setUnit('agent', v)}
                options={ctx.agents.map((a) => [a, a])} />
            </Field>
            <Field label="Co-agents" id="e-coagents">
              <Select
                id="e-coagents" value={d.coAgents[0] ?? ''}
                onChange={(v) => setDet('coAgents', v ? [v] : [])}
                options={[['', 'None'], ...ctx.agents.filter((a) => a !== u.agent).map((a) => [a, a] as [string, string])]}
              />
            </Field>
            <Field label="Commission" id="e-commission">
              <Unit suffix="%">
                <input className="inp" id="e-commission" type="number" step={0.1} value={d.commissionPct}
                  onChange={(e) => setDet('commissionPct', Number(e.target.value))} />
              </Unit>
            </Field>
          </div>
          <Field
            label="Internal notes" id="e-notes"
            hint={`Never shown on the storefront. Commission at asking: ${egp(u.price * (d.commissionPct / 100))}.`}
          >
            <textarea className="ta" id="e-notes" style={{ minHeight: 70 }} value={d.notes}
              placeholder="Only your team sees this."
              onChange={(e) => setDet('notes', e.target.value)} />
          </Field>
        </Fieldset>

        <div className="savebar" style={{ gridColumn: '1 / -1' }}>
          <span className="savebar__chip" {...(dirty ? { 'data-dirty': '' } : {})}>
            <i aria-hidden="true" />
            <span>{dirty ? (isNew ? 'New listing · not saved' : 'Unsaved changes') : 'Saved · 2s ago'}</span>
          </span>
          <span className="savebar__end">
            <button className="btn btn--app" type="button">Preview</button>
            <button className="btn btn--go" type="button" onClick={() => { setDirty(false); setSaved(true); }}>
              {isNew ? 'Create listing' : 'Publish changes'}
            </button>
          </span>
        </div>

        {saved && (
          <p className="rolenote" role="status" style={{ gridColumn: '1 / -1' }}>
            <b>Not saved</b>
            There is no database connected yet, so this listing lives in the page only and a
            refresh restores it. Everything above — the plan, the score, the positioning — is what
            would have been written.
          </p>
        )}
      </div>

      {/* ------------------------------------------------ side panels */}
      <aside className="ed__side" aria-label="Listing insight">
        <ChecklistPanel checks={list} score={score} />

        <section className="panel panel--pad">
          <h2 className="panel__title" style={{ marginBottom: 12 }}>On your storefront</h2>
          <div className="pcard">
            <div className="pcard__chrome">
              <span className="pcard__dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="pcard__url" dir="ltr">
                {ctx.storeSlug}.{ctx.rootDomain}/units/{u.reference.toLowerCase()}
              </span>
            </div>
            <div className="pcard__body">
              <div className="pcard__ph">
                <Placeholder label={`${d.media[0]?.label ?? 'no photo'} · 4:3`} />
              </div>
              {u.featured && <span className="badge badge--solid-sand">FEATURED</span>}
              <span className="pcard__title">
                {(lang === 'ar' ? u.titleAr : u.titleEn) || 'Untitled unit'}
              </span>
              <span className="pcard__where">{u.compound ? `${u.compound} · ${u.zone}` : u.zone}</span>
              <span className="pcard__specs">
                <span>{u.areaSqm} m²</span>
                <span>{u.bedrooms ? `${u.bedrooms} bed` : 'Studio'}</span>
                <span>{TYPE_LABEL[u.type]}</span>
              </span>
              <span className="pcard__price">
                {egp(u.price)}{d.negotiable ? ' · Negotiable' : ''}
              </span>
              <span className="pcard__plan">
                {u.downPct
                  ? `${u.downPct}% down · ${egp(plan.monthly)}/mo over ${u.years} years`
                  : 'Cash'}
              </span>
            </div>
          </div>
          <p className="f__hint" style={{ marginTop: 10 }}>
            The real card component, not a picture of one. Every figure comes from the same{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>computePlan</code> the buyer&rsquo;s
            page uses.
          </p>
        </section>

        {/* Only when there is enough comparable stock to say anything honest. */}
        {ctx.positioning && <PricePositioning p={ctx.positioning} />}
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------- parts */

function Fieldset({
  n, title, meta, open, hint, children,
}: {
  n: number; title: string; meta?: string; open?: boolean;
  hint?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <details className="fset" open={open}>
      <summary>
        <span className="fset__n" aria-hidden="true">{n}</span>
        <span className="fset__title">{title}</span>
        <span className="fset__meta">
          {meta}
          {hint}
          <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <div className="fset__body">{children}</div>
    </details>
  );
}

function Field({
  label, id, hint, hintNode, required, children,
}: {
  label: string; id?: string; hint?: string; hintNode?: React.ReactNode;
  required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="f">
      <label className="f__label" htmlFor={id}>
        {label}
        {required && <span className="f__req" aria-hidden="true"> *</span>}
        {hintNode}
      </label>
      {children}
      {hint && <span className="f__hint">{hint}</span>}
    </div>
  );
}

function Select({
  id, value, onChange, options,
}: {
  id: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <span className="selwrap">
      <select className="sel" id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <span className="selwrap__caret">
        <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

function Unit({ suffix, lead, children }: { suffix: string; lead?: boolean; children: React.ReactNode }) {
  return (
    <span className={`inp-unit${lead ? ' inp-unit--lead' : ''}`}>
      {children}
      <span className="inp-unit__u">{suffix}</span>
    </span>
  );
}

function Range({
  id, label, min, max, value, display, onChange,
}: {
  id: string; label: string; min: number; max: number; value: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div className="range-row">
      <span className="range-row__top">
        <label htmlFor={id}>{label}</label>
        <b>{display}</b>
      </span>
      <input id={id} type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function LangField({
  label, lang, setLang, en, ar, onEn, onAr, textarea, required, hint,
}: {
  label: string; lang: 'en' | 'ar'; setLang: (l: 'en' | 'ar') => void;
  en: string; ar: string; onEn: (v: string) => void; onAr: (v: string) => void;
  textarea?: boolean; required?: boolean; hint?: string;
}) {
  const arabicProps = { lang: 'ar', dir: 'rtl' as const, style: { fontFamily: 'var(--font-arabic)' } };
  return (
    <div className="lang-field">
      <div className="lang-field__top">
        <span className="f__label">
          {label}
          {required && <span className="f__req" aria-hidden="true"> *</span>}
        </span>
        <span className="lang-tabs">
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
        </span>
      </div>
      {lang === 'en'
        ? textarea
          ? <textarea className="ta" aria-label={`${label} in English`} value={en} onChange={(e) => onEn(e.target.value)} />
          : <input className="inp" aria-label={`${label} in English`} value={en} onChange={(e) => onEn(e.target.value)} />
        : textarea
          ? <textarea className="ta" aria-label={`${label} in Arabic`} {...arabicProps} value={ar} onChange={(e) => onAr(e.target.value)} />
          : <input className="inp" aria-label={`${label} in Arabic`} {...arabicProps} value={ar} onChange={(e) => onAr(e.target.value)} />}
      {hint && <span className="f__hint">{hint}</span>}
    </div>
  );
}
