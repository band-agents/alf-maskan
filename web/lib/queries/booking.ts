/**
 * Viewing slots.
 *
 * Two things the static build hard-codes do not survive into a real product.
 *
 * The **dates** were literals — "Thu 4 Sep", "Fri 5 Sep". Those are correct for
 * exactly one week. Days are generated from the actual date here, starting
 * tomorrow: a form whose confirmation says "we will come back within the hour"
 * is not the place to offer a slot ninety minutes from now, and starting at +1
 * also removes any question of a past time being bookable.
 *
 * The **busy map** was a literal too — `'Thu 4 Sep': ['13:00']` — and that one
 * is deliberately NOT carried across. Which hours an office already has taken
 * is a fact about that business, and it lives in booked viewings nobody has
 * stored yet. Inventing it would put false information about a real agency in
 * front of a real buyer, which is the same failure as drawing a map you do not
 * have. What *is* knowable without a database is the opening hours, so that is
 * what constrains the picker, and the office confirms the slot afterwards —
 * which the copy says plainly.
 *
 * When viewings are stored, `takenSlots(storeId, date)` is the one function to
 * add, and it plugs in at `disabled` below.
 */

/** Egyptian working week: Friday is the day off. Saturday is a working day. */
const CLOSED_WEEKDAY = 5; // Date.getDay(): 0 Sun … 5 Fri, 6 Sat

export const SLOT_TIMES = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'] as const;

export type BookableDay = {
  /** YYYY-MM-DD — what the form submits and what a query would key on. */
  iso: string;
  /** "Sun", for the small line above the number. */
  weekday: string;
  /** "6", the big figure. Western digits, as everywhere in this product. */
  dayNum: string;
  /** "Sun 6 Sep", for confirmations and the WhatsApp message. */
  label: string;
  closed: boolean;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Local date parts, not toISOString — that shifts to UTC and can hand back
 *  yesterday for anyone east of Greenwich, which is the whole of this market. */
function isoOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function bookableDays(count = 7, from: Date = new Date()): BookableDay[] {
  const days: BookableDay[] = [];
  for (let i = 1; days.length < count; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    days.push({
      iso: isoOf(d),
      weekday: WEEKDAYS[d.getDay()],
      dayNum: String(d.getDate()),
      label: `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
      closed: d.getDay() === CLOSED_WEEKDAY,
    });
    if (i > 60) break; // never loop forever on a bad `from`
  }
  return days;
}

/** Resolve a submitted date back to its label, and prove it was one we offered
 *  — a hand-edited form field must not book a Friday. */
export function dayFromIso(iso: string, days: BookableDay[] = bookableDays()): BookableDay | null {
  return days.find((d) => d.iso === iso && !d.closed) ?? null;
}

export function isSlotTime(value: string): value is (typeof SLOT_TIMES)[number] {
  return (SLOT_TIMES as readonly string[]).includes(value);
}

/**
 * The message a buyer sends on WhatsApp.
 *
 * Carries the unit, the day and the time — and deliberately not their name or
 * their number. WhatsApp already tells the agent who is writing, so asking the
 * message to repeat it would put personal details into a URL for nothing.
 */
export function viewingMessage(opts: {
  storeName: string;
  unitLabel: string;
  dayLabel: string;
  time: string;
}): string {
  return [
    `Hello ${opts.storeName} —`,
    `I would like to book a viewing.`,
    ``,
    `Unit: ${opts.unitLabel}`,
    `When: ${opts.dayLabel} at ${opts.time}`,
  ].join('\n');
}

/**
 * What the booking action hands back.
 *
 * Lives here rather than beside the action because a 'use server' module may
 * only export async functions — a plain const there is a build error, and the
 * message names the value rather than the rule, so it is worth the signpost.
 */
export type BookingValues = { unit: string; date: string; time: string; name: string; phone: string; note: string };

export type BookingState =
  | { status: 'idle'; errors?: undefined }
  // `values` and `attempt` exist for one reason: React resets an uncontrolled
  // form after an action runs, so a buyer who forgot to pick a time would get
  // their name, number and note wiped. On the screen whose whole job is
  // capturing a lead, that is the lead lost. The values come back and the
  // counter changes the form key so defaultValue is reapplied on remount.
  | { status: 'invalid'; errors: { field: string; message: string }[]; values: BookingValues; attempt: number }
  | { status: 'filed' | 'handoff'; errors?: undefined; dayLabel: string; time: string; unitRef: string | null };

export const IDLE: BookingState = { status: 'idle' };
