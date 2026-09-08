'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { computePlan, egp } from '@/lib/pricing';
import type { TenantStore } from '@/lib/mock';
import type { UnitRow } from '@/lib/queries/units';
import { Placeholder, TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The storefront builder.
 *
 * One state object, and the rail, the inspector and the preview all render from
 * it — which is the difference between a builder and a picture of one. Editing
 * a heading moves it in the canvas; dragging a section reorders what a buyer
 * would scroll through.
 *
 * The preview renders the agency's real units through the same `computePlan`
 * the buyer's page uses. The static build kept a separate four-unit array for
 * this screen, so an agency could arrange a homepage around stock it did not
 * have, and the instalment shown here was not the instalment anyone would be
 * quoted.
 */

type SectionId = 'hero' | 'featured' | 'map' | 'calc' | 'team' | 'testimonials' | 'offers' | 'faq';

type Section = {
  id: string;
  kind: SectionId;
  name: string;
  hidden: boolean;
  heading?: string;
  headingAr?: string;
  sub?: string;
  collection?: string;
  cards?: number;
  fields?: { price: boolean; terms: boolean; area: boolean; beds: boolean };
  bg?: string;
  pad?: number;
};

const LIBRARY: { kind: SectionId; name: string; blurb: string }[] = [
  { kind: 'featured', name: 'Featured units', blurb: 'A row of units from a collection.' },
  { kind: 'map', name: 'Map explorer', blurb: 'Units by zone, as a grid buyers can scan.' },
  { kind: 'calc', name: 'Payment plan calculator', blurb: 'Sliders for down payment and years.' },
  { kind: 'team', name: 'Team / agents', blurb: 'Your agents, with a WhatsApp button each.' },
  { kind: 'testimonials', name: 'Testimonials', blurb: 'What buyers said, in their own words.' },
  { kind: 'offers', name: 'Current offers', blurb: 'Anything running, with its countdown.' },
  { kind: 'faq', name: 'Questions buyers ask', blurb: 'Delivery, payment, finishing.' },
];

const START: Section[] = [
  { id: 's1', kind: 'hero', name: 'Search hero', hidden: false, heading: 'Find your unit', headingAr: 'اعثر على وحدتك' },
  {
    id: 's2', kind: 'featured', name: 'Featured units', hidden: false,
    heading: 'Featured units', headingAr: 'وحدات مختارة',
    sub: 'Hand-picked this week by our team',
    collection: 'sahel-2027', cards: 3,
    fields: { price: true, terms: true, area: true, beds: true },
    bg: '#FFFFFF', pad: 64,
  },
  { id: 's3', kind: 'map', name: 'Map explorer', hidden: false, heading: 'Where we sell', headingAr: 'مناطقنا' },
  { id: 's4', kind: 'calc', name: 'Payment plan calculator', hidden: false, heading: 'Work out your instalment', headingAr: 'احسب القسط' },
  { id: 's5', kind: 'team', name: 'Team / agents', hidden: false, heading: 'Talk to us', headingAr: 'كلّمنا' },
  { id: 's6', kind: 'testimonials', name: 'Testimonials', hidden: false, heading: 'What buyers said', headingAr: 'آراء المشترين' },
];

export function Builder({
  store,
  units,
  collections,
}: {
  store: TenantStore;
  units: UnitRow[];
  collections: { slug: string; name: string; count: number }[];
}) {
  const [sections, setSections] = useState<Section[]>(START);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [dirty, setDirty] = useState<string[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const nextId = useRef(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [library, setLibrary] = useState(false);
  const [page, setPage] = useState({
    title: `${store.nameEn} — ${store.slug.includes('kamal') ? 'New Cairo & Sahel' : 'Sheikh Zayed'}`,
    meta: `${units.length} units with payment plans up to 8 years.`,
    contentWidth: 1200,
    spacing: 64,
  });

  const current = sections.find((s) => s.id === selected) ?? null;

  /** Record what changed, once per section, so the publish list is a set of
   *  edits rather than a keystroke log. */
  const mark = (label: string) => {
    setDirty((d) => (d.includes(label) ? d : [...d, label]));
    setPublished(false);
  };

  function update(id: string, patch: Partial<Section>) {
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const s = sections.find((x) => x.id === id);
    if (s) mark(`${s.name} edited`);
  }

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    setSections((ss) => {
      const from = ss.findIndex((s) => s.id === fromId);
      const to = ss.findIndex((s) => s.id === toId);
      if (from < 0 || to < 0) return ss;
      const next = [...ss];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    const s = sections.find((x) => x.id === fromId);
    if (s) mark(`${s.name} moved`);
  }

  function add(kind: SectionId, name: string) {
    // A counter rather than Date.now(): rendering must be pure, and two
    // sections added in the same millisecond would have collided anyway.
    nextId.current += 1;
    const id = `s-new-${nextId.current}`;
    setSections((ss) => [...ss, { id, kind, name, hidden: false, heading: name, pad: 64 }]);
    mark(`${name} added`);
    setLibrary(false);
    setSelected(id);
  }

  function remove(id: string) {
    const s = sections.find((x) => x.id === id);
    setSections((ss) => ss.filter((x) => x.id !== id));
    if (selected === id) setSelected(null);
    if (s) mark(`${s.name} removed`);
  }

  const visible = sections.filter((s) => !s.hidden);
  const frameWidth = device === 'mobile' ? 390 : device === 'tablet' ? 768 : page.contentWidth;

  return (
    <div className="bx" id="bx">
      {/* ============================================ chrome */}
      <header className="bx__bar">
        <Link className="bx__back" href="/dash">
          <span>Dashboard</span>
        </Link>
        <span className="bx__rule" aria-hidden="true" />

        <span className="bx__store">
          <span className="bx__store-avatar">
            {store.nameEn.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <b>{store.nameEn}</b>
        </span>
        <span className={`bx__status ${dirty.length ? 'bx__status--draft' : 'bx__status--live'}`}>
          {dirty.length ? `${dirty.length} unpublished` : 'Live'}
        </span>
        <span className="bx__page">Home page</span>

        <div className="bx__centre">
          <div className="seg-dark" role="tablist" aria-label="Preview size">
            {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
              <button key={d} type="button" role="tab" aria-selected={device === d} onClick={() => setDevice(d)}>
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <div className="seg-dark" role="tablist" aria-label="Preview language">
            <button type="button" role="tab" aria-selected={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            <button type="button" role="tab" aria-selected={lang === 'ar'} lang="ar" onClick={() => setLang('ar')}>ع</button>
          </div>
        </div>

        <div className="bx__end">
          <span className="pubwrap">
            <button
              className="bx__save"
              type="button"
              disabled={dirty.length === 0}
              aria-haspopup="true"
              aria-expanded={publishing}
              onClick={() => setPublishing((p) => !p)}
            >
              Save
            </button>

            {publishing && (
              <div className="pubpop" role="dialog" aria-label="Publish changes">
                <h3>Publish these changes?</h3>
                <div className="pubpop__list">
                  {/* The actual edits, collected as they happened. */}
                  {dirty.map((d) => <div key={d}>{d}</div>)}
                </div>
                <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-4)', lineHeight: 1.5 }}>
                  Buyers see nothing until you publish. Your draft is saved either way.
                </p>
                <div className="pubpop__foot">
                  <button
                    className="btn btn--app" type="button" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setPublishing(false)}
                  >
                    Keep editing
                  </button>
                  <button
                    className="btn btn--go" type="button" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => { setPublished(true); setPublishing(false); }}
                  >
                    Publish
                  </button>
                </div>
              </div>
            )}
          </span>
        </div>
      </header>

      {published && (
        <p className="note" role="status" style={{ margin: '10px 16px', height: 'auto', padding: '10px 16px', lineHeight: 1.5 }}>
          {/* No StorefrontPage rows and no publish pipeline. Saying "published"
              would put an agency's homepage in a state it is not in. */}
          <b>Not published.</b> There is no page store yet, so the arrangement lives in this tab
          only and your storefront is unchanged. The edits are listed above so you can see exactly
          what would have gone live.
        </p>
      )}

      <div className="bx__body">
        {/* ============================================ rail */}
        <aside className="bx__rail" id="bxRail">
          <div className="bx__tabs" role="tablist" aria-label="Builder panels">
            <button type="button" role="tab" aria-selected="true">Sections</button>
          </div>

          <div className="bx__scroll">
            <p className="bx__group-label">Header</p>
            <div className="slist">
              <Locked name="Announcement bar" />
              <Locked name="Header" />
            </div>

            <p className="bx__group-label">
              Template <span className="count">{sections.length}</span>
            </p>
            <div className="slist">
              {sections.map((s) => (
                <button
                  key={s.id}
                  className={`srow${selected === s.id ? ' srow--on' : ''}${s.hidden ? ' srow--off' : ''}`}
                  type="button"
                  draggable
                  aria-current={selected === s.id}
                  onClick={() => setSelected(s.id)}
                  onDragStart={() => setDragging(s.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging) move(dragging, s.id);
                    setDragging(null);
                  }}
                  onDragEnd={() => setDragging(null)}
                >
                  <Grip />
                  <span className="srow__name">{s.name}</span>
                  <span
                    className="srow__eye"
                    role="button"
                    tabIndex={0}
                    aria-label={`${s.hidden ? 'Show' : 'Hide'} ${s.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      update(s.id, { hidden: !s.hidden });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        update(s.id, { hidden: !s.hidden });
                      }
                    }}
                  >
                    {s.hidden ? '◌' : '◉'}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="add-section"
              type="button"
              aria-haspopup="true"
              aria-expanded={library}
              onClick={() => setLibrary((l) => !l)}
            >
              Add section
            </button>

            {library && (
              <div className="slist" style={{ marginTop: 8 }}>
                {LIBRARY.map((l) => (
                  <button className="srow" type="button" key={l.kind + l.name} onClick={() => add(l.kind, l.name)}>
                    <span className="srow__name">
                      {l.name}
                      <span style={{ display: 'block', fontSize: 'var(--t-pico)', color: 'var(--text-4)' }}>
                        {l.blurb}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="bx__group-label">Footer</p>
            <div className="slist">
              <Locked name="Footer" />
            </div>
          </div>
        </aside>

        {/* ============================================ canvas */}
        <div className="bx__canvas">
          <div
            className="bx__frame"
            style={{ width: frameWidth, maxWidth: '100%', marginInline: 'auto' }}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            lang={lang === 'ar' ? 'ar' : 'en'}
          >
            {visible.length === 0 ? (
              <div className="empty" style={{ margin: 24 }}>
                <h3>Every section is hidden</h3>
                <p>Your storefront would show only the header and footer. Turn one back on.</p>
              </div>
            ) : (
              visible.map((s) => (
                <section
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  style={{
                    background: s.bg ?? 'var(--panel)',
                    paddingBlock: s.pad ?? 48,
                    paddingInline: 24,
                    outline: selected === s.id ? '2px solid var(--accent)' : 'none',
                    outlineOffset: -2,
                    cursor: 'pointer',
                  }}
                >
                  <Preview section={s} units={units} lang={lang} collections={collections} />
                </section>
              ))
            )}
          </div>
        </div>

        {/* ============================================ inspector */}
        <aside className="bx__insp" aria-label="Settings">
          {current ? (
            <SectionInspector
              section={current}
              collections={collections}
              onChange={(patch) => update(current.id, patch)}
              onRemove={() => remove(current.id)}
              onBack={() => setSelected(null)}
            />
          ) : (
            <PageInspector page={page} onChange={(p) => { setPage(p); mark('Page settings edited'); }} />
          )}
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ preview */

function Preview({
  section, units, lang, collections,
}: {
  section: Section; units: UnitRow[]; lang: 'en' | 'ar';
  collections: { slug: string; name: string; count: number }[];
}) {
  const heading = lang === 'ar' ? (section.headingAr ?? section.heading) : section.heading;

  if (section.kind === 'featured') {
    // Real units, so an agency cannot arrange a homepage around stock it has
    // not got — and the terms are computePlan's, not a second opinion.
    const live = units.filter((u) => u.status === 'LIVE').slice(0, section.cards ?? 3);
    return (
      <>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>{heading}</h2>
        {section.sub && <p style={{ color: 'var(--text-3)', fontSize: 'var(--t-micro)', marginBottom: 14 }}>{section.sub}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.cards ?? 3}, minmax(0,1fr))`, gap: 12 }}>
          {live.map((u) => {
            const plan = computePlan(
              { price: u.price, downPct: u.downPct ?? 0, years: u.years ?? 1 },
              u.areaSqm
            );
            return (
              <article key={u.id} style={{ border: '1px solid var(--rule)', borderRadius: 'var(--r-12)', overflow: 'hidden' }}>
                <Placeholder label={`${TYPE_LABEL[u.type]?.toLowerCase()} · 4:3`} />
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <b style={{ fontSize: 'var(--t-micro)' }}>{lang === 'ar' ? u.titleAr : u.titleEn}</b>
                  <span style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)' }}>
                    {section.fields?.area !== false && `${u.areaSqm} m²`}
                    {section.fields?.beds !== false && u.bedrooms ? ` · ${u.bedrooms} bed` : ''}
                  </span>
                  {section.fields?.price !== false && <b style={{ fontSize: 'var(--t-micro)' }}>{egp(u.price)}</b>}
                  {section.fields?.terms !== false && u.downPct && (
                    <span style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)' }}>
                      {u.downPct}% down · {egp(plan.monthly)}/mo
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {section.collection && (
          <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-4)', marginTop: 10 }}>
            From “{collections.find((c) => c.slug === section.collection)?.name ?? section.collection}”
          </p>
        )}
      </>
    );
  }

  if (section.kind === 'map') {
    const zones = [...new Set(units.filter((u) => u.status === 'LIVE').map((u) => u.zone))];
    return (
      <>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10 }}>{heading}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {zones.map((z) => (
            <span key={z} className="chip">
              {z} ({units.filter((u) => u.zone === z && u.status === 'LIVE').length})
            </span>
          ))}
        </div>
      </>
    );
  }

  if (section.kind === 'calc') {
    const u = units.find((x) => x.downPct) ?? units[0];
    const plan = u ? computePlan({ price: u.price, downPct: u.downPct ?? 10, years: u.years ?? 8 }, u.areaSqm) : null;
    return (
      <>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10 }}>{heading}</h2>
        {plan && (
          <div className="calc__result" style={{ maxWidth: 320 }}>
            <small>Monthly instalment</small>
            <b>{egp(plan.monthly)}</b>
            <span>{plan.months} payments after {egp(plan.downPayment)} down</span>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 10 }}>{heading ?? section.name}</h2>
      <Placeholder label={`${section.name.toLowerCase()} · 16:9`} />
    </>
  );
}

/* --------------------------------------------------------------- inspectors */

function SectionInspector({
  section, collections, onChange, onRemove, onBack,
}: {
  section: Section;
  collections: { slug: string; name: string; count: number }[];
  onChange: (patch: Partial<Section>) => void;
  onRemove: () => void;
  onBack: () => void;
}) {
  return (
    <div className="insp">
      <div className="insp__head">
        <button className="insp__back" type="button" onClick={onBack}>← Page settings</button>
        <b>{section.name}</b>
      </div>

      <div className="insp__body">
        <div className="f">
          <label className="f__label" htmlFor="i-heading">Heading</label>
          <input
            className="inp" id="i-heading"
            value={section.heading ?? ''}
            onChange={(e) => onChange({ heading: e.target.value })}
          />
        </div>

        <div className="f">
          <label className="f__label" htmlFor="i-heading-ar">Heading in Arabic</label>
          <input
            className="inp" id="i-heading-ar" lang="ar" dir="rtl"
            style={{ fontFamily: 'var(--font-arabic)' }}
            value={section.headingAr ?? ''}
            onChange={(e) => onChange({ headingAr: e.target.value })}
          />
        </div>

        {section.kind === 'featured' && (
          <>
            <div className="f">
              <label className="f__label" htmlFor="i-sub">Sub-heading</label>
              <input className="inp" id="i-sub" value={section.sub ?? ''} onChange={(e) => onChange({ sub: e.target.value })} />
            </div>
            <div className="f">
              <label className="f__label" htmlFor="i-coll">Collection</label>
              <span className="selwrap">
                <select
                  className="sel" id="i-coll"
                  value={section.collection ?? ''}
                  onChange={(e) => onChange({ collection: e.target.value })}
                >
                  {/* The agency's real collections, each with its live count. */}
                  {collections.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name} ({c.count})</option>
                  ))}
                </select>
                <span className="selwrap__caret">
                  <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </div>
            <div className="f">
              <label className="f__label" htmlFor="i-cards">Cards in the row</label>
              <input
                className="inp" id="i-cards" type="number" min={1} max={4}
                value={section.cards ?? 3}
                onChange={(e) => onChange({ cards: Math.min(4, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div className="f">
              <span className="f__label">Show on the card</span>
              {(['price', 'terms', 'area', 'beds'] as const).map((k) => (
                <label key={k} className="sw-row" style={{ alignItems: 'center' }}>
                  <input
                    className="sw" type="checkbox"
                    checked={section.fields?.[k] ?? true}
                    onChange={(e) =>
                      onChange({
                        fields: {
                          ...(section.fields ?? { price: true, terms: true, area: true, beds: true }),
                          [k]: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="sw-row__txt"><b>{k[0].toUpperCase() + k.slice(1)}</b></span>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="f">
          <label className="f__label" htmlFor="i-pad">Padding</label>
          <span className="inp-unit">
            <input
              className="inp" id="i-pad" type="number"
              value={section.pad ?? 48}
              onChange={(e) => onChange({ pad: Number(e.target.value) })}
            />
            <span className="inp-unit__u">px</span>
          </span>
        </div>

        <button className="btn btn--danger" type="button" onClick={onRemove} style={{ marginTop: 10 }}>
          Remove section
        </button>
      </div>
    </div>
  );
}

type Page = { title: string; meta: string; contentWidth: number; spacing: number };

function PageInspector({ page, onChange }: { page: Page; onChange: (p: Page) => void }) {
  return (
    <div className="insp">
      <div className="insp__head"><b>Page settings</b></div>
      <div className="insp__body">
        <div className="f">
          <label className="f__label" htmlFor="p-title">Page title</label>
          <input className="inp" id="p-title" value={page.title} onChange={(e) => onChange({ ...page, title: e.target.value })} />
          <span className="f__hint">What Google shows as the headline.</span>
        </div>
        <div className="f">
          <label className="f__label" htmlFor="p-meta">Meta description</label>
          <textarea className="ta" id="p-meta" value={page.meta} onChange={(e) => onChange({ ...page, meta: e.target.value })} />
          <span className="f__hint">{page.meta.length}/160 before Google trims it.</span>
        </div>
        <div className="f">
          <label className="f__label" htmlFor="p-width">Content width</label>
          <span className="inp-unit">
            <input
              className="inp" id="p-width" type="number"
              value={page.contentWidth}
              onChange={(e) => onChange({ ...page, contentWidth: Number(e.target.value) })}
            />
            <span className="inp-unit__u">px</span>
          </span>
        </div>
        <p className="f__hint">
          Select a section in the canvas or the list to edit it. Nothing here is published until
          you press Save.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- bits */

function Grip() {
  return (
    <span className="srow__grip" aria-hidden="true">
      <svg width="9" height="12" viewBox="0 0 9 12">
        {[2, 6, 10].map((y) => (
          <g key={y}>
            <circle cx="2" cy={y} r="1.1" fill="currentColor" />
            <circle cx="7" cy={y} r="1.1" fill="currentColor" />
          </g>
        ))}
      </svg>
    </span>
  );
}

/** Header and footer are not rearrangeable, and saying so is kinder than
 *  letting someone drag one and watch it snap back. */
function Locked({ name }: { name: string }) {
  return (
    <button className="srow srow--locked" type="button" disabled title="Always on, and always in this position">
      <Grip />
      <span className="srow__name">{name}</span>
    </button>
  );
}
