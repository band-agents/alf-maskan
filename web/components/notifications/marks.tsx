/** The icon beside a notification. Its tint comes from the class, so a lead and
 *  a warning are distinguishable without reading the text. */
export function NotifMark({ kind }: { kind: 'lead' | 'deal' | 'warn' | null }) {
  const cls = `notif__mark${kind ? ` notif__mark--${kind}` : ''}`;

  if (kind === 'lead') {
    return (
      <span className={cls} aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M1.5 3.5h13v9h-13z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 3.5L8 8.5l6.5-5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </span>
    );
  }
  if (kind === 'deal') {
    return (
      <span className={cls} aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 8.5l4 4 8-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === 'warn') {
    return (
      <span className={cls} aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5l6.5 12h-13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r=".8" fill="currentColor" />
        </svg>
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11" r=".8" fill="currentColor" />
      </svg>
    </span>
  );
}
