'use server';

import { revalidatePath } from 'next/cache';
import { db, orMock } from '@/lib/db';
import { mockStore } from '@/lib/mock';
import type { UnitRow } from '@/lib/queries/units';
import type { UnitDetail } from '@/lib/queries/unit-detail';
import { toDbFields } from '@/lib/queries/unit-map';

/**
 * Writing a listing.
 *
 * Two outcomes and never a third. `saved` means the row is in the database.
 * `unsaved` means it is not, and says why — which is the whole point: an editor
 * that reports a success it did not have is how an agent publishes a price
 * correction that never left the browser, then quotes the old price on the
 * phone.
 *
 * No database is connected yet, so today every call returns `unsaved` with
 * reason `no-database`. That is a real answer rather than a placeholder: the
 * moment DATABASE_URL points somewhere, this same code path writes for real.
 *
 * Every write is scoped by `storeId` in the `where`, not just by id. An id is
 * guessable and arrives from the browser; scoping on it alone is how one agency
 * edits another's unit.
 */

export type SaveOutcome =
  | { state: 'saved'; id: string; reference: string }
  | { state: 'unsaved'; reason: 'no-database' | 'duplicate' | 'invalid'; message: string };

export type ImportOutcome =
  | { state: 'imported'; created: number; drafts: number }
  | { state: 'unsaved'; reason: 'no-database' | 'nothing'; message: string };

const NO_DB_MESSAGE =
  'No database is connected, so nothing was written. Set DATABASE_URL and run ' +
  '`npm run db:push` — this same form then saves for real, with no other change.';

/** Nothing below this can be a unit, whatever else is filled in. */
function validate(u: UnitRow): string | null {
  if (!u.titleEn.trim()) return 'A listing needs an English title — it is what a buyer reads first.';
  if (!u.zone.trim()) return 'A listing needs a zone, or nobody filtering by area will find it.';
  if (!u.areaSqm || u.areaSqm <= 0) return 'A listing needs an area. Price per m² is what buyers compare.';
  if (!u.reference.trim()) return 'A listing needs a reference.';
  return null;
}

/** Prisma's unique-constraint code. Narrow on purpose — anything else is a real
 *  failure and must not reach an agent as "duplicate reference". */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

export async function saveUnit(unit: UnitRow, detail: UnitDetail): Promise<SaveOutcome> {
  const invalid = validate(unit);
  if (invalid) return { state: 'unsaved', reason: 'invalid', message: invalid };

  // The one line that changes when auth is real.
  const storeId = mockStore.id;

  try {
    return await orMock<SaveOutcome>(
      async () => {
        const row = await db.unit.update({
          // Tenant-scoped and unique in one clause, so this cannot reach
          // another agency's inventory even with a forged id.
          where: { storeId_reference: { storeId, reference: unit.reference } },
          data: toDbFields(unit, detail),
          select: { id: true, reference: true },
        });

        // The table, the editor and any collection this unit belongs to all
        // read stale otherwise, and a save that does not show is a save an
        // agent makes twice.
        revalidatePath('/dash/listings');
        revalidatePath(`/dash/listings/${row.reference.toLowerCase()}`);
        revalidatePath('/dash/collections');

        return { state: 'saved', id: row.id, reference: row.reference };
      },
      () => ({ state: 'unsaved', reason: 'no-database', message: NO_DB_MESSAGE })
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        state: 'unsaved', reason: 'duplicate',
        message: `Another unit already uses the reference ${unit.reference}.`,
      };
    }
    throw error;
  }
}

export async function createUnit(unit: UnitRow, detail: UnitDetail): Promise<SaveOutcome> {
  const invalid = validate(unit);
  if (invalid) return { state: 'unsaved', reason: 'invalid', message: invalid };

  const storeId = mockStore.id;

  try {
    return await orMock<SaveOutcome>(
      async () => {
        const row = await db.unit.create({
          data: { storeId, reference: unit.reference, ...toDbFields(unit, detail) },
          select: { id: true, reference: true },
        });
        revalidatePath('/dash/listings');
        return { state: 'saved', id: row.id, reference: row.reference };
      },
      () => ({ state: 'unsaved', reason: 'no-database', message: NO_DB_MESSAGE })
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        state: 'unsaved', reason: 'duplicate',
        // The reference is generated from the agency's own series, so a clash
        // means two people are adding a unit at once. Say that, rather than
        // surfacing "unique constraint failed".
        message:
          `Reference ${unit.reference} was taken while you were typing — someone else on your ` +
          'team added a unit. Change it and save again.',
      };
    }
    throw error;
  }
}

/**
 * Rows arrive already parsed, mapped and checked by the import screen; this
 * only writes them. One transaction, so a file never half-imports and leaves an
 * agency guessing which hundred of two hundred units made it.
 */
export async function importUnits(
  rows: { unit: UnitRow; detail: UnitDetail }[]
): Promise<ImportOutcome> {
  if (rows.length === 0) {
    return { state: 'unsaved', reason: 'nothing', message: 'There was nothing to import.' };
  }

  const storeId = mockStore.id;

  return orMock<ImportOutcome>(
    async () => {
      const written = await db.$transaction(
        rows.map(({ unit, detail }) =>
          db.unit.upsert({
            // Upsert rather than create: an agency re-importing a corrected
            // sheet expects its units updated, not doubled.
            where: { storeId_reference: { storeId, reference: unit.reference } },
            update: toDbFields(unit, detail),
            create: { storeId, reference: unit.reference, ...toDbFields(unit, detail) },
            select: { id: true, status: true },
          })
        )
      );
      revalidatePath('/dash/listings');
      return {
        state: 'imported',
        created: written.length,
        drafts: written.filter((w) => w.status === 'DRAFT').length,
      };
    },
    () => ({ state: 'unsaved', reason: 'no-database', message: NO_DB_MESSAGE })
  );
}
