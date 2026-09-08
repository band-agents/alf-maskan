'use client';

import { useState } from 'react';
import {
  FIELDS, SAMPLE_CSV, guessMapping, mapRows, parseSheet, summarise,
  type Field, type Sheet,
} from '@/lib/queries/import';
import { TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The importer.
 *
 * Three steps, and the middle one is the whole product: an agency's spreadsheet
 * never has our column names, so we guess the mapping and then let them correct
 * it while watching the first rows change underneath. Importing blind and
 * apologising afterwards is how you lose a two-hundred-unit inventory into the
 * wrong fields.
 *
 * Nothing is rejected for being incomplete. A row with no price becomes a draft
 * and says so; only a row that cannot become a unit at all — no title, no zone,
 * no area — is held back, and it is still listed so it can be fixed.
 */
export function Import() {
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [mapping, setMapping] = useState<Record<Field, number | null> | null>(null);
  const [done, setDone] = useState(false);

  function read(raw: string) {
    const parsed = parseSheet(raw);
    setText(raw);
    setSheet(parsed);
    setMapping(parsed.headers.length ? guessMapping(parsed.headers) : null);
    setDone(false);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    read(await file.text());
  }

  const rows = sheet && mapping ? mapRows(sheet, mapping) : [];
  const sum = rows.length ? summarise(rows) : null;
  const guessed = mapping ? FIELDS.filter((f) => mapping[f.id] !== null).length : 0;

  return (
    <>
      {/* ------------------------------------------------ 1 the file */}
      <section className="panel panel--pad" style={{ marginBottom: 16 }}>
        <h2 className="panel__title" style={{ marginBottom: 4 }}>1 · Your spreadsheet</h2>
        <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 14 }}>
          Any Excel or CSV export works — Property Finder, OLX, or your own sheet. You can also
          copy the rows straight out of Excel and paste them here.
        </p>

        <label
          className="dropzone"
          style={{ display: 'grid', cursor: 'pointer', marginBottom: 12 }}
        >
          <b>Choose a CSV file, or paste below</b>
          <span>We read your column names and guess the match before anything is saved.</span>
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv"
            className="visually-hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>

        <div className="f">
          <label className="f__label" htmlFor="im-paste">Or paste rows</label>
          <textarea
            className="ta" id="im-paste" dir="ltr"
            style={{ minHeight: 110, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-nano)' }}
            placeholder="Paste from Excel — the first row should be your column headings."
            value={text}
            onChange={(e) => read(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <button className="btn btn--app" type="button" onClick={() => read(SAMPLE_CSV)}>
            Try it with a sample file
          </button>
          {sheet && (
            <button
              className="btn btn--app" type="button"
              onClick={() => { setText(''); setSheet(null); setMapping(null); setDone(false); }}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {sheet && mapping && sheet.headers.length > 0 && (
        <>
          {/* ------------------------------------------------ 2 mapping */}
          <section className="panel panel--pad" style={{ marginBottom: 16 }}>
            <h2 className="panel__title" style={{ marginBottom: 4 }}>2 · Match the columns</h2>
            <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 14 }}>
              {guessed} of {FIELDS.length} matched automatically from your headings. Change any
              that are wrong — the preview below updates as you do.
            </p>

            <div className="fgrid fgrid--3">
              {FIELDS.map((f) => {
                const col = mapping[f.id];
                return (
                  <div className="f" key={f.id}>
                    <label className="f__label" htmlFor={`map-${f.id}`}>
                      {f.label}
                      {f.required && <span className="f__req" aria-hidden="true"> *</span>}
                    </label>
                    <span className={`selwrap${col === null ? '' : ''}`}>
                      <select
                        className="sel" id={`map-${f.id}`}
                        value={col === null ? '' : String(col)}
                        onChange={(e) =>
                          setMapping({ ...mapping, [f.id]: e.target.value === '' ? null : Number(e.target.value) })
                        }
                      >
                        <option value="">Not in my file</option>
                        {sheet.headers.map((h, i) => (
                          <option key={`${h}-${i}`} value={i}>{h || `Column ${i + 1}`}</option>
                        ))}
                      </select>
                      <span className="selwrap__caret">
                        <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
                          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ------------------------------------------------ 3 preview */}
          <section className="panel panel--pad">
            <h2 className="panel__title" style={{ marginBottom: 4 }}>3 · What will be created</h2>
            {sum && (
              <p style={{ fontSize: 'var(--t-nano)', color: 'var(--text-3)', marginBottom: 14 }}>
                <b style={{ color: 'var(--text)' }}>{sum.total} rows</b> — {sum.ready} ready to
                publish, {sum.drafts} as drafts
                {sum.blocked > 0 && <>, {sum.blocked} that cannot be imported yet</>}
                {sum.missingArabic > 0 && <> · {sum.missingArabic} have no Arabic title</>}.
              </p>
            )}

            {sum && sum.blocked > 0 && (
              <p className="rolenote" style={{ marginBottom: 14 }}>
                <b>{sum.blocked} row{sum.blocked === 1 ? '' : 's'} held back</b>
                A unit needs at least a title, a zone and an area. Those rows are marked below —
                fix them in your sheet and paste again, or import the rest and add them by hand.
              </p>
            )}

            <div className="tablewrap">
              <div className="tablescroll">
                <table className="dtable" style={{ minWidth: 880 }}>
                  <caption className="visually-hidden">
                    Every row from your file, exactly as it will be created.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Row</th>
                      <th scope="col">Unit</th>
                      <th scope="col">Zone / compound</th>
                      <th scope="col">Type</th>
                      <th className="col-num" scope="col">Area</th>
                      <th className="col-num" scope="col">Beds</th>
                      <th className="col-num" scope="col">Price</th>
                      <th scope="col">Status</th>
                      <th scope="col">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const v = r.values;
                      const blocked = r.issues.some((i) => i === 'no title' || i === 'no zone' || i === 'no area');
                      return (
                        <tr key={r.index} style={blocked ? { opacity: 0.6 } : undefined}>
                          <td><span className="cell-sub">{r.index + 2}</span></td>
                          <td>
                            <div className="cell-unit__txt">
                              <span className="cell-unit__title">{String(v.titleEn || '—')}</span>
                              {v.titleAr ? (
                                <span className="cell-unit__ar" lang="ar" dir="rtl">{String(v.titleAr)}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            {String(v.zone || '—')}
                            {v.compound ? <span className="cell-sub"> · {String(v.compound)}</span> : null}
                          </td>
                          <td>{TYPE_LABEL[String(v.type)] ?? String(v.type)}</td>
                          <td className="col-num">{v.areaSqm ?? '—'}</td>
                          <td className="col-num">{v.bedrooms ?? '—'}</td>
                          <td className="col-num">
                            {typeof v.price === 'number'
                              ? <span className="money">EGP {v.price.toLocaleString('en-US')}</span>
                              : '—'}
                          </td>
                          <td>
                            {blocked
                              ? <span className="st st--sold">Held back</span>
                              : <span className={`st ${r.status === 'LIVE' ? 'st--live' : 'st--draft'}`}>
                                  {r.status === 'LIVE' ? 'Ready' : 'Draft'}
                                </span>}
                          </td>
                          <td><span className="cell-sub">{r.issues.join(' · ') || '—'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 9, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn--go" type="button"
                disabled={!sum || sum.ready + sum.drafts === 0}
                onClick={() => setDone(true)}
              >
                Import {sum ? sum.ready + sum.drafts : 0} units
              </button>
              <span className="f__hint">Photos are not part of an import — add them per unit afterwards.</span>
            </div>

            {done && (
              <p className="rolenote" role="status" style={{ marginTop: 14 }}>
                <b>Nothing was imported</b>
                There is no database connected yet, so these rows were parsed and checked but not
                written. Everything above is exactly what would have been created — the mapping,
                the drafts and the held-back rows are all real work, and they will be applied the
                moment the store is live.
              </p>
            )}
          </section>
        </>
      )}

      {sheet && sheet.headers.length === 0 && (
        <section className="panel panel--pad">
          <div className="empty" style={{ border: 0 }}>
            <h3>Nothing to read in that</h3>
            <p>
              The first row should be your column headings — Reference, Title, Zone, Area and so
              on. Try the sample file to see the shape.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
