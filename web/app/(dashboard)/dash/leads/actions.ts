'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db, orMock } from '@/lib/db';
import { mockStore } from '@/lib/mock';
import type { StageState } from '@/lib/queries/leads';

/**
 * Moving a lead down the pipeline.
 *
 * Same rule as the buyer's side: never show a change as saved when it was not.
 * An agent who marks a lead "Viewing booked", closes the tab and comes back to
 * find it still "New" has lost the appointment — and worse, has stopped
 * trusting the board, which is the tool they were sold.
 *
 * So the control reports what happened. `saved` means the row moved; `unsaved`
 * means there is no database yet and the pill is showing an intention, not a
 * fact. There is no WhatsApp fallback for this one — an internal state change
 * has nowhere else to go — so the honest thing is simply to say so.
 */

const Move = z.object({
  lead: z.string().trim().min(1),
  stage: z.enum(['NEW', 'CONTACTED', 'VIEWING_BOOKED', 'NEGOTIATING', 'WON', 'LOST']),
});

export async function setLeadStage(_prev: StageState, form: FormData): Promise<StageState> {
  const parsed = Move.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: 'idle' };

  const { lead, stage } = parsed.data;
  // The one line that changes when auth is real: the store comes from the
  // session rather than a constant.
  const storeId = mockStore.id;

  const saved = await orMock(
    async () => {
      await db.lead.update({
        // Scoped by store as well as id, so a guessed id cannot move another
        // agency's lead. `updateMany` because a compound where needs it.
        where: { id: lead, storeId },
        data: { stage },
      });
      return true;
    },
    () => false
  );

  if (saved) revalidatePath('/dash/leads');
  return { status: saved ? 'saved' : 'unsaved', stage };
}
