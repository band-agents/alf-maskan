import type { LeadSource } from '@prisma/client';
import type { Segment } from '@/lib/queries/leads';

/**
 * The little source and segment glyphs, lifted from the static build.
 *
 * `.src--wa` / `--form` / `--call` / `--fb` already carry their colours in
 * `crm.css`; these only supply the shape. Colour is never the only signal —
 * every one of them sits next to a visually-hidden label naming the source.
 */

export const SEGMENT_LABEL: Record<Segment, string> = {
  all: 'All leads',
  unread: 'Unanswered',
  mine: 'Assigned to me',
  unassigned: 'Unassigned',
  wa: 'WhatsApp',
  form: 'Website form',
  call: 'Phone call',
  fb: 'Facebook',
};

const WA = (
  <path d="M8 0a8 8 0 0 0-6.8 12.2L0 16l3.9-1.1A8 8 0 1 0 8 0Zm0 14.6a6.6 6.6 0 0 1-3.4-.9l-.24-.15-2.5.7.7-2.4-.16-.25A6.6 6.6 0 1 1 8 14.6Z" />
);

function Wrapped({ kind, children, size = 10, box = 16 }: { kind: string; children: React.ReactNode; size?: number; box?: number }) {
  return (
    <span className={`src src--${kind}`} aria-hidden="true">
      <svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} fill="currentColor">{children}</svg>
    </span>
  );
}

function FormGlyph() {
  return (
    <span className="src src--form" aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
        <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3.5 4.5h5M3.5 7.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Either a lead's source, or the icon beside a segment in the rail. */
export function SourceMark({ source, seg }: { source?: LeadSource; seg?: Segment }) {
  const kind = source ?? seg;

  switch (kind) {
    case 'WHATSAPP':
    case 'wa':
      return <Wrapped kind="wa">{WA}</Wrapped>;
    case 'FORM':
    case 'form':
      return <FormGlyph />;
    case 'CALL':
    case 'call':
      return (
        <Wrapped kind="call" size={9} box={12}>
          <path d="M3 1 1 3c0 4 4 8 8 8l2-2-2.5-1.5L7 9C5.5 8 4 6.5 3 5l1.5-1.5z" />
        </Wrapped>
      );
    case 'FACEBOOK':
    case 'INSTAGRAM':
    case 'fb':
      return (
        <Wrapped kind="fb" size={9} box={12}>
          <path d="M7 4V3c0-.5.2-.8.8-.8H9V.2H7.4C5.6.2 5 1.3 5 2.8V4H3.5v2H5v6h2V6h1.6L9 4H7z" />
        </Wrapped>
      );

    // Segment icons that are not sources.
    case 'all':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M1 3.5h13v9H1z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 3.5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'unread':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7.5" cy="7.5" r="2" fill="currentColor" />
        </svg>
      );
    case 'mine':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="5" r="2.75" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 13a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'unassigned':
      return (
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2.5 2.5" />
        </svg>
      );
    default:
      return null;
  }
}
