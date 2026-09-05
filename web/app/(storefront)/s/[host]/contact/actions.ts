'use server';

import { z } from 'zod';

import { db, orMock } from '@/lib/db';
import { storeForHost } from '@/lib/tenant';
import { getUnitByRef } from '@/lib/queries/units';
import { bookableDays, dayFromIso, isSlotTime, type BookingState, type BookingValues } from '@/lib/queries/booking';

/**
 * A viewing request — the first write in the product, and the one the whole
 * subscription rests on. An agency does not pay EGP 990 a month for a website;
 * it pays for the enquiries the website produces, and the "New leads" figure on
 * the dashboard is what decides whether they are still paying in month two.
 *
 * Which makes the failure mode here the expensive one: a form that accepts a
 * request, says "we'll be in touch", and drops it. The static build shipped
 * `action="#"` with an in-place confirmation, and that confirmation was a lie
 * the buyer could not detect. This action never reports a request as received
 * unless it actually was.
 *
 * Two successful outcomes, both honest:
 *
 *   filed    the Lead row was written; the agency will see it in the dashboard.
 *   handoff  it was not — no database yet — so the page hands the buyer a
 *            prepared WhatsApp message and says so in plain words. WhatsApp is
 *            not a consolation prize in this market; it is how Egyptian
 *            brokers actually take enquiries, so the lead still lands.
 *
 * The result is returned rather than redirected to. A redirect would have to
 * name a path that `proxy.ts` rewrites, and the client router does not follow
 * that reliably — the RSC request resolves and the URL never changes. Returning
 * the outcome also keeps the buyer's name and number out of the address bar,
 * their history and any referrer, which a query string could not promise.
 */

const Request = z.object({
  unit: z.string().trim().max(24).optional().default(''),
  // Optional at the schema level so an unchecked radio — which omits the key
  // entirely — falls through to the slot checks below rather than tripping Zod's
  // generic "Required". Those two messages then live in exactly one place.
  date: z.string().trim().optional().default(''),
  time: z.string().trim().optional().default(''),
  name: z.string().trim().min(2, 'Tell us your name so we know who to ask for.').max(80),
  // Deliberately loose. Egyptian mobiles are written +20 10…, 010…, 0020 10…
  // and with spaces or dashes in every combination; rejecting a real number
  // because of its punctuation loses a sale to protect a regex.
  phone: z.string().trim().min(8, 'We need a mobile number to confirm on.').max(24),
  note: z.string().trim().max(600).optional().default(''),
});

/** Digits only, so a stored number is comparable and a wa.me link works. */
function normalisePhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('20')) return `+${d}`;
  if (d.startsWith('0')) return `+20${d.slice(1)}`;
  return `+20${d}`;
}


export async function requestViewing(prev: BookingState, form: FormData): Promise<BookingState> {
  const str = (k: string) => String(form.get(k) ?? '');
  // Everything typed comes straight back on any failure, so nothing is retyped.
  const values: BookingValues = {
    unit: str('unit'), date: str('date'), time: str('time'),
    name: str('name'), phone: str('phone'), note: str('note'),
  };
  const attempt = (prev.status === 'invalid' ? prev.attempt : 0) + 1;
  const invalid = (errors: { field: string; message: string }[]): BookingState => ({
    status: 'invalid', errors, values, attempt,
  });
  const one = (field: string, message: string) => invalid([{ field, message }]);

  const store = await storeForHost(String(form.get('host') ?? ''));
  if (!store) return one('form', 'This storefront could not be found.');

  const parsed = Request.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return invalid(
      parsed.error.issues.map((i) => ({ field: String(i.path[0] ?? 'form'), message: i.message }))
    );
  }
  const data = parsed.data;

  // The day and the time are re-checked against what we actually offered, not
  // trusted from the field. A closed Friday or an invented 03:00 must not
  // become a booking just because someone edited the HTML.
  const day = dayFromIso(data.date, bookableDays());
  if (!day) return one('date', 'Pick one of the days below.');
  if (!isSlotTime(data.time)) return one('time', 'Pick a time as well as a day.');

  const unit = data.unit ? await getUnitByRef(data.unit, store.id) : null;

  // The only write in the product so far. `orMock` catches connection failures
  // and nothing else, so a real constraint violation still throws rather than
  // quietly becoming a handoff.
  const filed = await orMock(
    async () => {
      await db.lead.create({
        data: {
          storeId: store.id,
          name: data.name,
          phone: normalisePhone(data.phone),
          source: 'FORM',
          stage: 'NEW',
          unitId: unit?.id ?? null,
          notes: data.note || null,
          // The slot belongs on the lead as a task, not buried in free text —
          // the agent's inbox needs to be able to sort by it.
          tasks: {
            create: {
              title: `Viewing: ${unit?.reference ?? 'unit not chosen'} — ${day.label} at ${data.time}`,
              dueAt: new Date(`${day.iso}T${data.time}:00`),
            },
          },
        },
      });
      return true;
    },
    () => false
  );

  return {
    status: filed ? 'filed' : 'handoff',
    dayLabel: day.label,
    time: data.time,
    unitRef: unit?.reference ?? null,
  };
}
