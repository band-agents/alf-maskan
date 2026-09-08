import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mockStore } from '@/lib/mock';
import { collectionsFor, getCollection } from '@/lib/queries/collections';
import { unitsForStore } from '@/lib/queries/units';
import { CollectionEditor } from '@/components/collections/CollectionEditor';

export const metadata = {
  title: 'Collections — Alf Maskan',
  description: 'Group units into the rows and pages buyers browse on your storefront.',
};

/**
 * Collections.
 *
 * Which collection you are editing lives in the URL, like every other bit of
 * navigation state in this dashboard, so an agent can send a colleague a link
 * to one rather than telling them which to click. The list and its counts are
 * server-rendered from the rules; only the editor is a client island, because
 * a rule being changed is a draft.
 */
export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const wanted = (Array.isArray(sp.c) ? sp.c[0] : sp.c) ?? null;

  // The one line that changes when auth is real.
  const storeId = mockStore.id;

  const collections = collectionsFor(storeId);
  const current = getCollection(storeId, wanted);
  // A slug that is not this store's does not fall back to the first collection:
  // silently showing a different group is how someone edits the wrong one.
  if (wanted && !current) notFound();

  const units = unitsForStore(storeId);

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/listings">Listings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Collections</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Collections</h1>
          <p>
            A collection is a group of units you can drop onto your storefront as a row, a page,
            or a filter.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--go" type="button">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New collection
          </button>
        </div>
      </div>

      {collections.length === 0 || !current ? (
        <div className="empty">
          <span className="empty__mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M2 7l9-4.5L20 7l-9 4.5L2 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M2 14l9 4.5 9-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <h3>No collections yet</h3>
          <p>
            Group units by zone, price or delivery date, then drop the group onto your storefront
            as a row.
          </p>
        </div>
      ) : (
        <div className="cols">
          <div className="collist" role="tablist" aria-label="Collections">
            {collections.map((c) => (
              <Link
                className="collist__item"
                key={c.id}
                href={`/dash/collections?c=${c.slug}`}
                role="tab"
                aria-current={c.slug === current.slug}
                scroll={false}
              >
                <span className="collist__mark" aria-hidden="true">
                  {c.auto ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 4.5l6-3 6 3-6 3-6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                      <path d="M1 9.5l6 3 6-3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="collist__txt">
                  <b>{c.nameEn}</b>
                  <span>{c.auto ? 'Automatic' : 'Manual'}</span>
                </span>
                {/* Derived by running the rules, not stored. A tab cannot
                    advertise a number the grid will not produce. */}
                <span className="collist__n">{c.count}</span>
              </Link>
            ))}
          </div>

          <CollectionEditor key={current.id} collection={current} units={units} />
        </div>
      )}
    </main>
  );
}
