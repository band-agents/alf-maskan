import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUnit } from '@/lib/queries/units';
import { mockStore } from '@/lib/mock';
import { editorContext } from '@/lib/queries/editor-context';
import { unitDetail } from '@/lib/queries/unit-detail';
import { Editor } from '@/components/listings/Editor';
import { Ref, StatusPill } from '@/components/ui/atoms';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const unit = await getUnit((await params).id, mockStore.id);
  return { title: unit ? `${unit.titleEn} — Alf Maskan` : 'Unit not found' };
}

export default async function ListingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  // The one line that changes when auth is real.
  const store = mockStore;
  const unit = await getUnit((await params).id, store.id);
  if (!unit) notFound();

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/listings">Listings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Ref>{unit.reference}</Ref>
      </nav>

      <div className="page-head">
        <div>
          <h1>{unit.titleEn}</h1>
          <p>
            {unit.compound ? `${unit.compound}, ` : ''}{unit.zone} ·{' '}
            {unit.views.toLocaleString('en-US')} views, {unit.leads} leads · updated {unit.updated}
          </p>
        </div>
        <div className="page-head__actions">
          <StatusPill status={unit.status} />
        </div>
      </div>

      <Editor
        unit={unit}
        detail={unitDetail(unit)}
        ctx={editorContext(store.id, store.slug, unit)}
      />
    </main>
  );
}
