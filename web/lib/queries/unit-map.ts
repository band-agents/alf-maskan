import { Finishing } from '@prisma/client';
import type { UnitDetail } from './unit-detail';
import type { UnitRow } from './units';

/**
 * The two places the UI and the database genuinely disagree about a unit.
 *
 * Both are worth stating rather than hiding, because both are the kind of
 * mismatch that compiles fine and produces wrong data.
 *
 * `finishing` is an enum in the schema and free text on screen. An enum is
 * right — it is filtered on, and "Fully Finished" and "fully finished" must not
 * be two different filter values — so the screen keeps its readable labels and
 * this maps them.
 *
 * `delivery` is a DateTime in the schema and a string like "Q2 2027" on screen.
 * The date is right: it sorts, it compares, and "delivering within a year" is a
 * real filter. But an agent quoting a developer's handover does not know a day,
 * and inventing one would be inventing data — so a quarter maps to the first
 * day of that quarter and reads back as the quarter it came from.
 */

export const FINISHING_LABEL: Record<Finishing, string> = {
  FULLY_FINISHED: 'Fully finished',
  FINISHED_WITH_AC: 'Finished with AC',
  SEMI_FINISHED: 'Semi-finished',
  CORE_AND_SHELL: 'Core & shell',
};

export function labelToFinishing(label: string): Finishing | null {
  const s = label.trim().toLowerCase();
  const hit = (Object.entries(FINISHING_LABEL) as [Finishing, string][])
    .find(([, l]) => l.toLowerCase() === s);
  if (hit) return hit[0];
  // Tolerant of what an import or an older row actually contains.
  if (s.includes('core') || s.includes('shell')) return 'CORE_AND_SHELL';
  if (s.includes('semi')) return 'SEMI_FINISHED';
  if (s.includes('ac')) return 'FINISHED_WITH_AC';
  if (s.includes('finish')) return 'FULLY_FINISHED';
  return null;
}

export const finishingToLabel = (f: Finishing | null): string =>
  f ? FINISHING_LABEL[f] : 'Not stated';

/** "Ready" is the absence of a delivery date, not a date in the past. */
export function deliveryToDate(text: string): Date | null {
  const s = text.trim();
  if (!s || /^ready/i.test(s)) return null;

  const quarter = s.match(/^Q([1-4])\s*(\d{4})$/i);
  if (quarter) {
    const q = Number(quarter[1]);
    return new Date(Date.UTC(Number(quarter[2]), (q - 1) * 3, 1));
  }

  const year = s.match(/^(\d{4})$/);
  if (year) return new Date(Date.UTC(Number(year[1]), 0, 1));

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateToDelivery(date: Date | null): string {
  if (!date) return 'Ready';
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  // January means the year was all anyone knew; a quarter start means a
  // quarter was. Anything else is a real date somebody entered.
  if (month === 0) return String(year);
  if (month % 3 === 0) return `Q${month / 3 + 1} ${year}`;
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Money is Decimal in the database and a number on screen. Prisma hands back a
 *  Decimal object, and `Number(decimal)` is the documented way across. */
export const toNumber = (v: unknown): number =>
  v === null || v === undefined ? 0 : Number(v);

export const toNullableNumber = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

/* ------------------------------------------------------- row → database row */

/**
 * One unit, as the database wants it.
 *
 * Shared by the seed and the save actions on purpose. These are the same
 * twenty-odd fields written twice otherwise, and the second copy is where a
 * field quietly stops being saved — the bug that leaves an agent's edit on
 * screen and out of the database.
 */
export function toDbFields(u: UnitRow, d: UnitDetail) {
  return {
    purpose: u.purpose,
    type: u.type,
    status: u.status,
    featured: u.featured,
    titleEn: u.titleEn,
    titleAr: u.titleAr,
    descEn: d.descriptionEn,
    descAr: d.descriptionAr,
    governorate: d.governorate,
    zone: u.zone,
    compound: u.compound,
    developer: d.developer,
    areaSqm: u.areaSqm,
    builtUpSqm: d.builtUpSqm,
    bedrooms: u.bedrooms,
    bathrooms: d.bathrooms,
    floor: d.floor,
    totalFloors: d.totalFloors,
    view: d.view,
    parking: d.parking,
    finishing: labelToFinishing(u.finishing),
    deliveryAt: deliveryToDate(u.delivery),
    price: u.price,
    downPaymentPct: u.downPct,
    installYears: u.years,
    maintenanceFee: d.maintenanceFee,
    negotiable: d.negotiable,
    amenities: d.amenities,
    metaTitleEn: d.metaTitle,
    metaDescEn: d.metaDesc,
    commission: d.commissionPct,
    notes: d.notes,
  };
}
