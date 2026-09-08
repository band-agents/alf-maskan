import { teamSummary } from './team';
import { unitsForStore } from './units';

/**
 * Billing.
 *
 * The plan's price is the one number in this product that a customer has
 * already agreed to, so nothing here restates it. EGP 990 is written once and
 * the annual price, the saving, every invoice line and the retention copy are
 * computed from it — the static build wrote all four, which meant a price
 * change would have had to be found in four places and would have been found in
 * three.
 *
 * The usage meters had the same problem in a worse form: they claimed 42
 * listings and 6 seats against a store that has neither. A meter that does not
 * measure is a bill nobody can check.
 */

export const MONTHLY = 990;
/** Annual is ten months for twelve — the discount is expressed as the months
 *  given away rather than a percentage, because that is how it is sold. */
export const FREE_MONTHS = 2;
export const ANNUAL = MONTHLY * (12 - FREE_MONTHS);
export const ANNUAL_SAVING = MONTHLY * 12 - ANNUAL;

/** Extras, priced per month. */
export const EXTRA_STOREFRONT = 390;
export const EXTRA_SEAT = 90;

export const STORAGE_GB = 20;

export type Cycle = 'monthly' | 'annual';

export type Meter = {
  label: string;
  used: number;
  /** null means unlimited — the bar shows headroom rather than pretending to
   *  approach a ceiling that does not exist. */
  limit: number | null;
  /** Text for the right of the row, e.g. "6 of 10 — 4 left". */
  detail: string;
  pct: number;
  /** Within one of the limit, or at it. */
  warn: boolean;
};

export type Invoice = {
  ref: string;
  date: string;
  method: string;
  amount: number;
  status: 'Paid' | 'Retried once' | 'Failed';
};

export type BillingView = {
  cycle: Cycle;
  price: number;
  nextPayment: string;
  meters: Meter[];
  invoices: Invoice[];
};

function meter(label: string, used: number, limit: number | null, unit = ''): Meter {
  const pct = limit === null
    // Unlimited: show the count as a fraction of a generous soft mark, so the
    // bar still moves as an agency grows without ever reading as "nearly full".
    ? Math.min(100, Math.round((used / 300) * 100))
    : Math.min(100, Math.round((used / limit) * 100));

  const detail = limit === null
    ? `${used}${unit} of unlimited`
    : limit - used > 0
      ? `${used}${unit} of ${limit}${unit} — ${limit - used} left`
      : `${used}${unit} of ${limit}${unit}`;

  return { label, used, limit, detail, pct, warn: limit !== null && used >= limit - 1 };
}

const INVOICE_HISTORY: [string, string, string, Invoice['status']][] = [
  ['AM-INV-0914', '3 Sep 2026', 'Visa 4417', 'Paid'],
  ['AM-INV-0831', '3 Aug 2026', 'Visa 4417', 'Paid'],
  ['AM-INV-0742', '3 Jul 2026', 'Fawry', 'Paid'],
  ['AM-INV-0655', '3 Jun 2026', 'Visa 4417', 'Retried once'],
  ['AM-INV-0571', '3 May 2026', 'Visa 4417', 'Paid'],
];

export function billingView(storeId: string, cycle: Cycle = 'monthly'): BillingView {
  const units = unitsForStore(storeId);
  const team = teamSummary(storeId);

  return {
    cycle,
    price: cycle === 'annual' ? ANNUAL : MONTHLY,
    nextPayment: '3 October 2026',
    meters: [
      meter('Storefronts', 1, 1),
      meter('Listings', units.length, null),
      // Seats come from the team screen's own count, so the two cannot
      // disagree about how many people this agency is paying for.
      meter('Team seats', team.used, team.seats),
      meter('Photo storage', storageUsedGb(units), STORAGE_GB, ' GB'),
    ],
    // Every invoice is the monthly price: an agency on monthly billing was
    // charged the monthly price, whatever it is switching to today.
    invoices: INVOICE_HISTORY.map(([ref, date, method, status]) => ({
      ref, date, method, status, amount: MONTHLY,
    })),
  };
}

/** A rough but honest figure: photo count times a typical listing photo. Better
 *  a number derived from the photos an agency actually uploaded than a literal
 *  that stays at 1.8 GB forever. */
function storageUsedGb(units: { photos: number }[]): number {
  const photos = units.reduce((n, u) => n + u.photos, 0);
  return Math.round(photos * 0.0022 * 10) / 10;
}

export const egp = (v: number) => `EGP ${v.toLocaleString('en-US')}`;
