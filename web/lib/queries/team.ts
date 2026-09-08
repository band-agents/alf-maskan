/**
 * Team, roles and permissions.
 *
 * These are two screens over one model, which is why they share a file. The
 * static build let them drift: the roles matrix wrote a headcount under each
 * column — Owner 1, Agent 2, Content ed. 0 — while the team table listed the
 * people, and nothing connected them. Remove an agent on one screen and the
 * other still says two.
 *
 * Here the column counts are derived from the members, so a role's header
 * cannot claim a person the team table does not show.
 */

export type RoleId = 'owner' | 'admin' | 'manager' | 'agent' | 'editor' | 'accountant' | 'viewer';

export type Role = {
  id: RoleId;
  label: string;
  /** Short label for the matrix header, which is narrow. */
  short: string;
  /** The owner's permissions cannot be edited. A store whose owner can be
   *  locked out of billing is a store nobody can pay for or close. */
  locked: boolean;
  /** Shown at the moment someone picks the role in the invite sheet, rather
   *  than on a help page they will not open. */
  note: string;
};

export const ROLES: Role[] = [
  {
    id: 'owner', label: 'Owner', short: 'Owner', locked: true,
    note: 'Everything, including billing and deleting the store. There is exactly one owner, and ownership is transferred rather than granted.',
  },
  {
    id: 'admin', label: 'Admin', short: 'Admin', locked: false,
    note: 'Everything except billing and the store itself. The role to give a partner or a general manager.',
  },
  {
    id: 'manager', label: 'Sales manager', short: 'Sales mgr', locked: false,
    note: 'The whole pipeline and every listing, plus marketing. Can see all agents’ leads, which is the point of the role.',
  },
  {
    id: 'agent', label: 'Agent', short: 'Agent', locked: false,
    note: 'Sees only their own listings and their own leads. Can create drafts but not publish them, and cannot see another agent’s pipeline or touch the storefront design.',
  },
  {
    id: 'editor', label: 'Content editor', short: 'Content ed.', locked: false,
    note: 'The storefront and its pages. No access to leads or prices — for a designer or an agency you hire by the month.',
  },
  {
    id: 'accountant', label: 'Accountant', short: 'Accountant', locked: false,
    note: 'Billing, invoices and the numbers. Can see deals for commission but cannot edit a listing or reply to a buyer.',
  },
  {
    id: 'viewer', label: 'Viewer', short: 'Viewer', locked: false,
    note: 'Read-only across listings and analytics. For an investor or a head office that wants to look without touching.',
  },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;

export type Member = {
  id: string;
  storeId: string;
  name: string;
  email: string;
  role: RoleId;
  /** Zones this person is limited to. Empty means everywhere the store
   *  operates — scope narrows a role, it never widens one. */
  scope: string[];
  /** Null for a pending invite: they have never signed in, so counting their
   *  listings would be counting nothing. */
  listings: number | null;
  leads: number | null;
  lastActive: string;
  pending: boolean;
  /** Pending invites only. */
  invitedBy?: string;
  invitedAgo?: string;
};

const KAMAL = 'store_kamal';
const MASRIA = 'store_masria';

const MEMBERS: Member[] = [
  { id: 'u1', storeId: KAMAL, name: 'Youssef Kamal', email: 'youssef@kamalestates.com', role: 'owner', scope: [], listings: 18, leads: 42, lastActive: 'Now', pending: false },
  { id: 'u2', storeId: KAMAL, name: 'Nourhan Adel', email: 'nourhan@kamalestates.com', role: 'admin', scope: [], listings: 11, leads: 24, lastActive: '12 minutes ago', pending: false },
  { id: 'u3', storeId: KAMAL, name: 'Mai Farouk', email: 'mai@kamalestates.com', role: 'manager', scope: ['North Coast', 'Ain Sokhna'], listings: 9, leads: 31, lastActive: '2 hours ago', pending: false },
  { id: 'u4', storeId: KAMAL, name: 'Karim ElSayed', email: 'karim@kamalestates.com', role: 'agent', scope: ['6th of October'], listings: 4, leads: 17, lastActive: 'Yesterday', pending: false },
  { id: 'u5', storeId: KAMAL, name: 'Omar Hegazy', email: 'omar@kamalestates.com', role: 'agent', scope: ['Mostakbal City'], listings: 6, leads: 11, lastActive: '3 days ago', pending: false },
  { id: 'u6', storeId: KAMAL, name: 'Rania Wagdy', email: 'rania@kamalestates.com', role: 'accountant', scope: [], listings: null, leads: null, lastActive: '1 week ago', pending: false },
  { id: 'u7', storeId: KAMAL, name: 'sherif@kamalestates.com', email: 'sherif@kamalestates.com', role: 'agent', scope: ['New Cairo'], listings: null, leads: null, lastActive: 'Never', pending: true, invitedBy: 'Youssef', invitedAgo: '2 days ago' },

  { id: 'e1', storeId: MASRIA, name: 'Sara Naguib', email: 'sara@elmasria.com', role: 'owner', scope: [], listings: 7, leads: 19, lastActive: 'Now', pending: false },
  { id: 'e2', storeId: MASRIA, name: 'Ahmed Zaki', email: 'ahmed@elmasria.com', role: 'agent', scope: ['Sheikh Zayed'], listings: 5, leads: 12, lastActive: '4 hours ago', pending: false },
];

/** Seats included before an agency pays for more. */
export const SEATS_INCLUDED = 10;

export function membersFor(storeId: string): Member[] {
  return MEMBERS.filter((m) => m.storeId === storeId);
}

export type TeamSummary = {
  members: Member[];
  active: number;
  pending: number;
  /** Seats used counts a pending invite: it is reserved the moment it is sent,
   *  or an agency could invite twenty people into ten seats. */
  used: number;
  seats: number;
  overSeats: boolean;
};

export function teamSummary(storeId: string): TeamSummary {
  const members = membersFor(storeId);
  const pending = members.filter((m) => m.pending).length;
  return {
    members,
    active: members.length - pending,
    pending,
    used: members.length,
    seats: SEATS_INCLUDED,
    overSeats: members.length > SEATS_INCLUDED,
  };
}

/**
 * How many people hold each role, derived rather than written under the column.
 * This is the number the static build let drift.
 *
 * Pending invites are excluded. The roles screen says a change "applies to
 * everyone holding that role, immediately", and someone who has not accepted an
 * invite holds nothing yet — counting them would overstate the blast radius of
 * an edit, which is the one thing that header exists to convey.
 */
export function roleCounts(storeId: string): Record<RoleId, number> {
  const counts = Object.fromEntries(ROLES.map((r) => [r.id, 0])) as Record<RoleId, number>;
  for (const m of membersFor(storeId)) if (!m.pending) counts[m.role]++;
  return counts;
}

// ------------------------------------------------------------ capabilities

export type Level = 'full' | 'limited' | 'none';
export const LEVELS: Level[] = ['full', 'limited', 'none'];

export type Capability = {
  id: string;
  label: string;
  detail: string;
  levels: Record<RoleId, Level>;
};

export const CAPABILITIES: Capability[] = [
  {
    id: 'listings-view', label: 'View listings', detail: 'Every unit in the store',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'limited', editor: 'full', accountant: 'full', viewer: 'full' },
  },
  {
    id: 'listings-edit', label: 'Create & edit listings', detail: 'Including drafts',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'limited', editor: 'none', accountant: 'none', viewer: 'none' },
  },
  {
    id: 'listings-publish', label: 'Publish & set prices', detail: 'Makes a unit visible to buyers',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'none', editor: 'none', accountant: 'none', viewer: 'none' },
  },
  {
    id: 'leads', label: 'Leads & deals', detail: 'Inbox, pipeline, assignment',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'limited', editor: 'none', accountant: 'limited', viewer: 'limited' },
  },
  {
    id: 'storefront', label: 'Storefront design', detail: 'Builder, pages, templates',
    levels: { owner: 'full', admin: 'full', manager: 'none', agent: 'none', editor: 'full', accountant: 'none', viewer: 'none' },
  },
  {
    id: 'marketing', label: 'Marketing', detail: 'Offers, broadcasts, lead forms',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'none', editor: 'limited', accountant: 'none', viewer: 'none' },
  },
  {
    id: 'analytics', label: 'Analytics', detail: 'Store-wide numbers',
    levels: { owner: 'full', admin: 'full', manager: 'full', agent: 'limited', editor: 'none', accountant: 'full', viewer: 'full' },
  },
  {
    id: 'team', label: 'Team & roles', detail: 'Invite, remove, change permissions',
    levels: { owner: 'full', admin: 'full', manager: 'limited', agent: 'none', editor: 'none', accountant: 'none', viewer: 'none' },
  },
  {
    id: 'billing', label: 'Billing & the store itself', detail: 'Payment method, invoices, deleting the store',
    levels: { owner: 'full', admin: 'none', manager: 'none', agent: 'none', editor: 'none', accountant: 'full', viewer: 'none' },
  },
];

export const LEVEL_GLYPH: Record<Level, string> = { full: '●', limited: '◐', none: '—' };
export const LEVEL_WORD: Record<Level, string> = { full: 'Full', limited: 'Limited', none: 'None' };

/** The zones an agency can scope someone to. Taken from where it actually
 *  operates, so the list cannot offer a governorate with no stock in it. */
export function scopeOptions(zones: string[]): string[] {
  return ['Everywhere we operate', ...zones];
}
