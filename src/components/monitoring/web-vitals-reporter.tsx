'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sendWebVital } from '@/lib/monitoring/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    sendWebVital(metric);
  });

  return null;
}
