'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usesStudentAppShell } from '@/lib/navigation/app-shell-paths';

const CONSENT_COPY = {
  ariaLabel: 'Consentement aux cookies analytiques',
  body: 'Nexus Réussite utilise des données analytiques anonymes pour améliorer votre expérience. Conformément au RGPD, votre consentement est requis.',
  refuse: 'Refuser',
  accept: 'Accepter',
} as const;

function useHasConsent(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    // Re-check on visibilitychange (covers tab switch)
    document.addEventListener('visibilitychange', onStoreChange);
    return () => document.removeEventListener('visibilitychange', onStoreChange);
  }, []);
  const getSnapshot = () => document.cookie.includes('eaf_analytics_consent=');
  const getServerSnapshot = () => true; // SSR: assume consent exists → banner hidden
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ConsentBanner() {
  const hasConsent = useHasConsent();
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const isStudentShellPage = usesStudentAppShell(pathname);

  if (hasConsent || dismissed) return null;

  const accept = () => {
    document.cookie = 'eaf_analytics_consent=true; max-age=31536000; path=/; SameSite=Lax';
    setDismissed(true);
  };

  const refuse = () => {
    document.cookie = 'eaf_analytics_consent=false; max-age=31536000; path=/; SameSite=Lax';
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-label={CONSENT_COPY.ariaLabel}
      className={`fixed inset-x-0 z-[60] flex flex-col items-center gap-3 bg-[var(--bg-surface)] p-4 shadow-lg sm:flex-row ${
        isStudentShellPage
          ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-3 rounded-[var(--radius-xl)] border border-[var(--border-strong)] shadow-[var(--shadow-lg)] md:bottom-0 md:mx-0 md:rounded-none md:border-x-0 md:border-b-0 md:border-t'
          : 'bottom-0 border-t border-[var(--border-strong)]'
      }`}
    >
      <p className="text-sm text-[var(--text-body)] flex-1">{CONSENT_COPY.body}</p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={refuse}
          className="px-4 py-2 text-sm font-semibold border border-[var(--border-strong)] rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--bg-surface-secondary)]"
        >
          {CONSENT_COPY.refuse}
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 text-sm font-semibold bg-[var(--c-primary)] text-[var(--bg-page)] rounded-full transition-colors hover:bg-[var(--c-primary-active)]"
        >
          {CONSENT_COPY.accept}
        </button>
      </div>
    </div>
  );
}
