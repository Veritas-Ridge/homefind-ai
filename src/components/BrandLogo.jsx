import React from 'react';
import { LOGO } from '@/lib/brand';

/**
 * Header / footer logo slot. Renders the horizontal lockup when one is
 * configured in src/lib/brand.js, otherwise the text wordmark used on
 * crandellrealestate.com. Both fill the same fixed-height box, and both keep
 * "Balboa Realty" visible above the fold (ARMLS IDX rule 23.3.7).
 */
export default function BrandLogo({ tone = 'dark' }) {
  const src = tone === 'light' ? (LOGO.horizontalLight || LOGO.horizontal) : LOGO.horizontal;
  if (src) {
    return (
      <span className="flex h-8 md:h-10 items-center">
        <img src={src} alt={LOGO.alt} className="h-full w-auto max-w-[260px] object-contain" decoding="async" />
      </span>
    );
  }
  return (
    <span className="flex h-8 md:h-10 flex-col justify-center leading-none">
      <span
        className={`font-display font-semibold text-[17px] min-[400px]:text-[19px] md:text-[21px] ${tone === 'light' ? 'text-white' : 'text-foreground'}`}
      >
        Crandell Real Estate Team
      </span>
      <span
        className={`mt-1 text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.14em] ${tone === 'light' ? 'text-[var(--crandell-footer-text)]' : 'text-primary'}`}
      >
        With Balboa Realty
      </span>
    </span>
  );
}
