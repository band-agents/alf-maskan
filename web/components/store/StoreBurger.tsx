'use client';

import { useEffect, useState } from 'react';

/**
 * The phone menu toggle. It drives `.st-nav.is-open`, which `store.css` already
 * styles below 860px — so this component owns the state and not one line of
 * appearance, exactly as `store.js` did.
 *
 * The nav is a sibling rendered by a server component, so the class goes on
 * through the DOM rather than through props. That is the one place in this port
 * where reaching outside React is the smaller cost: lifting the whole header
 * into a client component to pass one boolean would ship the tenant's name,
 * navigation and WhatsApp link as client JavaScript for no gain.
 */
export function StoreBurger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.querySelector('.st-nav')?.classList.toggle('is-open', open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        document.querySelector<HTMLButtonElement>('[data-store-burger]')?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <button
      className="st-burger"
      type="button"
      aria-expanded={open}
      data-store-burger
      onClick={() => setOpen((v) => !v)}
    >
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="visually-hidden">Menu</span>
    </button>
  );
}
