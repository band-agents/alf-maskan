import { mockStore } from '@/lib/mock';
import { collectionsFor } from '@/lib/queries/collections';
import { unitsForStore } from '@/lib/queries/units';
import { Builder } from '@/components/builder/Builder';

export const metadata = {
  title: 'Storefront builder — Alf Maskan',
  description: 'Drag the sections of your storefront into the order you want, then publish.',
};

export default function BuilderPage() {
  // The one line that changes when auth is real.
  const store = mockStore;

  return (
    <Builder
      store={store}
      units={unitsForStore(store.id)}
      collections={collectionsFor(store.id).map((c) => ({ slug: c.slug, name: c.nameEn, count: c.count }))}
    />
  );
}
