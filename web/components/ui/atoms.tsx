import type { UnitStatus } from '@prisma/client';
import { egp } from '@/lib/pricing';

// The ⓘ needs state, so it lives in its own client module. Re-exported here so
// every existing `import { Hint } from '@/components/ui/atoms'` keeps working.
export { Hint } from './Hint';

/**
 * The handful of primitives every data screen repeats. Written once here so a
 * status pill or a price never renders two different ways in two places.
 */

const STATUS: Record<UnitStatus, { cls: string; label: string }> = {
  LIVE: { cls: 'st--live', label: 'Live' },
  DRAFT: { cls: 'st--draft', label: 'Draft' },
  RESERVED: { cls: 'st--reserved', label: 'Reserved' },
  SOLD: { cls: 'st--sold', label: 'Sold' },
  RENTED: { cls: 'st--rented', label: 'Rented' },
};

/** Colour is never the only signal — the pill always carries its own word. */
export function StatusPill({ status }: { status: UnitStatus }) {
  const s = STATUS[status];
  return <span className={`st ${s.cls}`}>{s.label}</span>;
}

export function Money({ value, sub }: { value: number; sub?: string }) {
  return (
    <span className="money">
      {egp(value)}
      {sub && <span className="money__sub">{sub}</span>}
    </span>
  );
}

export function Ref({ children }: { children: React.ReactNode }) {
  return <span className="ref">{children}</span>;
}

/** A labelled placeholder marking where real photography goes. */
export function Placeholder({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`ph ${className}`} aria-hidden={label ? undefined : true}>
      {label}
    </div>
  );
}

/** Human-readable enum labels, so a screen never shows TWIN_HOUSE. */
export const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartment', DUPLEX: 'Duplex', PENTHOUSE: 'Penthouse', VILLA: 'Villa',
  TWIN_HOUSE: 'Twin house', TOWNHOUSE: 'Townhouse', CHALET: 'Chalet', STUDIO: 'Studio',
  OFFICE: 'Office', RETAIL: 'Retail', CLINIC: 'Clinic', LAND: 'Land',
};

export const PURPOSE_LABEL: Record<string, string> = {
  PRIMARY: 'Primary', RESALE: 'Resale', SALE: 'Sale', RENT: 'Rent',
};
