import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { editorContext } from '@/lib/queries/editor-context';
import { nextReference, unitDetail } from '@/lib/queries/unit-detail';
import { zonesFor } from '@/lib/queries/units';
import type { UnitRow } from '@/lib/queries/units';
import { Editor } from '@/components/listings/Editor';
import { Ref } from '@/components/ui/atoms';

export const metadata = {
  title: 'Add a listing — Alf Maskan',
  description: 'Add a unit once and it appears on your site, your WhatsApp replies and your team’s phones.',
};

/**
 * A new listing.
 *
 * The same editor, started from a blank unit rather than a stored one — so
 * there is one screen to maintain and an agent learns it once. What differs is
 * the seeding: the reference continues the agency's own series, the zone is the
 * one they sell most in, and the agent is the person adding it. An empty form
 * is a form people abandon.
 */
export default function NewListingPage() {
  // The one line that changes when auth is real.
  const store = mockStore;
  const zones = zonesFor(store.id);

  const blank: UnitRow = {
    id: 'new',
    storeId: store.id,
    reference: nextReference(store.id),
    titleEn: '',
    titleAr: '',
    zone: zones[0] ?? '',
    compound: null,
    type: 'APARTMENT',
    purpose: 'PRIMARY',
    // A new listing is a draft. Publishing is a decision, not a default —
    // nobody should put a half-written unit in front of a buyer by not noticing.
    status: 'DRAFT',
    areaSqm: 0,
    bedrooms: null,
    price: 0,
    downPct: 10,
    years: 8,
    delivery: '',
    finishing: 'Fully finished',
    photos: 0,
    views: 0,
    leads: 0,
    agent: 'Youssef Kamal',
    updated: 'Just now',
    featured: false,
  };

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/listings">Listings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>New listing</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Add a listing</h1>
          <p>
            Reference <Ref>{blank.reference}</Ref> is reserved for it, continuing your series.
            It stays a draft until you publish.
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/listings/import">Import a spreadsheet instead</Link>
        </div>
      </div>

      <Editor
        unit={blank}
        detail={unitDetail(blank)}
        ctx={editorContext(store.id, store.slug, null)}
        isNew
      />
    </main>
  );
}
