'use client';

import { useState } from 'react';
import { CameraIcon } from './icons';

/**
 * Photos, floor plan, 360° tour and map, from `store-unit.js`.
 *
 * Every pane is in the DOM and only `hidden` toggles, which is what let the
 * static build work with JavaScript off — the same reason it stays that way
 * here rather than becoming four conditional renders.
 */

type Photo = { label: string; thumb: string };

export function Gallery({
  gallery,
  photoCount,
  areaSqm,
  bedrooms,
  where,
  badges,
}: {
  gallery: Photo[];
  /** The unit's real photo count, which may exceed what the strip shows. */
  photoCount: number;
  areaSqm: number;
  bedrooms: number | null;
  where: string;
  badges: React.ReactNode;
}) {
  const [tab, setTab] = useState<'photos' | 'plan' | 'tour' | 'map'>('photos');
  const [shot, setShot] = useState(0);

  const TABS = [
    { key: 'photos', label: `Photos (${photoCount})` },
    { key: 'plan', label: 'Floor plan' },
    { key: 'tour', label: '360° tour' },
    { key: 'map', label: 'Map' },
  ] as const;

  const beds = bedrooms ? `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}` : 'studio';

  return (
    <section className="gallery" aria-label="Photos and plans">
      <div className="gallery__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            className="gallery__tab"
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="gallery__pane" hidden={tab !== 'photos'}>
        <div className="gallery__stage">
          <div className="ph">{gallery[shot]?.label} · 16:10</div>
          <div className="gallery__flags">{badges}</div>
          <button className="gallery__count" type="button">
            <CameraIcon />
            View all {photoCount} photos
          </button>
        </div>
        <div className="gallery__strip" style={{ marginTop: 10 }}>
          {gallery.map((p, i) => (
            <button
              key={p.label}
              className="gallery__thumb"
              type="button"
              aria-current={i === shot}
              onClick={() => setShot(i)}
            >
              <span className="ph">{p.thumb} · 4:3</span>
              <span className="visually-hidden">Show {p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gallery__pane" hidden={tab !== 'plan'}>
        <div className="gallery__stage">
          <div className="ph ph--fine" style={{ aspectRatio: '16/10' }}>
            floor plan · {areaSqm} m² · {beds} · 16:10
          </div>
        </div>
      </div>

      <div className="gallery__pane" hidden={tab !== 'tour'}>
        <div className="gallery__stage">
          <div className="ph" style={{ aspectRatio: '16/10' }}>360° virtual tour embed · 16:10</div>
        </div>
      </div>

      <div className="gallery__pane" hidden={tab !== 'map'}>
        <div className="gallery__stage">
          <div className="ph ph--dark" style={{ aspectRatio: '16/10' }}>
            map · {where} · approximate pin
          </div>
        </div>
      </div>
    </section>
  );
}
