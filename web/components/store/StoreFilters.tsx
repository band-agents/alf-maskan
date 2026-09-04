import Link from 'next/link';
import { TYPE_LABEL } from '@/components/ui/atoms';
import type { UnitFilters } from '@/lib/queries/units';

/**
 * The browse filters, as a GET form.
 *
 * No client component and no JavaScript: submitting navigates, the server
 * re-queries, and the URL is the only copy of the state. That is the same rule
 * the dashboard follows, and on the buyer's side it buys something extra — the
 * filtered list is a link an agent can paste into WhatsApp, which is how most
 * of this market actually shares property.
 *
 * A `<noscript>`-free progressive form needs a real submit button, so there is
 * one, rather than selects that only work if a script is listening.
 */
const TYPES = ['APARTMENT', 'PENTHOUSE', 'DUPLEX', 'VILLA', 'TWIN_HOUSE', 'TOWNHOUSE', 'CHALET', 'STUDIO', 'OFFICE'] as const;

const BUDGETS = [
  { label: 'Up to EGP 6M', value: 6_000_000 },
  { label: 'Up to EGP 10M', value: 10_000_000 },
  { label: 'Up to EGP 20M', value: 20_000_000 },
] as const;

const SORTS = [
  { value: 'updated', label: 'Newest first' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'area-desc', label: 'Largest first' },
] as const;

export function StoreFilters({
  filters,
  zones,
  compounds,
}: {
  filters: UnitFilters;
  zones: string[];
  compounds: string[];
}) {
  const active =
    filters.zone || filters.compound || filters.type || filters.beds || filters.max || filters.q;

  return (
    <form className="sfilters" method="get" action="" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', paddingBlock: 18 }}>
      <span className="fpill">
        <label className="visually-hidden" htmlFor="s-zone">Area</label>
        <select id="s-zone" name="zone" defaultValue={filters.zone ?? ''}>
          <option value="">Any area</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </span>

      {compounds.length > 0 && (
        <span className="fpill">
          <label className="visually-hidden" htmlFor="s-compound">Compound</label>
          <select id="s-compound" name="compound" defaultValue={filters.compound ?? ''}>
            <option value="">Any compound</option>
            {compounds.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </span>
      )}

      <span className="fpill">
        <label className="visually-hidden" htmlFor="s-type">Type</label>
        <select id="s-type" name="type" defaultValue={filters.type ?? ''}>
          <option value="">Any type</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </span>

      <span className="fpill">
        <label className="visually-hidden" htmlFor="s-beds">Bedrooms</label>
        <select id="s-beds" name="beds" defaultValue={filters.beds ?? ''}>
          <option value="">Any beds</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
      </span>

      <span className="fpill">
        <label className="visually-hidden" htmlFor="s-max">Budget</label>
        <select id="s-max" name="max" defaultValue={filters.max ?? ''}>
          <option value="">Any budget</option>
          {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </span>

      <span className="fpill" style={{ marginInlineStart: 'auto' }}>
        <label className="visually-hidden" htmlFor="s-sort">Sort</label>
        <select id="s-sort" name="sort" defaultValue={filters.sort}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </span>

      <button className="st-btn st-btn--primary" type="submit" style={{ height: 38, paddingInline: 20 }}>
        Apply
      </button>

      {active && (
        <Link className="st-btn st-btn--ghost" href="/units" style={{ height: 38, paddingInline: 16 }}>
          Clear
        </Link>
      )}
    </form>
  );
}
