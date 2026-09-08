import type { UnitStatus, Purpose, UnitType } from '@prisma/client';
import { computePlan } from '@/lib/pricing';

/**
 * The unit query layer.
 *
 * Filters live in the URL, not in client state. That is the difference between
 * this and the static build: a filtered list is shareable, the back button
 * works, and the same object that describes the filter becomes a Prisma
 * `where` clause without translation. Swapping the mock for the database is a
 * change inside `listUnits` and nowhere else.
 */

export type UnitRow = {
  id: string;
  /** Every row carries its tenant. Not a convenience — it is what makes an
   *  unscoped query a type error rather than a data leak between agencies. */
  storeId: string;
  reference: string;
  titleEn: string;
  titleAr: string;
  zone: string;
  compound: string | null;
  type: UnitType;
  purpose: Purpose;
  status: UnitStatus;
  areaSqm: number;
  bedrooms: number | null;
  price: number;
  downPct: number | null;
  years: number | null;
  delivery: string;
  finishing: string;
  photos: number;
  views: number;
  leads: number;
  agent: string;
  updated: string;
  featured: boolean;
};

export type UnitFilters = {
  q: string;
  status: UnitStatus | null;
  purpose: Purpose | null;
  zone: string | null;
  compound: string | null;
  type: UnitType | null;
  beds: number | null;
  /** Price ceiling. Buyers shop by "nothing over X", not by a range. */
  max: number | null;
  view: 'all' | 'live' | 'photos' | 'pricedrop';
  sort: 'updated' | 'price-asc' | 'price-desc' | 'area-desc' | 'views-desc';
};

const STATUSES = ['DRAFT', 'LIVE', 'RESERVED', 'SOLD', 'RENTED'] as const;
const PURPOSES = ['PRIMARY', 'RESALE', 'SALE', 'RENT'] as const;
const TYPES = ['APARTMENT', 'DUPLEX', 'PENTHOUSE', 'VILLA', 'TWIN_HOUSE', 'TOWNHOUSE', 'CHALET', 'STUDIO', 'OFFICE'] as const;

/** Anything unrecognised in the URL is dropped rather than trusted. */
export function parseUnitFilters(sp: Record<string, string | string[] | undefined>): UnitFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || '';
  };
  const oneOf = <T extends readonly string[]>(k: string, allowed: T) => {
    const v = one(k).toUpperCase();
    return (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
  };

  const beds = Number(one('beds'));
  const max = Number(one('max'));
  const view = one('view');
  const sort = one('sort');

  return {
    q: one('q').toLowerCase(),
    status: oneOf('status', STATUSES),
    purpose: oneOf('purpose', PURPOSES),
    zone: one('zone') || null,
    compound: one('compound') || null,
    type: oneOf('type', TYPES),
    beds: Number.isFinite(beds) && beds > 0 ? beds : null,
    max: Number.isFinite(max) && max > 0 ? max : null,
    view: (['all', 'live', 'photos', 'pricedrop'] as const).includes(view as never)
      ? (view as UnitFilters['view'])
      : 'all',
    sort: (['updated', 'price-asc', 'price-desc', 'area-desc', 'views-desc'] as const).includes(sort as never)
      ? (sort as UnitFilters['sort'])
      : 'updated',
  };
}

export function activeFilterCount(f: UnitFilters): number {
  return [f.q, f.status, f.purpose, f.zone, f.compound, f.type, f.beds, f.max].filter(Boolean).length;
}

// ─────────────────────────────────────────────── the data (mock for now)

const U = (
  storeId: string,
  reference: string, titleEn: string, titleAr: string, zone: string, compound: string | null,
  type: UnitType, purpose: Purpose, status: UnitStatus, areaSqm: number, bedrooms: number | null,
  price: number, downPct: number | null, years: number | null, delivery: string, finishing: string,
  photos: number, views: number, leads: number, agent: string, updated: string, featured = false
): UnitRow => ({
  id: reference.toLowerCase(), storeId, reference, titleEn, titleAr, zone, compound, type, purpose, status,
  areaSqm, bedrooms, price, downPct, years, delivery, finishing, photos, views, leads, agent, updated, featured,
});

const KAMAL = 'store_kamal';
const MASRIA = 'store_masria';

const UNITS: UnitRow[] = [
  U(KAMAL, 'AM-1042', 'Penthouse with roof garden', 'بنتهاوس بحديقة خاصة', 'New Cairo', 'Mivida', 'PENTHOUSE', 'PRIMARY', 'LIVE', 168, 3, 8450000, 10, 8, 'Q2 2027', 'Fully finished', 8, 1204, 7, 'Youssef Kamal', '2 hours ago', true),
  U(KAMAL, 'AM-1038', 'Sea-view chalet, first row', 'شاليه بفيو بحري · الصف الأول', 'North Coast', 'Marassi', 'CHALET', 'PRIMARY', 'LIVE', 122, 2, 12200000, 15, 6, 'Q3 2027', 'Semi-finished', 12, 986, 5, 'Mai Farouk', 'Yesterday', true),
  U(KAMAL, 'AM-1035', 'Studio, fully finished with AC', 'استوديو متشطب بالتكييف', 'New Cairo', 'Zed East', 'STUDIO', 'RESALE', 'LIVE', 62, 0, 4250000, null, null, 'Ready', 'Fully finished', 6, 742, 3, 'Karim ElSayed', '2 days ago'),
  U(KAMAL, 'AM-1021', 'Standalone villa with garden', 'فيلا مستقلة بحديقة 300 م²', 'Sheikh Zayed', 'Palm Hills', 'VILLA', 'PRIMARY', 'RESERVED', 420, 5, 34000000, null, null, '2028', 'Core & shell', 14, 655, 9, 'Nourhan Adel', '3 days ago'),
  U(KAMAL, 'AM-1030', 'Chalet overlooking the pool', 'شاليه بفيو على البيسين', 'Ain Sokhna', 'Il Monte Galala', 'CHALET', 'PRIMARY', 'LIVE', 95, 2, 7900000, 10, 7, '2027', 'Fully finished', 9, 512, 4, 'Omar Hegazy', '4 days ago'),
  U(KAMAL, 'AM-1044', 'Twin house, semi-finished', 'توين هاوس نصف تشطيب', 'New Cairo', 'Sodic East', 'TWIN_HOUSE', 'PRIMARY', 'DRAFT', 240, 4, 15800000, 12, 8, '2027', 'Semi-finished', 0, 0, 0, 'Youssef Kamal', '1 hour ago'),
  U(KAMAL, 'AM-1027', 'Garden apartment, ready to move', 'شقة بجاردن · استلام فوري', 'New Cairo', 'Hyde Park', 'APARTMENT', 'RESALE', 'LIVE', 144, 3, 7100000, null, null, 'Ready', 'Fully finished', 11, 498, 6, 'Nourhan Adel', '5 days ago'),
  U(KAMAL, 'AM-1019', 'Duplex with private entrance', 'دوبلكس بمدخل خاص', '6th of October', 'Badya', 'DUPLEX', 'PRIMARY', 'DRAFT', 210, 4, 9600000, 10, 8, '2028', 'Semi-finished', 2, 0, 0, 'Karim ElSayed', '6 days ago'),
  U(KAMAL, 'AM-1008', 'Nile-view apartment', 'شقة بفيو النيل', 'Zamalek', null, 'APARTMENT', 'RESALE', 'LIVE', 185, 3, 18500000, null, null, 'Ready', 'Fully finished', 16, 1420, 11, 'Mai Farouk', '1 week ago'),
  U(KAMAL, 'AM-0996', 'Townhouse, corner unit', 'تاون هاوس كورنر', 'Mostakbal City', null, 'TOWNHOUSE', 'PRIMARY', 'SOLD', 195, 3, 8900000, null, null, '2026', 'Fully finished', 10, 820, 14, 'Omar Hegazy', '2 weeks ago'),
  U(KAMAL, 'AM-1041', 'Fitted office, tower B', 'مكتب إداري متشطب · برج B', 'New Capital', null, 'OFFICE', 'RENT', 'LIVE', 88, null, 6400000, 20, 5, '2027', 'Fully finished', 5, 304, 2, 'Youssef Kamal', '3 days ago'),
  U(KAMAL, 'AM-1012', 'Chalet, summer let', 'شاليه للإيجار الصيفي', 'North Coast', 'Marassi', 'CHALET', 'RENT', 'RENTED', 88, 1, 6750000, null, null, 'Ready', 'Fully finished', 7, 611, 8, 'Mai Farouk', '3 weeks ago'),

  // El Masria — a resale broker in Giza. Its own reference series, its own
  // agents, its own zones, and cash-heavy because resale usually is. Nothing
  // here overlaps Kamal Estates, so a query that leaks between tenants shows up
  // as a wrong zone on the page rather than as a subtle duplicate.
  U(MASRIA, 'EM-2207', 'Family apartment near the club', 'شقة عائلية بجوار النادي', 'Sheikh Zayed', 'Beverly Hills', 'APARTMENT', 'RESALE', 'LIVE', 176, 3, 6900000, null, null, 'Ready', 'Fully finished', 9, 431, 6, 'Hisham Bakr', '4 hours ago', true),
  U(MASRIA, 'EM-2201', 'Townhouse, quiet phase', 'تاون هاوس في مرحلة هادئة', '6th of October', 'Dreamland', 'TOWNHOUSE', 'RESALE', 'LIVE', 232, 4, 11400000, null, null, 'Ready', 'Semi-finished', 12, 388, 4, 'Rania Fathy', 'Yesterday'),
  U(MASRIA, 'EM-2194', 'Ground-floor flat with garden', 'شقة أرضي بحديقة', 'Sheikh Zayed', 'Zayed Dunes', 'APARTMENT', 'RESALE', 'LIVE', 158, 3, 5750000, 20, 4, 'Ready', 'Fully finished', 7, 512, 5, 'Hisham Bakr', '2 days ago', true),
  U(MASRIA, 'EM-2188', 'Duplex, roof included', 'دوبلكس بالروف', '6th of October', 'Palm Parks', 'DUPLEX', 'RESALE', 'RESERVED', 268, 4, 9250000, null, null, 'Ready', 'Fully finished', 10, 296, 7, 'Rania Fathy', '5 days ago'),
  U(MASRIA, 'EM-2176', 'Studio for annual rent', 'استوديو للإيجار السنوي', 'Sheikh Zayed', null, 'STUDIO', 'RENT', 'LIVE', 55, 0, 1450000, null, null, 'Ready', 'Furnished', 5, 204, 3, 'Sameh Lotfy', '1 week ago'),
  U(MASRIA, 'EM-2170', 'Clinic, medical tower', 'عيادة في برج طبي', '6th of October', null, 'CLINIC', 'SALE', 'LIVE', 74, null, 4300000, 25, 3, 'Ready', 'Core & shell', 4, 168, 2, 'Sameh Lotfy', '2 weeks ago'),
  U(MASRIA, 'EM-2165', 'Villa, sold last month', 'فيلا · تم البيع', 'Sheikh Zayed', 'Allegria', 'VILLA', 'RESALE', 'SOLD', 385, 5, 27500000, null, null, 'Ready', 'Fully finished', 15, 742, 11, 'Rania Fathy', '1 month ago'),
];

/**
 * The zones a given store actually has units in, so a filter or a footer can
 * never offer a zone that returns nothing. Tenant-scoped for the same reason
 * everything else is: New Cairo belongs on Kamal Estates' site and nowhere else.
 */
/** Every unit in one store, unfiltered. Collections and analytics both need
 *  the whole slice to reason about it, and both must still be scoped. */
export function unitsForStore(storeId: string): UnitRow[] {
  return UNITS.filter((u) => u.storeId === storeId);
}

export function zonesFor(storeId: string): string[] {
  return Array.from(new Set(UNITS.filter((u) => u.storeId === storeId).map((u) => u.zone))).sort();
}

/**
 * The same list for a buyer, which is a different list twice over.
 *
 * Live only — offering an area whose only unit sold last month sends someone to
 * an empty result and reads as a dead site. And ordered by how much the agency
 * actually has there, not alphabetically: a broker whose inventory is mostly
 * New Cairo should not have a homepage that leads with the one chalet in Ain
 * Sokhna because A comes first.
 */
export function publicZonesFor(storeId: string): string[] {
  const counts = new Map<string, number>();
  for (const u of UNITS) {
    if (u.storeId !== storeId || u.status !== 'LIVE') continue;
    counts.set(u.zone, (counts.get(u.zone) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([z]) => z);
}

/** Compounds a store has live units in, in descending order of how many. */
export function compoundsFor(storeId: string): string[] {
  const counts = new Map<string, number>();
  for (const u of UNITS) {
    if (u.storeId !== storeId || u.status !== 'LIVE' || !u.compound) continue;
    counts.set(u.compound, (counts.get(u.compound) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

// ─────────────────────────────────────────────── the query

export type UnitListResult = {
  units: UnitRow[];
  total: number;
  counts: { all: number; live: number; photos: number; pricedrop: number };
};

/** Pure: a unit and a saved view in, a boolean out. Shared by the list and the
 *  tab counts so the two cannot drift. */
function inView(u: UnitRow, view: UnitFilters['view']): boolean {
  switch (view) {
    case 'live': return u.status === 'LIVE';
    case 'photos': return u.photos < 3;
    // Live, well-viewed and converting poorly — the units worth a price
    // conversation. The same rule the server would run over the whole table.
    case 'pricedrop': return u.status === 'LIVE' && u.views >= 300 && u.leads <= 4;
    default: return true;
  }
}

/**
 * When the database is live this becomes:
 *
 *   const where: Prisma.UnitWhereInput = { storeId, ...whereFromFilters(f) };
 *   const [units, total] = await db.$transaction([
 *     db.unit.findMany({ where, orderBy: orderFromSort(f.sort), take, skip }),
 *     db.unit.count({ where }),
 *   ]);
 *
 * The shape returned here is already that shape, so nothing above it changes.
 */
export async function listUnits(f: UnitFilters, storeId: string): Promise<UnitListResult> {
  // Tenant first, and not optional. Every count below is taken from this slice
  // rather than the whole table, so a tab can never total another agency's
  // inventory — the failure that would be least visible and worst to ship.
  const mine = UNITS.filter((u) => u.storeId === storeId);

  const matches = (u: UnitRow) => {
    if (!inView(u, f.view)) return false;
    if (f.q) {
      const hay = `${u.titleEn} ${u.titleAr} ${u.reference} ${u.zone} ${u.compound ?? ''} ${u.type}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    if (f.status && u.status !== f.status) return false;
    if (f.purpose && u.purpose !== f.purpose) return false;
    if (f.zone && u.zone !== f.zone) return false;
    if (f.compound && u.compound !== f.compound) return false;
    if (f.max && u.price > f.max) return false;
    if (f.type && u.type !== f.type) return false;
    if (f.beds && (u.bedrooms ?? 0) < f.beds) return false;
    return true;
  };

  const units = mine.filter(matches).sort((a, b) => {
    switch (f.sort) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'area-desc': return b.areaSqm - a.areaSqm;
      case 'views-desc': return b.views - a.views;
      default: return 0;
    }
  });

  return {
    units,
    total: mine.length,
    // Derived from the same predicate the list uses, so a tab can never claim
    // a number the list will not produce.
    counts: {
      all: mine.length,
      live: mine.filter((u) => inView(u, 'live')).length,
      photos: mine.filter((u) => inView(u, 'photos')).length,
      pricedrop: mine.filter((u) => inView(u, 'pricedrop')).length,
    },
  };
}

export async function getUnit(id: string, storeId: string): Promise<UnitRow | null> {
  return UNITS.find((u) => u.id === id && u.storeId === storeId) ?? null;
}

/**
 * The storefront addresses a unit by its reference, not its id: AM-1042 is what
 * an agent writes in a WhatsApp message and what a buyer reads back down the
 * phone. Matching is case-insensitive so a link typed by hand still resolves.
 * Scoped by store once the database is real — references are unique per store,
 * not globally (`@@unique([storeId, reference])`).
 */
export async function getUnitByRef(reference: string, storeId: string): Promise<UnitRow | null> {
  const want = reference.trim().toUpperCase();
  return UNITS.find((u) => u.storeId === storeId && u.reference.toUpperCase() === want) ?? null;
}

/** Terms line for a card, computed rather than stored. */
export function unitTerms(u: UnitRow): string {
  if (u.downPct == null || u.years == null) return u.purpose === 'RENT' ? 'Rental terms' : 'Cash';
  const { monthly } = computePlan({ price: u.price, downPct: u.downPct, years: u.years });
  return `${u.downPct}% down · ${Math.round(monthly).toLocaleString('en-US')}/mo`;
}
