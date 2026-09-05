import type { LeadSource, LeadStage } from '@prisma/client';
import { computePlan, egp } from '@/lib/pricing';
import { getUnitByRef, type UnitRow } from './units';
import { TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The leads inbox.
 *
 * This is the other half of `/contact`. A viewing request writes a Lead; this
 * is where an agency reads one. Until both halves exist the product's whole
 * claim — "your website produces enquiries" — is unverifiable from inside the
 * dashboard, which is the only place the person paying ever looks.
 *
 * Segments and the selected lead live in the URL, like every other filter in
 * this app, so an agent can send a colleague a link to a specific enquiry.
 */

export type LeadMessage = {
  direction: 'IN' | 'OUT';
  body: string;
  locale: 'ar' | 'en';
  when: string;
};

export type LeadTask = { title: string; when: string; done: boolean; overdue?: boolean };

export type LeadRow = {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  /** Reference of the unit asked about, resolved lazily so a lead and a listing
   *  can never carry two different prices for the same unit. */
  unitRef: string | null;
  budget: string | null;
  /** Relative, as the inbox shows it. Stored as a real timestamp once the
   *  database is live; the shape of the screen does not change. */
  when: string;
  /** No outbound message yet — the number the page head reports on. */
  unanswered: boolean;
  owner: 'me' | 'other' | null;
  firstTouch: string;
  event: string;
  messages: LeadMessage[];
  tasks: LeadTask[];
  notes: string;
};

const KAMAL = 'store_kamal';
const MASRIA = 'store_masria';

const LEADS: LeadRow[] = [
  {
    id: 'mai', storeId: KAMAL, name: 'Mai Farouk', phone: '+201013379042',
    source: 'WHATSAPP', stage: 'NEW', unitRef: 'AM-1038', budget: 'up to 14M',
    when: '1 min', unanswered: true, owner: 'me', firstTouch: '1 minute ago',
    event: 'Saw the Marassi chalet on your storefront',
    messages: [
      { direction: 'IN', locale: 'ar', when: 'Today, 14:02', body: 'مساء الخير، الشاليه في مراسي لسه متاح؟ وممكن أعرف المقدم كام؟' },
    ],
    tasks: [
      { title: 'Send the Marassi phase 3 price list', when: 'Overdue 1 d', done: false, overdue: true },
      { title: 'Confirm Friday viewing with the sales office', when: 'Today', done: false },
      { title: 'Log the budget range', when: 'Done', done: true },
    ],
    notes: 'Second enquiry from Mai this month — the first was for Sokhna. Cash-heavy, prefers a short plan. Her brother bought in Marassi last year.',
  },
  {
    id: 'hala', storeId: KAMAL, name: 'Hala Mansour', phone: '+201001112233',
    source: 'WHATSAPP', stage: 'CONTACTED', unitRef: 'AM-1042', budget: '8 – 10M',
    when: '22 min', unanswered: true, owner: 'me', firstTouch: '22 minutes ago',
    event: 'Opened the Mivida penthouse three times this week',
    messages: [
      { direction: 'IN', locale: 'en', when: 'Today, 13:40', body: 'Is the roof terrace included in the 168 m², or on top of it?' },
      { direction: 'OUT', locale: 'en', when: 'Today, 13:44', body: 'On top — the 168 m² is the flat itself, and the terrace is a further 60 m².' },
      { direction: 'IN', locale: 'en', when: 'Today, 13:52', body: 'Good. Can we see it Saturday morning?' },
    ],
    tasks: [{ title: 'Confirm Saturday 11:30 viewing', when: 'Tomorrow', done: false }],
    notes: 'Viewing the Mivida penthouse and one in Hyde Park the same morning. Decides with her husband.',
  },
  {
    id: 'tarek', storeId: KAMAL, name: 'Tarek Abdelrahman', phone: '+201224419006',
    source: 'FORM', stage: 'VIEWING_BOOKED', unitRef: 'AM-1042', budget: '14 – 18M',
    when: '2 h', unanswered: false, owner: 'me', firstTouch: '2 hours ago',
    event: 'Booked a viewing from the website form',
    messages: [
      { direction: 'IN', locale: 'en', when: 'Today, 11:15', body: 'Requested a viewing — Sun 6 Sep at 15:00. Cash buyer, moving in December.' },
      { direction: 'OUT', locale: 'en', when: 'Today, 11:31', body: 'Confirmed for Sunday at 15:00. I will meet you at the Mivida gate.' },
    ],
    tasks: [{ title: 'Meet at the Mivida gate, Sunday 15:00', when: 'Sunday', done: false }],
    notes: 'Came in through the site rather than WhatsApp — worth noticing, the form is starting to pull its weight.',
  },
  {
    id: 'dina', storeId: KAMAL, name: 'Dina Sherif', phone: '+201009988776',
    source: 'FACEBOOK', stage: 'NEW', unitRef: 'AM-1035', budget: 'up to 5M',
    when: '4 h', unanswered: true, owner: 'other', firstTouch: '4 hours ago',
    event: 'Clicked through from the Zed East advert',
    messages: [
      { direction: 'IN', locale: 'ar', when: 'Today, 09:20', body: 'الاستوديو ده متشطب بالكامل؟ وإيه أقل مقدم ممكن؟' },
    ],
    tasks: [],
    notes: 'First-time buyer. Asked about the smallest deposit rather than the price.',
  },
  {
    id: 'omar', storeId: KAMAL, name: 'Omar Hegazy', phone: '+201115556677',
    source: 'CALL', stage: 'NEGOTIATING', unitRef: 'AM-1021', budget: '30 – 36M',
    when: 'Yesterday', unanswered: false, owner: null, firstTouch: 'yesterday',
    event: 'Called the office about the Palm Hills villa',
    messages: [
      { direction: 'OUT', locale: 'en', when: 'Yesterday, 16:10', body: 'Sending the Palm Hills brochure and the handover schedule now.' },
      { direction: 'IN', locale: 'en', when: 'Yesterday, 18:02', body: 'The price is above where I want to be. What is the room on a cash offer?' },
    ],
    tasks: [{ title: 'Take the cash offer to the owner', when: 'Today', done: false }],
    notes: 'Unassigned. Whoever picks this up: the owner has already refused 32M once.',
  },
  {
    id: 'nourhan', storeId: KAMAL, name: 'Nourhan Adel', phone: '+201002223344',
    source: 'WHATSAPP', stage: 'VIEWING_BOOKED', unitRef: 'AM-1027', budget: '6 – 8M',
    when: '2 days', unanswered: false, owner: 'other', firstTouch: '2 days ago',
    event: 'Asked about the Hyde Park garden apartment',
    messages: [
      { direction: 'IN', locale: 'ar', when: 'Wed, 12:04', body: 'الشقة اللي بجاردن في هايد بارك لسه موجودة؟' },
      { direction: 'OUT', locale: 'ar', when: 'Wed, 12:20', body: 'أيوه لسه متاحة. تحب نحدد معاينة السبت الصبح؟' },
    ],
    tasks: [],
    notes: '',
  },
  {
    id: 'karim', storeId: KAMAL, name: 'Karim ElSayed', phone: '+201006667788',
    source: 'FORM', stage: 'WON', unitRef: 'AM-0996', budget: null,
    when: '1 week', unanswered: false, owner: 'me', firstTouch: 'last week',
    event: 'Contract signed on the Mostakbal City townhouse',
    messages: [
      { direction: 'OUT', locale: 'en', when: 'Last Tuesday', body: 'Contracts are ready. Bring your ID and the first cheque.' },
    ],
    tasks: [{ title: 'File the signed contract', when: 'Done', done: true }],
    notes: '',
  },
  // El Masria's own inbox, so the leads screen is tenant-scoped like every
  // other list. If this one ever shows up on Kamal Estates, the scoping broke.
  {
    id: 'yasmine', storeId: MASRIA, name: 'Yasmine Bakr', phone: '+201227778899',
    source: 'FORM', stage: 'NEW', unitRef: 'EM-2207', budget: '6 – 8M',
    when: '35 min', unanswered: true, owner: 'me', firstTouch: '35 minutes ago',
    event: 'Booked a viewing from the website form',
    messages: [
      { direction: 'IN', locale: 'en', when: 'Today, 13:05', body: 'Requested a viewing — Mon 7 Sep at 11:30.' },
    ],
    tasks: [],
    notes: '',
  },
  {
    id: 'sherif', storeId: MASRIA, name: 'Sherif Anwar', phone: '+201221114455',
    source: 'CALL', stage: 'CONTACTED', unitRef: 'EM-2201', budget: '10 – 12M',
    when: '3 h', unanswered: false, owner: 'other', firstTouch: '3 hours ago',
    event: 'Called about the Dreamland townhouse',
    messages: [
      { direction: 'OUT', locale: 'en', when: 'Today, 10:40', body: 'Sent the floor plan and the maintenance figure.' },
    ],
    tasks: [],
    notes: '',
  },
];

// ─────────────────────────────────────────────── segments

export const SEGMENTS = ['all', 'unread', 'mine', 'unassigned', 'wa', 'form', 'call', 'fb'] as const;
export type Segment = (typeof SEGMENTS)[number];

/** One predicate, used by both the list and the counts, so a segment can never
 *  advertise a number the list will not produce. */
function inSegment(l: LeadRow, seg: Segment): boolean {
  switch (seg) {
    case 'unread': return l.unanswered;
    case 'mine': return l.owner === 'me';
    case 'unassigned': return l.owner === null;
    case 'wa': return l.source === 'WHATSAPP';
    case 'form': return l.source === 'FORM';
    case 'call': return l.source === 'CALL';
    case 'fb': return l.source === 'FACEBOOK' || l.source === 'INSTAGRAM';
    default: return true;
  }
}

export function parseLeadParams(sp: Record<string, string | string[] | undefined>) {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? '';
  };
  const seg = one('seg') as Segment;
  return {
    seg: (SEGMENTS as readonly string[]).includes(seg) ? seg : ('all' as Segment),
    q: one('q').toLowerCase(),
    lead: one('lead'),
  };
}

/** A lead as the list renders it: the row plus the unit line an agent actually
 *  scans for. Resolved once here rather than per-item, and it doubles as the
 *  search haystack — the static build searched the rendered text, so "marassi"
 *  found the Marassi chalet. Searching only the reference would not.
 */
export type LeadListItem = LeadRow & { unitLabel: string; haystack: string };

export type LeadListResult = {
  leads: LeadListItem[];
  counts: Record<Segment, number>;
  /** Page-head figures, derived from the same rows the list renders. */
  unanswered: number;
  total: number;
};

export async function listLeads(
  storeId: string,
  opts: { seg: Segment; q: string }
): Promise<LeadListResult> {
  const mine = await Promise.all(
    LEADS.filter((l) => l.storeId === storeId).map(async (l) => {
      const u = l.unitRef ? await getUnitByRef(l.unitRef, storeId) : null;
      const unitLabel = u
        ? `${TYPE_LABEL[u.type]} · ${u.compound ?? u.zone}, ${u.reference}`
        : 'No unit yet';
      return { ...l, unitLabel, haystack: `${l.name} ${l.phone} ${unitLabel} ${l.budget ?? ''}`.toLowerCase() };
    })
  );

  const matches = (l: LeadListItem) => {
    if (!inSegment(l, opts.seg)) return false;
    return !opts.q || l.haystack.includes(opts.q);
  };

  const counts = Object.fromEntries(
    SEGMENTS.map((s) => [s, mine.filter((l) => inSegment(l, s)).length])
  ) as Record<Segment, number>;

  return {
    leads: mine.filter(matches),
    counts,
    unanswered: mine.filter((l) => l.unanswered).length,
    total: mine.length,
  };
}

export async function getLead(id: string, storeId: string): Promise<LeadRow | null> {
  return LEADS.find((l) => l.id === id && l.storeId === storeId) ?? null;
}

// ─────────────────────────────────────────────── labels and derived copy

export const STAGES: { key: LeadStage; label: string; short: string }[] = [
  { key: 'NEW', label: 'New', short: 'New' },
  { key: 'CONTACTED', label: 'Contacted', short: 'Contacted' },
  { key: 'VIEWING_BOOKED', label: 'Viewing booked', short: 'Viewing' },
  { key: 'NEGOTIATING', label: 'Negotiating', short: 'Negotiating' },
  { key: 'WON', label: 'Won', short: 'Won' },
  { key: 'LOST', label: 'Lost', short: 'Lost' },
];

export const SOURCE_LABEL: Record<LeadSource, string> = {
  WHATSAPP: 'WhatsApp', FORM: 'the website form', CALL: 'a phone call',
  FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', PORTAL: 'a portal', WALK_IN: 'a walk-in',
};

/** Which pill class the list item wears. Colour is never the only signal — the
 *  pill always carries its own word. */
export const STAGE_PILL: Record<LeadStage, string> = {
  NEW: 'st--live', CONTACTED: 'st--reserved', VIEWING_BOOKED: 'st--live',
  NEGOTIATING: 'st--reserved', WON: 'st--sold', LOST: 'st--paused',
};

/**
 * Quick replies, generated from the unit's real terms.
 *
 * The static build hard-coded these — "EGP 144,028 a month for six years" sat
 * in a `data-reply` attribute. That is the drift `lib/pricing.ts` exists to
 * stop, and it is worse here than on a card: a card shows a stale number, a
 * quick reply *sends* one, in the agent's name, to the buyer. Every figure
 * below comes from `computePlan`.
 */
export async function quickReplies(lead: LeadRow, storeId: string): Promise<{ label: string; text: string; ar?: boolean }[]> {
  const unit: UnitRow | null = lead.unitRef ? await getUnitByRef(lead.unitRef, storeId) : null;
  const replies: { label: string; text: string; ar?: boolean }[] = [
    {
      label: 'Offer a viewing time',
      text: `Would Saturday suit you? I can do 11:30 and meet you at the unit — I will send the location.`,
    },
  ];

  if (unit && unit.downPct != null && unit.years != null) {
    const { downPayment, monthly, months } = computePlan(
      { price: unit.price, downPct: unit.downPct, years: unit.years },
      unit.areaSqm
    );
    replies.push({
      label: 'Send the payment plan',
      text:
        `Here is the full plan for ${unit.reference}: ${unit.downPct}% down (${egp(downPayment)}), ` +
        `then ${egp(monthly)} a month for ${unit.years} years — ${months} payments, starting on delivery.`,
    });
    replies.push({
      label: 'Send it in Arabic',
      ar: true,
      // Western digits inside Arabic copy, per the house rule and the market.
      text:
        `خطة السداد للوحدة ${unit.reference}: مقدم ${unit.downPct}% يعني ${egp(downPayment)}، ` +
        `وبعدها ${egp(monthly)} شهريًا لمدة ${unit.years} سنوات.`,
    });
  }

  return replies;
}

/**
 * What the stage control reports back. Lives here rather than beside the
 * action because a 'use server' module may only export async functions.
 */
export type StageState =
  | { status: 'idle'; stage?: undefined }
  | { status: 'saved' | 'unsaved'; stage: LeadStage };

export const STAGE_IDLE: StageState = { status: 'idle' };
