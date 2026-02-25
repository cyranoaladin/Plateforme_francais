'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TrackingProvider } from '@/components/tracking/tracking-provider';

/**
 * Le tracking analytics n'est activé que si l'utilisateur a donné son consentement.
 * Consentement stocké dans le cookie 'eaf_analytics_consent'.
 */
function useAnalyticsConsent(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('eaf_analytics_consent=true'));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname === '/bienvenue';
  const hasConsent = useAnalyticsConsent();

  if (isLoginPage) {
    return <main className="flex-1 relative min-h-screen">{children}</main>;
  }

  return (
    <>
      {hasConsent && <TrackingProvider />}
      <Sidebar />
      <main className="flex-1 md:ml-72 relative min-h-screen pb-20 md:pb-0">{children}</main>
    </>
  );
}
