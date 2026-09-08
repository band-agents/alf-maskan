import { collectionsFor } from './collections';
import { membersFor } from './team';
import { compoundsFor, zonesFor, type UnitRow } from './units';
import { positioning } from './unit-detail';
import type { EditorContext } from '@/components/listings/Editor';

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'alfmaskan.com';

/**
 * Everything the editor needs that is not the unit itself.
 *
 * Gathered in one place because both the edit and the create route need exactly
 * the same set, and because every list in it is the agency's own: its zones,
 * its compounds, its people, its collections. A dropdown offering a zone the
 * agency does not sell in is how a unit ends up somewhere no buyer looks.
 */
export function editorContext(storeId: string, slug: string, unit: UnitRow | null): EditorContext {
  return {
    zones: zonesFor(storeId),
    compounds: compoundsFor(storeId),
    agents: membersFor(storeId).filter((m) => !m.pending).map((m) => m.name),
    collections: collectionsFor(storeId).map((c) => ({ slug: c.slug, name: c.nameEn })),
    storeSlug: slug,
    rootDomain: ROOT,
    // A brand-new unit has no price yet, so there is nothing honest to compare.
    positioning: unit ? positioning(unit, storeId) : null,
  };
}
