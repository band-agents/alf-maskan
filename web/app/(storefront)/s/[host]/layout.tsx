import { notFound } from 'next/navigation';
import { storeForHost } from '@/lib/tenant';

/**
 * Every storefront route hangs off this. Resolving the tenant here means a page
 * below can assume it exists, and an unknown host 404s once rather than in
 * every page that forgot to check.
 *
 * The skin — template, brand colour, direction — is applied one level up, on
 * `<html>`, because that is the only element the template's ground colour can
 * reach. See the root storefront layout. This one guards; that one paints.
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

  return <>{children}</>;
}
