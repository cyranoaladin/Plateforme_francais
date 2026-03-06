'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { sendWebVital } from '@/lib/monitoring/web-vitals';

/**
 * Only reports Web Vitals if the user has accepted analytics consent.
 * Matches the consent cookie set by ConsentBanner.
 */
export function WebVitalsReporter() {
  const subscribe = useCallback((cb: () => void) => {
    document.addEventListener('visibilitychange', cb);
    return () => document.removeEventListener('visibilitychange', cb);
  }, []);
  const hasConsent = useSyncExternalStore(
    subscribe,
    () => document.cookie.includes('eaf_analytics_consent=true'),
    () => false,
  );

  useReportWebVitals((metric) => {
    if (hasConsent) {
      sendWebVital(metric);
    }
  });

  return null;
}
