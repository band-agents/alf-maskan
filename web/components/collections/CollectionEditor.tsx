'use client';

import { useMemo, useState } from 'react';
import {
  RULE_FIELDS,
  matchUnits,
  valuesFor,
  type Collection,
  type Rule,
  type RuleField,
  type RuleOp,
} from '@/lib/queries/collections';
import type { UnitRow } from '@/lib/queries/units';
import { Hint, Placeholder, TYPE_LABEL } from '@/components/ui/atoms';

/**
 * The collection editor.
 *
 * Every count on this screen — the conditions bar, the fieldset summary, the
 * grid below — comes from one `matchUnits` call over the store's units. The
 * static build wrote those numbers by hand and they contradicted each other;
 * here disagreeing is not expressible.
 *
 * Matching runs in the browser so an agent sees the effect of a condition as
 * they change it. That is the one place client state is right on this surface:
 * a rule being edited is a draft, not a saved query, and putting a half-typed
 * threshold in the URL would be worse than useless.
 */
export function CollectionEditor({
  collection,
  units,
}: {
  collection: Collection;
  units: UnitRow[];
}) {
  const [draft, setDraft] = useState<Collection>(collection);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof Collection>(key: K, value: Collection[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const matched = useMemo(() => matchUnits(draft, units), [draft, units]);

  function setRule(i: number, patch: Partial<Rule>) {
    const rules = draft.rules.map((r, n) => (n === i ? { ...r, ...patch } : r));
    // Changing the field invalidates the value it was written against, so the
    // rule is re-seeded rather than left comparing a zone name to a unit type.
    if (patch.field) {
      const opts = valuesFor(patch.field, units);
      const numeric = RULE_FIELDS.find((f) => f.value === patch.field)?.numeric;
      rules[i] = {
        field: patch.field,
        op: numeric ? 'under' : 'is',
        value: numeric ? '' : (opts[0] ?? ''),
      };
    }
    set('rules', rules);
  }

  function addRule() {
    const zones = valuesFor('zone', units);
    set('rules', [...draft.rules, { field: 'zone', op: 'is', value: zones[0] ?? '' }]);
  }

  function removeRule(i: number) {
    set('rules', draft.rules.filter((_, n) => n !== i));
  }

  return (
    <form className="ed__form" onSubmit={(e) => e.preventDefault()}>
      {/* ---------------------------------------------- details */}
      <details className="fset" open>
        <summary>
          <span className="fset__n" aria-hidden="true">1</span>
          <span className="fset__title">Collection details</span>
          <span className="fset__meta"><Caret /></span>
        </summary>
        <div className="fset__body">
          <div className="lang-field">
            <div className="lang-field__top">
              <span className="f__label">Name <span className="f__req" aria-hidden="true">*</span></span>
              <span className="lang-tabs">
                <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                <button type="button" aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>ع</button>
              </span>
            </div>
            {lang === 'en' ? (
              <input
                className="inp"
                aria-label="Collection name in English"
                value={draft.nameEn}
                onChange={(e) => set('nameEn', e.target.value)}
              />
            ) : (
              <input
                className="inp"
                aria-label="Collection name in Arabic"
                lang="ar"
                dir="rtl"
                style={{ fontFamily: 'var(--font-arabic)' }}
                value={draft.nameAr}
                onChange={(e) => set('nameAr', e.target.value)}
              />
            )}
          </div>

          <div className="f">
            <label className="f__label" htmlFor="c-desc">Description</label>
            <textarea
              className="ta"
              id="c-desc"
              style={{ minHeight: 64 }}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
            />
            <span className="f__hint">
              Shown under the heading when this collection is used as a storefront row.
            </span>
          </div>

          <div className="f">
            <span className="f__label">
              How units get in
              <Hint about="About collection types">
                An automatic collection updates itself whenever a unit changes — add a Marassi
                chalet tomorrow and it appears here without you touching anything.
              </Hint>
            </span>
            <span className="seg">
              <button type="button" aria-pressed={draft.auto} onClick={() => set('auto', true)}>
                Automatic
              </button>
              <button type="button" aria-pressed={!draft.auto} onClick={() => set('auto', false)}>
                Manual
              </button>
            </span>
          </div>
        </div>
      </details>

      {/* ---------------------------------------------- conditions */}
      {draft.auto ? (
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">2</span>
            <span className="fset__title">Conditions</span>
            <span className="fset__meta">
              <Hint about="About conditions">
                Every unit that satisfies these is in the collection, now and in future. Change a
                unit&rsquo;s zone and it leaves or joins on its own.
              </Hint>
              <Caret />
            </span>
          </summary>
          <div className="fset__body">
            <div className="f">
              <span className="f__label" id="c-match-label">Units must match</span>
              <span className="seg" role="group" aria-labelledby="c-match-label">
                <button type="button" aria-pressed={draft.match === 'all'} onClick={() => set('match', 'all')}>
                  All conditions
                </button>
                <button type="button" aria-pressed={draft.match === 'any'} onClick={() => set('match', 'any')}>
                  Any condition
                </button>
              </span>
            </div>

            <div className="rules">
              {draft.rules.map((rule, i) => {
                const numeric = RULE_FIELDS.find((f) => f.value === rule.field)?.numeric;
                const options = valuesFor(rule.field, units);
                return (
                  <div key={i}>
                    {i > 0 && (
                      <span className="rule__join">{draft.match === 'all' ? 'and' : 'or'}</span>
                    )}
                    <div className="rule">
                      <span className="selwrap">
                        <label className="visually-hidden" htmlFor={`r${i}-f`}>
                          Condition {i + 1} field
                        </label>
                        <select
                          className="sel"
                          id={`r${i}-f`}
                          value={rule.field}
                          onChange={(e) => setRule(i, { field: e.target.value as RuleField })}
                        >
                          {RULE_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                        <Caret small />
                      </span>

                      <span className="selwrap">
                        <label className="visually-hidden" htmlFor={`r${i}-o`}>
                          Condition {i + 1} operator
                        </label>
                        <select
                          className="sel"
                          id={`r${i}-o`}
                          value={rule.op}
                          onChange={(e) => setRule(i, { op: e.target.value as RuleOp })}
                        >
                          {numeric ? (
                            <>
                              <option value="under">is under</option>
                              <option value="over">is over</option>
                            </>
                          ) : (
                            <>
                              <option value="is">is</option>
                              <option value="isnot">is not</option>
                            </>
                          )}
                        </select>
                        <Caret small />
                      </span>

                      {numeric ? (
                        <input
                          className="inp"
                          type="number"
                          aria-label={`Condition ${i + 1} value`}
                          value={rule.value}
                          onChange={(e) => setRule(i, { value: e.target.value })}
                        />
                      ) : (
                        <span className="selwrap">
                          <label className="visually-hidden" htmlFor={`r${i}-v`}>
                            Condition {i + 1} value
                          </label>
                          <select
                            className="sel"
                            id={`r${i}-v`}
                            value={rule.value}
                            onChange={(e) => setRule(i, { value: e.target.value })}
                          >
                            {/* Only values some unit actually has. Offering one
                                nothing matches builds an empty collection that
                                looks broken. */}
                            {options.map((v) => (
                              <option key={v} value={v}>
                                {rule.field === 'type' ? (TYPE_LABEL[v] ?? v) : v}
                              </option>
                            ))}
                          </select>
                          <Caret small />
                        </span>
                      )}

                      <button className="rule__drop" type="button" onClick={() => removeRule(i)}>
                        <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span className="visually-hidden">Remove condition {i + 1}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="views__add"
              type="button"
              onClick={addRule}
              style={{ alignSelf: 'flex-start', height: 34 }}
            >
              + Add condition
            </button>

            <div className="matchbar" role="status" aria-live="polite">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <b>{matched.length}</b> {matched.length === 1 ? 'unit matches' : 'units match'} right now
              </span>
              <span className="matchbar__end">Updates by itself as units change</span>
            </div>
          </div>
        </details>
      ) : (
        <details className="fset" open>
          <summary>
            <span className="fset__n" aria-hidden="true">2</span>
            <span className="fset__title">Chosen units</span>
            <span className="fset__meta">{draft.refs.length} picked<Caret /></span>
          </summary>
          <div className="fset__body">
            <p className="f__hint" style={{ marginBottom: 10 }}>
              A manual collection holds exactly what you put in it. Tick a unit to add or remove
              it; nothing joins or leaves on its own.
            </p>
            <div className="fgrid">
              {units.map((u) => (
                <label key={u.id} className="sw-row" style={{ alignItems: 'center' }}>
                  <input
                    className="sw sw--sand"
                    type="checkbox"
                    checked={draft.refs.includes(u.reference)}
                    onChange={(e) =>
                      set(
                        'refs',
                        e.target.checked
                          ? [...draft.refs, u.reference]
                          : draft.refs.filter((r) => r !== u.reference)
                      )
                    }
                  />
                  <span className="sw-row__txt">
                    <b>{u.titleEn}</b>
                    <span>{u.reference} · {u.zone}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* ---------------------------------------------- matched units */}
      <details className="fset" open>
        <summary>
          <span className="fset__n" aria-hidden="true">3</span>
          <span className="fset__title">Matched units</span>
          <span className="fset__meta">{matched.length} units<Caret /></span>
        </summary>
        <div className="fset__body">
          {matched.length === 0 ? (
            <div className="empty">
              <span className="empty__mark" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7.5 11h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <h3>Nothing matches yet</h3>
              <p>
                No unit satisfies these conditions. Loosen one, or switch to &ldquo;Any
                condition&rdquo; so a unit only has to meet one of them.
              </p>
            </div>
          ) : (
            <div className="ugrid">
              {matched.map((u) => (
                <article className="ucard" key={u.id}>
                  <div className="ucard__media">
                    <Placeholder label={`${TYPE_LABEL[u.type]?.toLowerCase()} · ${u.compound ?? u.zone} · 4:3`} />
                    <div className="ucard__flags">
                      <span className={`st st--${u.status.toLowerCase()}`}>
                        {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ucard__body">
                    <span className="ucard__title">{u.titleEn}</span>
                    <span className="ucard__where">
                      {u.compound ? `${u.zone} · ${u.compound}` : u.zone}
                    </span>
                    <span className="ucard__specs">
                      <span>{u.areaSqm} m²</span>
                      <span>{u.bedrooms ? `${u.bedrooms} bed` : 'Studio'}</span>
                      <span>{u.reference}</span>
                    </span>
                    <span className="ucard__price">
                      EGP {u.price.toLocaleString('en-US')}
                    </span>
                    <span className="ucard__plan">
                      {u.delivery === 'Ready' ? 'Ready to move' : `Delivery ${u.delivery}`}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </details>

      <div className="savebar">
        <span className="savebar__chip" {...(dirty ? { 'data-dirty': '' } : {})}>
          <i aria-hidden="true" />
          <span>{dirty ? 'Unsaved changes' : 'Saved · 2s ago'}</span>
        </span>
        <span className="savebar__end">
          <button className="btn btn--app" type="button">Delete collection</button>
          <button className="btn btn--go" type="button" onClick={() => setDirty(false)}>
            Save collection
          </button>
        </span>
      </div>
    </form>
  );
}

function Caret({ small }: { small?: boolean }) {
  // The class sits on the svg for a fieldset caret and on a wrapper span inside
  // a select — that is how alf-maskan's stylesheets target each, and swapping
  // them silently drops the rotation on one and the positioning on the other.
  if (small) {
    return (
      <span className="selwrap__caret">
        <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <svg className="fset__caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
