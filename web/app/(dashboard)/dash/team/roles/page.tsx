import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { roleCounts } from '@/lib/queries/team';
import { Matrix } from '@/components/team/Matrix';

export const metadata = {
  title: 'Roles & permissions — Alf Maskan',
  description: 'What each role can reach, as a grid you can edit a cell at a time.',
};

/** Roles sits under Team rather than beside it: it is the same model seen as a
 *  grid, and the crumb should say so. */
export default function RolesPage() {
  // The one line that changes when auth is real.
  const counts = roleCounts(mockStore.id);

  return (
    <main className="content" id="main">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dash/team">Team</Link>
        <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Roles &amp; permissions</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>Roles &amp; permissions</h1>
          <p>Click a cell to cycle it. Changes apply to everyone holding that role, immediately.</p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/settings/audit">Audit log</Link>
          <button className="btn btn--go" type="button">Create a custom role</button>
        </div>
      </div>

      <Matrix counts={counts} />
    </main>
  );
}
