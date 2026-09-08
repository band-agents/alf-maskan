'use client';

import { useRef, useState } from 'react';
import type { MediaItem } from '@/lib/queries/unit-detail';
import { Placeholder } from '@/components/ui/atoms';

/**
 * The photo manager.
 *
 * Order is meaning here: the first image is the cover, and the cover is what a
 * buyer sees in search, on the homepage and — the one that actually decides
 * things — in a WhatsApp share. So reordering is the primary interaction and
 * "make cover" is just "move to front", said in the words an agent thinks in.
 *
 * There is no upload yet: no object storage is wired up. Adding a photo adds a
 * labelled placeholder and says so, rather than showing a spinner that resolves
 * into nothing.
 */
export function Gallery({
  media,
  onChange,
}: {
  media: MediaItem[];
  onChange: (next: MediaItem[]) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const nextId = useRef(0);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = media.findIndex((m) => m.id === fromId);
    const to = media.findIndex((m) => m.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function add(kind: 'photo' | 'plan') {
    nextId.current += 1;
    onChange([
      ...media,
      { id: `new-${nextId.current}`, label: kind === 'plan' ? 'floor plan' : 'new photo', kind },
    ]);
  }

  const photos = media.filter((m) => m.kind === 'photo').length;
  const plans = media.filter((m) => m.kind === 'plan').length;

  return (
    <>
      <div className="gal">
        {media.map((m, i) => (
          <div
            className="gal__item"
            key={m.id}
            draggable
            onDragStart={() => setDragging(m.id)}
            onDragOver={(e) => { e.preventDefault(); setOver(m.id); }}
            onDragLeave={() => setOver((o) => (o === m.id ? null : o))}
            onDrop={(e) => { e.preventDefault(); if (dragging) move(dragging, m.id); setDragging(null); setOver(null); }}
            onDragEnd={() => { setDragging(null); setOver(null); }}
            style={{
              outline: over === m.id && dragging !== m.id ? '2px solid var(--accent)' : undefined,
              opacity: dragging === m.id ? 0.4 : 1,
            }}
          >
            {i === 0 && <span className="gal__cover">Cover</span>}

            <button
              className="gal__del"
              type="button"
              onClick={() => onChange(media.filter((x) => x.id !== m.id))}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="visually-hidden">Remove {m.label}</span>
            </button>

            <Placeholder className={m.kind === 'plan' ? 'ph ph--fine' : undefined} label={`${m.label} · 4:3`} />

            <div className="gal__bar">
              <span className="gal__grab" aria-hidden="true">
                <svg width="9" height="11" viewBox="0 0 9 11">
                  {[2, 5.5, 9].map((y) => (
                    <g key={y}>
                      <circle cx="2" cy={y} r="1" fill="currentColor" />
                      <circle cx="7" cy={y} r="1" fill="currentColor" />
                    </g>
                  ))}
                </svg>
              </span>
              <span style={{ textTransform: 'capitalize' }}>{m.label}</span>
              {i !== 0 && (
                // The same action as dragging it to the front, for anyone not
                // dragging — a touch screen, a keyboard, or a hurry.
                <button
                  type="button"
                  onClick={() => move(m.id, media[0].id)}
                  style={{
                    marginInlineStart: 'auto', background: 'none', border: 0, cursor: 'pointer',
                    color: 'var(--accent-ink, var(--accent))', fontSize: 'var(--t-pico)', fontWeight: 600,
                  }}
                >
                  Make cover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className="dropzone"
        tabIndex={0}
        role="button"
        onClick={() => add('photo')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add('photo'); }
        }}
      >
        <b>Drag photos here, or browse</b>
        <span>JPG or PNG, at least 1600px wide. The first one becomes the cover.</span>
      </div>

      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn--app" type="button" onClick={() => add('photo')}>Add a photo</button>
        <button className="btn btn--app" type="button" onClick={() => add('plan')}>Add a floor plan</button>
        <span className="f__hint" style={{ marginInlineStart: 'auto' }}>
          {photos} photo{photos === 1 ? '' : 's'} · {plans} floor plan{plans === 1 ? '' : 's'}
        </span>
      </div>

      <p className="f__hint">
        {/* Honest about the gap rather than faking an upload. */}
        There is no image storage in this build yet, so &ldquo;add&rdquo; puts a labelled
        placeholder in the order. Reordering, the cover and the counts are all real.
      </p>
    </>
  );
}
