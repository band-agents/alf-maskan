/**
 * Help: guides, tours and the changelog.
 *
 * Content rather than data, so most of it is text. The two things that are
 * derived are the counts on the tabs and the topic list, both of which the
 * static build wrote by hand — it claimed twelve guides above thirteen of them.
 * A help index that miscounts itself is a small thing that makes an agency
 * trust the rest of the page less.
 *
 * The tours link into the app, so each names a route; a tour pointing at a
 * screen that does not exist is checked by lib/routes.ts like any other link.
 */

export type Topic = 'Getting started' | 'Listings' | 'Leads' | 'Storefront' | 'Billing';

export type Guide = {
  id: string;
  topic: Topic;
  title: string;
  minutes: number;
  body: string[];
  link?: { href: string; label: string };
};

export const GUIDES: Guide[] = [
  {
    id: 'domain', topic: 'Getting started', title: 'Connecting a domain you already own', minutes: 4,
    body: [
      'You keep the domain wherever you bought it. Log in there, find the DNS or "name servers" page, and add the two lines we show you in Settings → Domains. Nothing moves and nothing is transferred.',
      'It usually takes an hour or two to take effect, occasionally a full day. Your free .alfmaskan.com address keeps working the whole time and forever after, so links you have already sent on WhatsApp never break.',
    ],
    link: { href: '/dash/settings#domains', label: 'Open Domains' },
  },
  {
    id: 'views-no-leads', topic: 'Listings', title: 'Why a unit gets views but no enquiries', minutes: 3,
    body: [
      'Views mean the photos and the price caught someone. No enquiry after that usually means one of three things: the payment plan is missing, the price is above the compound’s going rate, or there is no floor plan.',
      'Analytics → Views by unit lists views against leads side by side. A unit high on views and low on leads is a pricing conversation, not a photography one.',
    ],
    link: { href: '/dash/analytics', label: 'Open Analytics' },
  },
  {
    id: 'import', topic: 'Listings', title: 'Importing units from a spreadsheet', minutes: 5,
    body: [
      'Any Excel or CSV works — we read your column names and guess the match, then show you the first row exactly as it will appear before anything is saved. Rows with no price come in as drafts rather than being rejected.',
      'Photos are not part of an import. Add them per unit afterwards; a unit with fewer than three photos gets roughly a fifth of the views.',
    ],
  },
  {
    id: 'arabic', topic: 'Storefront', title: 'Making your storefront work in Arabic', minutes: 4,
    body: [
      'Set Settings → Language & region to "Arabic and English" and every unit gets two title fields and two description fields. Buyers switch with one tap and the whole page mirrors.',
      'Prices stay in Western digits (8,450,000, not ٨٬٤٥٠٬٠٠٠) in both languages. That is deliberate — Egyptian buyers read prices that way, and Eastern Arabic numerals in a price have cost sellers deals.',
    ],
  },
  {
    id: 'agent-lead', topic: 'Leads', title: 'Why an agent cannot see a lead', minutes: 2,
    body: [
      'Agents see only their own leads by design. If someone says a lead has vanished, check two things: who it is assigned to, and whether their role is scoped to a zone the unit is not in.',
    ],
    link: { href: '/dash/team/roles', label: 'Open Roles & permissions' },
  },
  {
    id: 'whatsapp', topic: 'Leads', title: 'Connecting WhatsApp Business', minutes: 6,
    body: [
      'You need a number that is not already on a personal WhatsApp account. Settings → Integrations walks the verification, which is a code by SMS.',
      'Once connected, every enquiry lands in your Leads inbox with the whole conversation attached, and quick-reply templates work in both scripts.',
    ],
    link: { href: '/dash/settings#integrations', label: 'Open Integrations' },
  },
  {
    id: 'template', topic: 'Storefront', title: 'Changing template without losing anything', minutes: 2,
    body: [
      'All ten templates are built from the same sections, so switching keeps every unit, photo, price and payment plan. What changes is type, colour and layout.',
      'What does not carry over: per-section padding and background overrides you set by hand. The builder warns you which ones before it swaps.',
    ],
  },
  {
    id: 'no-card', topic: 'Billing', title: 'Paying without a card — Fawry, InstaPay and wallets', minutes: 3,
    body: [
      'Pick Fawry, Paymob or InstaPay in Billing. We send a code or a request three days before the renewal date and the storefront stays up while it is open — nothing switches off the moment a payment is late.',
    ],
    link: { href: '/dash/billing', label: 'Open Billing' },
  },
  {
    id: 'pause', topic: 'Billing', title: 'Pausing instead of cancelling', minutes: 2,
    body: [
      'A two-month pause costs nothing and keeps your storefront live. Most agencies who pause do it over Ramadan or August. Ask for it in Billing → Cancel, or on WhatsApp.',
    ],
  },
  {
    id: 'invite', topic: 'Getting started', title: 'Inviting your team and what each role can do', minutes: 4,
    body: [
      'Seven roles, from Owner down to Viewer. The one most agencies get wrong is Agent — it deliberately cannot publish a listing or see another agent’s pipeline. If you want someone who can publish, they are a Sales manager.',
    ],
    link: { href: '/dash/team', label: 'Open Team' },
  },
  {
    id: 'google', topic: 'Getting started', title: 'Getting found on Google', minutes: 5,
    body: [
      'Fill the Arabic name and the Arabic descriptions. Most Egyptian buyers search in Arabic, and a storefront with only Latin text is close to invisible to them.',
      'Every unit has a meta title and description with a live Google preview in the listing editor. Compound and zone names in the title do most of the work.',
    ],
  },
  {
    id: 'photos', topic: 'Storefront', title: 'What a good unit photo set looks like', minutes: 3,
    body: [
      'Eight to twelve images, at least 1600px wide, shot in daylight with the lights on. Lead with the thing that sells it — the terrace, the view, the garden — not the front door.',
      'Include a floor plan. Buyers who cannot picture the layout ask fewer questions and book fewer viewings.',
    ],
  },
];

/** Topics that some guide actually has, in the order they first appear. */
export function topics(): Topic[] {
  const seen: Topic[] = [];
  for (const g of GUIDES) if (!seen.includes(g.topic)) seen.push(g.topic);
  return seen;
}

export function searchGuides(q: string, topic: string | null): Guide[] {
  const needle = q.trim().toLowerCase();
  return GUIDES.filter((g) => {
    if (topic && g.topic !== topic) return false;
    if (!needle) return true;
    return `${g.title} ${g.topic} ${g.body.join(' ')}`.toLowerCase().includes(needle);
  });
}

export type Tour = { id: string; title: string; blurb: string; minutes: number; href: string };

export const TOURS: Tour[] = [
  { id: 'first-unit', title: 'Publish your first unit', blurb: 'Six steps through the listing editor, ending with it live on your storefront.', minutes: 4, href: '/dash/listings' },
  { id: 'rearrange', title: 'Rearrange your storefront', blurb: 'Drag a section, edit it, and publish — without breaking anything.', minutes: 5, href: '/dash/builder' },
  { id: 'answer-lead', title: 'Answer a lead properly', blurb: 'From WhatsApp message to booked viewing, with the templates that work.', minutes: 3, href: '/dash/leads' },
  { id: 'first-offer', title: 'Run your first offer', blurb: 'A limited discount with a countdown, on the units you choose.', minutes: 4, href: '/dash/marketing' },
];

export type Change = { id: string; mark: 'lead' | 'deal' | 'warn' | null; title: string; body: string; when: string };

export const CHANGELOG: Change[] = [
  {
    id: 'c1', mark: 'lead', title: 'Team, roles and billing', when: '3 Sep 2026',
    body: 'Seven roles with a permission matrix you can edit, an audit log of every price and permission change, and billing through Fawry, Paymob and InstaPay as well as card.',
  },
  {
    id: 'c2', mark: 'deal', title: 'Deals pipeline', when: '3 Sep 2026',
    body: 'Drag deals between stages. Pipeline value, commission and a weighted forecast recompute as you move them, and a deal that has not moved in a fortnight says so.',
  },
  {
    id: 'c3', mark: null, title: 'Buyer storefront', when: '2 Sep 2026',
    body: 'Buyer-facing pages including a unit page with a working payment-plan calculator and a contact flow that says plainly when it could not file a request.',
  },
  {
    id: 'c4', mark: 'warn', title: 'Fixed: a slot you could book twice', when: '2 Sep 2026',
    body: 'Changing the day on a viewing request kept a time selected that had just become unavailable. It now clears.',
  },
];
