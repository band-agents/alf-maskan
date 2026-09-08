import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { Import } from '@/components/listings/Import';

export const metadata = {
  title: 'Import units — Alf Maskan',
  description: 'Bring your whole inventory across from a spreadsheet in one step.',
};

export default function ImportPage() {
  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/listings">Listings</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Import units</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Import units</h1>
          <p>
            Bring your whole inventory across in one step. Nothing is saved until you have seen
            exactly what will be created.
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/listings/new">Add one by hand instead</Link>
        </div>
      </div>

      {/* The one line that changes when auth is real. */}
      <Import storeId={mockStore.id} />
    </main>
  );
}
