import Link from 'next/link';
import { listUnits, parseUnitFilters, unitTerms, ZONES } from '@/lib/queries/units';
import { Money, Placeholder, Ref, StatusPill, TYPE_LABEL } from '@/components/ui/atoms';
import { Filters } from '@/components/listings/Filters';

export const metadata = { title: 'Listings — Alf Maskan' };

/**
 * A server component. The filters arrive as searchParams, the query runs here,
 * and the browser is handed finished HTML — which is why a filtered list is
 * shareable and survives a refresh, unlike the static build's client filtering.
 */
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseUnitFilters(await searchParams);
  const { units, counts } = await listUnits(filters);

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Listings</h1>
          <p>
            <b>{counts.all}</b> units · {counts.live} live, {counts.all - counts.live} not.{' '}
            {counts.photos > 0 && <>{counts.photos} still need photos.</>}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--app" type="button">Import units</button>
          <Link className="btn btn--go" href="/dash/listings/new">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add listing
          </Link>
        </div>
      </div>

      <Filters filters={filters} zones={ZONES} counts={counts} shown={units.length} />

      {units.length === 0 ? (
        <div className="empty">
          <span className="empty__mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="9.5" cy="9.5" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path d="M15 15l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <h3>No units match these filters</h3>
          <p>Try widening the price range or clearing the zone. Your other {counts.all} units are still there.</p>
          <div className="empty__acts">
            <Link className="btn btn--app" href="/dash/listings">Clear all filters</Link>
            <Link className="btn btn--go" href="/dash/listings/new">Add a listing</Link>
          </div>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="tablescroll">
            <table className="dtable">
              <caption className="visually-hidden">
                Every unit in your store, with its zone, price, status and performance.
              </caption>
              <thead>
                <tr>
                  <th className="col-pin" scope="col">Unit</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Zone / compound</th>
                  <th scope="col">Type</th>
                  <th className="col-num" scope="col">Area m²</th>
                  <th className="col-num" scope="col">Beds</th>
                  <th className="col-num" scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th className="col-num" scope="col">Views</th>
                  <th className="col-num" scope="col">Leads</th>
                  <th scope="col">Agent</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td className="col-pin">
                      <div className="cell-unit">
                        <Placeholder className="cell-unit__ph" />
                        <div className="cell-unit__txt">
                          <Link className="cell-unit__title" href={`/dash/listings/${u.id}`}>
                            {u.titleEn}
                          </Link>
                          <span className="cell-unit__ar" lang="ar" dir="rtl">{u.titleAr}</span>
                        </div>
                      </div>
                    </td>
                    <td><Ref>{u.reference}</Ref></td>
                    <td>
                      {u.zone}
                      {u.compound && <span className="cell-sub"> · {u.compound}</span>}
                    </td>
                    <td>{TYPE_LABEL[u.type]}</td>
                    <td className="col-num">{u.areaSqm}</td>
                    <td className="col-num">{u.bedrooms ? u.bedrooms : '—'}</td>
                    <td className="col-num"><Money value={u.price} sub={unitTerms(u)} /></td>
                    <td><StatusPill status={u.status} /></td>
                    <td className="col-num">{u.views ? u.views.toLocaleString('en-US') : '—'}</td>
                    <td className="col-num">{u.leads || '—'}</td>
                    <td>
                      <span className="avatar avatar--sm" title={u.agent} />
                      <span className="visually-hidden">{u.agent}</span>
                    </td>
                    <td><span className="cell-sub">{u.updated}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="f__hint" style={{ marginTop: 12 }}>
        Filters live in the URL, so this view is shareable and the back button works. The same
        object that describes them becomes a Prisma <code style={{ fontFamily: 'var(--font-mono)' }}>where</code> clause
        when the database is live.
      </p>
    </main>
  );
}
