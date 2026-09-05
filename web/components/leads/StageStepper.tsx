'use client';

import { useActionState } from 'react';
import type { LeadStage } from '@prisma/client';

import { setLeadStage } from '@/app/(dashboard)/dash/leads/actions';
import { STAGES, STAGE_IDLE, type StageState } from '@/lib/queries/leads';
import { Hint } from '@/components/ui/atoms';

/**
 * The pipeline stepper.
 *
 * Each pill is a submit button in one form, so the whole control works without
 * JavaScript — the page posts, the server moves the row, the list re-renders
 * with the new pill. No client state holds the stage; the server's answer does.
 *
 * When there is no database the pill still moves, but the control says the
 * change was not saved rather than letting an agent believe an appointment is
 * on the board when it is not.
 */
export function StageStepper({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const [state, action, pending] = useActionState<StageState, FormData>(setLeadStage, STAGE_IDLE);

  // The server's stage wins on a save; an unsaved attempt still shows where the
  // agent pointed, so the failure is legible rather than a control that ignores
  // the click.
  const shown = state.status === 'idle' ? stage : state.stage;

  return (
    <section aria-labelledby="stage-h">
      <div className="titlerow">
        <h3 className="panel__title" id="stage-h" style={{ marginBottom: 9 }}>Stage</h3>
        <Hint about="stages">
          Moving a lead to Viewing booked or further creates a deal on the pipeline board, so the
          two screens never disagree.
        </Hint>
      </div>

      <form action={action}>
        <input type="hidden" name="lead" value={leadId} />
        <div className="stepper" role="group" aria-label="Lead stage">
          {STAGES.map((s) => (
            <button
              key={s.key}
              className={`step-pill${s.key === 'WON' ? ' step-pill--won' : ''}${s.key === 'LOST' ? ' step-pill--lost' : ''}`}
              type="submit"
              name="stage"
              value={s.key}
              aria-current={s.key === shown ? 'step' : undefined}
              disabled={pending}
            >
              {s.label}
            </button>
          ))}
        </div>
      </form>

      {state.status === 'unsaved' && (
        // Not a toast that fades. An agent who walks away needs this still on
        // screen when they come back.
        <p className="f__hint" style={{ marginTop: 9, color: 'var(--warn)' }}>
          <b>Not saved.</b> There is no database connected yet, so this lead is still{' '}
          {STAGES.find((s) => s.key === stage)?.label} for everyone else on the team.
        </p>
      )}
      {state.status === 'saved' && (
        <p className="f__hint" style={{ marginTop: 9, color: 'var(--ok, var(--success))' }}>
          Moved to {STAGES.find((s) => s.key === shown)?.label}.
        </p>
      )}
    </section>
  );
}
