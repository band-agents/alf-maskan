import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { dealsFor } from '@/lib/queries/deals';
import { Board } from '@/components/deals/Board';

export const metadata = {
  title: 'Deals — Alf Maskan',
  description: 'Every live deal by stage, with the pipeline value and where it is stalling.',
};

/** The pipeline board. Deals are fetched and scoped here; every figure derived
 *  from them lives in lib/queries/deals.ts and is computed in the board, so a
 *  drag re-totals the sidebar without a round trip. */
export default function DealsPage() {
  // The one line that changes when auth is real.
  const deals = dealsFor(mockStore.id);

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/leads">Leads</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Deals</span>
      </nav>

      <Board deals={deals} />
    </main>
  );
}
