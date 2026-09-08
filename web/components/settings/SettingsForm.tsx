'use client';

import { useState } from 'react';
import type { TenantStore } from '@/lib/mock';

/**
 * Settings.
 *
 * The values come from the store rather than being typed into the markup, so
 * this screen shows El Masria's details when El Masria is signed in — the
 * static build hard-coded Kamal Estates into every field, including the
 * storefront address in the delete warning, which is the one place a wrong
 * name would be read carefully and acted on.
 *
 * The integrations count in the fieldset summary is derived from the switches,
 * so toggling one moves it.
 */

type Integration = { id: string; label: string; note: string };

const INTEGRATIONS: Integration[] = [
  { id: 'wa', label: 'WhatsApp Business', note: 'Carries every lead reply and broadcast.' },
  { id: 'meta', label: 'Facebook & Instagram lead ads', note: 'New lead-ad submissions land in your inbox within a minute.' },
  { id: 'ga', label: 'Google Analytics', note: 'G-4KM2QX8P1L. Storefront only — nothing from the dashboard is sent.' },
  { id: 'pixel', label: 'Meta Pixel', note: 'Needed if you want to retarget people who viewed a unit.' },
  { id: 'pf', label: 'Property Finder sync', note: 'Pushes your live units to your Property Finder listings once a night.' },
  { id: 'olx', label: 'OLX sync', note: 'Syncs your live units to OLX Properties.' },
];

const CONNECTED_BY_DEFAULT = ['wa', 'meta', 'ga'];

export function SettingsForm({ store, rootDomain }: { store: TenantStore; rootDomain: string }) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [dirty, setDirty] = useState(false);
  const [connected, setConnected] = useState<string[]>(CONNECTED_BY_DEFAULT);
  const [slug, setSlug] = useState(store.slug);
  const [transfer, setTransfer] = useState(false);

  const touch = () => setDirty(true);
  const freeAddress = `${slug || store.slug}.${rootDomain}`;

  return (
    <form className="ed__form" onSubmit={(e) => e.preventDefault()}>
      {/* ---------------------------------------- profile */}
      <details className="fset" id="profile" open>
        <summary>
          <span className="fset__n" aria-hidden="true">1</span>
          <span className="fset__title">Store profile</span>
          <span className="fset__meta"><Caret /></span>
        </summary>
        <div className="fset__body">
          <div className="lang-field">
            <div className="lang-field__top">
              <span className="f__label">Store name</span>
              <span className="lang-tabs">
                <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
              </span>
            </div>
            {lang === 'en' ? (
              <input className="inp" aria-label="Store name in English" defaultValue={store.nameEn} onChange={touch} />
            ) : (
              <input
                className="inp"
                aria-label="Store name in Arabic"
                lang="ar"
                dir="rtl"
                style={{ fontFamily: 'var(--font-arabic)' }}
                defaultValue={store.nameAr}
                onChange={touch}
              />
            )}
          </div>

          <div className="fgrid">
            <div className="f">
              <label className="f__label" htmlFor="s-wa">WhatsApp number</label>
              <span className="inp-unit inp-unit--lead">
                <input
                  className="inp"
                  id="s-wa"
                  type="tel"
                  dir="ltr"
                  defaultValue={(store.whatsapp ?? '').replace(/^\+?20/, '').trim()}
                  onChange={touch}
                />
                <span className="inp-unit__u">+20</span>
              </span>
            </div>
            <div className="f">
              <label className="f__label" htmlFor="s-email">Contact email</label>
              <input className="inp" id="s-email" type="email" dir="ltr" defaultValue={store.email ?? ''} onChange={touch} />
            </div>
          </div>

          <div className="f">
            <label className="f__label" htmlFor="s-address">Office address</label>
            <input className="inp" id="s-address" defaultValue={store.address ?? ''} onChange={touch} />
          </div>

          <div className="sw-row">
            <input
              className="sw"
              type="checkbox"
              id="s-transfer"
              checked={transfer}
              onChange={(e) => { setTransfer(e.target.checked); touch(); }}
            />
            <span className="sw-row__txt">
              <b><label htmlFor="s-transfer">Allow ownership transfer</label></b>
              <span>
                Off by default. Turning it on lets you hand the store to another admin — the only
                way to move billing off your name.
              </span>
            </span>
          </div>
        </div>
      </details>

      {/* ---------------------------------------- domains */}
      <details className="fset" id="domains">
        <summary>
          <span className="fset__n" aria-hidden="true">2</span>
          <span className="fset__title">Domains</span>
          <span className="fset__meta">
            <span className="st st--live">SSL active</span>
            <Caret />
          </span>
        </summary>
        <div className="fset__body">
          <div className="f">
            <label className="f__label" htmlFor="s-sub">Your free address</label>
            <div className="domainbox">
              <input
                id="s-sub"
                value={slug}
                dir="ltr"
                onChange={(e) => { setSlug(e.target.value); touch(); }}
              />
              <span className="domainbox__suffix" dir="ltr">.{rootDomain}</span>
            </div>
            <span className="f__hint">
              This keeps working forever, even after you connect your own domain — old WhatsApp
              links do not break.
            </span>
          </div>

          <div className="f">
            <span className="f__label">Your own domain</span>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px',
                border: '1px solid var(--rule)', borderRadius: 'var(--r-10)',
                background: 'var(--panel-2)', flexWrap: 'wrap',
              }}
            >
              <span className="st st--live">Connected</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-micro)', color: 'var(--text)' }} dir="ltr">
                {store.slug.replace(/-/g, '')}.com
              </span>
              <span className="f__hint" style={{ marginInlineStart: 'auto' }}>
                Certificate renews 12 November 2026
              </span>
            </div>
          </div>

          <div className="f">
            <span className="f__label">The two lines your registrar needs</span>
            <div className="tablescroll">
              <table className="dtable" style={{ minWidth: 0 }}>
                <thead>
                  <tr><th scope="col">Type</th><th scope="col">Name</th><th scope="col">Value</th></tr>
                </thead>
                <tbody>
                  <tr><td><span className="ref">A</span></td><td><span className="ref">@</span></td><td><span className="ref">76.76.21.21</span></td></tr>
                  <tr><td><span className="ref">CNAME</span></td><td><span className="ref">www</span></td><td><span className="ref">cname.{rootDomain}</span></td></tr>
                </tbody>
              </table>
            </div>
            <span className="f__hint">
              Paste these where you bought the domain. If the panel is in Arabic and you cannot
              find the field, send us a screenshot on WhatsApp.
            </span>
          </div>
        </div>
      </details>

      {/* ---------------------------------------- region */}
      <details className="fset" id="region">
        <summary>
          <span className="fset__n" aria-hidden="true">3</span>
          <span className="fset__title">Language &amp; region</span>
          <span className="fset__meta">
            {store.storeLangs === 'BOTH' ? 'EN + AR' : store.storeLangs} · EGP · m²
            <Caret />
          </span>
        </summary>
        <div className="fset__body">
          <div className="fgrid">
            <Field label="Dashboard language" id="s-dash-lang" hint="Yours only. Everyone on the team picks their own."
              options={['English', 'العربية']} onChange={touch} />
            <Field label="Storefront languages" id="s-store-lang"
              options={['Arabic and English', 'Arabic only', 'English only']} onChange={touch} />
          </div>

          <div className="fgrid fgrid--3">
            <Field label="Currency" id="s-currency" options={['EGP — Egyptian pound', 'USD — US dollar']} onChange={touch} />
            <Field label="Area unit" id="s-area" options={['m² — square metres', 'ft² — square feet']} onChange={touch} />
            <Field label="Time zone" id="s-tz" options={['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai']} onChange={touch} />
          </div>

          <div className="sw-row">
            <input className="sw" type="checkbox" id="s-digits" checked disabled readOnly />
            <span className="sw-row__txt">
              <b><label htmlFor="s-digits">Western digits everywhere</label></b>
              <span>
                Locked on. Egyptian buyers read prices in 0–9 even in Arabic copy, and Eastern
                Arabic numerals in a price have cost sellers deals.
              </span>
            </span>
          </div>
        </div>
      </details>

      {/* ---------------------------------------- integrations */}
      <details className="fset" id="integrations">
        <summary>
          <span className="fset__n" aria-hidden="true">4</span>
          <span className="fset__title">Integrations</span>
          {/* Counted from the switches, so toggling one moves it. */}
          <span className="fset__meta">{connected.length} connected<Caret /></span>
        </summary>
        <div className="fset__body">
          {INTEGRATIONS.map((i) => {
            const on = connected.includes(i.id);
            return (
              <div className="sw-row" key={i.id}>
                <input
                  className="sw"
                  type="checkbox"
                  id={`i-${i.id}`}
                  checked={on}
                  onChange={(e) => {
                    setConnected((c) => (e.target.checked ? [...c, i.id] : c.filter((x) => x !== i.id)));
                    touch();
                  }}
                />
                <span className="sw-row__txt">
                  <b><label htmlFor={`i-${i.id}`}>{i.label}</label></b>
                  <span>
                    {on
                      ? i.id === 'wa' && store.whatsapp
                        ? `Connected as ${store.whatsapp}. ${i.note}`
                        : i.id === 'meta'
                          ? `Connected to ${store.nameEn}. ${i.note}`
                          : `Connected. ${i.note}`
                      : `Not connected. ${i.note}`}
                  </span>
                </span>
              </div>
            );
          })}

          <div className="f">
            <label className="f__label" htmlFor="s-api">API key</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="inp inp--computed"
                id="s-api"
                readOnly
                value="am_live_••••••••••••••••••••3f71"
                dir="ltr"
                style={{ flex: 1, minWidth: 220 }}
              />
              <button className="btn btn--app" type="button">Reveal</button>
              <button className="btn btn--app" type="button">Rotate</button>
            </div>
            <span className="f__hint">
              Rotating invalidates the old key immediately. Anything using it stops working until
              you paste the new one.
            </span>
          </div>
        </div>
      </details>

      {/* ---------------------------------------- data */}
      <details className="fset" id="data">
        <summary>
          <span className="fset__n" aria-hidden="true">5</span>
          <span className="fset__title">Import &amp; export</span>
          <span className="fset__meta"><Caret /></span>
        </summary>
        <div className="fset__body">
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button className="btn btn--app" type="button">Export all listings (CSV)</button>
            <button className="btn btn--app" type="button">Export leads &amp; deals (CSV)</button>
            <button className="btn btn--app" type="button">Import a spreadsheet</button>
          </div>
          <p className="f__hint">
            Your data is yours. Exports are the full record, not a summary, and there is no charge
            for taking it.
          </p>
        </div>
      </details>

      {/* ---------------------------------------- danger */}
      <section id="danger" style={{ marginTop: 6 }}>
        <h2 className="panel__title" style={{ marginBottom: 10 }}>Danger zone</h2>
        <div className="danger-zone">
          <div>
            <b>Delete this store</b>
            <p>
              Removes every unit, lead, deal and the storefront itself. The address{' '}
              {/* The real address, from the field above. A delete warning naming
                  somebody else's store is the worst place for a stale literal. */}
              <span style={{ fontFamily: 'var(--font-mono)' }} dir="ltr">{freeAddress}</span> is
              released and someone else can claim it. Export first — this cannot be undone and we
              do not keep a copy.
            </p>
          </div>
          <button className="btn btn--danger" type="button">Delete store</button>
        </div>
      </section>

      <div className="savebar">
        <span className="savebar__chip" {...(dirty ? { 'data-dirty': '' } : {})}>
          <i aria-hidden="true" />
          <span>{dirty ? 'Unsaved changes' : 'Saved · 2s ago'}</span>
        </span>
        <span className="savebar__end">
          <button className="btn btn--go" type="button" onClick={() => setDirty(false)}>
            Save settings
          </button>
        </span>
      </div>
    </form>
  );
}

function Field({
  label, id, options, hint, onChange,
}: {
  label: string; id: string; options: string[]; hint?: string; onChange: () => void;
}) {
  return (
    <div className="f">
      <label className="f__label" htmlFor={id}>{label}</label>
      <span className="selwrap">
        <select className="sel" id={id} onChange={onChange}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <span className="selwrap__caret">
          <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      {hint && <span className="f__hint">{hint}</span>}
    </div>
  );
}

function Caret() {
  return (
    <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
