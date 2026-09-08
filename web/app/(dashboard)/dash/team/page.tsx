import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { roleById, teamSummary } from '@/lib/queries/team';
import { scopeOptions } from '@/lib/queries/team';
import { zonesFor } from '@/lib/queries/units';
import { InviteSheet } from '@/components/team/InviteSheet';

export const metadata = {
  title: 'Team — Alf Maskan',
  description: 'Everyone in your agency, what they can reach, and what they have been doing.',
};

export default function TeamPage() {
  // The one line that changes when auth is real.
  const storeId = mockStore.id;
  const t = teamSummary(storeId);
  const scopes = scopeOptions(zonesFor(storeId));

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Team</h1>
          {/* Every figure counted from the members below, so the sentence
              cannot outlive a person who was removed. */}
          <p>
            <b>{t.active} {t.active === 1 ? 'person' : 'people'}</b>
            {t.pending > 0 && <> · {t.pending} {t.pending === 1 ? 'invite' : 'invites'} waiting</>}
            {' · '}
            {t.overSeats
              ? `${t.used} of ${t.seats} seats used — you are over your plan.`
              : `seats are included up to ${t.seats} on your plan.`}
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/team/roles">Roles &amp; permissions</Link>
          <InviteSheet scopes={scopes} />
        </div>
      </div>

      <div className="tablewrap">
        <div className="tablescroll">
          <table className="dtable" style={{ minWidth: 880 }}>
            <caption className="visually-hidden">
              Everyone on {mockStore.nameEn}, with their role, scope and last activity.
            </caption>
            <thead>
              <tr>
                <th className="col-pin" scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Scope</th>
                <th className="col-num" scope="col">Listings</th>
                <th className="col-num" scope="col">Leads</th>
                <th scope="col">Last active</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {t.members.map((m) => {
                const role = roleById(m.role);
                return (
                  <tr key={m.id}>
                    <td className="col-pin">
                      <div className="cell-unit">
                        <span className="avatar avatar--sm" aria-hidden="true" />
                        <div className="cell-unit__txt">
                          <span className="cell-unit__title">{m.name}</span>
                          <span className="cell-sub">
                            {m.pending ? `Invited ${m.invitedAgo} by ${m.invitedBy}` : m.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`rolepill${
                          m.role === 'owner' ? ' rolepill--owner' : m.role === 'admin' ? ' rolepill--admin' : ''
                        }`}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td>
                      <span className="cell-sub">
                        {m.scope.length ? m.scope.join(' · ') : scopeLabel(m.role)}
                      </span>
                    </td>
                    {/* A pending invite has never signed in, so a zero here
                        would read as "did nothing" rather than "not yet". */}
                    <td className="col-num">{m.listings ?? '—'}</td>
                    <td className="col-num">{m.leads ?? '—'}</td>
                    <td><span className="cell-sub">{m.lastActive}</span></td>
                    <td>
                      <span className={`st ${m.pending ? 'st--draft' : 'st--live'}`}>
                        {m.pending ? 'Invite pending' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="rowacts">
                        <button className="rowact" type="button">
                          <svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true">
                            <circle cx="2" cy="2" r="1.4" fill="currentColor" />
                            <circle cx="7" cy="2" r="1.4" fill="currentColor" />
                            <circle cx="12" cy="2" r="1.4" fill="currentColor" />
                          </svg>
                          <span className="visually-hidden">Actions for {m.name}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="f__hint" style={{ marginTop: 12 }}>
        An agent sees only their own listings and leads. If someone says a unit has vanished,
        check their scope before you check the unit.
      </p>
    </main>
  );
}

/** What an unscoped member reaches, which depends on the role rather than
 *  being the same word for everyone. */
function scopeLabel(role: string): string {
  if (role === 'owner') return 'Everything';
  if (role === 'admin') return 'Everything except billing';
  if (role === 'accountant') return 'Billing & commissions';
  return 'Everywhere we operate';
}
