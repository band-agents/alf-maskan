import { Tajawal, Inter, IBM_Plex_Sans_Arabic, IBM_Plex_Mono, Newsreader } from 'next/font/google';

/**
 * Declared once and shared by all three root layouts. next/font deduplicates
 * by declaration site, so importing this from three places still downloads and
 * subsets each face exactly once.
 */
export const tajawal = Tajawal({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700'], variable: '--f-display', display: 'swap' });
export const inter = Inter({ subsets: ['latin'], variable: '--f-ui', display: 'swap' });
export const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--f-arabic', display: 'swap' });
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono', display: 'swap' });

/**
 * The storefront's display serif, and the only face the dashboard never
 * downloads — `store.css` is a third visual world, not a variant of the app.
 * Loaded on the storefront layout alone, which is why it is not in `fontVars`.
 */
export const newsreader = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' });

export const fontVars = [tajawal.variable, inter.variable, plexArabic.variable, plexMono.variable].join(' ');

export const storeFontVars = [fontVars, newsreader.variable].join(' ');

/**
 * Applies the stored theme before first paint, so dark mode never flashes
 * white. Only the dashboard uses it — a storefront is a fixed light world and
 * must not follow the viewer's OS preference.
 */
export const THEME_SCRIPT =
  `try{var t=localStorage.getItem('am-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.dataset.theme='dark';}catch(e){}`;
