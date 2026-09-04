import { AppRail } from '@/components/AppRail';
import { AppTopbar } from '@/components/AppTopbar';
import { mockStore } from '@/lib/mock';

export default function DashShell({ children }: { children: React.ReactNode }) {
  // The only line that changes when the database is live.
  const store = mockStore;

  return (
    <div className="shell" id="shell">
      <AppRail storeName={store.nameEn} />
      <div className="rail-scrim" />
      <div className="main">
        <AppTopbar storefrontUrl={`http://${store.slug}.localhost:3000`} />
        {children}
      </div>
    </div>
  );
}
