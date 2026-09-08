import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { unitsForStore } from '@/lib/queries/units';
import { OfferBuilder } from '@/components/marketing/OfferBuilder';
import { Broadcast } from '@/components/marketing/Broadcast';

export const metadata = {
  title: 'Marketing — Alf Maskan',
  description: 'Offers with a countdown, WhatsApp broadcasts, and the form that catches leads.',
};

const FIELDS = [
  { name: 'Name', kind: 'text', required: true },
  { name: 'Mobile', kind: 'phone · +20', required: true },
  { name: 'Budget', kind: 'select · 4 options', required: false },
  { name: 'When are you moving', kind: 'select · 3 options', required: false },
  { name: 'Message', kind: 'long text', required: false },
];

/** Which tool you are using is in the URL, so an agent can send a colleague the
 *  broadcast they are drafting rather than describing where to click. */
export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab = raw === 'broadcasts' || raw === 'forms' ? raw : 'offers';

  // The one line that changes when auth is real.
  const units = unitsForStore(mockStore.id);

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Marketing</h1>
          <p>Offers that end themselves, broadcasts that reach a segment, and the form that catches the lead.</p>
        </div>
      </div>

      <div className="views" role="tablist" aria-label="Marketing tools">
        <Link className="view" role="tab" aria-selected={tab === 'offers'} href="/dash/marketing" scroll={false}>
          Deals &amp; offers <span className="view__n">1</span>
        </Link>
        <Link className="view" role="tab" aria-selected={tab === 'broadcasts'} href="/dash/marketing?tab=broadcasts" scroll={false}>
          Broadcasts <span className="view__n">3</span>
        </Link>
        <Link className="view" role="tab" aria-selected={tab === 'forms'} href="/dash/marketing?tab=forms" scroll={false}>
          Lead forms <span className="view__n">2</span>
        </Link>
      </div>

      {tab === 'offers' && <OfferBuilder units={units} />}
      {tab === 'broadcasts' && <Broadcast units={units} />}

      {tab === 'forms' && (
        <div className="two-col">
          <div className="ed__form">
            <details className="fset" open>
              <summary>
                <span className="fset__n" aria-hidden="true">1</span>
                <span className="fset__title">Fields on the form</span>
                <span className="fset__meta">
                  {FIELDS.length} fields
                  <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <div className="fset__body">
                <div>
                  {FIELDS.map((f) => (
                    <div className="fieldrow" key={f.name}>
                      <span className="fieldrow__grip" aria-hidden="true">
                        <svg width="9" height="12" viewBox="0 0 9 12">
                          {[2, 6, 10].map((y) => (
                            <g key={y}>
                              <circle cx="2" cy={y} r="1" fill="currentColor" />
                              <circle cx="7" cy={y} r="1" fill="currentColor" />
                            </g>
                          ))}
                        </svg>
                      </span>
                      <span className="fieldrow__txt"><b>{f.name}</b><span>{f.kind}</span></span>
                      {f.required && <span className="fieldrow__req">Required</span>}
                    </div>
                  ))}
                </div>
                <button className="views__add" type="button" style={{ height: 34, marginTop: 10 }}>
                  + Add a field
                </button>
                <p className="f__hint">
                  Every extra field costs you replies. {FIELDS.length} is already more than most
                  agencies need.
                </p>
              </div>
            </details>

            <details className="fset" open>
              <summary>
                <span className="fset__n" aria-hidden="true">2</span>
                <span className="fset__title">Where the lead goes</span>
                <span className="fset__meta">
                  <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <div className="fset__body">
                <p className="f__hint">
                  Every submission lands in the Leads inbox and notifies the assigned agent on
                  WhatsApp. Nothing is emailed anywhere else, and nothing is shared.
                </p>
                <Link className="panel__link" href="/dash/leads">Open the leads inbox →</Link>
              </div>
            </details>
          </div>

          <aside className="two-col__side" aria-label="Form preview">
            <section className="panel panel--pad">
              <h2 className="panel__title" style={{ marginBottom: 12 }}>On your storefront</h2>
              <div className="ed__form" style={{ gap: 10 }}>
                {FIELDS.map((f) => (
                  <div className="f" key={f.name}>
                    <span className="f__label">
                      {f.name}
                      {f.required && <span className="f__req" aria-hidden="true"> *</span>}
                    </span>
                    {f.kind === 'long text' ? (
                      <textarea className="ta" aria-label={f.name} readOnly />
                    ) : (
                      <input className="inp" aria-label={f.name} readOnly />
                    )}
                  </div>
                ))}
                <button className="btn btn--go" type="button" style={{ alignSelf: 'flex-start' }}>
                  Request a viewing
                </button>
              </div>
              <p className="f__hint" style={{ marginTop: 12 }}>
                This is the form buyers fill in on the contact page. Reordering a field above
                reorders it here.
              </p>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
