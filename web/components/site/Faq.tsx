'use client';

import { useRef } from 'react';

/**
 * The questions brokers actually ask, one open at a time.
 *
 * <details> already opens on its own, so this only enforces the one-at-a-time
 * behaviour — with scripting off every answer is still reachable, which is the
 * rule the static build set for this whole surface.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const root = useRef<HTMLDivElement>(null);

  function closeOthers(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const opened = e.currentTarget;
    if (!opened.open || !root.current) return;
    for (const other of root.current.querySelectorAll('details')) {
      if (other !== opened) other.open = false;
    }
  }

  return (
    <div className="faq" ref={root}>
      {items.map((item, i) => (
        <details key={item.q} open={i === 0} onToggle={closeOthers}>
          <summary>
            {item.q}
            <span className="faq__sign" aria-hidden="true" />
          </summary>
          <p className="faq__answer body-sm">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
