'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The ⓘ that sits beside every non-obvious control.
 *
 * It was rendering as a dead button: `atoms.tsx` output the dot and a `hidden`
 * body and nothing ever toggled them, so every hint in the app — the dashboard
 * KPIs included — looked interactive and did nothing. A control that lies about
 * being a control is worse than no control, and the house rule asks for one of
 * these on anything non-obvious, so it has to actually work.
 *
 * Behaviour is the static build's, from `dashboard.js`: click toggles, hover
 * opens and closes, blur closes, and a click anywhere else closes it. Escape is
 * added — the original relied on the document click, which a keyboard user
 * never fires.
 */
export function Hint({ children, about }: { children: React.ReactNode; about: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      className="hint"
      ref={wrap}
      data-open={open ? '' : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="hint__dot"
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          // Without this the document listener above closes it in the same tick.
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
      >
        i<span className="visually-hidden">About {about}</span>
      </button>
      <span className="hint__body" hidden={!open}>
        {children}
      </span>
    </span>
  );
}
