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
  type: UnitType | null;
  beds: number | null;
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
  const view = one('view');
  const sort = one('sort');

  return {
    q: one('q').toLowerCase(),
    status: oneOf('status', STATUSES),
    purpose: oneOf('purpose', PURPOSES),
    zone: one('zone') || null,
    type: oneOf('type', TYPES),
    beds: Number.isFinite(beds) && beds > 0 ? beds : null,
    view: (['all', 'live', 'photos', 'pricedrop'] as const).includes(view as never)
      ? (view as UnitFilters['view'])
      : 'all',
    sort: (['updated', 'price-asc', 'price-desc', 'area-desc', 'views-desc'] as const).includes(sort as never)
      ? (sort as UnitFilters['sort'])
      : 'updated',
  };
}

export function activeFilterCount(f: UnitFilters): number {
  return [f.q, f.status, f.purpose, f.zone, f.type, f.beds].filter(Boolean).length;
}

// ─────────────────────────────────────────────── the data (mock for now)

const U = (
  reference: string, titleEn: string, titleAr: string, zone: string, compound: string | null,
  type: UnitType, purpose: Purpose, status: UnitStatus, areaSqm: number, bedrooms: number | null,
  price: number, downPct: number | null, years: number | null, delivery: string, finishing: string,
  photos: number, views: number, leads: number, agent: string, updated: string, featured = false
): UnitRow => ({
  id: reference.toLowerCase(), reference, titleEn, titleAr, zone, compound, type, purpose, status,
  areaSqm, bedrooms, price, downPct, years, delivery, finishing, photos, views, leads, agent, updated, featured,
});

const UNITS: UnitRow[] = [
  U('AM-1042', 'Penthouse with roof garden', 'بنتهاوس بحديقة خاصة', 'New Cairo', 'Mivida', 'PENTHOUSE', 'PRIMARY', 'LIVE', 168, 3, 8450000, 10, 8, 'Q2 2027', 'Fully finished', 8, 1204, 7, 'Youssef Kamal', '2 hours ago', true),
  U('AM-1038', 'Sea-view chalet, first row', 'شاليه بفيو بحري · الصف الأول', 'North Coast', 'Marassi', 'CHALET', 'PRIMARY', 'LIVE', 122, 2, 12200000, 15, 6, 'Q3 2027', 'Semi-finished', 12, 986, 5, 'Mai Farouk', 'Yesterday', true),
  U('AM-1035', 'Studio, fully finished with AC', 'استوديو متشطب بالتكييف', 'New Cairo', 'Zed East', 'STUDIO', 'RESALE', 'LIVE', 62, 0, 4250000, null, null, 'Ready', 'Fully finished', 6, 742, 3, 'Karim ElSayed', '2 days ago'),
  U('AM-1021', 'Standalone villa with garden', 'فيلا مستقلة بحديقة 300 م²', 'Sheikh Zayed', 'Palm Hills', 'VILLA', 'PRIMARY', 'RESERVED', 420, 5, 34000000, null, null, '2028', 'Core & shell', 14, 655, 9, 'Nourhan Adel', '3 days ago'),
  U('AM-1030', 'Chalet overlooking the pool', 'شاليه بفيو على البيسين', 'Ain Sokhna', 'Il Monte Galala', 'CHALET', 'PRIMARY', 'LIVE', 95, 2, 7900000, 10, 7, '2027', 'Fully finished', 9, 512, 4, 'Omar Hegazy', '4 days ago'),
  U('AM-1044', 'Twin house, semi-finished', 'توين هاوس نصف تشطيب', 'New Cairo', 'Sodic East', 'TWIN_HOUSE', 'PRIMARY', 'DRAFT', 240, 4, 15800000, 12, 8, '2027', 'Semi-finished', 0, 0, 0, 'Youssef Kamal', '1 hour ago'),
  U('AM-1027', 'Garden apartment, ready to move', 'شقة بجاردن · استلام فوري', 'New Cairo', 'Hyde Park', 'APARTMENT', 'RESALE', 'LIVE', 144, 3, 7100000, null, null, 'Ready', 'Fully finished', 11, 498, 6, 'Nourhan Adel', '5 days ago'),
  U('AM-1019', 'Duplex with private entrance', 'دوبلكس بمدخل خاص', '6th of October', 'Badya', 'DUPLEX', 'PRIMARY', 'DRAFT', 210, 4, 9600000, 10, 8, '2028', 'Semi-finished', 2, 0, 0, 'Karim ElSayed', '6 days ago'),
  U('AM-1008', 'Nile-view apartment', 'شقة بفيو النيل', 'Zamalek', null, 'APARTMENT', 'RESALE', 'LIVE', 185, 3, 18500000, null, null, 'Ready', 'Fully finished', 16, 1420, 11, 'Mai Farouk', '1 week ago'),
  U('AM-0996', 'Townhouse, corner unit', 'تاون هاوس كورنر', 'Mostakbal City', null, 'TOWNHOUSE', 'PRIMARY', 'SOLD', 195, 3, 8900000, null, null, '2026', 'Fully finished', 10, 820, 14, 'Omar Hegazy', '2 weeks ago'),
  U('AM-1041', 'Fitted office, tower B', 'مكتب إداري متشطب · برج B', 'New Capital', null, 'OFFICE', 'RENT', 'LIVE', 88, null, 6400000, 20, 5, '2027', 'Fully finished', 5, 304, 2, 'Youssef Kamal', '3 days ago'),
  U('AM-1012', 'Chalet, summer let', 'شاليه للإيجار الصيفي', 'North Coast', 'Marassi', 'CHALET', 'RENT', 'RENTED', 88, 1, 6750000, null, null, 'Ready', 'Fully finished', 7, 611, 8, 'Mai Farouk', '3 weeks ago'),
];

/** The zones actually present, so the filter can never offer an empty option. */
export const ZONES = Array.from(new Set(UNITS.map((u) => u.zone))).sort();

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
export async function listUnits(f: UnitFilters, storeId?: string): Promise<UnitListResult> {
  void storeId; // every query is tenant-scoped once the database is real

  const matches = (u: UnitRow) => {
    if (!inView(u, f.view)) return false;
    if (f.q) {
      const hay = `${u.titleEn} ${u.titleAr} ${u.reference} ${u.zone} ${u.compound ?? ''} ${u.type}`.toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    if (f.status && u.status !== f.status) return false;
    if (f.purpose && u.purpose !== f.purpose) return false;
    if (f.zone && u.zone !== f.zone) return false;
    if (f.type && u.type !== f.type) return false;
    if (f.beds && (u.bedrooms ?? 0) < f.beds) return false;
    return true;
  };

  const units = UNITS.filter(matches).sort((a, b) => {
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
    total: UNITS.length,
    // Derived from the same predicate the list uses, so a tab can never claim
    // a number the list will not produce.
    counts: {
      all: UNITS.length,
      live: UNITS.filter((u) => inView(u, 'live')).length,
      photos: UNITS.filter((u) => inView(u, 'photos')).length,
      pricedrop: UNITS.filter((u) => inView(u, 'pricedrop')).length,
    },
  };
}

export async function getUnit(id: string): Promise<UnitRow | null> {
  return UNITS.find((u) => u.id === id) ?? null;
}

/** Terms line for a card, computed rather than stored. */
export function unitTerms(u: UnitRow): string {
  if (u.downPct == null || u.years == null) return u.purpose === 'RENT' ? 'Rental terms' : 'Cash';
  const { monthly } = computePlan({ price: u.price, downPct: u.downPct, years: u.years });
  return `${u.downPct}% down · ${Math.round(monthly).toLocaleString('en-US')}/mo`;
}
