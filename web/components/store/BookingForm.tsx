'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { requestViewing } from '@/app/(storefront)/s/[host]/contact/actions';
import { viewingMessage, SLOT_TIMES, IDLE, type BookableDay, type BookingState } from '@/lib/queries/booking';
import { WhatsAppMark } from './icons';

/**
 * The booking form, and the confirmation it turns into.
 *
 * The slot picker is radio inputs, not the static build's `aria-pressed`
 * buttons. Buttons need JavaScript to hold a selection and to put it in the
 * payload; radios carry both natively. Together with `useActionState` — which
 * Next replays server-side on a plain form post — the whole screen works with
 * scripting off, which the house rules require and which, for a buyer on a
 * throttled connection, is not a hypothetical audience.
 *
 * The look is the design system's, unchanged: `.slot-day` and `.slot-time`
 * style the label, and the small block on the page maps `:has(:checked)` onto
 * the `[aria-pressed="true"]` rules those classes already carry.
 */
export function BookingForm({
  host,
  storeName,
  storePhone,
  whatsapp,
  days,
  units,
  defaultUnit,
}: {
  host: string;
  storeName: string;
  storePhone: string | null;
  whatsapp: string | null;
  days: BookableDay[];
  units: { reference: string; label: string }[];
  defaultUnit?: string;
}) {
  const [state, action, pending] = useActionState<BookingState, FormData>(requestViewing, IDLE);

  if (state.status === 'filed' || state.status === 'handoff') {
    return (
      <Confirmation
        state={state}
        storeName={storeName}
        storePhone={storePhone}
        whatsapp={whatsapp}
        units={units}
      />
    );
  }

  const errorFor = (field: string) =>
    state.status === 'invalid' ? state.errors.find((e) => e.field === field)?.message : undefined;

  const kept = state.status === 'invalid' ? state.values : null;
  const firstOpen = days.find((d) => !d.closed)?.iso;
  // React resets an uncontrolled form once its action returns. Keying on the
  // attempt remounts it, which is what makes the defaultValues below stick.
  const formKey = state.status === 'invalid' ? state.attempt : 0;
  const danger = { color: 'var(--danger)' };

  return (
    <form className="book__form" action={action} key={formKey}>
      <input type="hidden" name="host" value={host} />

      <div>
        <span className="st-eyebrow">Usually confirmed within the hour</span>
        <h1 className="st-h1" style={{ marginTop: 8 }}>Book a viewing</h1>
        <p className="st-lede" style={{ marginTop: 10 }}>
          Pick a day and a time. We will meet you at the unit, or send a video walkthrough if you
          are abroad.
        </p>
      </div>

      {errorFor('form') && (
        <p className="st-field__hint"><b style={danger}>{errorFor('form')}</b></p>
      )}

      <div className="st-field">
        <label htmlFor="b-unit">Which unit</label>
        <select id="b-unit" name="unit" defaultValue={kept?.unit ?? defaultUnit ?? ''}>
          {units.map((u) => (
            <option key={u.reference} value={u.reference}>{u.label}</option>
          ))}
          <option value="">Not sure yet — help me choose</option>
        </select>
      </div>

      <fieldset style={{ border: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <legend className="st-field" style={{ padding: 0 }}>
          <span style={{ fontSize: 'var(--t-micro)', fontWeight: 500, color: 'var(--nile-ink-2)' }}>Pick a day</span>
        </legend>
        <div className="slot-days">
          {days.map((d) => (
            <label className="slot-day" key={d.iso}>
              <input
                type="radio"
                name="date"
                value={d.iso}
                disabled={d.closed}
                defaultChecked={kept ? d.iso === kept.date : d.iso === firstOpen}
                className="visually-hidden"
              />
              <span>{d.weekday}</span>
              <b>{d.dayNum}</b>
            </label>
          ))}
        </div>
        <p className="st-field__hint">
          {errorFor('date') ? <b style={danger}>{errorFor('date')}</b> : 'Friday is our day off. Everything is Cairo time.'}
        </p>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <legend className="st-field" style={{ padding: 0 }}>
          <span style={{ fontSize: 'var(--t-micro)', fontWeight: 500, color: 'var(--nile-ink-2)' }}>Pick a time</span>
        </legend>
        <div className="slot-times">
          {SLOT_TIMES.map((t) => (
            <label className="slot-time" key={t}>
              <input type="radio" name="time" value={t} defaultChecked={kept?.time === t} className="visually-hidden" />
              {t}
            </label>
          ))}
        </div>
        {errorFor('time') && <p className="st-field__hint"><b style={danger}>{errorFor('time')}</b></p>}
      </fieldset>

      <div className="st-field__row">
        <div className="st-field">
          <label htmlFor="b-name">Your name</label>
          <input id="b-name" name="name" type="text" autoComplete="name" placeholder="Hala Mansour" defaultValue={kept?.name} required />
          {errorFor('name') && <span className="st-field__hint" style={danger}>{errorFor('name')}</span>}
        </div>
        <div className="st-field">
          <label htmlFor="b-phone">Mobile</label>
          {/* dir="ltr": a phone number never mirrors, whatever the page does. */}
          <input id="b-phone" name="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="+20 100 000 0000" defaultValue={kept?.phone} required />
          <span className="st-field__hint" style={errorFor('phone') ? danger : undefined}>
            {errorFor('phone') ?? 'We send the confirmation on WhatsApp.'}
          </span>
        </div>
      </div>

      <div className="st-field">
        <label htmlFor="b-note">Anything we should know</label>
        <textarea id="b-note" name="note" placeholder="Budget, how soon you want to move, whether you need a mortgage." defaultValue={kept?.note} />
      </div>

      <button className="st-btn st-btn--primary" type="submit" style={{ alignSelf: 'flex-start' }} disabled={pending}>
        {pending ? 'Sending…' : 'Request this viewing'}
      </button>
      <p className="st-field__hint">No payment, no commitment. You can move or cancel it on WhatsApp.</p>
    </form>
  );
}

/**
 * What the buyer is told afterwards, and the only place in this product where
 * the copy changes depending on whether a write succeeded. `filed` promises a
 * reply; `handoff` promises nothing and gives them the means to deliver it
 * themselves.
 */
function Confirmation({
  state,
  storeName,
  storePhone,
  whatsapp,
  units,
}: {
  state: Extract<BookingState, { status: 'filed' | 'handoff' }>;
  storeName: string;
  storePhone: string | null;
  whatsapp: string | null;
  units: { reference: string; label: string }[];
}) {
  const unit = units.find((u) => u.reference === state.unitRef);
  const unitLabel = unit ? unit.label.split(' — ')[0] : 'Not chosen yet';

  const handoffHref = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(
        viewingMessage({
          storeName,
          unitLabel: state.unitRef ? `${unitLabel} (${state.unitRef})` : 'not chosen yet',
          dayLabel: state.dayLabel,
          time: state.time,
        })
      )}`
    : null;

  return (
    <section className="book__form" aria-labelledby="done-h">
      <div>
        <span className="st-eyebrow">{state.status === 'filed' ? 'Request received' : 'One step left'}</span>
        <h1 className="st-h1" id="done-h" style={{ marginTop: 8 }}>
          {state.status === 'filed' ? 'We have your request' : 'Send it on WhatsApp'}
        </h1>
      </div>

      <div className="booked" role="status">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: 'none', color: 'var(--success)' }}>
          <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 9l2.4 2.4L12.5 6.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <b>{state.dayLabel} at {state.time}</b>
          {state.unitRef && <> · {unitLabel} <span className="ref" dir="ltr">{state.unitRef}</span></>}
        </span>
      </div>

      {state.status === 'filed' ? (
        <p className="st-lede">
          {storeName} will confirm on WhatsApp, usually within the hour. Nothing is booked until
          they do — the slot is a request, not a reservation.
        </p>
      ) : (
        <>
          <p className="st-lede">
            We could not file this with {storeName} automatically. Send it on WhatsApp and it
            reaches them straight away — the message is already written.
          </p>
          {handoffHref && (
            <a className="st-btn st-btn--primary" href={handoffHref} style={{ alignSelf: 'flex-start' }}>
              <WhatsAppMark />
              Send this on WhatsApp
            </a>
          )}
          {storePhone && (
            <p className="st-field__hint">
              Or call <a href={`tel:${storePhone}`} dir="ltr">{storePhone}</a> during office hours.
            </p>
          )}
        </>
      )}

      <p className="st-field__hint">
        <Link href="/contact">Book another viewing</Link> · <Link href="/units">Keep browsing</Link>
      </p>
    </section>
  );
}
