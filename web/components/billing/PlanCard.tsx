'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ANNUAL, ANNUAL_SAVING, FREE_MONTHS, MONTHLY, egp, type Cycle } from '@/lib/queries/billing';

/**
 * The plan card and the cancel flow.
 *
 * Every figure is computed from MONTHLY, so the annual price, the saving and
 * the sentence describing them move together. The static build wrote 990, 9,900
 * and 1,980 as three separate literals that happened to be consistent.
 */
export function PlanCard() {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const price = cycle === 'annual' ? ANNUAL : MONTHLY;

  return (
    <section className="plancard" aria-labelledby="plan-h">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 210 }}>
        <span className="st st--live" style={{ alignSelf: 'flex-start' }}>Active</span>
        <h2 className="panel__title" id="plan-h" style={{ fontSize: 'var(--t-body-sm)' }}>
          Pro — everything included
        </h2>
        <span className="plancard__price">
          {egp(price)}
          <span style={{ fontSize: 'var(--t-micro)', fontWeight: 400, color: 'var(--text-3)' }}>
            {' '}/ {cycle === 'annual' ? 'year' : 'month'}
          </span>
        </span>
        <span style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)' }}>
          {cycle === 'annual'
            ? `Billed once a year. ${FREE_MONTHS} months free.`
            : `Billed monthly. Annual saves ${FREE_MONTHS} months.`}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button type="button" aria-pressed={cycle === 'monthly'} onClick={() => setCycle('monthly')}>
            Monthly
          </button>
          <button type="button" aria-pressed={cycle === 'annual'} onClick={() => setCycle('annual')}>
            Annual · {FREE_MONTHS} months free
          </button>
        </div>
        <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.6 }}>
          {cycle === 'monthly' ? (
            <>
              <b style={{ color: 'var(--text)' }}>{egp(MONTHLY)}</b> charged on the 3rd of each
              month. Switching to annual would cost <b style={{ color: 'var(--text)' }}>{egp(ANNUAL)}</b>{' '}
              once and save you <b style={{ color: 'var(--text)' }}>{egp(ANNUAL_SAVING)}</b> a year.
            </>
          ) : (
            <>
              <b style={{ color: 'var(--text)' }}>{egp(ANNUAL)}</b> charged once a year — the same
              as {egp(Math.round(ANNUAL / 12))} a month, and{' '}
              <b style={{ color: 'var(--text)' }}>{egp(ANNUAL_SAVING)}</b> less than paying monthly.
            </>
          )}
        </p>
      </div>

      <div className="plancard__end">
        <button
          className="btn btn--go"
          type="button"
          onClick={() => setCycle((c) => (c === 'monthly' ? 'annual' : 'monthly'))}
        >
          Switch to {cycle === 'monthly' ? 'annual' : 'monthly'}
        </button>
        <Link className="btn btn--app" href="/#features">See what is included</Link>
      </div>
    </section>
  );
}

/**
 * Cancelling, with the retention offer shown once and taking no for an answer.
 *
 * The offer is real — a pause is cheaper for the agency than cancelling and
 * cheaper for us than losing them — but it appears once and the second button
 * is a plain "cancel anyway", not a smaller or greyer one. A dark pattern here
 * would be noticed by exactly the people who are already leaving.
 */
export function CancelZone({ periodEnd }: { periodEnd: string }) {
  const [step, setStep] = useState<'idle' | 'offer' | 'paused' | 'cancelled'>('idle');

  return (
    <>
      <section className="danger-zone" style={{ marginTop: 4 }}>
        <div>
          <b>Cancel the subscription</b>
          <p>
            Your storefront goes offline at the end of the period you have paid for — {periodEnd}.
            Your units, leads and deals are kept for ninety days, so coming back is one payment
            and nothing else. Export first if you want a copy regardless.
          </p>
        </div>
        <button
          className="btn btn--danger"
          type="button"
          disabled={step !== 'idle'}
          onClick={() => setStep('offer')}
        >
          Cancel subscription
        </button>
      </section>

      {step === 'offer' && (
        <section className="panel panel--pad" style={{ borderColor: 'var(--accent)' }}>
          <h2 className="panel__title" style={{ marginBottom: 8 }}>Before you go</h2>
          <p style={{ fontSize: 'var(--t-micro)', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '60ch' }}>
            If it is the money, we can pause the store for two months at no charge instead.
            Everything stays exactly as it is and the storefront keeps working — most agencies
            who pause do it over Ramadan or August and come back.
          </p>
          <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginTop: 8 }}>
            If it is something else, tell us what and we will fix it or help you export cleanly.
            Either way this is the only time we will ask.
          </p>
          <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn btn--go" type="button" onClick={() => setStep('paused')}>
              Pause for two months instead
            </button>
            <button className="btn btn--app" type="button" onClick={() => setStep('cancelled')}>
              No, cancel anyway
            </button>
          </div>
        </section>
      )}

      {(step === 'paused' || step === 'cancelled') && (
        <section className="panel panel--pad" role="status">
          <h2 className="panel__title" style={{ marginBottom: 8 }}>Nothing has changed yet</h2>
          <p style={{ fontSize: 'var(--t-micro)', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '60ch' }}>
            {/* There is no subscription store and no payment provider wired up.
                Saying "cancelled" here would be the most expensive lie in the
                product: an agency would stop expecting to be charged. */}
            There is no billing provider connected to this build, so{' '}
            {step === 'paused' ? 'the pause' : 'the cancellation'} was not recorded and your
            subscription is untouched. When Paymob is wired up this{' '}
            {step === 'paused'
              ? 'pauses the store for two months and moves your next payment date.'
              : `keeps the storefront live until ${periodEnd} and then takes it offline.`}
          </p>
          <button
            className="btn btn--app"
            type="button"
            style={{ marginTop: 14 }}
            onClick={() => setStep('idle')}
          >
            Back
          </button>
        </section>
      )}
    </>
  );
}
