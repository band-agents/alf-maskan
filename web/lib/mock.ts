import type { Store, Unit } from '@prisma/client';

/**
 * Typed stand-in data, shaped by the Prisma types so the swap to real queries
 * is a change of source and not a change of every component that reads it.
 * The figures are the ones the static build uses, so the two agree on screen.
 *
 * Delete this file the moment DATABASE_URL points at something real.
 */

export const mockStore: Pick<
  Store,
  'id' | 'slug' | 'nameEn' | 'nameAr' | 'brandHex' | 'template'
> = {
  id: 'store_kamal',
  slug: 'kamal-estates',
  nameEn: 'Kamal Estates',
  nameAr: 'كمال العقارية',
  brandHex: '#0F5E4E',
  template: 'nile',
};

export type MockUnit = Pick<
  Unit,
  'id' | 'reference' | 'titleEn' | 'titleAr' | 'zone' | 'compound' | 'areaSqm' | 'bedrooms' | 'status'
> & { price: number; views: number; leads: number; agent: string; updated: string };

export const mockUnits: MockUnit[] = [
  { id: 'u1', reference: 'AM-1042', titleEn: 'Penthouse with roof garden', titleAr: 'بنتهاوس بحديقة خاصة', zone: 'New Cairo', compound: 'Mivida', areaSqm: 168, bedrooms: 3, status: 'LIVE', price: 8450000, views: 1204, leads: 7, agent: 'Youssef Kamal', updated: '2 hours ago' },
  { id: 'u2', reference: 'AM-1038', titleEn: 'Sea-view chalet, first row', titleAr: 'شاليه بفيو بحري', zone: 'North Coast', compound: 'Marassi', areaSqm: 122, bedrooms: 2, status: 'LIVE', price: 12200000, views: 986, leads: 5, agent: 'Mai Farouk', updated: 'Yesterday' },
  { id: 'u3', reference: 'AM-1035', titleEn: 'Studio, fully finished with AC', titleAr: 'استوديو متشطب بالتكييف', zone: 'New Cairo', compound: 'Zed East', areaSqm: 62, bedrooms: 0, status: 'LIVE', price: 4250000, views: 742, leads: 3, agent: 'Karim ElSayed', updated: '2 days ago' },
  { id: 'u4', reference: 'AM-1021', titleEn: 'Standalone villa with garden', titleAr: 'فيلا مستقلة بحديقة', zone: 'Sheikh Zayed', compound: 'Palm Hills', areaSqm: 420, bedrooms: 5, status: 'RESERVED', price: 34000000, views: 655, leads: 9, agent: 'Nourhan Adel', updated: '3 days ago' },
  { id: 'u5', reference: 'AM-1044', titleEn: 'Twin house, semi-finished', titleAr: 'توين هاوس نصف تشطيب', zone: 'New Cairo', compound: 'Sodic East', areaSqm: 240, bedrooms: 4, status: 'DRAFT', price: 15800000, views: 0, leads: 0, agent: 'Youssef Kamal', updated: '1 hour ago' },
];

/** EGP, Western digits, no decimals — the convention the whole product uses. */
export const egp = (v: number) => `EGP ${Math.round(v).toLocaleString('en-US')}`;

export const kpis = [
  { label: 'Active listings', value: '37', delta: '+4', up: true, hint: 'Units currently visible on your storefront. Drafts and sold units are not counted.' },
  { label: 'Views this week', value: '8,412', delta: '+18%', up: true, hint: 'A view is one buyer opening a unit page. Repeat visits from the same phone within an hour count once.' },
  { label: 'New leads', value: '23', delta: '+9', up: true, hint: 'Anyone who gave you a way to reach them — a form, a WhatsApp message or a call.' },
  { label: 'Deals in progress', value: '6', delta: '−1', up: false, hint: 'Open deals across every stage except Won and Lost.' },
];
