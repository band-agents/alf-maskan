import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { EXTRA_SEAT, EXTRA_STOREFRONT, billingView, egp } from '@/lib/queries/billing';
import { CancelZone, PlanCard } from '@/components/billing/PlanCard';
import { Hint, Ref } from '@/components/ui/atoms';

export const metadata = {
  title: 'Billing — Alf Maskan',
  description: 'Your plan, what you are using, how you pay and every invoice.',
};

const METHODS = [
  { id: 'card', mark: 'Visa', label: 'Visa ending 4417', note: 'Expires 09/28 · auto-renews' },
  { id: 'fawry', mark: 'Fawry', label: 'Fawry', note: 'We send a code, you pay at any outlet' },
  { id: 'paymob', mark: 'Paymob', label: 'Paymob wallet', note: 'Vodafone Cash, Etisalat, Orange' },
  { id: 'instapay', mark: 'InstaPay', label: 'InstaPay', note: 'Bank transfer from your phone' },
];

export default function BillingPage() {
  // The one line that changes when auth is real.
  const b = billingView(mockStore.id);

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/settings">Settings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Billing</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Billing</h1>
          <p>Next payment <b>{b.nextPayment}</b> · no contract, cancel whenever.</p>
        </div>
      </div>

      <PlanCard />

      <div className="split">
        <section className="panel panel--pad" aria-labelledby="usage-h">
          <h2 className="panel__title" id="usage-h" style={{ marginBottom: 14 }}>
            What you are using
            <Hint about="About usage limits">
              Nothing switches off when you reach a ceiling — we tell you and you decide.
              Storefronts and seats are the only two that cost extra.
            </Hint>
          </h2>
          <div className="meters">
            {b.meters.map((m) => (
              // Every figure counted from the store, not written here. The
              // static build's meters claimed 42 listings and 6 seats against a
              // store that had neither.
              <div className="meter" key={m.label} data-warn={m.warn ? '' : undefined}>
                <span className="meter__top"><span>{m.label}</span><b>{m.detail}</b></span>
                <span className="meter__track">
                  <span className="meter__fill" style={{ width: `${m.pct}%` }} />
                </span>
              </div>
            ))}
          </div>
          <p className="f__hint" style={{ marginTop: 14, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
            A second storefront is {egp(EXTRA_STOREFRONT)} a month. Seats past{' '}
            {b.meters.find((m) => m.label === 'Team seats')?.limit} are {egp(EXTRA_SEAT)} each.
          </p>
        </section>

        <section className="panel panel--pad" aria-labelledby="pay-h">
          <h2 className="panel__title" id="pay-h" style={{ marginBottom: 6 }}>How you pay</h2>
          <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 12 }}>
            Every method below is settled in EGP. No card is required — plenty of agencies pay by
            Fawry or InstaPay.
          </p>

          <div className="rails" role="radiogroup" aria-label="Payment method">
            {METHODS.map((m, i) => (
              <label className="rail-opt" key={m.id}>
                <input type="radio" name="pay" value={m.id} defaultChecked={i === 0} />
                <span className="ph">{m.mark}</span>
                <b>{m.label}</b>
                <span>{m.note}</span>
              </label>
            ))}
          </div>

          <p className="f__hint" style={{ marginTop: 12 }}>
            Charged automatically on the 3rd. If a card fails we retry twice over five days and
            email you before anything switches off.
          </p>
        </section>
      </div>

      <section className="panel panel--pad" aria-labelledby="inv-h">
        <h2 className="panel__title" id="inv-h" style={{ marginBottom: 12 }}>Invoices</h2>
        <div className="tablescroll">
          <table className="dtable" style={{ minWidth: 640 }}>
            <caption className="visually-hidden">Every invoice on this store, newest first.</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Invoice</th>
                <th scope="col">Method</th>
                <th className="col-num" scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Download</span></th>
              </tr>
            </thead>
            <tbody>
              {b.invoices.map((inv) => (
                <tr key={inv.ref}>
                  <td>{inv.date}</td>
                  <td><Ref>{inv.ref}</Ref></td>
                  <td>{inv.method}</td>
                  <td className="col-num"><span className="money">{egp(inv.amount)}</span></td>
                  <td>
                    <span className={`st ${inv.status === 'Paid' ? 'st--live' : 'st--reserved'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="rowacts">
                      <button className="rowact" type="button">
                        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                          <path d="M7.5 1v9m0 0L4 6.5m3.5 3.5L11 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1.5 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <span className="visually-hidden">Download {inv.ref}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="f__hint" style={{ marginTop: 12 }}>
          Invoices carry your tax registration number. Add it in Store profile if it is missing.
        </p>
      </section>

      <CancelZone periodEnd={b.nextPayment} />
    </main>
  );
}
