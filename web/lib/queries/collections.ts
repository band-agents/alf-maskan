import { unitsForStore, type UnitRow } from './units';

/**
 * Collections: a group of units an agency drops onto its storefront as a row,
 * a page, or a filter.
 *
 * The static build drew this screen with its matched units hard-coded — six
 * cards written by hand under a heading that said "2 units match right now".
 * They disagreed, because nothing derived either number.
 *
 * Here a collection is a saved query and nothing else. `matchUnits` is the only
 * thing that decides membership, so the count on the tab, the count in the
 * conditions bar, the count on the fieldset and the cards below it are the same
 * number by construction. This is the `computePlan` rule applied to inventory:
 * derive it once, never author it twice.
 */

export type RuleField = 'zone' | 'compound' | 'type' | 'price' | 'beds' | 'delivery' | 'status';

/** `is`/`isnot` compare as text; `over`/`under` are numeric and only offered
 *  for the two fields where a threshold is what an agent actually means. */
export type RuleOp = 'is' | 'isnot' | 'over' | 'under';

export type Rule = { field: RuleField; op: RuleOp; value: string };

export type Collection = {
  id: string;
  storeId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  description: string;
  /** Automatic collections re-evaluate their rules on every read, so adding a
   *  Marassi chalet tomorrow joins it with nobody touching anything. Manual
   *  ones are a pinned list, which is what "Youssef's picks" means. */
  auto: boolean;
  match: 'all' | 'any';
  rules: Rule[];
  /** Manual membership, by unit reference. Ignored when `auto`. */
  refs: string[];
};

export const RULE_FIELDS: { value: RuleField; label: string; numeric: boolean }[] = [
  { value: 'zone', label: 'Zone', numeric: false },
  { value: 'compound', label: 'Compound', numeric: false },
  { value: 'type', label: 'Unit type', numeric: false },
  { value: 'price', label: 'Price', numeric: true },
  { value: 'beds', label: 'Bedrooms', numeric: true },
  { value: 'delivery', label: 'Delivery', numeric: false },
  { value: 'status', label: 'Status', numeric: false },
];

/** The value a rule reads off a unit. Kept in one place so the editor's option
 *  lists and the matcher can never drift apart. */
function fieldValue(field: RuleField, u: UnitRow): string | number {
  switch (field) {
    case 'zone': return u.zone;
    case 'compound': return u.compound ?? '';
    case 'type': return u.type;
    case 'price': return u.price;
    case 'beds': return u.bedrooms ?? 0;
    case 'delivery': return u.delivery;
    case 'status': return u.status;
  }
}

function ruleMatches(rule: Rule, u: UnitRow): boolean {
  const actual = fieldValue(rule.field, u);

  if (rule.op === 'over' || rule.op === 'under') {
    const threshold = Number(rule.value);
    const value = Number(actual);
    // A non-numeric comparison is a mistake in the rule, not a match. Silently
    // returning true would quietly widen a collection an agency is selling from.
    if (!Number.isFinite(threshold) || !Number.isFinite(value)) return false;
    return rule.op === 'over' ? value > threshold : value < threshold;
  }

  // Delivery is the awkward one: "2027" should match "Q3 2027", because that is
  // how an agent thinks about a year and how the static build's own data was
  // written. Everything else is an exact, case-insensitive comparison.
  const a = String(actual).toLowerCase();
  const b = rule.value.toLowerCase();
  const hit = rule.field === 'delivery' ? a.includes(b) : a === b;
  return rule.op === 'is' ? hit : !hit;
}

/** The units in a collection, right now. */
export function matchUnits(c: Collection, units: UnitRow[]): UnitRow[] {
  if (!c.auto) {
    const wanted = new Set(c.refs);
    return units.filter((u) => wanted.has(u.reference));
  }
  if (c.rules.length === 0) return [];
  return units.filter((u) =>
    c.match === 'all' ? c.rules.every((r) => ruleMatches(r, u)) : c.rules.some((r) => ruleMatches(r, u))
  );
}

/** The distinct values a field actually takes across a store, for the editor's
 *  third dropdown. Offering a value no unit has is how you build a collection
 *  that is empty and looks broken. */
export function valuesFor(field: RuleField, units: UnitRow[]): string[] {
  if (field === 'price' || field === 'beds') return [];
  const seen = new Set<string>();
  for (const u of units) {
    const v = String(fieldValue(field, u));
    if (v) seen.add(v);
  }
  return [...seen].sort();
}

const KAMAL = 'store_kamal';
const MASRIA = 'store_masria';

const COLLECTIONS: Collection[] = [
  {
    id: 'col_sahel',
    storeId: KAMAL,
    slug: 'sahel-2027',
    nameEn: 'Sahel 2027 delivery',
    nameAr: 'استلام الساحل 2027',
    description:
      'Chalets and villas on the North Coast delivering in 2027 — the ones buyers ask about every spring.',
    auto: true,
    match: 'all',
    rules: [
      { field: 'zone', op: 'is', value: 'North Coast' },
      { field: 'delivery', op: 'is', value: '2027' },
    ],
    refs: [],
  },
  {
    id: 'col_under10',
    storeId: KAMAL,
    slug: 'under-10m',
    nameEn: 'Under EGP 10M',
    nameAr: 'أقل من 10 مليون جنيه',
    description: 'Everything a first-time buyer can reach, in one row.',
    auto: true,
    match: 'all',
    rules: [{ field: 'price', op: 'under', value: '10000000' }],
    refs: [],
  },
  {
    id: 'col_ready',
    storeId: KAMAL,
    slug: 'ready-to-move',
    nameEn: 'Ready to move',
    nameAr: 'استلام فوري',
    description: 'No waiting, no delivery date to explain. The easiest units to sell.',
    auto: true,
    match: 'all',
    rules: [{ field: 'delivery', op: 'is', value: 'Ready' }],
    refs: [],
  },
  {
    id: 'col_picks',
    storeId: KAMAL,
    slug: 'youssef-picks',
    nameEn: "Youssef's picks",
    nameAr: 'اختيارات يوسف',
    description: 'Hand-chosen for the homepage. Changes when Youssef says so, not when the data does.',
    auto: false,
    match: 'all',
    rules: [],
    refs: ['AM-1042', 'AM-1038', 'AM-1008'],
  },
  {
    id: 'col_zayed',
    storeId: MASRIA,
    slug: 'zayed-resale',
    nameEn: 'Sheikh Zayed resale',
    nameAr: 'إعادة بيع الشيخ زايد',
    description: 'Resale stock in Zayed, where most of our enquiries start.',
    auto: true,
    match: 'all',
    rules: [{ field: 'zone', op: 'is', value: 'Sheikh Zayed' }],
    refs: [],
  },
];

export type CollectionRow = Collection & { count: number };

/** Every collection in a store, each already carrying its live count. */
export function collectionsFor(storeId: string): CollectionRow[] {
  const units = unitsForStore(storeId);
  return COLLECTIONS.filter((c) => c.storeId === storeId).map((c) => ({
    ...c,
    count: matchUnits(c, units).length,
  }));
}

/** One collection by slug, scoped. An unknown slug returns null rather than
 *  the first collection, so a stale link cannot silently show the wrong group. */
export function getCollection(storeId: string, slug: string | null): CollectionRow | null {
  const all = collectionsFor(storeId);
  if (!slug) return all[0] ?? null;
  return all.find((c) => c.slug === slug) ?? null;
}
