'use client';

import { useState } from 'react';
import { egp } from '@/lib/pricing';
import type { UnitRow } from '@/lib/queries/units';
import { Hint, Placeholder, TYPE_LABEL } from '@/components/ui/atoms';

/**
 * Broadcasts.
 *
 * Two derived things matter here. The character count is real, because WhatsApp
 * folds a message at roughly 300 and an agency writing past that is talking to
 * nobody — the static build printed 201 next to a message that is 203 characters
 * long. And the audience number in the send button is the same value as the
 * one in the panel above it, rather than a second copy that could disagree
 * about how many people are about to be messaged.
 */

const FOLD = 300;

const SEGMENTS = [
  { id: 'all', label: 'Everyone who enquired', size: 412, note: 'Everyone who has ever enquired, minus 34 who opted out.' },
  { id: 'coast', label: 'Interested in the North Coast', size: 96, note: 'Anyone whose enquiry named a North Coast unit or zone.' },
  { id: 'budget', label: 'Budget under EGP 10M', size: 148, note: 'Taken from the budget field on your lead form.' },
  { id: 'quiet', label: 'Went quiet after one reply', size: 57, note: 'Replied once, then nothing for 14 days.' },
];

export function Broadcast({ units }: { units: UnitRow[] }) {
  const [segment, setSegment] = useState(SEGMENTS[0].id);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [sent, setSent] = useState(false);

  const [en, setEn] = useState(
    'Autumn launch at Mivida: 5% off the down payment on four units until 30 September. The roof-garden penthouse is EGP 8,450,000 with the plan over eight years. Reply here and I will send the full plan.'
  );
  const [ar, setAr] = useState(
    'عرض الخريف في ميفيدا: خصم 5% على المقدم لأربع وحدات حتى 30 سبتمبر. البنتهاوس بحديقة السطح بـ 8,450,000 ج.م وخطة سداد حتى ثماني سنوات. ابعتلي هنا وهبعتلك الخطة كاملة.'
  );

  const seg = SEGMENTS.find((s) => s.id === segment)!;
  const text = lang === 'en' ? en : ar;
  const unit = units.find((u) => u.id === unitId);
  const over = text.length > FOLD;

  return (
    <form className="two-col" onSubmit={(e) => e.preventDefault()}>
      <div className="ed__form">
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">1</span>
            <span className="fset__title">Who gets it</span>
            <span className="fset__meta"><Caret /></span>
          </summary>
          <div className="fset__body">
            <div className="fgrid">
              <div className="f">
                <label className="f__label" htmlFor="b-channel">Channel</label>
                <span className="selwrap">
                  <select className="sel" id="b-channel">
                    <option>WhatsApp</option><option>SMS</option><option>Email</option>
                  </select>
                  <SelCaret />
                </span>
              </div>
              <div className="f">
                <label className="f__label" htmlFor="b-segment">Segment</label>
                <span className="selwrap">
                  <select className="sel" id="b-segment" value={segment} onChange={(e) => setSegment(e.target.value)}>
                    {SEGMENTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label} ({s.size})</option>
                    ))}
                  </select>
                  <SelCaret />
                </span>
              </div>
            </div>

            <div className="audience">
              <span className="audience__n">{seg.size}</span>
              <span className="audience__txt">
                <b>contacts will get this</b>
                <span>{seg.note}</span>
              </span>
            </div>
          </div>
        </details>

        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">2</span>
            <span className="fset__title">The message</span>
            <span className="fset__meta">
              <Hint about="About message length">
                WhatsApp shows about {FOLD} characters before a &ldquo;read more&rdquo;. Anything
                past that is only seen by people who tap.
              </Hint>
              <Caret />
            </span>
          </summary>
          <div className="fset__body">
            <div className="lang-field">
              <div className="lang-field__top">
                <span className="f__label">Text</span>
                <span className="lang-tabs">
                  <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                  <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
                </span>
              </div>
              {lang === 'en' ? (
                <textarea className="ta" aria-label="Message in English" value={en} onChange={(e) => setEn(e.target.value)} />
              ) : (
                <textarea
                  className="ta" aria-label="Message in Arabic" lang="ar" dir="rtl"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                  value={ar} onChange={(e) => setAr(e.target.value)}
                />
              )}
            </div>
            {/* Counted, not typed. */}
            <span className="charcount" style={over ? { color: 'var(--warn)' } : undefined}>
              <b>{text.length}</b>/{FOLD} before WhatsApp folds it
            </span>
          </div>
        </details>

        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">3</span>
            <span className="fset__title">Attach a unit</span>
            <span className="fset__meta"><Caret /></span>
          </summary>
          <div className="fset__body">
            <div className="f">
              <label className="f__label" htmlFor="b-unit">Unit card</label>
              <span className="selwrap">
                <select className="sel" id="b-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.titleEn} — {u.compound ?? u.zone}</option>
                  ))}
                  <option value="">No unit, text only</option>
                </select>
                <SelCaret />
              </span>
            </div>
          </div>
        </details>

        <div className="savebar">
          <span className="savebar__chip"><i aria-hidden="true" /><span>{sent ? 'Not sent — see below' : 'Not sent'}</span></span>
          <span className="savebar__end">
            <button className="btn btn--app" type="button">Send a test to me</button>
            {/* The same value as the panel above, not a second copy of it. */}
            <button className="btn btn--go" type="button" onClick={() => setSent(true)}>
              Send to {seg.size}
            </button>
          </span>
        </div>

        {sent && (
          <p className="rolenote" role="status">
            <b>Nothing was sent</b>
            There is no WhatsApp Business connection and no contact store in this build, so no
            message left the building. Nobody was messaged — this button is wired to the preview
            only.
          </p>
        )}
      </div>

      <aside className="two-col__side" aria-label="Message preview">
        <section className="panel panel--pad">
          <h2 className="panel__title" style={{ marginBottom: 12 }}>How it arrives</h2>
          <div className="wa-preview">
            {unit && (
              <div className="wa-card">
                <Placeholder label={`${TYPE_LABEL[unit.type]?.toLowerCase()} · ${unit.compound ?? unit.zone} · 16:9`} />
                <div className="wa-card__body">
                  <b>{unit.titleEn}</b>
                  <span>{egp(unit.price)} · {unit.compound ?? unit.zone}</span>
                </div>
              </div>
            )}
            <div className="wa-bubble" lang={lang === 'ar' ? 'ar' : undefined} dir={lang === 'ar' ? 'rtl' : undefined}>
              {text}
            </div>
          </div>
          <p className="f__hint" style={{ marginTop: 12 }}>
            Type in the box and this updates, in whichever script you are writing.
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
