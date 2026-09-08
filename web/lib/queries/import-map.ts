import type { ImportRow } from './import';
import type { UnitRow } from './units';
import { unitDetail, type UnitDetail } from './unit-detail';

/**
 * Parsed spreadsheet rows, as units.
 *
 * The bridge between what the import screen shows and what the action writes.
 * It exists so the two cannot disagree: the preview table and the database both
 * read this, so a row previewed as a draft is written as a draft.
 *
 * Blocked rows — no title, no zone or no area — are dropped here rather than in
 * the action. They are still on screen, listed and explained, because an agency
 * needs to know which four of two hundred did not come across; they are simply
 * not units yet.
 */
export function toImportedUnits(
  rows: ImportRow[],
  storeId: string
): { unit: UnitRow; detail: UnitDetail }[] {
  return rows
    .filter((r) => !r.issues.some((i) => i === 'no title' || i === 'no zone' || i === 'no area'))
    .map((r) => {
      const v = r.values;
      const str = (k: keyof typeof v, fallback = '') => {
        const raw = v[k];
        return raw === null || raw === undefined ? fallback : String(raw);
      };
      const num = (k: keyof typeof v) => {
        const raw = v[k];
        return typeof raw === 'number' ? raw : null;
      };

      const unit: UnitRow = {
        // The id is assigned by the database on write; upsert matches on
        // store + reference, so nothing here depends on it.
        id: `import-${r.index}`,
        storeId,
        reference: str('reference') || `IMP-${r.index + 1}`,
        titleEn: str('titleEn'),
        titleAr: str('titleAr'),
        zone: str('zone'),
        compound: str('compound') || null,
        type: str('type', 'APARTMENT') as UnitRow['type'],
        purpose: str('purpose', 'PRIMARY') as UnitRow['purpose'],
        // A row with no price is a draft, exactly as the preview promised.
        status: r.status,
        areaSqm: num('areaSqm') ?? 0,
        bedrooms: num('bedrooms'),
        price: num('price') ?? 0,
        downPct: num('downPct'),
        years: num('years'),
        delivery: str('delivery'),
        finishing: str('finishing', 'Fully finished'),
        // Photos are not part of an import; the help guide says so and the
        // screen repeats it.
        photos: 0,
        views: 0,
        leads: 0,
        agent: str('agent'),
        updated: 'Just now',
        featured: false,
      };

      // The same drafting a hand-added listing gets: a meta description, plausible
      // amenities, a governorate. An imported unit should not arrive worse off
      // than a typed one.
      return { unit, detail: unitDetail(unit) };
    });
}
