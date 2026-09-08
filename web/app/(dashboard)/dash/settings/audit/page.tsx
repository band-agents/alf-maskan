import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { AUDIT_KINDS, auditFor, auditPeople, parseAuditFilters } from '@/lib/queries/audit';
import { Ref } from '@/components/ui/atoms';

export const metadata = {
  title: 'Audit log — Alf Maskan',
  description: 'Every change to a price, a permission or the storefront.',
};

/**
 * The audit log.
 *
 * Filters are links rather than a scripted <select>, so the whole screen works
 * with JavaScript off — which matters more here than anywhere else in the
 * dashboard: this is the page someone opens when they are trying to establish
 * what happened, often in a hurry and often on somebody else's phone.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const f = parseAuditFilters(sp);
  // The one line that changes when auth is real.
  const storeId = mockStore.id;
  const { rows, total } = auditFor(storeId, f);
  const people = auditPeople(storeId);

  const href = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams();
    if (f.q) q.set('q', f.q);
    if (f.who) q.set('who', f.who);
    if (f.kind) q.set('kind', f.kind);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    return s ? `/dash/settings/audit?${s}` : '/dash/settings/audit';
  };

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/settings">Settings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Audit log</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Audit log</h1>
          <p>
            Every change to a price, a permission or the storefront. Kept for two years and never
            editable.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--app" type="button">Export CSV</button>
        </div>
      </div>

      {/* A GET form, so searching works without script and the query lands in
          the URL like every other filter in this dashboard. */}
      <form className="toolbar" action="/dash/settings/audit" method="get">
        <label className="fsearch">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="visually-hidden">Search the log</span>
          <input type="search" name="q" placeholder="Person, unit or field…" defaultValue={f.q} />
        </label>
        {f.who && <input type="hidden" name="who" value={f.who} />}
        {f.kind && <input type="hidden" name="kind" value={f.kind} />}

        <span className={`fselect${f.who ? ' fselect--on' : ''}`}>
          <label className="visually-hidden" htmlFor="a-who">Person</label>
          <select id="a-who" name="who" defaultValue={f.who ?? ''}>
            <option value="">Everyone</option>
            {/* From the team, so a name that never worked here is not offered. */}
            {people.map((p) => <option key={p}>{p}</option>)}
          </select>
          <span className="fselect__caret">
            <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </span>

        <button className="tool-btn" type="submit">Filter</button>

        <span className="f__hint" style={{ marginInlineStart: 'auto' }}>
          <b>{rows.length}</b> of {total.toLocaleString('en-US')} entries
        </span>
      </form>

      <div className="toolbar" style={{ marginTop: -6 }}>
        {AUDIT_KINDS.map((k) => (
          <Link
            key={k.value || 'all'}
            className="tool-btn"
            href={href({ kind: k.value || null })}
            aria-pressed={(f.kind ?? '') === k.value}
            scroll={false}
          >
            {k.label}
          </Link>
        ))}
        {(f.q || f.who || f.kind) && (
          <Link className="tool-btn tool-btn--quiet" href="/dash/settings/audit" scroll={false}>
            Clear
          </Link>
        )}
      </div>

      <section className="panel panel--pad">
        {rows.length === 0 ? (
          <div className="empty" style={{ border: 0, padding: '40px 20px' }}>
            <h3>Nothing matches</h3>
            <p>No entries from that person of that kind in this period.</p>
          </div>
        ) : (
          <div className="audit">
            {rows.map((e) => (
              <div className="auditrow" key={e.id}>
                <span className="avatar avatar--sm" aria-hidden="true" />
                <div className="auditrow__body">
                  <b>{e.who}</b> {e.did}
                  {e.object && <> <b>{e.object}</b></>}
                  {e.objectRef && <> (<Ref>{e.objectRef}</Ref>)</>}
                  {e.tail && <> {e.tail}</>}
                  {(e.before || e.after) && (
                    <div className="diff">
                      {e.before && <span className="diff__old">{e.before}</span>}
                      {e.after && <span className="diff__new">{e.after}</span>}
                    </div>
                  )}
                </div>
                <span className="auditrow__when">{e.when}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="f__hint" style={{ marginTop: 12 }}>
        Price and permission changes are the two people ask about after the fact, so both record
        the value they had before. A deletion keeps what it was, because that is the only record
        left of it.
      </p>
    </main>
  );
}
