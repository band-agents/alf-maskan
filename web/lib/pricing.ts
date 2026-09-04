/**
 * Payment plan maths — the one place it is written.
 *
 * The static build computed this in four separate files (the listing editor,
 * the storefront unit page, the marketing pricing card and the offer preview).
 * They agreed by luck, not by construction. A buyer who sees one instalment on
 * a card and a different one on the unit page stops trusting the whole site,
 * so this module is the only thing allowed to know the formula.
 *
 * No interest. Egyptian developer plans are quoted as a flat split of the
 * balance, and inventing a rate would put a number in front of a buyer that
 * nobody agreed to.
 */

export type Plan = {
  /** Total asking price. */
  price: number;
  /** Percentage of the price paid up front, 0–100. */
  downPct: number;
  /** Years the balance is spread over. */
  years: number;
};

export type PlanBreakdown = {
  downPayment: number;
  financed: number;
  months: number;
  monthly: number;
  /** Price per square metre, the figure buyers compare across compounds. */
  pricePerSqm: number | null;
};

export function computePlan(plan: Plan, areaSqm?: number | null): PlanBreakdown {
  const price = Math.max(0, plan.price || 0);
  const downPct = clamp(plan.downPct, 0, 100);
  const years = Math.max(1, Math.round(plan.years || 1));

  const downPayment = (price * downPct) / 100;
  const financed = price - downPayment;
  const months = years * 12;

  return {
    downPayment,
    financed,
    months,
    monthly: months > 0 ? financed / months : 0,
    pricePerSqm: areaSqm && areaSqm > 0 ? price / areaSqm : null,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

/**
 * EGP, Western digits, no decimals — the convention across the whole product,
 * in Arabic copy as well as English. Egyptian buyers read prices in 0–9, and
 * Eastern Arabic numerals in a price have cost sellers deals.
 */
export function egp(value: number): string {
  return `EGP ${Math.round(value).toLocaleString('en-US')}`;
}

/** Compact form for chart axes and pill labels: EGP 8.5M. */
export function egpShort(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `EGP ${(m >= 10 ? Math.round(m) : Number(m.toFixed(1)))}M`;
  }
  if (value >= 1_000) return `EGP ${Math.round(value / 1_000)}K`;
  return egp(value);
}

/** The one-line terms shown under a price on every card. */
export function planSummary(plan: Plan): string {
  const { monthly, years } = { ...computePlan(plan), years: plan.years };
  return `${plan.downPct}% down · ${egp(monthly)}/mo over ${years} ${years === 1 ? 'year' : 'years'}`;
}
