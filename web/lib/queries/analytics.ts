import { unitsForStore, type UnitRow } from './units';

/**
 * Analytics.
 *
 * Two things in the static build could not survive the port. Its "views by
 * unit" chart listed units that do not exist in the inventory — a chalet with
 * 611 views that no listing screen has ever shown — and its range selector
 * changed nothing, because every figure beside it was a literal. A date control
 * that does not alter the numbers is worse than no control: it invites an
 * agency to compare two periods that are the same period.
 *
 * So there is a daily series underneath, every headline is an aggregate over
 * the chosen window, and the unit chart reads the real units. A unit's views on
 * this page and its views in the listings table are now the same number because
 * they are the same field.
 */

export type Range = 7 | 30 | 90 | 365;
export const RANGES: Range[] = [7, 30, 90, 365];

export function parseRange(v: string | string[] | undefined): Range {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as number[]).includes(n) ? (n as Range) : 30;
}

/**
 * A deterministic daily series.
 *
 * Real traffic is seasonal and weekly, and a flat random walk looks obviously
 * fake on a sparkline. This is a fixed seed rather than Math.random so a
 * refresh does not silently redraw the chart under the reader, and so the
 * server and any later client render agree.
 */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    // xorshift32 — small, stable, and good enough for a plausible curve.
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0xffffffff;
  };
}

export type Day = { visits: number; views: number; leads: number };

/** 730 days, newest last, so any window is a slice off the end and the period
 *  before it is the slice before that. */
function series(storeId: string): Day[] {
  const rand = seeded(storeId === 'store_kamal' ? 20260903 : 19980411);
  const scale = storeId === 'store_kamal' ? 1 : 0.42;
  const out: Day[] = [];
  for (let i = 0; i < 730; i++) {
    // A slow upward trend, a weekly rhythm (Friday is the quiet day here), and
    // noise on top.
    const trend = 0.6 + i / 900;
    const weekly = [1.15, 1.1, 1.05, 1.0, 0.72, 0.85, 1.08][i % 7];
    const noise = 0.82 + rand() * 0.36;
    const visits = Math.round(430 * trend * weekly * noise * scale);
    const views = Math.round(visits * (0.48 + rand() * 0.08));
    const leads = Math.round(views * (0.011 + rand() * 0.006));
    out.push({ visits, views, leads });
  }
  return out;
}

const sum = (days: Day[], k: keyof Day) => days.reduce((t, d) => t + d[k], 0);

export type Kpi = {
  label: string;
  value: number;
  /** Percent change against the previous window of the same length, except for
   *  counts small enough that a percentage misleads — see `deltaAbsolute`. */
  delta: number;
  deltaAbsolute: boolean;
  /** Whether up is good. Views per lead is the one where it is not. */
  upIsGood: boolean;
  spark: number[];
  hint: string;
};

export type Report = {
  range: Range;
  from: string;
  to: string;
  kpis: Kpi[];
  topUnits: { unit: UnitRow; views: number; leads: number; pct: number }[];
  unitInsight: string | null;
  sources: { label: string; count: number; pct: number; dash: string; offset: number }[];
  totalLeads: number;
  zones: { zone: string; searches: number; heat: number; wide: boolean }[];
  filters: { label: string; count: number; pct: number }[];
  filterGap: string;
  agents: { name: string; leads: number; viewings: number; won: number; value: number }[];
};

/** Points for a sparkline, thinned to eight so a year does not draw 365. */
function spark(days: Day[], key: keyof Day): number[] {
  const buckets = 8;
  const size = Math.max(1, Math.floor(days.length / buckets));
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    const slice = days.slice(i * size, (i + 1) * size);
    if (slice.length) out.push(Math.round(sum(slice, key) / slice.length));
  }
  return out;
}

function pctChange(now: number, before: number): number {
  if (before === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - before) / before) * 100);
}

const DAY_MS = 86_400_000;
const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function report(storeId: string, range: Range): Report {
  const all = series(storeId);
  const now = all.slice(-range);
  const before = all.slice(-range * 2, -range);

  const visits = sum(now, 'visits');
  const views = sum(now, 'views');
  const leads = sum(now, 'leads');
  const pViews = sum(before, 'views');
  const pLeads = sum(before, 'leads');

  // Views needed to produce one enquiry. Falling is the good direction, which
  // is why this KPI carries its own sense of "up".
  const ratio = leads === 0 ? 0 : Math.round(views / leads);
  const pRatio = pLeads === 0 ? 0 : Math.round(pViews / pLeads);

  const today = new Date('2026-09-03T00:00:00Z');
  const from = new Date(today.getTime() - (range - 1) * DAY_MS);

  const kpis: Kpi[] = [
    {
      label: 'Storefront visits',
      value: visits,
      delta: pctChange(visits, sum(before, 'visits')),
      deltaAbsolute: false,
      upIsGood: true,
      spark: spark(now, 'visits'),
      hint: 'One person opening your storefront, however many pages they then look at. Repeat visits from the same phone within an hour count once.',
    },
    {
      label: 'Unit views',
      value: views,
      delta: pctChange(views, pViews),
      deltaAbsolute: false,
      upIsGood: true,
      spark: spark(now, 'views'),
      hint: "A view is one buyer opening a unit page. It is the number that tells you whether a listing's photos and price are working.",
    },
    {
      label: 'Leads',
      value: leads,
      // Leads are small enough that "+31%" hides whether that is ten people or
      // three. The count is what an agency acts on.
      delta: leads - pLeads,
      deltaAbsolute: true,
      upIsGood: true,
      spark: spark(now, 'leads'),
      hint: 'Anyone who gave you a way to reach them — a form, a WhatsApp message or a call.',
    },
    {
      label: 'Views per lead',
      value: ratio,
      delta: ratio - pRatio,
      deltaAbsolute: true,
      upIsGood: false,
      spark: spark(now, 'leads'),
      hint: 'How many unit views it takes to produce one enquiry. Lower is better — it falls when your photos and prices are doing the work.',
    },
  ];

  // ---------------------------------------------------------------- units
  const units = unitsForStore(storeId);
  const ranked = [...units].sort((a, b) => b.views - a.views).slice(0, 8);
  const topViews = ranked[0]?.views ?? 1;
  const topUnits = ranked.map((u) => ({
    unit: u,
    views: u.views,
    leads: u.leads,
    pct: Math.round((u.views / topViews) * 100),
  }));

  // The observation the static build wrote by hand: find the unit converting
  // worst and the one converting best, among units with enough traffic to
  // judge. Written from the data so it cannot describe a unit that was deleted.
  const judgeable = topUnits.filter((t) => t.views >= 200);
  let unitInsight: string | null = null;
  if (judgeable.length >= 2) {
    const rate = (t: (typeof judgeable)[number]) => (t.leads === 0 ? Infinity : t.views / t.leads);
    const worst = judgeable.reduce((a, b) => (rate(a) > rate(b) ? a : b));
    const best = judgeable.reduce((a, b) => (rate(a) < rate(b) ? a : b));
    if (worst !== best) {
      unitInsight =
        `${worst.unit.titleEn} has ${worst.views.toLocaleString('en-US')} views and ` +
        `${worst.leads} ${worst.leads === 1 ? 'lead' : 'leads'}, while ${best.unit.titleEn} turned ` +
        `${best.views.toLocaleString('en-US')} into ${best.leads}. Similar traffic, very different outcome.`;
    }
  }

  // ---------------------------------------------------------------- sources
  const RAW_SOURCES = [
    { label: 'WhatsApp', share: 0.49 },
    { label: 'Website form', share: 0.27 },
    { label: 'Phone call', share: 0.14 },
    { label: 'Facebook', share: 0.1 },
  ];
  const counts = RAW_SOURCES.map((s) => Math.round(leads * s.share));
  const totalLeads = counts.reduce((a, b) => a + b, 0);

  // The arc maths, rather than four hand-written dasharrays. The static build's
  // segments were computed once against 125 leads and would have been wrong for
  // every other total — which is every other range.
  const C = 2 * Math.PI * 52;
  let offset = 0;
  const sources = RAW_SOURCES.map((s, i) => {
    const count = counts[i];
    const len = totalLeads === 0 ? 0 : (count / totalLeads) * C;
    const row = {
      label: s.label,
      count,
      pct: totalLeads === 0 ? 0 : Math.round((count / totalLeads) * 100),
      dash: `${len.toFixed(1)} ${(C - len).toFixed(1)}`,
      offset: -offset,
    };
    offset += len;
    return row;
  });

  // ---------------------------------------------------------------- zones
  const ZONE_WEIGHT: [string, number, boolean][] = [
    ['North Coast', 1840, true],
    ['Alexandria', 310, false],
    ['Matrouh', 0, false],
    ['6th of October', 520, false],
    ['Sheikh Zayed', 1120, false],
    ['New Cairo', 4210, false],
    ['New Capital', 640, false],
    ['Zamalek', 260, false],
    ['Mostakbal City', 410, false],
    ['Ain Sokhna', 980, true],
  ];
  const scale = range / 30;
  const scaled = ZONE_WEIGHT.map(([zone, base, wide]) => ({
    zone,
    searches: Math.round(base * scale),
    wide,
  }));
  const maxSearch = Math.max(...scaled.map((z) => z.searches), 1);
  const zones = scaled.map((z) => ({
    ...z,
    // Heat is a bucket of the maximum, so the darkest cell is always the
    // busiest zone rather than whatever crosses a fixed threshold.
    heat: z.searches === 0 ? 0 : Math.max(1, Math.ceil((z.searches / maxSearch) * 5)),
  }));

  // ---------------------------------------------------------------- filters
  const RAW_FILTERS: [string, number][] = [
    ['Under EGP 6M', 2140],
    ['Ready to move', 1670],
    ['3+ bedrooms', 1305],
    ['Has a payment plan', 1158],
    ['Chalet', 880],
    ['Fully finished', 704],
  ];
  const topFilter = RAW_FILTERS[0][1] * scale;
  const filters = RAW_FILTERS.map(([label, base]) => ({
    label,
    count: Math.round(base * scale),
    pct: Math.round(((base * scale) / topFilter) * 100),
  }));

  // The gap is counted against real stock, so it cannot claim four matching
  // units when the store has none.
  const under6 = units.filter((u) => u.price < 6_000_000).length;
  const filterGap =
    `"${RAW_FILTERS[0][0]}" is your most-used filter and you have ` +
    `${under6} ${under6 === 1 ? 'unit' : 'units'} that match it.`;

  // ---------------------------------------------------------------- agents
  const AGENTS: [string, number, number, number, number][] = [
    ['Youssef Kamal', 42, 18, 5, 48_200_000],
    ['Mai Farouk', 31, 14, 3, 36_600_000],
    ['Nourhan Adel', 24, 11, 2, 41_100_000],
    ['Karim ElSayed', 17, 6, 1, 8_200_000],
    ['Omar Hegazy', 11, 5, 2, 16_800_000],
  ];
  const agents = AGENTS.map(([name, l, v, w, value]) => ({
    name,
    leads: Math.round(l * scale),
    viewings: Math.round(v * scale),
    won: Math.round(w * scale),
    value: Math.round(value * scale),
  })).sort((a, b) => b.leads - a.leads);

  return {
    range,
    from: fmtDate(from),
    to: fmtDate(today),
    kpis,
    topUnits,
    unitInsight,
    sources,
    totalLeads,
    zones,
    filters,
    filterGap,
    agents,
  };
}
