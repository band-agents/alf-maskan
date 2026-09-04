/**
 * The storefront's icons, drawn inline.
 *
 * There is no icon library in this project and no `<img>` anywhere — every mark
 * is a path, every photo is a labelled placeholder. These are lifted from the
 * static build unchanged so the two halves render the same glyphs.
 */

export function WhatsAppMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0a8 8 0 0 0-6.8 12.2L0 16l3.9-1.1A8 8 0 1 0 8 0Zm0 14.6a6.6 6.6 0 0 1-3.4-.9l-.24-.15-2.5.7.7-2.4-.16-.25A6.6 6.6 0 1 1 8 14.6Zm3.6-4.9c-.2-.1-1.16-.57-1.34-.64-.18-.06-.31-.1-.44.1s-.5.63-.62.76-.23.15-.43.05a5.4 5.4 0 0 1-1.6-.98 6 6 0 0 1-1.1-1.37c-.11-.2 0-.3.09-.4l.3-.35c.1-.12.13-.2.2-.34a.37.37 0 0 0 0-.35c0-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.33h-.37a.72.72 0 0 0-.52.24 2.18 2.18 0 0 0-.68 1.62 3.8 3.8 0 0 0 .8 2 8.65 8.65 0 0 0 3.3 2.9c.46.2.82.32 1.1.4a2.65 2.65 0 0 0 1.22.08 2 2 0 0 0 1.3-.92 1.6 1.6 0 0 0 .12-.92c-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg width="5" height="8" viewBox="0 0 6 10" fill="none" aria-hidden="true">
      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Tick() {
  return (
    <svg width="12" height="9" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M1 5l3.6 3.6L12 1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartOutline() {
  return (
    <svg width="15" height="14" viewBox="0 0 16 15" fill="none" aria-hidden="true">
      <path d="M8 13.5S1 9.5 1 5.2A3.7 3.7 0 018 3.1a3.7 3.7 0 017 2.1c0 4.3-7 8.3-7 8.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/* ── the six key-spec glyphs, in the order the unit page lists them ────────── */

export function AreaIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 6h16M6 1v16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BedIcon() {
  return (
    <svg width="19" height="15" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <path d="M1 11V3a2 2 0 012-2h14a2 2 0 012 2v8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 11h18v4M1 15v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.5 7.5h4M11.5 7.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BathIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 9h16v3a4 4 0 01-4 4H5a4 4 0 01-4-4V9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 9V3.5A2.5 2.5 0 016.5 1h0A2.5 2.5 0 019 3.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function FloorIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 16V6l7-4.5L16 6v10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 16h14M7 16v-5h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function FinishIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.5l2.2 4.6 5 .7-3.6 3.6.85 5-4.45-2.4-4.45 2.4.85-5L1.8 6.8l5-.7L9 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function DeliveryIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 7h16M5.5 1v3M12.5 1v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function PlanIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ color: 'var(--palm-600)' }}>
      <rect x="1" y="2.5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 6.5h16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg width="13" height="12" viewBox="0 0 14 13" fill="none" aria-hidden="true">
      <rect x=".75" y="2.75" width="12.5" height="9.5" rx="1.75" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 2.75L5 .75h4l1 2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
