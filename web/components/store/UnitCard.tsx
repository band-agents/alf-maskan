import Link from 'next/link';
import { egp } from '@/lib/pricing';
import { unitTerms, type UnitRow } from '@/lib/queries/units';
import { TYPE_LABEL } from '@/components/ui/atoms';
import { HeartOutline } from './icons';

/**
 * One unit, as a card. Written once because it appears on the home page, in the
 * unit page's "similar" rail and across the browse grid — and a price that
 * formats three different ways in three places is the same defect as a price
 * that computes three different ways.
 *
 * The plan line is `unitTerms`, which routes through `computePlan`, so a card
 * and the calculator on the unit it links to cannot quote different money.
 */
export function UnitCard({
  unit,
  showFeaturedFlag = true,
}: {
  unit: UnitRow;
  /** Off when every card in the row is featured — a badge on all of them marks
   *  nothing. Same reason the compare table dims the identical rows. */
  showFeaturedFlag?: boolean;
}) {
  const gone = unit.status !== 'LIVE';

  return (
    <article className="st-card">
      <div className="st-card__media">
        <div className="ph">
          {TYPE_LABEL[unit.type].toLowerCase()} · {unit.compound ?? unit.zone} · 4:3
        </div>
        {(gone || (unit.featured && showFeaturedFlag)) && (
          <div className="st-card__flags">
            {gone ? (
              <span className="badge badge--neutral">
                {unit.status === 'RESERVED' ? 'Under offer' : unit.status === 'RENTED' ? 'Rented' : 'Sold'}
              </span>
            ) : (
              <span className="badge badge--solid-sand">FEATURED</span>
            )}
          </div>
        )}
        <button className="st-card__save" type="button" aria-pressed="false">
          <HeartOutline />
          <span className="visually-hidden">Save {unit.titleEn}</span>
        </button>
      </div>

      <div className="st-card__body">
        <Link className="st-card__title" href={`/units/${unit.reference}`}>{unit.titleEn}</Link>
        <span className="st-card__where">
          {unit.zone}{unit.compound && ` · ${unit.compound}`}
        </span>
        <span className="st-card__specs">
          <span>{unit.areaSqm} m²</span>
          <span>{unit.bedrooms ? `${unit.bedrooms} bed` : 'Studio'}</span>
          <span>{unit.delivery}</span>
        </span>
        <span className="st-card__price">{egp(unit.price)}</span>
        <span className="st-card__plan">{unitTerms(unit)}</span>
      </div>
    </article>
  );
}
