import Link from 'next/link';
import { CHANGELOG, GUIDES, TOURS, searchGuides, topics } from '@/lib/queries/help';
import { isBuilt } from '@/lib/routes';
import { NotifMark } from '@/components/notifications/marks';

export const metadata = {
  title: 'Help — Alf Maskan',
  description: 'Guides, guided tours and what changed recently.',
};

const WA = 'https://wa.me/201002448817';

/**
 * Help.
 *
 * Tab, search and topic all live in the URL and every control is a link or a
 * GET form, so the whole page works with scripting off. That is the right
 * trade here specifically: someone opening Help is often already having
 * trouble, and a help page that needs the thing that is failing is no help.
 */
export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || '';
  };
  const raw = one('tab');
  const tab = raw === 'tours' || raw === 'changelog' ? raw : 'guides';
  const q = one('q');
  const topic = topics().includes(one('topic') as never) ? one('topic') : null;

  const shown = searchGuides(q, topic);

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    if (tab !== 'guides') p.set('tab', tab);
    if (q) p.set('q', q);
    if (topic) p.set('topic', topic);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `/dash/help?${s}` : '/dash/help';
  };

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Help</h1>
          <p>
            Most answers are here. If they are not, a real person replies on WhatsApp between
            10:00 and 19:00, Saturday to Thursday.
          </p>
        </div>
        <div className="page-head__actions">
          <a className="btn btn--go" href={WA}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0a8 8 0 0 0-6.8 12.2L0 16l3.9-1.1A8 8 0 1 0 8 0Zm0 14.6a6.6 6.6 0 0 1-3.4-.9l-.24-.15-2.5.7.7-2.4-.16-.25A6.6 6.6 0 1 1 8 14.6Z" />
            </svg>
            Ask us on WhatsApp
          </a>
        </div>
      </div>

      <div className="views" role="tablist" aria-label="Help sections">
        {/* Counted from the arrays. The static build wrote 12 above thirteen
            guides, which is the kind of small wrongness that makes an agency
            trust the rest of the page less. */}
        <Link className="view" role="tab" aria-selected={tab === 'guides'} href={href({ tab: null })} scroll={false}>
          Guides <span className="view__n">{GUIDES.length}</span>
        </Link>
        <Link className="view" role="tab" aria-selected={tab === 'tours'} href={href({ tab: 'tours' })} scroll={false}>
          Guided tours <span className="view__n">{TOURS.length}</span>
        </Link>
        <Link className="view" role="tab" aria-selected={tab === 'changelog'} href={href({ tab: 'changelog' })} scroll={false}>
          What&rsquo;s new
        </Link>
      </div>

      {tab === 'guides' && (
        <>
          <form className="toolbar" action="/dash/help" method="get">
            <label className="fsearch">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="visually-hidden">Search the guides</span>
              <input
                type="search"
                name="q"
                placeholder="Search — try “domain”, “Arabic” or “commission”…"
                defaultValue={q}
              />
            </label>
            {topic && <input type="hidden" name="topic" value={topic} />}
            <button className="tool-btn" type="submit">Search</button>
            <span className="f__hint" style={{ marginInlineStart: 'auto' }}>
              <b>{shown.length}</b> {shown.length === 1 ? 'guide' : 'guides'}
            </span>
          </form>

          <div className="toolbar" style={{ marginTop: -6 }}>
            <Link className="tool-btn" href={href({ topic: null })} aria-pressed={!topic} scroll={false}>
              Every topic
            </Link>
            {/* Only topics some guide has. */}
            {topics().map((t) => (
              <Link key={t} className="tool-btn" href={href({ topic: t })} aria-pressed={topic === t} scroll={false}>
                {t}
              </Link>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="empty" style={{ marginTop: 14 }}>
              <span className="empty__mark" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="9.5" cy="9.5" r="7" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M15 15l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <h3>No guide covers that yet</h3>
              <p>Ask us on WhatsApp and we will answer, then write the guide.</p>
              <div className="empty__acts">
                <a className="btn btn--go" href={WA}>Ask on WhatsApp</a>
              </div>
            </div>
          ) : (
            <div className="ed__form">
              {shown.map((g) => (
                <details className="fset" key={g.id}>
                  <summary>
                    <span className="fset__n" aria-hidden="true">?</span>
                    <span className="fset__title">{g.title}</span>
                    <span className="fset__meta">
                      {g.minutes} min
                      <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="fset__body">
                    {g.body.map((p, i) => (
                      <p key={i} style={{ fontSize: 'var(--t-micro)', color: 'var(--text-2)', lineHeight: 1.75 }}>
                        {p}
                      </p>
                    ))}
                    {/* A guide linking into a screen that is not built would be
                        the worst place for a 404, so it goes through the gate. */}
                    {g.link && isBuilt(g.link.href) && (
                      <Link className="panel__link" href={g.link.href}>{g.link.label} →</Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tours' && (
        <div className="kpis">
          {TOURS.map((t) => {
            const built = isBuilt(t.href);
            return (
              <article className="panel kpi" key={t.id}>
                <h2 className="kpi__label">{t.title}</h2>
                <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.6, marginTop: 6 }}>
                  {t.blurb}
                </p>
                {built ? (
                  <Link className="btn btn--app" href={t.href} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                    Start tour · {t.minutes} min
                  </Link>
                ) : (
                  <span
                    className="btn btn--app"
                    aria-disabled="true"
                    style={{ marginTop: 12, alignSelf: 'flex-start', opacity: 0.45, cursor: 'default' }}
                  >
                    Soon
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === 'changelog' && (
        <section className="panel panel--pad">
          <div className="audit">
            {CHANGELOG.map((c) => (
              <div className="auditrow" key={c.id}>
                <NotifMark kind={c.mark} />
                <div className="auditrow__body">
                  <b>{c.title}</b>
                  <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', lineHeight: 1.6, marginTop: 3 }}>
                    {c.body}
                  </p>
                </div>
                <span className="auditrow__when">{c.when}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
