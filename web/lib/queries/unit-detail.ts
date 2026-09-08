import { computePlan } from '@/lib/pricing';
import { TYPE_LABEL } from '@/components/ui/atoms';
import { unitsForStore, type UnitRow } from './units';

/**
 * Everything about a unit that the list view does not need.
 *
 * Derived from the row rather than stored twenty fields wide, with a small
 * override table for the units an agency has actually filled in. Two reasons.
 * A hand-written detail record for twelve units is twelve chances for the meta
 * title to disagree with the title above it — and more usefully, this is what
 * the product should really do: a new listing arrives with a sensible draft of
 * everything, and the agent corrects rather than composes.
 */

export type MediaItem = { id: string; label: string; kind: 'photo' | 'plan' };

export type UnitDetail = {
  governorate: string;
  developer: string | null;
  builtUpSqm: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  view: string | null;
  parking: number;
  maintenanceFee: number | null;
  negotiable: boolean;
  amenities: string[];
  media: MediaItem[];
  videoUrl: string;
  tourUrl: string;
  metaTitle: string;
  metaDesc: string;
  commissionPct: number;
  coAgents: string[];
  notes: string;
  descriptionEn: string;
  descriptionAr: string;
};

export const GOVERNORATES = ['Cairo', 'Giza', 'Alexandria', 'Matrouh', 'Suez', 'Red Sea'];

/** Which governorate a zone sits in. An agent should never have to answer this
 *  twice, and getting it wrong is how a unit vanishes from a buyer's filter. */
const ZONE_GOV: Record<string, string> = {
  'New Cairo': 'Cairo',
  'Mostakbal City': 'Cairo',
  'New Capital': 'Cairo',
  Zamalek: 'Cairo',
  'Sheikh Zayed': 'Giza',
  '6th of October': 'Giza',
  'North Coast': 'Matrouh',
  'Ain Sokhna': 'Suez',
};

export const AMENITIES = [
  'Pool', 'Gym', 'Clubhouse', 'Security 24/7', 'Kids area', 'Smart home',
  'Central AC', 'Elevator', 'Backup generator', 'Private garden', 'Roof terrace',
  'Maid’s room', 'Covered parking', 'Beach access',
];

export const VIEWS = ['Garden', 'Pool', 'Sea', 'Golf', 'Street', 'Landscape', 'Nile', 'Open'];

export const FINISHING = ['Fully finished', 'Semi-finished', 'Core & shell', 'Furnished'];

/** Rooms a unit of this size and bedroom count plausibly has. A draft an agent
 *  corrects beats an empty field they skip. */
function defaultMedia(u: UnitRow): MediaItem[] {
  const rooms = ['reception', 'kitchen', 'master bedroom', 'bathroom', 'balcony', 'living area', 'entrance', 'terrace'];
  const items: MediaItem[] = [];
  for (let i = 0; i < u.photos; i++) {
    items.push({ id: `${u.reference}-p${i}`, label: rooms[i % rooms.length], kind: 'photo' });
  }
  // A floor plan is counted separately on the fieldset, because it is the one
  // image buyers ask for by name.
  if (u.photos >= 6) items.push({ id: `${u.reference}-plan`, label: 'floor plan', kind: 'plan' });
  return items;
}

function defaultAmenities(u: UnitRow): string[] {
  const base = ['Security 24/7'];
  if (u.compound) base.push('Pool', 'Gym', 'Clubhouse');
  if (u.finishing === 'Fully finished') base.push('Central AC');
  if (u.type === 'VILLA' || u.type === 'TWIN_HOUSE' || u.type === 'TOWNHOUSE') base.push('Private garden', 'Covered parking');
  if (u.zone === 'North Coast' || u.zone === 'Ain Sokhna') base.push('Beach access');
  if (u.type === 'PENTHOUSE') base.push('Roof terrace');
  return [...new Set(base)];
}

/** A meta description an agent can ship as-is: what it is, where, how big, what
 *  it costs and when it lands — in that order, because that is the order a buyer
 *  scanning a search result reads. */
function defaultMeta(u: UnitRow) {
  const plan = computePlan(
    { price: u.price, downPct: u.downPct ?? 0, years: u.years ?? 1 },
    u.areaSqm
  );
  const where = u.compound ? `${u.compound}, ${u.zone}` : u.zone;
  const beds = u.bedrooms ? `${u.bedrooms}-bedroom ` : '';
  const label = TYPE_LABEL[u.type]?.toLowerCase() ?? 'unit';

  const title = `${beds}${label} in ${where} — ${u.areaSqm} m²`;
  const money = u.downPct
    ? `EGP ${u.price.toLocaleString('en-US')} with a ${u.years}-year plan from EGP ${Math.round(plan.monthly).toLocaleString('en-US')} a month.`
    : `EGP ${u.price.toLocaleString('en-US')}, cash.`;
  const when = u.delivery === 'Ready' ? 'Ready to move.' : `Delivery ${u.delivery}.`;

  return {
    title: title.length > 90 ? title.slice(0, 87) + '…' : title,
    desc: `${u.finishing} ${label} of ${u.areaSqm} m² in ${where}. ${when} ${money}`,
  };
}

/** The few units an agency has genuinely filled in beyond the draft. */
const OVERRIDES: Record<string, Partial<UnitDetail>> = {
  'AM-1042': {
    developer: 'Emaar Misr',
    builtUpSqm: 168,
    bathrooms: 3,
    floor: 6,
    totalFloors: 6,
    view: 'Landscape',
    parking: 2,
    maintenanceFee: 34_000,
    notes: 'Owner will not go below 8.2M. Keys with the Mivida sales office, call ahead.',
    descriptionEn:
      'A top-floor penthouse with a 60 m² private roof terrace, laid out so the reception and terrace read as one room. Fully finished to Emaar spec, delivery Q2 2027.',
    descriptionAr:
      'بنتهاوس بالدور الأخير مع تراس خاص 60 م² على السطح، والريسبشن والتراس مفتوحين على بعض. تشطيب كامل بمواصفات إعمار، الاستلام الربع الثاني 2027.',
  },
  'AM-1038': {
    developer: 'Emaar Misr',
    bathrooms: 2,
    view: 'Sea',
    parking: 1,
    maintenanceFee: 22_000,
    notes: 'First row. Owner is abroad until October — offers by WhatsApp only.',
  },
  'AM-1021': {
    developer: 'Palm Hills Developments',
    builtUpSqm: 380,
    bathrooms: 5,
    view: 'Garden',
    parking: 3,
    maintenanceFee: 61_000,
    notes: 'Reserved pending the 10% deposit. Do not show to new buyers until 15 Sep.',
  },
};

export function unitDetail(u: UnitRow): UnitDetail {
  const meta = defaultMeta(u);
  const label = TYPE_LABEL[u.type]?.toLowerCase() ?? 'unit';
  const where = u.compound ? `${u.compound}, ${u.zone}` : u.zone;

  const base: UnitDetail = {
    governorate: ZONE_GOV[u.zone] ?? 'Cairo',
    developer: null,
    builtUpSqm: null,
    bathrooms: u.bedrooms ? Math.max(1, u.bedrooms - 1) : 1,
    floor: null,
    totalFloors: null,
    view: null,
    parking: u.type === 'STUDIO' || u.type === 'OFFICE' ? 0 : 1,
    maintenanceFee: null,
    negotiable: true,
    amenities: defaultAmenities(u),
    media: defaultMedia(u),
    videoUrl: '',
    tourUrl: '',
    metaTitle: meta.title,
    metaDesc: meta.desc,
    commissionPct: u.price >= 20_000_000 ? 2 : 2.5,
    coAgents: [],
    notes: '',
    descriptionEn: `${u.finishing} ${label} of ${u.areaSqm} m² in ${where}.`,
    descriptionAr: `${label} مساحة ${u.areaSqm} م² في ${where}.`,
  };

  return { ...base, ...OVERRIDES[u.reference] };
}

/* ------------------------------------------------------------ smart checks */

export type Check = {
  id: string;
  ok: boolean;
  /** What is missing, in the agency's terms. */
  label: string;
  /** Why it matters, with the cost of skipping it where that is known. */
  why: string;
  /** Weight in the completeness score. Photos count for more than a video
   *  because the evidence says so. */
  weight: number;
};

/**
 * What is missing from a listing, and what each gap costs.
 *
 * This is the piece the static build did not have and the reason an agent would
 * open this screen twice. A completeness bar that only counts filled fields is
 * a nag; one that says "no floor plan — buyers who cannot picture the layout
 * book fewer viewings" is an argument.
 */
export function checks(u: UnitRow, d: UnitDetail): Check[] {
  const photos = d.media.filter((m) => m.kind === 'photo').length;
  return [
    {
      id: 'photos', ok: photos >= 6, weight: 3,
      label: photos === 0 ? 'No photos at all' : `Only ${photos} photo${photos === 1 ? '' : 's'}`,
      why: 'Units with fewer than three photos get about a fifth of the views. Six to twelve is the range that works.',
    },
    {
      id: 'plan', ok: d.media.some((m) => m.kind === 'plan'), weight: 2,
      label: 'No floor plan',
      why: 'Buyers who cannot picture the layout ask more questions and book fewer viewings.',
    },
    {
      id: 'arabic', ok: u.titleAr.trim().length > 0 && d.descriptionAr.trim().length > 0, weight: 3,
      label: 'Arabic is incomplete',
      why: 'Most Egyptian buyers search in Arabic. A unit with only English text is close to invisible to them.',
    },
    {
      id: 'plan-terms', ok: u.downPct !== null && u.years !== null, weight: 2,
      label: 'No payment plan',
      why: 'A price without a plan reads as cash-only. Most enquiries start with "what is the down payment".',
    },
    {
      id: 'delivery', ok: Boolean(u.delivery), weight: 1,
      label: 'No delivery date',
      why: 'It is the second thing a buyer asks after the price.',
    },
    {
      id: 'amenities', ok: d.amenities.length >= 3, weight: 1,
      label: 'Few amenities listed',
      why: 'Amenities are what a buyer filters on when they have shortlisted three compounds.',
    },
    {
      id: 'seo', ok: d.metaTitle.length >= 20 && d.metaDesc.length >= 60, weight: 1,
      label: 'Search text is thin',
      why: 'This is the sentence Google shows. It is your advert, written once.',
    },
  ];
}

export function completeness(list: Check[]): number {
  const total = list.reduce((n, c) => n + c.weight, 0);
  const got = list.filter((c) => c.ok).reduce((n, c) => n + c.weight, 0);
  return total === 0 ? 100 : Math.round((got / total) * 100);
}

/* -------------------------------------------------------- price positioning */

export type Positioning = {
  /** Comparable units — same zone, same type where there are enough of them. */
  peers: { reference: string; pricePerSqm: number; title: string }[];
  pricePerSqm: number;
  median: number;
  min: number;
  max: number;
  /** 0–100, where this unit sits between the cheapest and dearest comparable. */
  percent: number;
  verdict: 'below' | 'in-line' | 'above';
  basis: string;
};

/**
 * Where this unit's price per m² sits against comparable stock.
 *
 * The single most useful thing this screen can tell an agent, and it needs no
 * new data — the answer is already in their own inventory. A unit priced 40%
 * above everything else in the zone is not a photography problem, and the
 * analytics screen will not tell you that until it has already cost you a month.
 */
export function positioning(u: UnitRow, storeId: string): Positioning | null {
  const all = unitsForStore(storeId).filter((x) => x.id !== u.id && x.areaSqm > 0);

  // Prefer same zone and type; widen to the zone, then to the type, rather than
  // comparing a Sokhna chalet with a Zamalek flat.
  const sameZoneType = all.filter((x) => x.zone === u.zone && x.type === u.type);
  const sameZone = all.filter((x) => x.zone === u.zone);
  const sameType = all.filter((x) => x.type === u.type);

  let peers = sameZoneType;
  let basis = `${TYPE_LABEL[u.type]?.toLowerCase() ?? 'unit'}s in ${u.zone}`;
  if (peers.length < 2) { peers = sameZone; basis = `units in ${u.zone}`; }
  if (peers.length < 2) { peers = sameType; basis = `${TYPE_LABEL[u.type]?.toLowerCase() ?? 'unit'}s across your stock`; }
  if (peers.length < 2) return null;

  const rate = (x: UnitRow) => x.price / x.areaSqm;
  const rates = peers.map(rate).sort((a, b) => a - b);
  const mine = u.areaSqm > 0 ? u.price / u.areaSqm : 0;

  const min = rates[0];
  const max = rates[rates.length - 1];
  const mid = Math.floor(rates.length / 2);
  const median = rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;

  const span = max - min || 1;
  const percent = Math.max(0, Math.min(100, Math.round(((mine - min) / span) * 100)));

  // A tenth either side of the median is "in line" — tighter than that and
  // every unit gets flagged, which trains an agent to ignore the flag.
  const verdict = mine > median * 1.1 ? 'above' : mine < median * 0.9 ? 'below' : 'in-line';

  return {
    peers: peers.map((p) => ({ reference: p.reference, pricePerSqm: rate(p), title: p.titleEn })),
    pricePerSqm: mine,
    median, min, max, percent, verdict, basis,
  };
}

/** The next reference in an agency's own series, so an agent never types one. */
export function nextReference(storeId: string): string {
  const mine = unitsForStore(storeId);
  const prefix = mine[0]?.reference.split('-')[0] ?? 'AM';
  const highest = mine.reduce((n, u) => {
    const num = Number(u.reference.split('-')[1]);
    return Number.isFinite(num) && num > n ? num : n;
  }, 0);
  return `${prefix}-${highest + 1}`;
}
