import { MONTHLY, egp } from './billing';
import { commissionOf, dealsFor, pipeline } from './deals';
import { unitsForStore } from './units';

/**
 * Notifications.
 *
 * Most of this feed is a claim about data that exists elsewhere in the product:
 * how many deals have stalled, which units have no photos, what a won deal
 * earned. The static build wrote all of them as prose, so the page said two
 * deals were quiet next to a board that decided that for itself, and quoted a
 * commission computed by hand.
 *
 * Anything the product can know, this derives. A notification that disagrees
 * with the screen it points at is worse than no notification, because an agent
 * acts on it and then finds nothing there.
 */

export type NotifType = 'lead' | 'deal' | 'listing' | 'system';

export type Notification = {
  id: string;
  type: NotifType;
  /** 'lead' | 'deal' | 'warn' | null — picks the icon and its tint. */
  mark: 'lead' | 'deal' | 'warn' | null;
  title: string;
  body: string;
  when: string;
  unread: boolean;
};

export const NOTIF_TYPES: { value: NotifType | ''; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'lead', label: 'Leads' },
  { value: 'deal', label: 'Deals' },
  { value: 'listing', label: 'Listings' },
  { value: 'system', label: 'Account' },
];

/** Fewer than this and a unit gets a fraction of the views it should. */
const MIN_PHOTOS = 3;

export function notificationsFor(storeId: string): Notification[] {
  const units = unitsForStore(storeId);
  const deals = dealsFor(storeId);
  const p = pipeline(deals);

  const thin = units.filter((u) => u.photos < MIN_PHOTOS);
  const none = thin.filter((u) => u.photos === 0);
  const won = deals.find((d) => d.stage === 'won');
  const newest = [...units].sort((a, b) => b.price - a.price)[0];

  const feed: (Notification | null)[] = [
    {
      id: 'n1', type: 'lead', mark: 'lead', unread: true,
      title: 'Mai Farouk asked about the Marassi chalet',
      body: '"مساء الخير، الشاليه في مراسي لسه متاح؟" — came in on WhatsApp, assigned to you.',
      when: '1 minute ago',
    },
    {
      id: 'n2', type: 'lead', mark: 'lead', unread: true,
      title: 'Hala Mansour has been waiting 22 minutes',
      body: 'Your first-reply target is 30 minutes. She asked about the Mivida penthouse.',
      when: '22 minutes ago',
    },
    // The commission here is the deal's own, not a number typed beside it.
    won
      ? {
          id: 'n3', type: 'deal', mark: 'deal', unread: true,
          title: `${won.agent} moved a deal to Won`,
          body: `${won.unit} — ${egp(won.value)}. Commission ${egp(Math.round(commissionOf(won)))}.`,
          when: '3 hours ago',
        }
      : null,
    // Counted, so it cannot say five when there are two.
    thin.length > 0
      ? {
          id: 'n4', type: 'listing', mark: 'warn', unread: true,
          title: `${thin.length} ${thin.length === 1 ? 'unit has' : 'units have'} gone a month without photos`,
          body:
            `Units with fewer than ${MIN_PHOTOS} photos get about a fifth of the views.` +
            (none.length
              ? ` ${none.slice(0, 2).map((u) => u.reference).join(' and ')} ${none.length === 1 ? 'has' : 'have'} none at all.`
              : ''),
          when: 'Today, 09:00',
        }
      : null,
    // The board decides what has gone quiet; this reports what it decided.
    p.stale.length > 0
      ? {
          id: 'n5', type: 'deal', mark: 'warn', unread: false,
          title: `${p.stale.length} ${p.stale.length === 1 ? 'deal has' : 'deals have'} not moved in a fortnight`,
          body: `${p.stale.map((d) => `${d.unit} (${d.age} days)`).join(' and ')}.`,
          when: 'Yesterday',
        }
      : null,
    newest
      ? {
          id: 'n6', type: 'listing', mark: null, unread: false,
          title: `${newest.agent} published ${newest.reference}`,
          body: `${newest.titleEn} — ${egp(newest.price)}. It is live on your storefront.`,
          when: 'Yesterday, 16:20',
        }
      : null,
    {
      id: 'n7', type: 'system', mark: null, unread: false,
      title: 'Your storefront had its best week yet',
      body: '4,102 visits, up 22% on the week before. Most of it came from the North Coast broadcast.',
      when: 'Monday',
    },
    {
      id: 'n8', type: 'system', mark: null, unread: false,
      title: `Your ${egp(MONTHLY)} subscription renewed`,
      body: 'Paid by Visa ending 4417. Next renewal 3 October 2026.',
      when: '1 September',
    },
  ];

  return feed.filter((n): n is Notification => n !== null);
}

export type NotifFilters = { type: NotifType | null; unreadOnly: boolean };

export function parseNotifFilters(sp: Record<string, string | string[] | undefined>): NotifFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || '';
  };
  const t = one('type');
  const valid = ['lead', 'deal', 'listing', 'system'];
  return {
    type: valid.includes(t) ? (t as NotifType) : null,
    unreadOnly: one('unread') === '1',
  };
}

export function filterNotifications(all: Notification[], f: NotifFilters): Notification[] {
  return all.filter((n) => (!f.type || n.type === f.type) && (!f.unreadOnly || n.unread));
}

export type PrefRow = { label: string; detail: string; app: boolean; email: boolean; whatsapp: boolean };

export const PREFS: PrefRow[] = [
  { label: 'A new lead arrives', detail: 'Any source, assigned to me', app: true, email: false, whatsapp: true },
  { label: 'A lead is waiting too long', detail: 'Past your 30-minute first-reply target', app: true, email: false, whatsapp: true },
  { label: 'A deal changes stage', detail: 'Anyone on the team', app: true, email: true, whatsapp: false },
  { label: 'A deal goes quiet', detail: 'No movement for 14 days', app: true, email: true, whatsapp: false },
  { label: 'A listing needs attention', detail: 'Missing photos, stale price', app: true, email: false, whatsapp: false },
  { label: 'Weekly summary', detail: 'Monday morning, your numbers', app: false, email: true, whatsapp: false },
  { label: 'Billing and account', detail: 'Renewals, failed payments', app: true, email: true, whatsapp: false },
];
