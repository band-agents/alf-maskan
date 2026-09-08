import { membersFor } from './team';

/**
 * The audit log.
 *
 * The one screen in the product that is deliberately not derived. Everywhere
 * else a stale number is a bug; here a rewritten record is the bug. An audit
 * entry is a claim about what someone did at a moment in the past, and
 * recomputing it from today's data would quietly rewrite history — the price
 * AM-1042 used to have is not recoverable from the price it has now.
 *
 * So these are stored strings, as they should be, and the only thing derived is
 * the list of people to filter by, which comes from the team.
 */

export type AuditKind = 'price' | 'perm' | 'store' | 'listing';

export type AuditEntry = {
  id: string;
  storeId: string;
  who: string;
  kind: AuditKind;
  /** The sentence, split so the actor and the object can be emphasised without
   *  parsing the text back apart at render time. */
  did: string;
  object?: string;
  objectRef?: string;
  tail?: string;
  /** What it was, and what it became. A deletion has only `before`, because
   *  that is the only record of it left. */
  before?: string;
  after?: string;
  when: string;
};

export const AUDIT_KINDS: { value: AuditKind | ''; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'price', label: 'Prices' },
  { value: 'perm', label: 'Permissions' },
  { value: 'store', label: 'Storefront' },
  { value: 'listing', label: 'Listings' },
];

const KAMAL = 'store_kamal';

/** What the log would hold in total. The page shows a recent window of it. */
export const TOTAL_ENTRIES = 1284;

const ENTRIES: AuditEntry[] = [
  {
    id: 'a1', storeId: KAMAL, who: 'Nourhan Adel', kind: 'price',
    did: 'changed the price of', object: 'Penthouse with roof garden', objectRef: 'AM-1042',
    before: 'EGP 8,900,000', after: 'EGP 8,450,000', when: 'Today 11:04',
  },
  {
    id: 'a2', storeId: KAMAL, who: 'Youssef Kamal', kind: 'perm',
    did: 'changed what', object: 'Agent', tail: 'can do with analytics',
    before: 'none', after: 'limited to their own records', when: 'Today 09:41',
  },
  {
    id: 'a3', storeId: KAMAL, who: 'Mai Farouk', kind: 'listing',
    did: 'published', object: 'Sea-view chalet, first row', objectRef: 'AM-1038',
    before: 'Draft', after: 'Live', when: 'Yesterday 17:22',
  },
  {
    id: 'a4', storeId: KAMAL, who: 'Youssef Kamal', kind: 'store',
    did: 'published storefront changes — 3 sections edited, 1 added',
    after: 'Featured units · Map explorer · Payment plan calculator · + Testimonials',
    when: 'Yesterday 16:08',
  },
  {
    id: 'a5', storeId: KAMAL, who: 'Karim ElSayed', kind: 'price',
    did: 'changed the down payment on', object: 'Duplex with private entrance', objectRef: 'AM-1019',
    before: '15% · EGP 1,440,000', after: '10% · EGP 960,000', when: '2 days ago',
  },
  {
    id: 'a6', storeId: KAMAL, who: 'Youssef Kamal', kind: 'perm',
    did: 'invited', object: 'sherif@kamalestates.com', tail: 'as an Agent, scoped to New Cairo',
    when: '2 days ago',
  },
  {
    id: 'a7', storeId: KAMAL, who: 'Nourhan Adel', kind: 'listing',
    did: 'deleted', object: 'Studio, Madinaty', objectRef: 'AM-0974',
    // No `after`: the unit is gone, and this line is the only surviving record
    // of what it was.
    before: 'Live · EGP 3,100,000 · 8 photos', when: '1 week ago',
  },
];

export type AuditFilters = { q: string; who: string | null; kind: AuditKind | null };

export function parseAuditFilters(sp: Record<string, string | string[] | undefined>): AuditFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || '';
  };
  const kind = one('kind');
  const valid = ['price', 'perm', 'store', 'listing'];
  return {
    q: one('q').toLowerCase(),
    who: one('who') || null,
    kind: valid.includes(kind) ? (kind as AuditKind) : null,
  };
}

export function auditFor(storeId: string, f: AuditFilters): { rows: AuditEntry[]; total: number } {
  const mine = ENTRIES.filter((e) => e.storeId === storeId);
  const rows = mine.filter((e) => {
    if (f.who && e.who !== f.who) return false;
    if (f.kind && e.kind !== f.kind) return false;
    if (f.q) {
      const hay = `${e.who} ${e.did} ${e.object ?? ''} ${e.objectRef ?? ''} ${e.tail ?? ''} ${e.before ?? ''} ${e.after ?? ''}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  return { rows, total: TOTAL_ENTRIES };
}

/** People to filter by, from the team rather than a written list — so someone
 *  who joined last week is offered and someone who never existed is not. */
export function auditPeople(storeId: string): string[] {
  return membersFor(storeId)
    .filter((m) => !m.pending)
    .map((m) => m.name)
    .sort();
}
