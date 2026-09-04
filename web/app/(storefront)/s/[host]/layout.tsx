import { notFound } from 'next/navigation';
import { storeForHost } from '@/lib/tenant';

/**
 * Every storefront route hangs off this. Resolving the tenant here means a page
 * below can assume it exists, and an unknown host 404s once rather than in
 * every page that forgot to check.
 */
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));
  if (!store) notFound();

  return (
    <div data-template={store.template} dir={store.storeLangs === 'AR' ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}
