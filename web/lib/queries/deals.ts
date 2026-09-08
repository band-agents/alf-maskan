/**
 * Deals: the pipeline an agency actually manages money through.
 *
 * Everything numeric on this screen is derived here. That is not tidiness — the
 * static build authored its figures and three of them were wrong. It claimed
 * EGP 2,848,750 of commission at asking, where its own deals sum to 2,587,750,
 * and a weighted forecast of 1,361,813 against a real 1,205,213. A pipeline
 * screen exists to answer "what am I going to earn", so a number nobody
 * computed is worse than no number.
 *
 * The rule from lib/pricing.ts, applied to the board: one function owns each
 * total, and every place that shows it calls that function.
 */

export type StageId = 'contacted' | 'viewing' | 'negotiating' | 'reserved' | 'won';

export type Stage = {
  id: StageId;
  label: string;
  /** Flat close rate used for the weighted forecast. Deliberately a guess, and
   *  labelled as one on screen: an agency should replace these once it has a
   *  year of its own outcomes. */
  closeRate: number;
  /** Won is banked, not pipeline. Kept out of "live deals" and out of the
   *  forecast, which is what made the static build's 8-vs-9 discrepancy. */
  open: boolean;
};

export const STAGES: Stage[] = [
  { id: 'contacted', label: 'Contacted', closeRate: 0.2, open: true },
  { id: 'viewing', label: 'Viewing booked', closeRate: 0.35, open: true },
  { id: 'negotiating', label: 'Negotiating', closeRate: 0.6, open: true },
  { id: 'reserved', label: 'Reserved', closeRate: 0.85, open: true },
  { id: 'won', label: 'Won', closeRate: 1, open: false },
];

/** A deal sitting in one stage for this long has gone quiet. A fortnight is the
 *  static build's threshold and it is the right shape: shorter and every deal
 *  over a weekend is flagged, longer and the flag arrives after the buyer has. */
export const STALE_DAYS = 14;

export type Deal = {
  id: string;
  storeId: string;
  stage: StageId;
  /** What the unit is being sold for. */
  value: number;
  /** The agency's rate on this deal. Big-ticket villas are negotiated down;
   *  storing it per deal is why the commission total cannot be re-derived
   *  wrongly from a single assumed rate. */
  rate: number;
  unit: string;
  buyer: string;
  agent: string;
  /** Days in the current stage. */
  age: number;
};

const KAMAL = 'store_kamal';
const MASRIA = 'store_masria';

const DEALS: Deal[] = [
  { id: 'd1', storeId: KAMAL, stage: 'contacted', value: 12200000, rate: 0.025, unit: 'Sea-view chalet, first row', buyer: 'Mai Farouk · Marassi', agent: 'Mai Farouk', age: 2 },
  { id: 'd2', storeId: KAMAL, stage: 'contacted', value: 8200000, rate: 0.025, unit: 'Garden apartment, Hyde Park', buyer: 'Rania Wagdy · Hyde Park', agent: 'Karim ElSayed', age: 4 },
  { id: 'd3', storeId: KAMAL, stage: 'viewing', value: 15800000, rate: 0.025, unit: 'Twin house, Sodic East', buyer: 'Tarek Abdelrahman', agent: 'Youssef Kamal', age: 6 },
  { id: 'd4', storeId: KAMAL, stage: 'viewing', value: 8450000, rate: 0.025, unit: 'Penthouse, Mivida', buyer: 'Hala Mansour', agent: 'Youssef Kamal', age: 3 },
  { id: 'd5', storeId: KAMAL, stage: 'viewing', value: 7900000, rate: 0.025, unit: 'Chalet, Il Monte Galala', buyer: 'Sherif Nabil', agent: 'Omar Hegazy', age: 18 },
  { id: 'd6', storeId: KAMAL, stage: 'negotiating', value: 34000000, rate: 0.02, unit: 'Villa, Palm Hills', buyer: 'Omar Hegazy · buyer', agent: 'Nourhan Adel', age: 24 },
  { id: 'd7', storeId: KAMAL, stage: 'negotiating', value: 18200000, rate: 0.02, unit: 'Nile-view apartment, Zamalek', buyer: 'Dina Sherif', agent: 'Mai Farouk', age: 9 },
  { id: 'd8', storeId: KAMAL, stage: 'reserved', value: 9200000, rate: 0.025, unit: 'Corner penthouse, phase 7', buyer: 'Amr Selim', agent: 'Youssef Kamal', age: 5 },
  { id: 'd9', storeId: KAMAL, stage: 'won', value: 8900000, rate: 0.025, unit: 'Townhouse, Mostakbal City', buyer: 'Karim ElSayed · buyer', agent: 'Omar Hegazy', age: 0 },

  { id: 'm1', storeId: MASRIA, stage: 'contacted', value: 5400000, rate: 0.025, unit: 'Apartment, Beverly Hills', buyer: 'Hossam Ali', agent: 'Sara Naguib', age: 3 },
  { id: 'm2', storeId: MASRIA, stage: 'negotiating', value: 11750000, rate: 0.02, unit: 'Villa, Allegria', buyer: 'Mounir Fahmy', agent: 'Ahmed Zaki', age: 16 },
];

export function dealsFor(storeId: string): Deal[] {
  return DEALS.filter((d) => d.storeId === storeId);
}

export const commissionOf = (d: Deal) => d.value * d.rate;

export const isStale = (d: Deal) => d.stage !== 'won' && d.age >= STALE_DAYS;

export type Pipeline = {
  /** Open deals only. "Live deals" never includes won, which is banked. */
  openCount: number;
  openValue: number;
  /** Commission on open deals at the asking price — the optimistic number. */
  commission: number;
  /** The same, discounted by each stage's close rate. */
  weighted: number;
  staleCount: number;
  stale: Deal[];
  byStage: { stage: Stage; deals: Deal[]; count: number; value: number }[];
};

/**
 * Every figure the board and its sidebar show, from one pass over the deals.
 *
 * Taking a stage's deals from the same grouping that produces its total is what
 * makes a column header incapable of contradicting the cards beneath it.
 */
export function pipeline(deals: Deal[]): Pipeline {
  const byStage = STAGES.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage.id);
    return {
      stage,
      deals: inStage,
      count: inStage.length,
      value: inStage.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const open = deals.filter((d) => STAGES.find((s) => s.id === d.stage)?.open);
  const stale = deals.filter(isStale);

  return {
    openCount: open.length,
    openValue: open.reduce((sum, d) => sum + d.value, 0),
    commission: open.reduce((sum, d) => sum + commissionOf(d), 0),
    weighted: open.reduce((sum, d) => {
      const rate = STAGES.find((s) => s.id === d.stage)?.closeRate ?? 0;
      return sum + commissionOf(d) * rate;
    }, 0),
    staleCount: stale.length,
    stale,
    byStage,
  };
}

/**
 * The conversion funnel, last 90 days.
 *
 * Counts are historical outcomes rather than the current board, so they are
 * their own figures — but the bar widths are computed from them here rather
 * than written as percentages next to them, which is how the static build ended
 * up with a bar whose width and label disagreed.
 */
export type FunnelStep = { label: string; count: number; pct: number };

const FUNNEL_COUNTS: { label: string; count: number }[] = [
  { label: 'Leads', count: 142 },
  { label: 'Contacted', count: 96 },
  { label: 'Viewing booked', count: 41 },
  { label: 'Negotiating', count: 18 },
  { label: 'Won', count: 11 },
];

export function funnel(): { steps: FunnelStep[]; biggestDrop: { from: string; to: string; lost: number } } {
  const top = FUNNEL_COUNTS[0].count;
  const steps = FUNNEL_COUNTS.map((s) => ({ ...s, pct: Math.round((s.count / top) * 100) }));

  let biggest = { from: '', to: '', lost: 0 };
  for (let i = 1; i < FUNNEL_COUNTS.length; i++) {
    const lost = FUNNEL_COUNTS[i - 1].count - FUNNEL_COUNTS[i].count;
    if (lost > biggest.lost) {
      biggest = { from: FUNNEL_COUNTS[i - 1].label, to: FUNNEL_COUNTS[i].label, lost };
    }
  }
  return { steps, biggestDrop: biggest };
}

/** EGP in full, for a figure someone will act on. */
export const egpFull = (v: number) => `EGP ${Math.round(v).toLocaleString('en-US')}`;

/** EGP abbreviated, for a column header where the exact piastre is noise. */
export function egpShort(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    // One decimal below 100M, none above — 113.9M reads, 113.95M does not.
    return `EGP ${m >= 100 ? Math.round(m) : Math.round(m * 10) / 10}M`;
  }
  if (v >= 1000) return `EGP ${Math.round(v / 1000)}K`;
  return `EGP ${Math.round(v)}`;
}
