import { storeForHost } from '@/lib/tenant';

export default async function StoreHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const store = await storeForHost(decodeURIComponent(host));

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <p style={{ opacity: 0.6, fontSize: 13 }}>storefront · {host}</p>
      <h1>{store?.nameEn}</h1>
      <p>{store?.nameAr}</p>
    </main>
  );
}
