'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TrackingProvider } from '@/components/tracking/tracking-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldTrackLearningActivity =
    pathname !== '/login' &&
    pathname !== '/bienvenue' &&
    pathname !== '/pricing' &&
    !pathname.startsWith('/paiement/');
  const isStandalonePage =
    pathname === '/login' ||
    pathname === '/bienvenue' ||
    pathname === '/pricing' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/paiement/');

  if (isStandalonePage) {
    return (
      <>
        <ThemeProvider>
          {shouldTrackLearningActivity && <TrackingProvider />}
          <main className="flex-1 relative min-h-screen">{children}</main>
        </ThemeProvider>
      </>
    );
  }

  return (
    <>
      <ThemeProvider>
        <TrackingProvider />
        <Sidebar />
        <main className="flex-1 md:ml-72 relative min-h-screen pb-20 md:pb-0">{children}</main>
      </ThemeProvider>
    </>
  );
}
