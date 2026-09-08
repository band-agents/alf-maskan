'use client';

import { useMemo, useState } from 'react';
import {
  STAGES,
  commissionOf,
  egpFull,
  egpShort,
  funnel,
  isStale,
  pipeline,
  type Deal,
  type StageId,
} from '@/lib/queries/deals';
import { Hint } from '@/components/ui/atoms';

/**
 * The pipeline board.
 *
 * Dragging a deal recomputes every figure on the screen from the moved set —
 * column counts and sums, pipeline value, commission, the weighted forecast and
 * the gone-quiet list. That is the point of the interaction: an agent wants to
 * see what moving this deal does to the month.
 *
 * What it does not do is save. There is no writes layer yet, and a board that
 * springs back on refresh without saying so is the "Requested." lie the
 * contact form used to tell. So the move is real for this session and the
 * notice says exactly that, once anything has moved.
 */
export function Board({ deals: initial }: { deals: Deal[] }) {
  const [deals, setDeals] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<StageId | null>(null);
  const [moved, setMoved] = useState(0);

  const p = useMemo(() => pipeline(deals), [deals]);
  const f = useMemo(() => funnel(), []);

  function move(id: string, stage: StageId) {
    // The decision is made out here, not inside the updater. A state updater
    // must be pure — React re-runs it to check — and setMoved() in there counted
    // every move twice, so the notice claimed two deals had moved when one had.
    const deal = deals.find((d) => d.id === id);
    if (deal && deal.stage !== stage) {
      // Age is days in the current stage, so moving resets it. Carrying it over
      // would flag a deal that just progressed as having gone quiet.
      setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage, age: 0 } : d)));
      setMoved((n) => n + 1);
    }
    setDragging(null);
    setOver(null);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Deals</h1>
          <p>
            <b>{p.openCount}</b> live deals worth <b>{egpFull(p.openValue)}</b>
            {p.staleCount > 0 && <> · {p.staleCount} {p.staleCount === 1 ? 'has' : 'have'} gone quiet.</>}
          </p>
        </div>
        <div className="page-head__actions">
          <a className="btn btn--app" href="/dash/leads">Leads inbox</a>
          <button className="btn btn--go" type="button">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New deal
          </button>
        </div>
      </div>

      {moved > 0 && (
        <p
          className="note"
          role="status"
          style={{
            marginBottom: 14,
            paddingInline: 16,
            height: 'auto',
            paddingBlock: 10,
            borderRadius: 'var(--r-12)',
            fontSize: 'var(--t-micro)',
            lineHeight: 1.5,
          }}
        >
          {moved === 1 ? 'One deal has' : `${moved} deals have`} been moved on this screen only.
          There is no deal store yet, so a refresh puts {moved === 1 ? 'it' : 'them'} back.
        </p>
      )}

      <div className="pipe">
        <div className="board">
          {p.byStage.map(({ stage, deals: inStage, count, value }) => (
            <section
              className="col"
              key={stage.id}
              aria-label={stage.label}
              data-over={over === stage.id ? '' : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage.id);
              }}
              onDragLeave={() => setOver((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging) move(dragging, stage.id);
              }}
            >
              <header className="col__head">
                <b>{stage.label}</b>
                <span className="col__n">{count}</span>
                <span className="col__sum">{egpShort(value)}</span>
              </header>
              <div className="col__body">
                {inStage.map((d) => (
                  <article
                    className="deal"
                    key={d.id}
                    draggable
                    data-stale={isStale(d) ? '' : undefined}
                    onDragStart={() => setDragging(d.id)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                  >
                    <div className="deal__top">
                      <span className="ph" aria-hidden="true" />
                      <span className="deal__txt">
                        <b>{d.unit}</b>
                        <span>{d.buyer}</span>
                      </span>
                    </div>
                    <div className="deal__money">
                      <b>{egpFull(d.value)}</b>
                      {/* Derived from the deal's own rate, so a negotiated 2%
                          villa cannot be shown at the standard 2.5%. */}
                      <span>
                        {d.rate * 100}% · {Math.round(commissionOf(d)).toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="deal__foot">
                      <span className="avatar avatar--sm" aria-hidden="true" />
                      <span>{shortName(d.agent)}</span>
                      <span className="deal__age">
                        {d.stage === 'won' ? 'Closed' : `${d.age} d`}
                      </span>
                    </div>
                  </article>
                ))}

                {/* A stage with nothing in it still has to be a drop target, or
                    you cannot move the first deal into it. */}
                {inStage.length === 0 && (
                  <p
                    style={{
                      fontSize: 'var(--t-nano)',
                      color: 'var(--text-4)',
                      padding: '14px 4px',
                      textAlign: 'center',
                    }}
                  >
                    Drop a deal here
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        <aside className="forecast" aria-label="Pipeline summary">
          <section className="panel panel--pad">
            <div className="titlerow">
              <h2 className="panel__title" style={{ marginBottom: 12 }}>Pipeline value</h2>
              <Hint about="About pipeline value">
                The full asking price of every open deal. It is not what you will earn — the
                commission line below is.
              </Hint>
            </div>
            <p className="kpi__value" style={{ fontSize: 28 }}>{egpShort(p.openValue)}</p>
            <p className="delta delta--up" style={{ marginTop: 6 }}>
              <svg width="8" height="6" viewBox="0 0 8 6" aria-hidden="true">
                <path d="M4 0l4 6H0z" fill="currentColor" />
              </svg>
              {p.openCount} open {p.openCount === 1 ? 'deal' : 'deals'}
            </p>
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--rule)',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                fontSize: 'var(--t-nano)',
                color: 'var(--text-3)',
              }}
            >
              <Row label="Commission at asking" value={egpFull(p.commission)} />
              <Row label="Weighted forecast" value={egpFull(p.weighted)} />
            </div>
            <p
              className="f__hint"
              style={{ marginTop: 10, fontSize: 'var(--t-nano)', color: 'var(--text-4)', lineHeight: 1.5 }}
            >
              Weighted uses a flat close rate per stage —{' '}
              {STAGES.filter((s) => s.open).map((s) => `${Math.round(s.closeRate * 100)}% ${s.label.toLowerCase()}`).join(', ')}.
              Change those once you have a year of your own numbers; until then treat it as a
              shape, not a promise.
            </p>
          </section>

          <section className="panel panel--pad">
            <h2 className="panel__title" style={{ marginBottom: 12 }}>Conversion</h2>
            <div className="funnel">
              {f.steps.map((s) => (
                <div className="funnel__row" key={s.label}>
                  <span className="funnel__top"><span>{s.label}</span><b>{s.count}</b></span>
                  {/* Width computed from the count, not written beside it. */}
                  <span className="funnel__bar" style={{ width: `${s.pct}%` }} />
                </div>
              ))}
            </div>
            <p
              className="f__hint"
              style={{ marginTop: 12, fontSize: 'var(--t-nano)', color: 'var(--text-4)', lineHeight: 1.5 }}
            >
              Last 90 days. The biggest drop is {f.biggestDrop.from.toLowerCase()} →{' '}
              {f.biggestDrop.to.toLowerCase()}: {f.biggestDrop.lost} people stopped answering after
              the first reply.
            </p>
          </section>

          <section className="panel panel--pad">
            <h2 className="panel__title" style={{ marginBottom: 10 }}>Gone quiet</h2>
            {p.stale.length === 0 ? (
              <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.6 }}>
                Nothing has sat in the same stage for more than a fortnight.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  {p.stale.length === 1 ? 'One deal has' : `${p.stale.length} deals have`} sat in
                  the same stage for over a fortnight.{' '}
                  {p.stale.length === 1 ? 'It is' : 'They are'} marked on the board.
                </p>
                <ul
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 'var(--t-micro)',
                  }}
                >
                  {p.stale.map((d) => (
                    <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span>{d.unit}</span>
                      <b style={{ color: 'var(--warn)', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-nano)' }}>
                        {d.age} d
                      </b>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
      <span>{label}</span>
      <b style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}

/** "Youssef Kamal" → "Youssef K." — the board is narrow and the surname is
 *  never what distinguishes two agents in one agency. */
function shortName(name: string): string {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}
