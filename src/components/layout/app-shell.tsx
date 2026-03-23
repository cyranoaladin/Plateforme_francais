'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TrackingProvider } from '@/components/tracking/tracking-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { isStandaloneAppShellPath } from '@/lib/navigation/app-shell-paths';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = isStandaloneAppShellPath(pathname);
  const shouldTrackLearningActivity = !isStandalonePage;

  if (isStandalonePage) {
    return (
      <>
        <ThemeProvider>
          {shouldTrackLearningActivity && <TrackingProvider />}
          <main className="flex-1 relative min-h-screen w-full min-w-0">{children}</main>
        </ThemeProvider>
      </>
    );
  }

  return (
    <>
      <ThemeProvider>
        <TrackingProvider />
        <Sidebar />
        <main className="relative min-h-screen flex-1 pb-20 md:ml-72 md:mr-60 md:min-w-0 md:pb-0 lg:mr-64">{children}</main>
      </ThemeProvider>
    </>
  );
}
