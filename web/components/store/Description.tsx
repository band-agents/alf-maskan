'use client';

import { useState } from 'react';

/**
 * The description, in both scripts, with the EN / ع switch from `store-unit.js`.
 *
 * Both panes ship in the HTML and only `hidden` moves, so a buyer with no
 * JavaScript still reads the unit in their own language — and a search engine
 * indexes both. Arabic carries `lang` and `dir` so the browser picks the right
 * face and shaping; the numerals inside stay Western, which is the convention
 * across this whole product.
 */
export function Description({ en, ar }: { en: string[]; ar: string[] }) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const both = en.length > 0 && ar.length > 0;

  return (
    <section className="st-sec" aria-labelledby="about-h">
      <div className="st-sec__head">
        <h2 className="st-h2" id="about-h">About this unit</h2>
        {both && (
          <span className="st-lang" role="group" aria-label="Description language">
            <a
              href="#about-h"
              aria-current={lang === 'en' ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); setLang('en'); }}
            >
              EN
            </a>
            <a
              href="#about-h"
              aria-current={lang === 'ar' ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); setLang('ar'); }}
            >
              ع
            </a>
          </span>
        )}
      </div>

      {en.length > 0 && (
        <div className="st-prose" hidden={lang !== 'en'}>
          {en.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {ar.length > 0 && (
        <div className="st-prose" dir="rtl" lang="ar" hidden={lang !== 'ar'}>
          {ar.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </section>
  );
}
