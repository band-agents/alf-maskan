import type { Metadata } from 'next';
import { fontVars } from '@/lib/fonts';

import '../styles/tokens.css';
import '../styles/fonts.css';
import '../styles/alf-maskan.css';

export const metadata: Metadata = {
  title: 'Alf Maskan — your own real-estate website, live in 10 minutes',
  description:
    'List your units, drag your storefront into shape, and send buyers a site that looks like it cost a fortune. EGP 990 a month, Arabic and English.',
};

/** Root layout for the marketing site. No theme script: this surface is light. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
