import { TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The hero search.
 *
 * A plain GET form pointed at /units, with no JavaScript of any kind: the
 * browser serialises the selects into the query string, and `parseUnitFilters`
 * on the other side reads exactly the same parameter names the browse page's
 * own filters write. That is why the two stay in step, why the result is
 * shareable, and why it still works for a buyer on a throttled connection in a
 * Cairo lift — which is not a hypothetical audience for this product.
 *
 * "Any" options carry an empty value so an untouched select contributes nothing
 * to the URL rather than a literal `type=Any` the parser would have to know to
 * discard.
 */

const TYPES = ['APARTMENT', 'PENTHOUSE', 'DUPLEX', 'VILLA', 'TWIN_HOUSE', 'TOWNHOUSE', 'CHALET', 'STUDIO', 'OFFICE'] as const;

/** Budget bands in EGP, as a buyer thinks about them rather than as the
 *  database stores them. The band becomes a max, which is the way people
 *  actually shop: "nothing over ten million". */
const BUDGETS = [
  { label: 'Up to EGP 6M', max: 6_000_000 },
  { label: 'Up to EGP 10M', max: 10_000_000 },
  { label: 'Up to EGP 20M', max: 20_000_000 },
  { label: 'Over EGP 20M', max: 0 },
] as const;

export function HeroSearch({ zones }: { zones: string[] }) {
  return (
    <form className="hero-search" style={{ marginTop: 32 }} action="/units" method="get">
      <span className="hero-search__f">
        <label htmlFor="h-zone">Zone</label>
        <select id="h-zone" name="zone" defaultValue="">
          <option value="">Any area</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </span>

      <span className="hero-search__f">
        <label htmlFor="h-type">Type</label>
        <select id="h-type" name="type" defaultValue="">
          <option value="">Any</option>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </span>

      <span className="hero-search__f">
        <label htmlFor="h-beds">Bedrooms</label>
        <select id="h-beds" name="beds" defaultValue="">
          <option value="">Any</option>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
      </span>

      <span className="hero-search__f">
        <label htmlFor="h-budget">Budget</label>
        <select id="h-budget" name="max" defaultValue="">
          <option value="">Any</option>
          {BUDGETS.map((b) => (
            <option key={b.label} value={b.max || ''}>{b.label}</option>
          ))}
        </select>
      </span>

      <button className="hero-search__go" type="submit">Search</button>
    </form>
  );
}
