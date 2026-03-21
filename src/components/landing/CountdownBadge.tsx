/**
 * CountdownBadge — Animated countdown to EAF exam date.
 * Dependencies: none (pure React + Tailwind)
 */
'use client';

import { useEffect, useState } from 'react';

const EAF_DATE = new Date('2026-06-08T08:00:00');
const calcDays = () => Math.max(0, Math.ceil((EAF_DATE.getTime() - Date.now()) / 86_400_000));

interface CountdownBadgeProps {
  className?: string;
}

export function CountdownBadge({ className }: CountdownBadgeProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(calcDays());
    const id = setInterval(() => setDays(calcDays()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (days === null) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 animate-pulse ${className ?? ''}`}
        aria-hidden="true"
      >
        <span className="inline-block h-4 w-32 rounded bg-red-100" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 ${className ?? ''}`}
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
      </svg>
      <span suppressHydrationWarning={true}>J-{days} avant l&apos;épreuve EAF 2026</span>
    </div>
  );
}
