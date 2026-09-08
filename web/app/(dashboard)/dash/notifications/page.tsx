import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import {
  NOTIF_TYPES,
  PREFS,
  filterNotifications,
  notificationsFor,
  parseNotifFilters,
} from '@/lib/queries/notifications';
import { Hint } from '@/components/ui/atoms';
import { NotifMark } from '@/components/notifications/marks';

export const metadata = {
  title: 'Notifications — Alf Maskan',
  description: 'What happened while you were away, and how you want to hear about it.',
};

/**
 * Notifications.
 *
 * Tab, type filter and unread-only all live in the URL, so this page needs no
 * client state at all — which also means it works with scripting off, and a
 * filtered feed is a link an agent can send.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseNotifFilters(sp);
  const tab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) === 'prefs' ? 'prefs' : 'feed';

  // The one line that changes when auth is real.
  const all = notificationsFor(mockStore.id);
  const shown = filterNotifications(all, filters);
  const unread = all.filter((n) => n.unread).length;

  const href = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams();
    if (tab === 'prefs') q.set('tab', 'prefs');
    if (filters.type) q.set('type', filters.type);
    if (filters.unreadOnly) q.set('unread', '1');
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    return s ? `/dash/notifications?${s}` : '/dash/notifications';
  };

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          {/* Both counted from the feed, so neither can outlive it. */}
          <p>
            <b>{unread}</b> unread · {all.length} in the last week.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--app" type="button">Mark all read</button>
        </div>
      </div>

      <div className="views" role="tablist" aria-label="Notification views">
        <Link className="view" role="tab" aria-selected={tab === 'feed'} href={href({ tab: null })} scroll={false}>
          Activity
        </Link>
        <Link className="view" role="tab" aria-selected={tab === 'prefs'} href={href({ tab: 'prefs' })} scroll={false}>
          How you get them
        </Link>
      </div>

      {tab === 'feed' ? (
        <>
          <div className="toolbar">
            {NOTIF_TYPES.map((t) => (
              <Link
                key={t.value || 'all'}
                className="tool-btn"
                href={href({ type: t.value || null })}
                aria-pressed={(filters.type ?? '') === t.value}
                scroll={false}
              >
                {t.label}
              </Link>
            ))}

            <Link
              className="tool-btn tool-btn--quiet"
              href={href({ unread: filters.unreadOnly ? null : '1' })}
              aria-pressed={filters.unreadOnly}
              scroll={false}
            >
              Unread only
            </Link>
          </div>

          <section className="panel panel--pad" aria-label="Activity">
            {shown.length === 0 ? (
              <div className="empty" style={{ border: 0, padding: '44px 20px' }}>
                <h3>Nothing here</h3>
                <p>No notifications of that kind in the last week.</p>
              </div>
            ) : (
              shown.map((n) => (
                <div className="notif" key={n.id} data-unread={n.unread ? '' : undefined}>
                  <NotifMark kind={n.mark} />
                  <div className="notif__body">
                    <b>{n.title}</b>
                    <p>{n.body}</p>
                    <span className="notif__when">{n.when}</span>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      ) : (
        <section className="panel panel--pad">
          <div className="titlerow">
            <h2 className="panel__title" style={{ marginBottom: 6 }}>How you get them</h2>
            <Hint about="About channels">
              WhatsApp reaches you on site where email will not. Keep it for the things you would
              want to be interrupted for, and nothing else.
            </Hint>
          </div>
          <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 14 }}>
            These are yours alone — every person on the team sets their own.
          </p>

          <div className="tablescroll">
            <table className="prefs-table">
              <caption className="visually-hidden">Notification channels for each kind of event.</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'start' }}>Tell me when</th>
                  <th scope="col">In app</th>
                  <th scope="col">Email</th>
                  <th scope="col">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {PREFS.map((p) => (
                  <tr key={p.label}>
                    <th scope="row">{p.label}<span>{p.detail}</span></th>
                    <td><input className="sw" type="checkbox" defaultChecked={p.app} aria-label={`${p.label}, in app`} /></td>
                    <td><input className="sw" type="checkbox" defaultChecked={p.email} aria-label={`${p.label}, email`} /></td>
                    <td><input className="sw" type="checkbox" defaultChecked={p.whatsapp} aria-label={`${p.label}, WhatsApp`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sw-row" style={{ marginTop: 16, borderTop: '1px solid var(--rule)', paddingTop: 14 }}>
            <input className="sw" type="checkbox" id="n-quiet" defaultChecked />
            <span className="sw-row__txt">
              <b><label htmlFor="n-quiet">Quiet hours, 22:00 – 08:00</label></b>
              <span>
                WhatsApp and email hold until morning. In-app still collects, and anything about a
                payment failing still goes out.
              </span>
            </span>
          </div>
        </section>
      )}
    </main>
  );
}
