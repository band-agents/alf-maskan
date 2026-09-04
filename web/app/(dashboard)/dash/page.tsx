import Link from 'next/link';
import { kpis, mockUnits, egp } from '@/lib/mock';

const STATUS_CLASS: Record<string, string> = {
  LIVE: 'st--live',
  DRAFT: 'st--draft',
  RESERVED: 'st--reserved',
  SOLD: 'st--sold',
  RENTED: 'st--rented',
};

const STATUS_LABEL: Record<string, string> = {
  LIVE: 'Live',
  DRAFT: 'Draft',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  RENTED: 'Rented',
};

export default function DashHome() {
  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Good morning, Youssef</h1>
          <p>7 new leads since yesterday, and 5 units still need photos.</p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/listings">
            Import units
          </Link>
          <Link className="btn btn--go" href="/dash/listings/new">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add listing
          </Link>
        </div>
      </div>

      <section className="kpis" aria-label="Key numbers">
        {kpis.map((k) => (
          <article className="panel kpi" key={k.label}>
            <h2 className="kpi__label">{k.label}</h2>
            <div className="kpi__body">
              <div>
                <p className="kpi__value">{k.value}</p>
                <p className={`delta ${k.up ? 'delta--up' : 'delta--down'}`}>
                  <svg
                    width="8"
                    height="6"
                    viewBox="0 0 8 6"
                    aria-hidden="true"
                    style={k.up ? undefined : { transform: 'rotate(180deg)' }}
                  >
                    <path d="M4 0l4 6H0z" fill="currentColor" />
                  </svg>
                  {k.delta}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-4)', lineHeight: 1.5, marginTop: 8 }}>
              {k.hint}
            </p>
          </article>
        ))}
      </section>

      <section className="panel panel--pad" aria-labelledby="units-h">
        <div className="panel__head">
          <h2 className="panel__title" id="units-h">
            Top performing units
          </h2>
          <Link className="panel__link" href="/dash/listings">
            All 42 →
          </Link>
        </div>

        <div className="tablescroll">
          <table className="dtable" style={{ minWidth: 720 }}>
            <caption className="visually-hidden">
              Your five most-viewed units, with leads and status.
            </caption>
            <thead>
              <tr>
                <th scope="col">Unit</th>
                <th scope="col">Zone</th>
                <th className="col-num" scope="col">Area m²</th>
                <th className="col-num" scope="col">Price</th>
                <th scope="col">Status</th>
                <th className="col-num" scope="col">Views</th>
                <th className="col-num" scope="col">Leads</th>
              </tr>
            </thead>
            <tbody>
              {mockUnits.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-unit">
                      <div className="ph cell-unit__ph" aria-hidden="true" />
                      <div className="cell-unit__txt">
                        <Link className="cell-unit__title" href={`/dash/listings/${u.id}`}>
                          {u.titleEn}
                        </Link>
                        <span className="cell-unit__ar" lang="ar" dir="rtl">
                          {u.titleAr}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.zone}
                    {u.compound && <span className="cell-sub"> · {u.compound}</span>}
                  </td>
                  <td className="col-num">{u.areaSqm}</td>
                  <td className="col-num">
                    <span className="money">{egp(u.price)}</span>
                  </td>
                  <td>
                    <span className={`st ${STATUS_CLASS[u.status]}`}>{STATUS_LABEL[u.status]}</span>
                  </td>
                  <td className="col-num">{u.views ? u.views.toLocaleString('en-US') : '—'}</td>
                  <td className="col-num">{u.leads || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="f__hint" style={{ marginTop: 12 }}>
          Reading from typed mock data shaped by the Prisma model. When
          <code style={{ fontFamily: 'var(--font-mono)' }}> DATABASE_URL </code>
          points at a real database this becomes a query and nothing else on the page changes.
        </p>
      </section>
    </main>
  );
}
