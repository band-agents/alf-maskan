'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import type { UnitFilters } from '@/lib/queries/units';

/**
 * Every control here writes to the URL and nothing else. The server re-runs the
 * query and re-renders; there is no second copy of the filter state to drift.
 *
 * The cost of that is a round trip per change, which is why the whole thing is
 * wrapped in a transition — the list dims rather than blanking, and the control
 * you just touched stays responsive.
 */

type Props = {
  filters: UnitFilters;
  zones: string[];
  counts: { all: number; live: number; photos: number; pricedrop: number };
  shown: number;
};

const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'photos', label: 'Needs photos' },
  { key: 'pricedrop', label: 'Price drop candidates' },
] as const;

export function Filters({ filters, zones, counts, shown }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router]
  );

  const active = [
    filters.status && { key: 'status', label: `Status: ${title(filters.status)}` },
    filters.purpose && { key: 'purpose', label: `Purpose: ${title(filters.purpose)}` },
    filters.zone && { key: 'zone', label: `Zone: ${filters.zone}` },
    filters.type && { key: 'type', label: `Type: ${title(filters.type)}` },
    filters.beds && { key: 'beds', label: `Beds: ${filters.beds}+` },
    filters.q && { key: 'q', label: `“${filters.q}”` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <>
      <div className="views" role="tablist" aria-label="Saved views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className="view"
            type="button"
            role="tab"
            aria-selected={filters.view === v.key}
            onClick={() => setParam('view', v.key === 'all' ? null : v.key)}
          >
            {v.label} <span className="view__n">{counts[v.key]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <label className="fsearch">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="visually-hidden">Search listings</span>
          <input
            type="search"
            placeholder="Search by title, reference or compound…"
            defaultValue={filters.q}
            onChange={(e) => setParam('q', e.target.value || null)}
          />
        </label>

        <Select label="Status" value={filters.status ?? ''} onChange={(v) => setParam('status', v)}
          options={[['LIVE', 'Live'], ['DRAFT', 'Draft'], ['RESERVED', 'Reserved'], ['SOLD', 'Sold'], ['RENTED', 'Rented']]} />

        <Select label="Purpose" value={filters.purpose ?? ''} onChange={(v) => setParam('purpose', v)}
          options={[['PRIMARY', 'Primary'], ['RESALE', 'Resale'], ['SALE', 'Sale'], ['RENT', 'Rent']]} />

        <Select label="Zone" value={filters.zone ?? ''} onChange={(v) => setParam('zone', v)}
          options={zones.map((z) => [z, z])} />

        <Select label="Type" value={filters.type ?? ''} onChange={(v) => setParam('type', v)}
          options={[['APARTMENT', 'Apartment'], ['PENTHOUSE', 'Penthouse'], ['DUPLEX', 'Duplex'], ['VILLA', 'Villa'], ['TWIN_HOUSE', 'Twin house'], ['TOWNHOUSE', 'Townhouse'], ['CHALET', 'Chalet'], ['STUDIO', 'Studio'], ['OFFICE', 'Office']]} />

        <Select label="Beds" value={filters.beds ? String(filters.beds) : ''} onChange={(v) => setParam('beds', v)}
          options={[['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+'], ['5', '5+']]} />

        {active.length > 0 && (
          <button
            className="tool-btn tool-btn--quiet"
            type="button"
            onClick={() =>
              startTransition(() => router.replace(pathname, { scroll: false }))
            }
          >
            Clear all
          </button>
        )}
      </div>

      <div className="resultline" style={pending ? { opacity: 0.55 } : undefined}>
        <span>
          <b>{shown}</b> {active.length || filters.view !== 'all' ? 'matching' : `of ${counts.all} units`}
        </span>
        <span className="fchips">
          {active.map((a) => (
            <span className="fchip" key={a.key}>
              {a.label}
              <button type="button" onClick={() => setParam(a.key, null)}>
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="visually-hidden">Remove {a.label} filter</span>
              </button>
            </span>
          ))}
        </span>
        <span className="resultline__end">
          <Select
            label="Sort"
            value={filters.sort === 'updated' ? '' : filters.sort}
            onChange={(v) => setParam('sort', v)}
            options={[['price-asc', 'Price, low to high'], ['price-desc', 'Price, high to low'], ['area-desc', 'Largest first'], ['views-desc', 'Most viewed']]}
          />
        </span>
      </div>
    </>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string | null) => void;
  options: [string, string][];
}) {
  return (
    <span className={`fselect${value ? ' fselect--on' : ''}`}>
      <label className="visually-hidden" htmlFor={`f-${label}`}>{label}</label>
      <select id={`f-${label}`} value={value} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{label}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <span className="fselect__caret">
        <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}

function title(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}
