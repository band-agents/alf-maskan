import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { RANGES, parseRange, report } from '@/lib/queries/analytics';
import { egpShort } from '@/lib/queries/deals';
import { Hint } from '@/components/ui/atoms';

export const metadata = {
  title: 'Analytics — Alf Maskan',
  description: 'What buyers looked at, where they came from and which agent turned it into a deal.',
};

/**
 * Analytics.
 *
 * The range lives in the URL, so a period is shareable and the back button
 * steps through what you looked at. It also, unlike the static build's version,
 * changes the numbers — every figure on this page is an aggregate over the
 * chosen window rather than a literal sitting next to a control that did
 * nothing.
 */
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  // The one line that changes when auth is real.
  const r = report(mockStore.id, range);

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>
            {r.from} – {r.to} · compared with the previous {range} days.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--app" type="button">Export CSV</button>
          <button className="btn btn--app" type="button">Email me this weekly</button>
        </div>
      </div>

      <div className="report-head">
        {/* Links, not buttons: the range is a destination, and this works with
            scripting off. */}
        <span className="seg">
          {RANGES.map((n) => (
            <Link
              key={n}
              href={n === 30 ? '/dash/analytics' : `/dash/analytics?range=${n}`}
              aria-pressed={range === n}
              scroll={false}
            >
              {n === 365 ? 'Year' : `${n} days`}
            </Link>
          ))}
        </span>
      </div>

      {/* ============================================ KPIs */}
      <section className="kpis" aria-label="Headline numbers">
        {r.kpis.map((k) => {
          const good = k.delta === 0 ? null : k.delta > 0 === k.upIsGood;
          const sign = k.delta > 0 ? '+' : k.delta < 0 ? '−' : '';
          const shown = Math.abs(k.delta) + (k.deltaAbsolute ? '' : '%');
          return (
            <article className="panel kpi" key={k.label}>
              <div className="kpi__label">
                <h2>{k.label}</h2>
                <Hint about={`About ${k.label.toLowerCase()}`}>{k.hint}</Hint>
              </div>
              <div className="kpi__body">
                <div>
                  <p className="kpi__value">{k.value.toLocaleString('en-US')}</p>
                  <p className={`delta ${good === false ? 'delta--down' : 'delta--up'}`}>
                    <svg
                      width="8"
                      height="6"
                      viewBox="0 0 8 6"
                      aria-hidden="true"
                      style={k.delta < 0 ? { transform: 'rotate(180deg)' } : undefined}
                    >
                      <path d="M4 0l4 6H0z" fill="currentColor" />
                    </svg>
                    {sign}{shown}
                  </p>
                </div>
                <Spark points={k.spark} invert={!k.upIsGood} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ============================================ views by unit */}
      <section className="panel panel--pad chartcard" aria-labelledby="vbu-h">
        <div className="chartcard__head">
          <div>
            <div className="titlerow">
              <h2 className="panel__title" id="vbu-h">Views by unit</h2>
              <Hint about="About views by unit">
                Your most-viewed units this period. A unit high here with no leads usually has a
                price problem, not a photo problem.
              </Hint>
            </div>
            <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginTop: 3 }}>
              Top {r.topUnits.length} units · leads in brackets
            </p>
          </div>
        </div>
        <div className="hbars">
          {r.topUnits.map((t) => (
            <div className="hbar" key={t.unit.id}>
              <span className="hbar__label">{t.unit.titleEn}</span>
              <span className="hbar__track">
                {/* Width from the number beside it, not typed next to it. */}
                <span className="hbar__fill" style={{ width: `${t.pct}%` }} />
              </span>
              <span className="hbar__val">
                {t.views.toLocaleString('en-US')} ({t.leads})
              </span>
            </div>
          ))}
        </div>
        {r.unitInsight && (
          <p
            style={{
              fontSize: 'var(--t-nano)',
              color: 'var(--text-4)',
              lineHeight: 1.55,
              borderTop: '1px solid var(--rule)',
              paddingTop: 12,
            }}
          >
            <b style={{ color: 'var(--text-3)' }}>Worth a look:</b> {r.unitInsight}
          </p>
        )}
      </section>

      {/* ============================================ source + zones */}
      <div className="split">
        <section className="panel panel--pad chartcard" aria-labelledby="src-h">
          <div className="titlerow">
            <h2 className="panel__title" id="src-h">Leads by source</h2>
            <Hint about="About sources">
              Where the {r.totalLeads} leads came in. Every slice is named beside its own number,
              so the chart still reads if the colours do not.
            </Hint>
          </div>
          <div className="donut-wrap">
            <svg
              className="donut"
              width="132"
              height="132"
              viewBox="0 0 132 132"
              role="img"
              aria-label={r.sources.map((s) => `${s.label} ${s.count} leads`).join(', ')}
            >
              <g transform="rotate(-90 66 66)">
                {r.sources.map((s, i) => (
                  <circle
                    key={s.label}
                    cx="66"
                    cy="66"
                    r="52"
                    stroke={`var(--series-${i + 1})`}
                    strokeDasharray={s.dash}
                    strokeDashoffset={s.offset}
                  />
                ))}
              </g>
              <text
                x="66" y="62" textAnchor="middle" fontSize="24" fontWeight="700"
                fill="var(--text)" fontFamily="var(--font-display)"
              >
                {r.totalLeads}
              </text>
              <text
                x="66" y="79" textAnchor="middle" fontSize="10"
                fill="var(--text-4)" fontFamily="var(--font-mono)"
              >
                LEADS
              </text>
            </svg>
            <div className="legend-list">
              {r.sources.map((s, i) => (
                <div className="legend-row" key={s.label}>
                  <i style={{ background: `var(--series-${i + 1})` }} />
                  {s.label} <b>{s.count}</b><span>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel panel--pad chartcard" aria-labelledby="zone-h">
          <div className="titlerow">
            <h2 className="panel__title" id="zone-h">Where buyers searched</h2>
            <Hint about="About the zone chart">
              Which zone people picked in your storefront&rsquo;s search filter. It tells you what
              to list next, not what you sold.
            </Hint>
          </div>
          <div
            className="carto"
            role="img"
            aria-label={`Search volume by zone: ${r.zones
              .map((z) => `${z.zone} ${z.searches || 'none'}`)
              .join(', ')}`}
          >
            {r.zones.map((z) => (
              <div
                className={`carto__cell${z.wide ? ' carto__span2' : ''}`}
                key={z.zone}
                data-heat={z.heat}
              >
                <b>{z.zone}</b>
                <span>{z.searches ? z.searches.toLocaleString('en-US') : '—'}</span>
              </div>
            ))}
          </div>
          <div className="heat-key">
            <span>Fewer searches</span>
            <i style={{ background: 'var(--panel-2)' }} />
            <i style={{ background: 'color-mix(in srgb, var(--palm-600) 16%, var(--panel))' }} />
            <i style={{ background: 'color-mix(in srgb, var(--palm-600) 34%, var(--panel))' }} />
            <i style={{ background: 'color-mix(in srgb, var(--palm-600) 62%, var(--panel))' }} />
            <i style={{ background: 'var(--palm-600)' }} />
            <span>More</span>
          </div>
          <p
            style={{
              fontSize: 'var(--t-nano)',
              color: 'var(--text-4)',
              lineHeight: 1.55,
              borderTop: '1px solid var(--rule)',
              paddingTop: 12,
            }}
          >
            These blocks are laid out roughly the way Egypt sits, but this is{' '}
            <b style={{ color: 'var(--text-3)' }}>not a map</b> — the sizes mean nothing and the
            shapes are not real. It is a table you can scan by position.
          </p>
        </section>
      </div>

      {/* ============================================ filters + leaderboard */}
      <div className="split">
        <section className="panel panel--pad chartcard" aria-labelledby="filt-h">
          <div className="titlerow">
            <h2 className="panel__title" id="filt-h">Filters buyers used</h2>
            <Hint about="About filters used">
              Every time someone narrowed your storefront search. A filter used often with few
              results is a gap in your stock.
            </Hint>
          </div>
          <div className="hbars">
            {r.filters.map((f) => (
              <div className="hbar" key={f.label}>
                <span className="hbar__label">{f.label}</span>
                <span className="hbar__track">
                  <span className="hbar__fill" style={{ width: `${f.pct}%` }} />
                </span>
                <span className="hbar__val">{f.count.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 'var(--t-nano)',
              color: 'var(--text-4)',
              lineHeight: 1.55,
              borderTop: '1px solid var(--rule)',
              paddingTop: 12,
            }}
          >
            {/* Counted against real stock, so it cannot promise four matching
                units the agency does not have. */}
            <b style={{ color: 'var(--text-3)' }}>Gap:</b> {r.filterGap}
          </p>
        </section>

        <section className="panel panel--pad chartcard" aria-labelledby="lead-h">
          <h2 className="panel__title" id="lead-h">Agent leaderboard</h2>
          <div className="tablescroll">
            <table className="dtable" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th className="col-num" scope="col">Leads</th>
                  <th className="col-num" scope="col">Viewings</th>
                  <th className="col-num" scope="col">Won</th>
                  <th className="col-num" scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {r.agents.map((a) => (
                  <tr key={a.name}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span className="avatar avatar--sm" aria-hidden="true" />
                        {a.name}
                      </span>
                    </td>
                    <td className="col-num">{a.leads}</td>
                    <td className="col-num">{a.viewings}</td>
                    <td className="col-num">{a.won}</td>
                    <td className="col-num"><span className="money">{egpShort(a.value)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              fontSize: 'var(--t-nano)',
              color: 'var(--text-4)',
              lineHeight: 1.55,
              borderTop: '1px solid var(--rule)',
              paddingTop: 12,
            }}
          >
            Ordered by leads, not by value — an agent can close less often on bigger units, which
            the value column shows and the ranking deliberately does not.
          </p>
        </section>
      </div>
    </main>
  );
}

/** A sparkline drawn from the series, scaled to its own range so a flat month
 *  looks flat rather than being stretched to fill the box. */
function Spark({ points, invert }: { points: number[]; invert?: boolean }) {
  const w = 72;
  const h = 34;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;

  const d = points
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(' ');

  return (
    <svg
      className={`kpi__spark${invert ? ' kpi__spark--flat' : ''}`}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <polyline points={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
