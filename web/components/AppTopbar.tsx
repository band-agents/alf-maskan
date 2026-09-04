'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * The dashboard top bar. The theme toggle is the only piece with real state:
 * it writes to localStorage and stamps data-theme on <html>, which is the same
 * pair the pre-paint script in the root layout reads back on the next load.
 */
export function AppTopbar({ storefrontUrl }: { storefrontUrl: string }) {
  const [dark, setDark] = useState(false);

  // Read the theme the pre-paint script already applied, rather than deciding
  // again here — deciding twice is how a flash gets reintroduced.
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = 'dark';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('am-theme', next ? 'dark' : 'light');
    } catch {
      // Private mode, or site data blocked. The toggle still works for this
      // page; it just will not be remembered.
    }
  }

  // ⌘K / Ctrl+K focuses search, as the static build does.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-omnibox]')?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="topbar">
      <button className="icon-btn rail-open" type="button" aria-controls="rail" aria-expanded="false">
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
          <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="visually-hidden">Open sidebar</span>
      </button>

      <label className="omnibox">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="visually-hidden">Search</span>
        <input type="search" placeholder="Search units, leads, agents…" data-omnibox />
        <span className="kbd" aria-hidden="true">
          <span>⌘</span>
          <span>K</span>
        </span>
      </label>

      <div className="topbar__end">
        <div className="lang">
          <a href="#" lang="en" hrefLang="en" aria-current="true">EN</a>
          <a href="#" lang="ar" hrefLang="ar">ع</a>
        </div>

        <button
          className="icon-btn"
          type="button"
          onClick={toggleTheme}
          aria-pressed={dark}
        >
          <span className="theme-swatch" aria-hidden="true" />
          <span className="visually-hidden">
            {dark ? 'Switch to light mode' : 'Switch to dark mode'}
          </span>
        </button>

        <Link className="icon-btn" href="/dash/notifications">
          <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true">
            <path d="M2 6a5 5 0 0110 0v4l1.25 2H.75L2 10V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="icon-btn__dot" aria-hidden="true" />
          <span className="visually-hidden">Notifications</span>
        </Link>

        <a className="topbar__link" href={storefrontUrl}>
          View storefront <span aria-hidden="true">↗</span>
        </a>

        <button className="account" type="button">
          <span className="avatar" aria-hidden="true" />
          <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
          </svg>
          <span className="visually-hidden">Your account</span>
        </button>
      </div>
    </header>
  );
}
