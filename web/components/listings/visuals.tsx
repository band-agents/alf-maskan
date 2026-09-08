'use client';

import { egp } from '@/lib/pricing';
import type { Check, Positioning } from '@/lib/queries/unit-detail';

/**
 * The visual pieces of the listing editor.
 *
 * Each of these answers a question an agent actually has, rather than
 * decorating a form. "Is this finished?", "am I priced sensibly?", "what am I
 * asking a buyer to pay, and when?" — a number can answer all three, but a
 * number does not get looked at and a shape does.
 */

/* ------------------------------------------------------------ completeness */

export function CompletenessRing({ score, size = 92 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;

  // Colour by band, not by a gradient: an agent needs "good enough / not yet",
  // and a continuous ramp makes 61% and 69% look meaningfully different.
  const tone = score >= 85 ? 'var(--ok)' : score >= 55 ? 'var(--sand-500)' : 'var(--warn)';

  return (
    <div style={{ display: 'grid', placeItems: 'center', position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${filled.toFixed(1)} ${(c - filled).toFixed(1)}`}
        />
      </svg>
      <span
        style={{
          position: 'absolute', fontFamily: 'var(--font-display)', fontSize: 22,
          fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums',
        }}
      >
        {score}%
      </span>
    </div>
  );
}

export function ChecklistPanel({ checks, score }: { checks: Check[]; score: number }) {
  const missing = checks.filter((c) => !c.ok);

  return (
    <section className="panel panel--pad" aria-labelledby="cx-h">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: missing.length ? 14 : 0 }}>
        <CompletenessRing score={score} />
        <div>
          <h2 className="panel__title" id="cx-h" style={{ marginBottom: 4 }}>Listing strength</h2>
          <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.55 }}>
            {missing.length === 0
              ? 'Nothing missing. This is as complete as a listing gets.'
              : `${missing.length} thing${missing.length === 1 ? '' : 's'} left. Each one below is ordered by what it costs you.`}
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Heaviest first: an agent who fixes one thing should fix the one
              that matters, not the one nearest the top of the form. */}
          {[...missing].sort((a, b) => b.weight - a.weight).map((c) => (
            <li key={c.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span
                aria-hidden="true"
                style={{
                  flex: 'none', width: 16, height: 16, borderRadius: 999, marginTop: 1,
                  background: c.weight >= 3 ? 'var(--warn-bg)' : 'var(--panel-2)',
                  color: c.weight >= 3 ? 'var(--warn)' : 'var(--text-4)',
                  display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700,
                  border: '1px solid var(--rule)',
                }}
              >
                !
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <b style={{ fontSize: 'var(--t-micro)', color: 'var(--text)' }}>{c.label}</b>
                <span style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.55 }}>{c.why}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------- price positioning */

export function PricePositioning({ p }: { p: Positioning }) {
  const fmt = (v: number) => `EGP ${Math.round(v).toLocaleString('en-US')}`;
  const medianPct = Math.max(0, Math.min(100, ((p.median - p.min) / (p.max - p.min || 1)) * 100));

  const word =
    p.verdict === 'above' ? 'above' : p.verdict === 'below' ? 'below' : 'in line with';
  const tone =
    p.verdict === 'above' ? 'var(--warn)' : p.verdict === 'below' ? 'var(--info)' : 'var(--ok)';

  return (
    <section className="panel panel--pad" aria-labelledby="pp-h">
      <h2 className="panel__title" id="pp-h" style={{ marginBottom: 4 }}>Price positioning</h2>
      <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 14 }}>
        Against {p.peers.length} comparable {p.basis}, by price per m².
      </p>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div
          style={{
            height: 8, borderRadius: 999, background: 'var(--panel-2)',
            border: '1px solid var(--rule)', position: 'relative', overflow: 'visible',
          }}
        >
          {/* The median, so "cheap" and "dear" have something to be relative to. */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', insetInlineStart: `${medianPct}%`, top: -4, bottom: -4,
              width: 2, background: 'var(--rule-strong, var(--text-4))', opacity: 0.6,
            }}
          />
          {/* Every comparable, so the shape of the market is visible rather than
              summarised into one word. */}
          {p.peers.map((peer) => {
            const pct = Math.max(0, Math.min(100, ((peer.pricePerSqm - p.min) / (p.max - p.min || 1)) * 100));
            return (
              <span
                key={peer.reference}
                title={`${peer.reference} · ${fmt(peer.pricePerSqm)}/m²`}
                style={{
                  position: 'absolute', insetInlineStart: `calc(${pct}% - 3px)`, top: -1,
                  width: 6, height: 8, borderRadius: 999, background: 'var(--text-4)', opacity: 0.5,
                }}
              />
            );
          })}
          {/* This unit. */}
          <span
            style={{
              position: 'absolute', insetInlineStart: `calc(${p.percent}% - 7px)`, top: -5,
              width: 14, height: 14, borderRadius: 999, background: tone,
              border: '2px solid var(--panel)', boxShadow: '0 1px 3px rgb(0 0 0 / .25)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 8,
            fontSize: 'var(--t-pico)', color: 'var(--text-4)', fontFamily: 'var(--font-mono)',
          }}
        >
          <span>{fmt(p.min)}</span>
          <span>{fmt(p.max)}</span>
        </div>
      </div>

      <p style={{ fontSize: 'var(--t-micro)', color: 'var(--text-2)', lineHeight: 1.6 }}>
        This unit is <b style={{ color: tone }}>{fmt(p.pricePerSqm)}/m²</b> — {word} the{' '}
        {fmt(p.median)} median.
        {p.verdict === 'above' && ' A unit well above its neighbours gets views and no enquiries, which reads as a photo problem and is not one.'}
        {p.verdict === 'below' && ' Priced under the pack. Worth checking you have not left money on the table.'}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------- payment plan */

export function PlanBar({
  price, downPayment, financed, monthly, months, years,
}: {
  price: number; downPayment: number; financed: number;
  monthly: number; months: number; years: number;
}) {
  const downPct = price > 0 ? (downPayment / price) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height: 30, borderRadius: 'var(--r-8)', overflow: 'hidden', border: '1px solid var(--rule)' }}>
        <span
          style={{
            width: `${downPct}%`, background: 'var(--accent)', color: 'var(--on-accent, #fff)',
            display: 'grid', placeItems: 'center', fontSize: 'var(--t-pico)', fontWeight: 600,
            minWidth: downPct > 0 ? 40 : 0,
          }}
          title={`Down payment ${egp(downPayment)}`}
        >
          {downPct >= 12 ? `${Math.round(downPct)}%` : ''}
        </span>
        <span
          style={{
            flex: 1, background: 'var(--panel-2)', color: 'var(--text-3)',
            display: 'grid', placeItems: 'center', fontSize: 'var(--t-pico)', fontWeight: 600,
          }}
          title={`Financed ${egp(financed)}`}
        >
          {Math.round(100 - downPct)}% over {years} years
        </span>
      </div>

      {/* The instalments themselves, thinned to a year a bar. A buyer asks
          "how long am I paying"; a row of ticks answers faster than "96". */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 26 }}>
        {Array.from({ length: Math.min(years, 12) }).map((_, i) => (
          <span
            key={i}
            title={`Year ${i + 1} · ${egp(monthly * 12)}`}
            style={{
              flex: 1, height: '100%', borderRadius: 3,
              background: 'color-mix(in srgb, var(--accent) 26%, var(--panel-2))',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 'var(--t-pico)', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
        {months} payments of {egp(monthly)} after {egp(downPayment)} down
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------- SERP */

export function Serp({ url, title, desc }: { url: string; title: string; desc: string }) {
  const titleOver = title.length > 60;
  const descOver = desc.length > 160;

  return (
    <div className="serp">
      <span className="serp__url" dir="ltr">{url}</span>
      {/* Google truncates, so the preview truncates — showing the full string
          would hide the one thing this box exists to reveal. */}
      <span className="serp__title">{titleOver ? title.slice(0, 60) + '…' : title}</span>
      <span className="serp__desc">{descOver ? desc.slice(0, 160) + '…' : desc}</span>
      <span className="serp__count">
        title{' '}
        <b style={titleOver ? { color: 'var(--warn)' } : undefined}>{title.length}</b>/60 ·
        description{' '}
        <b style={descOver ? { color: 'var(--warn)' } : undefined}>{desc.length}</b>/160
      </span>
    </div>
  );
}
