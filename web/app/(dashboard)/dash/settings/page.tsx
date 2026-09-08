import Link from 'next/link';
import { mockStore } from '@/lib/mock';
import { SettingsForm } from '@/components/settings/SettingsForm';

export const metadata = {
  title: 'Settings — Alf Maskan',
  description: 'Store profile, domains, language, integrations and the danger zone.',
};

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'alfmaskan.com';

export default function SettingsPage() {
  // The one line that changes when auth is real.
  const store = mockStore;

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Everything about the store itself. Your own profile is under your avatar.</p>
        </div>
      </div>

      <div className="settings">
        <nav className="subnav" aria-label="Settings sections">
          <a href="#profile">Store profile</a>
          <a href="#domains">Domains</a>
          <a href="#region">Language &amp; region</a>
          <a href="#integrations">Integrations</a>
          <a href="#data">Import &amp; export</a>
          <Link href="/dash/billing">Billing</Link>
          <Link href="/dash/settings/audit">Audit log</Link>
          <a href="#danger">Danger zone</a>
        </nav>

        <SettingsForm store={store} rootDomain={ROOT} />
      </div>
    </main>
  );
}
