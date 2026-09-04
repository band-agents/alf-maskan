import { computePlan } from '@/lib/pricing';
import { getUnitByRef, listUnits, type UnitRow } from './units';

/**
 * The buyer's side of the same inventory.
 *
 * Everything a storefront shows about a unit is either a column the dashboard
 * already reads (`UnitRow`) or something derived from one. That is deliberate:
 * `listings.html` and `collections.html` in the static build once disagreed
 * about when AM-1038 delivers, because two pages each carried their own copy of
 * the same unit. Here the extra detail hangs off the shared row rather than
 * restating it, so a price or a delivery date has exactly one source.
 *
 * The narrative fields below — description, amenities, what is nearby — are the
 * ones a database will hold per unit and a mock cannot invent per unit. They
 * are keyed by reference and merged onto the row; a unit with no entry still
 * renders, minus those sections, rather than throwing.
 */

export type UnitDetail = UnitRow & {
  developer: string | null;
  builtUpSqm: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  negotiable: boolean;
  maintenanceFee: number | null;
  descEn: string[];
  descAr: string[];
  amenities: string[];
  nearby: { place: string; minutes: number }[];
  /** Named `gallery`, not `photos`: `UnitRow.photos` is already the count the
   *  dashboard table shows, and one name for two meanings is how a column ends
   *  up rendering a number where an image belongs. */
  gallery: { label: string; thumb: string }[];
  specNotes: Partial<Record<'area' | 'beds' | 'baths' | 'floor' | 'finishing' | 'delivery', string>>;
  agentPhone: string;
  agentBlurb: string;
  compoundBlurb: string | null;
};

/** Per-unit copy. Keyed by reference — the stable identifier a person quotes. */
const DETAIL: Record<string, Partial<UnitDetail>> = {
  'AM-1042': {
    developer: 'Emaar Misr',
    builtUpSqm: 152,
    bathrooms: 3,
    floor: 7,
    totalFloors: 7,
    negotiable: true,
    maintenanceFee: 380000,
    descEn: [
      'Top-floor penthouse in Mivida with a 60 m² private roof terrace overlooking the central park. Three bedrooms, one of them a master en-suite, and a separate reception that opens onto the terrace stair.',
      'Fully finished with air conditioning throughout, two dedicated parking spots, and delivery in the second quarter of 2027. The payment plan runs to eight years from a 10% down payment, and the seller will consider a shorter plan against a higher deposit.',
    ],
    descAr: [
      'بنتهاوس بالدور الأخير في ميفيدا، بتراس خاص 60 م² بفيو على الحديقة المركزية. ثلاث غرف نوم منها غرفة ماستر، وريسبشن منفصل يفتح على سلم التراس.',
      'متشطب بالكامل بالتكييف، ومعه جراجان، والاستلام الربع الثاني من 2027. خطة السداد تصل إلى ثماني سنوات بمقدم 10٪، والبائع مستعد لخطة أقصر مقابل مقدم أكبر.',
    ],
    amenities: [
      'Swimming pool', 'Gym', 'Clubhouse', 'Security 24/7',
      'Central AC', 'Two parking spots', 'Private roof terrace', 'Backup generator',
    ],
    nearby: [
      { place: 'Cairo Festival City', minutes: 6 },
      { place: 'AUC New Cairo', minutes: 9 },
      { place: '90th Street', minutes: 4 },
      { place: 'Ring Road', minutes: 7 },
      { place: 'Mivida Business Park', minutes: 3 },
    ],
    gallery: [
      { label: 'roof terrace at golden hour', thumb: 'roof terrace' },
      { label: 'reception, looking to the terrace', thumb: 'reception' },
      { label: 'master bedroom', thumb: 'master bedroom' },
      { label: 'kitchen, fully fitted', thumb: 'kitchen' },
      { label: 'view over the central park', thumb: 'park view' },
    ],
    specNotes: {
      beds: 'One master en-suite',
      baths: 'Guest WC',
      floor: 'Top floor',
      finishing: 'With AC',
    },
    agentBlurb: 'Your agent for Mivida · speaks Arabic and English',
    compoundBlurb:
      "Emaar Misr's 900-acre community off the Suez Road, built around a central park and a business district. Delivered in phases since 2019; phase 7, where this unit sits, hands over in 2027.",
  },
};

const AGENT_PHONE = '+201002448817';

/** Photo labels for a unit with no hand-written entry, so a gallery still reads
 *  as a gallery rather than five identical grey boxes. */
function genericGallery(u: UnitRow): { label: string; thumb: string }[] {
  const where = u.compound ? `${u.compound}, ${u.zone}` : u.zone;
  return [
    { label: `exterior · ${where}`, thumb: 'exterior' },
    { label: 'reception', thumb: 'reception' },
    { label: 'master bedroom', thumb: 'bedroom' },
    { label: 'kitchen', thumb: 'kitchen' },
  ].slice(0, Math.max(1, Math.min(5, u.photos || 1)));
}

export async function getUnitDetail(reference: string, storeId: string): Promise<UnitDetail | null> {
  const row = await getUnitByRef(reference, storeId);
  if (!row) return null;

  const extra = DETAIL[row.reference] ?? {};

  return {
    ...row,
    developer: extra.developer ?? null,
    builtUpSqm: extra.builtUpSqm ?? null,
    bathrooms: extra.bathrooms ?? null,
    floor: extra.floor ?? null,
    totalFloors: extra.totalFloors ?? null,
    negotiable: extra.negotiable ?? false,
    maintenanceFee: extra.maintenanceFee ?? null,
    descEn: extra.descEn ?? [],
    descAr: extra.descAr ?? [],
    amenities: extra.amenities ?? [],
    nearby: extra.nearby ?? [],
    gallery: extra.gallery ?? genericGallery(row),
    specNotes: extra.specNotes ?? {},
    agentPhone: AGENT_PHONE,
    agentBlurb: extra.agentBlurb ?? `Your agent for ${row.zone}`,
    compoundBlurb: extra.compoundBlurb ?? null,
  };
}

/**
 * Units to show under "Similar units".
 *
 * Same zone first, then anything else live — never the unit being viewed, and
 * never a draft, a sold or a reserved unit. A buyer following a "similar"
 * link into something they cannot buy is worse than a shorter rail.
 */
export async function similarUnits(to: UnitDetail, storeId: string, take = 3): Promise<UnitRow[]> {
  const { units } = await listUnits({
    q: '', status: null, purpose: null, zone: null, compound: null, type: null,
    beds: null, max: null, view: 'live', sort: 'views-desc',
  }, storeId);

  const others = units.filter((u) => u.id !== to.id);
  const sameZone = others.filter((u) => u.zone === to.zone);
  const rest = others.filter((u) => u.zone !== to.zone);

  return [...sameZone, ...rest].slice(0, take);
}

/**
 * The headline terms, computed from `computePlan` — the same module the
 * dashboard's listing editor imports. This function exists so the server-
 * rendered figure and the calculator's first frame come from one call rather
 * than two implementations that have to agree.
 */
export function headlinePlan(u: Pick<UnitDetail, 'price' | 'downPct' | 'years' | 'areaSqm'>) {
  const downPct = u.downPct ?? 0;
  const years = u.years ?? 1;
  return {
    downPct,
    years,
    ...computePlan({ price: u.price, downPct, years }, u.areaSqm),
  };
}
