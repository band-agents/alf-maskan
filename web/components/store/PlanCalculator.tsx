'use client';

import { useState } from 'react';
import { computePlan, egp } from '@/lib/pricing';
import { PlanIcon } from './icons';
import { CtaBar } from './CtaBar';

/**
 * The one control on the page a buyer actually operates.
 *
 * It imports `computePlan` — the same function the dashboard's listing editor
 * calls when an agent sets the terms. That is the point of this component
 * existing at all: in the static build the buyer's calculator and the agent's
 * editor each carried their own copy of the arithmetic, and they agreed by
 * luck. Here there is one implementation and two callers, so an agent quoting
 * a plan on the phone and a buyer sliding this control cannot be shown
 * different instalments.
 *
 * Server-rendered with the seller's own headline terms, so the figures are
 * correct before any JavaScript arrives and the panel is never blank.
 *
 * It also renders the sticky phone bar, because that bar quotes the same
 * monthly figure and the two must move together — the static build wires the
 * same pair in `store-unit.js`.
 */
export function PlanCalculator({
  price,
  downPct,
  years,
  maxYears,
  maintenanceFee,
  agentPhone,
  wa,
}: {
  price: number;
  downPct: number;
  years: number;
  maxYears: number;
  maintenanceFee: number | null;
  agentPhone: string;
  wa: string | null;
}) {
  const [pct, setPct] = useState(downPct);
  const [yrs, setYrs] = useState(years);

  const { downPayment, financed, months, monthly } = computePlan({ price, downPct: pct, years: yrs });

  return (
    <>
    <section className="plan" aria-labelledby="plan-h">
      <div className="plan__head">
        <PlanIcon />
        <h2 className="st-h3" id="plan-h" style={{ fontSize: 16 }}>Work out your instalment</h2>
      </div>

      <div className="plan__body">
        <div className="slider">
          <span className="slider__top">
            <label htmlFor="p-down">Down payment</label>
            <b>{pct}% · {egp(downPayment)}</b>
          </span>
          <input
            type="range" id="p-down" min={5} max={50} step={1}
            value={pct} onChange={(e) => setPct(Number(e.target.value))}
          />
        </div>

        <div className="slider">
          <span className="slider__top">
            <label htmlFor="p-years">Over</label>
            <b>{yrs} {yrs === 1 ? 'year' : 'years'}</b>
          </span>
          <input
            type="range" id="p-years" min={1} max={maxYears} step={1}
            value={yrs} onChange={(e) => setYrs(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="plan__out" role="status" aria-live="polite">
        <small>Monthly instalment</small>
        <b>{egp(monthly)}</b>
        <span>{months} payments, starting on delivery</span>
        <div className="plan__rows">
          <div><span>Down payment today</span><b>{egp(downPayment)}</b></div>
          <div><span>Balance over the plan</span><b>{egp(financed)}</b></div>
          {maintenanceFee != null && (
            <div><span>Maintenance, one-off</span><b>{egp(maintenanceFee)}</b></div>
          )}
        </div>
      </div>

      <p className="plan__note">
        Instalments are quoted without interest, the way Egyptian developer plans are written.
        {maintenanceFee != null && ' Maintenance is paid separately on handover.'}
      </p>
    </section>

    <CtaBar price={price} monthly={monthly} phone={agentPhone} wa={wa} />
    </>
  );
}
