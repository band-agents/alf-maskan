import Link from 'next/link';

import { mockStore } from '@/lib/mock';
import {
  listLeads, getLead, parseLeadParams, quickReplies,
  SOURCE_LABEL, STAGES, STAGE_PILL, type Segment, type LeadRow,
} from '@/lib/queries/leads';
import { getUnitByRef, unitTerms } from '@/lib/queries/units';
import { egp } from '@/lib/pricing';
import { TYPE_LABEL, Placeholder } from '@/components/ui/atoms';
import { StageStepper } from '@/components/leads/StageStepper';
import { ReplyPanel } from '@/components/leads/ReplyPanel';
import { SourceMark, SEGMENT_LABEL } from '@/components/leads/marks';

export const metadata = { title: 'Leads — Alf Maskan' };

/**
 * The leads inbox — ported from `src/pages/app/leads.html`.
 *
 * The other half of `/contact`: that screen files an enquiry, this is where the
 * agency reads it. At EGP 990 a month the number on this page is the one that
 * decides renewal, so it is derived from the rows below it and never authored.
 *
 * Segment, search and the selected lead are URL state, as everywhere else in
 * this app. That is what lets an agent paste a colleague a link to one enquiry
 * rather than saying "it's the third one down".
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The one line that changes when auth is real.
  const storeId = mockStore.id;

  const { seg, q, lead: wanted } = parseLeadParams(await searchParams);
  const { leads, counts, unanswered, total } = await listLeads(storeId, { seg, q });

  // The selected lead falls back to the first in view, so the right pane is
  // never empty while the list has something in it.
  const selected =
    (wanted ? await getLead(wanted, storeId) : null) ??
    (leads[0] ? await getLead(leads[0].id, storeId) : null);

  const href = (over: Partial<{ seg: string; q: string; lead: string }>) => {
    const p = new URLSearchParams();
    const next = { seg, q, lead: selected?.id ?? '', ...over };
    if (next.seg && next.seg !== 'all') p.set('seg', next.seg);
    if (next.q) p.set('q', next.q);
    if (next.lead) p.set('lead', next.lead);
    const s = p.toString();
    return s ? `/dash/leads?${s}` : '/dash/leads';
  };

  return (
    <main className="content" id="main">
      <div className="page-head">
        <div>
          <h1>Leads</h1>
          <p>
            <b>{unanswered} unanswered</b> · {total} in the inbox
            {counts.form > 0 && <> · {counts.form} from the website form</>}
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="btn btn--app" href="/dash/deals">Pipeline board</Link>
          <Link className="btn btn--go" href="/dash/leads">
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add lead
          </Link>
        </div>
      </div>

      <div className="inbox">
        {/* ───────────────────────────────────────────────── segments */}
        <nav className="segs" aria-label="Lead segments">
          <span className="segs__label">Inbox</span>
          {(['all', 'unread', 'mine', 'unassigned'] as Segment[]).map((s) => (
            <Link
              key={s}
              className="seg-item"
              href={href({ seg: s, lead: '' })}
              aria-current={s === seg ? 'true' : 'false'}
            >
              <SourceMark seg={s} />
              {SEGMENT_LABEL[s]} <span className="seg-item__n">{counts[s]}</span>
            </Link>
          ))}

          <span className="segs__label">Source</span>
          {(['wa', 'form', 'call', 'fb'] as Segment[]).map((s) => (
            <Link
              key={s}
              className="seg-item"
              href={href({ seg: s, lead: '' })}
              aria-current={s === seg ? 'true' : 'false'}
            >
              <SourceMark seg={s} />
              {SEGMENT_LABEL[s]} <span className="seg-item__n">{counts[s]}</span>
            </Link>
          ))}
        </nav>

        {/* ───────────────────────────────────────────────── the list */}
        <div className="leadlist">
          <div className="leadlist__top">
            {/* A GET form, so search survives with no JavaScript and the result
                is a URL an agent can share. */}
            <form method="get" action="/dash/leads">
              {seg !== 'all' && <input type="hidden" name="seg" value={seg} />}
              <label className="fsearch" style={{ height: 32 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="visually-hidden">Search leads</span>
                <input type="search" name="q" defaultValue={q} placeholder="Name, unit or phone…" />
              </label>
            </form>
          </div>

          <div className="leadlist__scroll" aria-label="Leads">
            {leads.map((l) => (
              <Link
                key={l.id}
                className="leaditem"
                href={href({ lead: l.id })}
                aria-current={l.id === selected?.id ? 'true' : 'false'}
                data-unread={l.unanswered ? '' : undefined}
              >
                <span className="avatar avatar--sm" aria-hidden="true" />
                <span className="leaditem__body">
                  <span className="leaditem__top">
                    <span className="leaditem__name">
                      {l.name}
                      {l.unanswered && <span className="visually-hidden">, unanswered</span>}
                    </span>
                    <span className="leaditem__time">{l.when}</span>
                  </span>
                  <span className="leaditem__unit">{l.unitLabel}</span>
                  <span className="leaditem__meta">
                    <SourceMark source={l.source} />
                    <span className="visually-hidden">from {SOURCE_LABEL[l.source]}</span>
                    <span className={`st ${STAGE_PILL[l.stage]}`}>
                      {STAGES.find((s) => s.key === l.stage)?.short}
                    </span>
                    {l.budget && <span className="leaditem__budget">{l.budget}</span>}
                  </span>
                </span>
              </Link>
            ))}

            {leads.length === 0 && (
              <div className="empty" style={{ border: 0, borderRadius: 0, padding: '36px 18px' }}>
                <h3>No leads here</h3>
                <p>
                  Nothing in this segment right now.{' '}
                  {q ? <>Try clearing the search.</> : <>Your other {total} leads are still there.</>}
                </p>
                <div className="empty__acts">
                  <Link className="btn btn--app" href="/dash/leads">Show all leads</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────── the lead */}
        {selected ? <LeadView lead={selected} storeId={storeId} /> : (
          <div className="leadview">
            <div className="empty" style={{ border: 0, margin: 'auto' }}>
              <h3>Nothing selected</h3>
              <p>Pick a lead from the list to see the conversation.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/** The right-hand pane. A server component: everything on it is read except the
 *  stepper and the reply box, which own their own client boundaries. */
async function LeadView({ lead, storeId }: { lead: LeadRow; storeId: string }) {
  const unit = lead.unitRef ? await getUnitByRef(lead.unitRef, storeId) : null;
  const replies = await quickReplies(lead, storeId);
  const wa = `https://wa.me/${lead.phone.replace(/\D/g, '')}`;

  return (
    <div className="leadview">
      <div className="leadview__head">
        <div className="leadview__who">
          <span className="avatar" aria-hidden="true" />
          <div>
            <h2>{lead.name}</h2>
            <p>
              {/* A phone number never mirrors, whatever the page direction. */}
              <span dir="ltr">{lead.phone}</span> · {SOURCE_LABEL[lead.source]} · first touch{' '}
              {lead.firstTouch}
            </p>
          </div>
        </div>
        <div className="leadview__acts">
          <button className="btn btn--app" type="button">Assign</button>
          <button className="btn btn--app" type="button">Add task</button>
          <a className="btn btn--go" href={wa} target="_blank" rel="noopener noreferrer">
            Reply on WhatsApp
          </a>
        </div>
      </div>

      <div className="leadview__scroll">
        <StageStepper leadId={lead.id} stage={lead.stage} />

        {unit && (
          <section aria-labelledby="asked-h">
            <h3 className="panel__title" id="asked-h" style={{ marginBottom: 9 }}>Asked about</h3>
            <Link className="askedabout" href={`/dash/listings/${unit.id}`}>
              <Placeholder />
              <div className="askedabout__txt">
                <b>{unit.titleEn}</b>
                <span>
                  {unit.zone}
                  {unit.compound && ` · ${unit.compound}`} · {unit.areaSqm} m²
                  {unit.bedrooms ? ` · ${unit.bedrooms} bed` : ''} · {TYPE_LABEL[unit.type]}
                </span>
              </div>
              <div className="askedabout__price">
                <b>{egp(unit.price)}</b>
                <span>{unitTerms(unit)}</span>
              </div>
            </Link>
          </section>
        )}

        <section aria-labelledby="convo-h">
          <h3 className="panel__title" id="convo-h" style={{ marginBottom: 12 }}>Conversation</h3>
          <div className="convo">
            <span className="convo-event">{lead.event}</span>
            {lead.messages.map((m, i) => (
              <div className={`msg${m.direction === 'OUT' ? ' msg--out' : ''}`} key={i}>
                <span className="avatar avatar--sm msg__avatar" aria-hidden="true" />
                <div
                  className="msg__bubble"
                  lang={m.locale === 'ar' ? 'ar' : undefined}
                  dir={m.locale === 'ar' ? 'rtl' : undefined}
                >
                  {m.body}
                  <span className="msg__when" dir="ltr">{m.when}</span>
                </div>
              </div>
            ))}
            {lead.unanswered && (
              <span className="convo-event">Waiting on a reply — {lead.when} so far</span>
            )}
          </div>
        </section>

        {lead.tasks.length > 0 && (
          <section aria-labelledby="tasks-h">
            <h3 className="panel__title" id="tasks-h" style={{ marginBottom: 6 }}>Tasks</h3>
            <div className="tasklist">
              {lead.tasks.map((t) => (
                <label className="task" key={t.title} data-overdue={t.overdue ? '' : undefined}>
                  <input className="chk" type="checkbox" defaultChecked={t.done} />
                  <span>{t.title}</span>
                  <span className="task__when">{t.when}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {lead.notes && (
          <section aria-labelledby="notes-h">
            <h3 className="panel__title" id="notes-h" style={{ marginBottom: 9 }}>Internal notes</h3>
            <textarea
              className="ta"
              defaultValue={lead.notes}
              style={{
                width: '100%', minHeight: 70, padding: '10px 12px',
                border: '1px solid var(--rule)', borderRadius: 'var(--r-10)',
                background: 'var(--panel-2)', font: 'inherit',
                fontSize: 'var(--t-micro)', color: 'var(--text)',
              }}
            />
          </section>
        )}

        <ReplyPanel replies={replies} phone={lead.phone} name={lead.name} />
      </div>
    </div>
  );
}
