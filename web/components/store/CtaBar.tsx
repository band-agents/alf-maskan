import { egp } from '@/lib/pricing';
import { WhatsAppMark } from './icons';

/**
 * A phone has no sidebar, so the price and the two actions follow the reader.
 *
 * `position: fixed`, so where this sits in the DOM does not affect where it
 * paints — which is what lets the calculator render it and keep its monthly
 * figure in step with the sliders. Two different instalments visible on one
 * page is the exact failure `lib/pricing.ts` exists to prevent, and it does not
 * stop being one just because the two numbers are twelve inches apart.
 */
export function CtaBar({
  price,
  monthly,
  phone,
  wa,
}: {
  price: number;
  monthly: number | null;
  phone: string;
  wa: string | null;
}) {
  return (
    <div className="cta-bar">
      <span className="cta-bar__price">
        <b>{egp(price)}</b>
        {monthly != null && <span>{egp(monthly)}/mo</span>}
      </span>
      <span className="cta-bar__acts">
        <a className="st-btn st-btn--ghost" style={{ height: 40, paddingInline: 16 }} href={`tel:${phone}`}>
          Call
        </a>
        {wa && (
          <a className="st-btn st-btn--primary" style={{ height: 40, paddingInline: 16 }} href={wa}>
            <WhatsAppMark />
            WhatsApp
          </a>
        )}
      </span>
    </div>
  );
}
