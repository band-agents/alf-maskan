'use client';

import { useState } from 'react';
import {
  CAPABILITIES,
  LEVELS,
  LEVEL_GLYPH,
  LEVEL_WORD,
  ROLES,
  type Level,
  type RoleId,
} from '@/lib/queries/team';

type Grid = Record<string, Record<RoleId, Level>>;

const initial = (): Grid =>
  Object.fromEntries(CAPABILITIES.map((c) => [c.id, { ...c.levels }])) as Grid;

/**
 * The permissions matrix.
 *
 * Clicking a cell cycles full → limited → none. Each cell carries a glyph for
 * sighted readers and a real word for screen readers, and the two are written
 * as separate children rather than one being swapped in over the other — the
 * static build set textContent on the button, which wiped the hidden label it
 * had just written and threw on all sixty-three cells.
 *
 * "What changed" is derived by diffing against the defaults, so it lists the
 * net edit. Cycling a cell three times back to where it started removes it from
 * the list, which is the honest answer and not what a running log would say.
 */
export function Matrix({ counts }: { counts: Record<RoleId, number> }) {
  const [grid, setGrid] = useState<Grid>(initial);
  const [saved, setSaved] = useState(false);

  function cycle(capId: string, role: RoleId) {
    setGrid((g) => {
      const next = LEVELS[(LEVELS.indexOf(g[capId][role]) + 1) % LEVELS.length];
      return { ...g, [capId]: { ...g[capId], [role]: next } };
    });
    setSaved(false);
  }

  const changes = CAPABILITIES.flatMap((c) =>
    ROLES.filter((r) => grid[c.id][r.id] !== c.levels[r.id]).map((r) => ({
      key: `${c.id}-${r.id}`,
      text: `${r.label} · ${c.label}: ${LEVEL_WORD[c.levels[r.id]]} → ${LEVEL_WORD[grid[c.id][r.id]]}`,
    }))
  );

  return (
    <>
      <div className="cap-key" style={{ marginBottom: 14 }}>
        <span><i style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>●</i> Full — can do all of it</span>
        <span><i style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>◐</i> Limited — their own records only</span>
        <span><i style={{ border: '1px solid var(--rule)', color: 'var(--text-4)' }}>—</i> None — the screen is not in their sidebar</span>
      </div>

      <div className="panel panel--pad">
        <div className="matrix-scroll">
          <table className="matrix">
            <caption className="visually-hidden">
              Capability groups down the side, roles across the top. Each cell is full, limited or
              none.
            </caption>
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">Capability</span></th>
                {ROLES.map((r) => (
                  <th scope="col" key={r.id}>
                    <span className={`matrix__role${r.locked ? ' matrix__role--locked' : ''}`}>
                      <b>{r.short}</b>
                      {/* Counted from the team, not written under the column.
                          This is the number that used to drift. */}
                      <span>{counts[r.id]}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    {c.label} <span>{c.detail}</span>
                  </th>
                  {ROLES.map((r) => {
                    const level = grid[c.id][r.id];
                    return (
                      <td key={r.id} data-level={level}>
                        <button
                          type="button"
                          className="cap"
                          disabled={r.locked}
                          onClick={() => cycle(c.id, r.id)}
                          title={r.locked ? 'The owner’s permissions are locked' : undefined}
                        >
                          <span className="cap__g" aria-hidden="true">{LEVEL_GLYPH[level]}</span>
                          <span className="visually-hidden">
                            {r.label}, {c.label}: {LEVEL_WORD[level]}
                            {r.locked ? ' (locked)' : '. Click to change.'}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="side-note" style={{ marginTop: 16 }}>
        <svg width="15" height="14" viewBox="0 0 16 15" fill="none" aria-hidden="true">
          <path d="M8 1l7 12.5H1L8 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r=".8" fill="currentColor" />
        </svg>
        <span>
          <b>Owner is locked on purpose</b>
          If the owner could be locked out of billing, a store could end up with nobody able to
          pay for it or close it. Transfer ownership instead — Settings, then Store profile.
        </span>
      </div>

      <div className="panel panel--pad" style={{ marginTop: 16 }}>
        <h2 className="panel__title" style={{ marginBottom: 10 }}>What changed</h2>
        <div
          style={{ fontSize: 'var(--t-micro)', color: 'var(--text-3)', lineHeight: 1.7 }}
          role="status"
          aria-live="polite"
        >
          {changes.length === 0 ? (
            <p>
              Nothing yet. Cells you change are listed here before you save, so you can see the
              whole edit at once rather than trusting your memory of nine clicks.
            </p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {changes.map((c) => <li key={c.key}>{c.text}</li>)}
            </ul>
          )}
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 14, alignItems: 'center' }}>
          <button
            className="btn btn--app"
            type="button"
            onClick={() => {
              setGrid(initial());
              setSaved(false);
            }}
          >
            Reset to defaults
          </button>
          <button
            className="btn btn--go"
            type="button"
            disabled={changes.length === 0}
            onClick={() => setSaved(true)}
          >
            Save permissions
          </button>
          {saved && (
            <span className="cell-sub">
              Not stored — there is no permissions table yet, so a refresh restores the defaults.
            </span>
          )}
        </div>
      </div>
    </>
  );
}
