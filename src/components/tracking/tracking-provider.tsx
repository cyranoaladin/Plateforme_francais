'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

async function trackEvent(body: {
  type: 'navigation' | 'interaction' | 'discussion' | 'resource' | 'evaluation' | 'quiz' | 'auth';
  feature: string;
  path?: string;
  payload?: Record<string, string | number | boolean | string[]>;
}) {
  try {
    const csrf = getCsrfTokenFromDocument();
    await fetch('/api/v1/memory/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Ignore telemetry failures on client.
  }
}

export function useTrackInteraction() {
  return (feature: string, payload?: Record<string, string | number | boolean | string[]>) =>
    trackEvent({ type: 'interaction', feature, payload });
}

export function TrackingProvider() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === '/login' || pathname === lastPathRef.current) {
      return;
    }

    lastPathRef.current = pathname;
    void trackEvent({
      type: 'navigation',
      feature: 'page_view',
      path: pathname,
    });
  }, [pathname]);

  return null;
}
