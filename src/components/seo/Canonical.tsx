'use client';

import { usePathname } from 'next/navigation';

/**
 * Component to inject a canonical link into the head.
 * Useful for SEO to avoid duplicate content issues.
 */
export function Canonical({ baseUrl }: { baseUrl: string }) {
  const pathname = usePathname();
  const url = `${baseUrl}${pathname === '/' ? '' : pathname}`;

  return (
    <link rel="canonical" href={url} />
  );
}
