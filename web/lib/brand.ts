/**
 * The agency's own colour, applied safely.
 *
 * `brandHex` is picked in onboarding step 4, from the colours pulled out of the
 * agency's logo, and it is the difference between "a website" and "your
 * website" — which is what the EGP 990 actually buys. Every accent rule in
 * `templates.css` reads one token, `--tpl-accent`, so applying it is a single
 * override; the template keeps the shape (ground, radius, faces, card
 * treatment) and the tenant supplies the colour.
 *
 * The part that is not a one-liner is what sits ON the accent. `.st-btn--primary`
 * and `.st-wa` are white text on that colour, and an agency whose logo is a
 * light gold or a mid-cyan would ship a storefront whose main call to action is
 * unreadable. The onboarding step warns at pick time — it flags sand at 2.0:1
 * and passes navy at 8.3:1 — but a warning is not a guarantee, and the same
 * check has to hold on the page. So the ink is chosen here, per tenant, by
 * measurement rather than by hope.
 *
 * WCAG 2.1 relative luminance and contrast ratio, which is the same maths the
 * static build's `onboard.js` runs.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** #ABC and #AABBCC both, since a hand-typed brand colour arrives either way. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrast(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [l1, l2] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** The ink that reads on a given ground: white if it clears AA, otherwise the
 *  storefront's near-black. Never a mid grey — that fails against both. */
export const INK = '#14181C';

export function onAccent(accentHex: string): string {
  return contrast('#FFFFFF', accentHex) >= 4.5 ? '#FFFFFF' : INK;
}

export type Brand = {
  /** The tenant's colour, or null when it is unusable and the template's own
   *  accent should stand. */
  accent: string | null;
  /** What to write on it. */
  ink: string;
  /** Contrast of `ink` on `accent`, so a caller can report rather than guess. */
  ratio: number;
};

export function brandFor(brandHex: string | null | undefined): Brand {
  const accent = brandHex && parseHex(brandHex) ? brandHex : null;
  if (!accent) return { accent: null, ink: '#FFFFFF', ratio: 0 };
  const ink = onAccent(accent);
  return { accent, ink, ratio: contrast(ink, accent) };
}
