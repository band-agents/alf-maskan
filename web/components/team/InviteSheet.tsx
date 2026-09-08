'use client';

import { useEffect, useRef, useState } from 'react';
import { ROLES, roleById, type RoleId } from '@/lib/queries/team';
import { Hint } from '@/components/ui/atoms';

/**
 * The invite sheet.
 *
 * The role note updates as you pick, which is the whole design idea: what a
 * role can do belongs at the moment you choose it, not on a help page nobody
 * opens. It is read from the same ROLES list the matrix headers use, so the
 * description and the permissions cannot describe different things.
 */
export function InviteSheet({ scopes }: { scopes: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [role, setRole] = useState<RoleId>('agent');
  const [sent, setSent] = useState<string | null>(null);

  // showModal() cannot be an attribute, so opening is imperative either way.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const close = () => setSent(null);
    el.addEventListener('close', close);
    return () => el.removeEventListener('close', close);
  }, []);

  const current = roleById(role);
  // Owner is transferred, never granted, so it is not an option here.
  const invitable = ROLES.filter((r) => r.id !== 'owner');

  return (
    <>
      <button className="btn btn--go" type="button" onClick={() => dialog.current?.showModal()}>
        <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Invite member
      </button>

      <dialog className="sheet" ref={dialog}>
        <form
          method="dialog"
          onSubmit={(e) => {
            // No invite store and no mail sender, so this cannot claim to have
            // sent anything. It says what it did — nothing — rather than
            // closing with a tick.
            e.preventDefault();
            setSent(current.label);
          }}
        >
          <div className="sheet__head">
            <h2>Invite someone</h2>
            <button className="sheet__x" type="button" onClick={() => dialog.current?.close()}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="visually-hidden">Close</span>
            </button>
          </div>

          <div className="sheet__body">
            <div className="f">
              <label className="f__label" htmlFor="i-who">Email or mobile</label>
              <input className="inp" id="i-who" placeholder="sherif@kamalestates.com" autoComplete="off" />
              <span className="f__hint">
                A mobile number gets the invite on WhatsApp instead, which most agents open faster.
              </span>
            </div>

            <div className="f">
              <label className="f__label" htmlFor="i-role">Role</label>
              <span className="selwrap">
                <select
                  className="sel"
                  id="i-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleId)}
                >
                  {invitable.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <span className="selwrap__caret">
                  <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </div>

            <div className="rolenote" role="status" aria-live="polite">
              <b>{current.label}</b>
              {current.note}
            </div>

            <div className="f">
              <label className="f__label" htmlFor="i-scope">
                Limit them to
                <Hint about="About scope">
                  Scope narrows what a role can already do. It never widens it — an agent limited
                  to New Cairo still cannot publish.
                </Hint>
              </label>
              <span className="selwrap">
                <select className="sel" id="i-scope">
                  {scopes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span className="selwrap__caret">
                  <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </div>

            {sent && (
              <p className="rolenote" role="status">
                <b>Not sent</b>
                There is no invite store or mail sender yet, so nothing left the building. When
                there is, this sends a {sent} invite and the person appears in the table as
                pending.
              </p>
            )}
          </div>

          <div className="sheet__foot">
            <button className="btn btn--app" type="button" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button className="btn btn--go" type="submit">Send invite</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
