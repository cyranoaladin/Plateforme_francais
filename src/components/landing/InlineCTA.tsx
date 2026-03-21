import React from 'react';
import Link from 'next/link';

interface InlineCTAProps {
  headline: string;
  cta: string;
  href: string;
  className?: string;
}

export function InlineCTA({ headline, cta, href, className }: InlineCTAProps) {
  return (
    <div className={'py-14 text-center ' + (className ?? '')}>
      <p className="text-lg font-semibold text-gray-900 sm:text-xl">{headline}</p>
      <Link
        href={href}
        aria-label={cta}
        className="mt-4 inline-block rounded-xl bg-sapphire-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-sapphire-700"
      >
        {cta}
      </Link>
    </div>
  );
}
