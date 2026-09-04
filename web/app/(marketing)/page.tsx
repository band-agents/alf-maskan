import Link from 'next/link';

/**
 * The marketing site. Its five pages exist in full in the static build at
 * ../src/pages/*.html and are the spec for porting them; this is the shell
 * they land in.
 */
export default function MarketingHome() {
  return (
    <main id="main" className="wrap" style={{ paddingBlock: '80px 64px' }}>
      <span className="badge badge--palm">Now live in 11 governorates</span>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-hero)',
          lineHeight: 1.1,
          fontWeight: 700,
          color: 'var(--ink-900)',
          letterSpacing: '-.02em',
          margin: '18px 0 0',
          maxWidth: '16ch',
        }}
      >
        Your own real-estate website. Live in 10 minutes.
      </h1>

      <p
        style={{
          fontSize: 'var(--t-lede)',
          color: 'var(--slate-500)',
          lineHeight: 1.65,
          maxWidth: '54ch',
          marginTop: 18,
        }}
      >
        List your units, drag your storefront into shape, and send buyers a site that looks
        like it cost a fortune. EGP 990 a month, Arabic and English, no developer needed.
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
        <Link className="btn btn--lg btn--primary" href="/dash">
          Open the dashboard
        </Link>
        <a
          className="btn btn--lg btn--secondary"
          href="http://kamal-estates.localhost:3000"
        >
          See a storefront
        </a>
      </div>

      <p style={{ marginTop: 40, fontSize: 'var(--t-micro)', color: 'var(--slate-400)' }}>
        Storefronts resolve by hostname. In development,{' '}
        <code style={{ fontFamily: 'var(--font-mono)' }}>&lt;slug&gt;.localhost:3000</code> is a
        tenant and <code style={{ fontFamily: 'var(--font-mono)' }}>app.localhost:3000</code> is
        the dashboard — no wildcard DNS needed, browsers resolve those themselves.
      </p>
    </main>
  );
}
