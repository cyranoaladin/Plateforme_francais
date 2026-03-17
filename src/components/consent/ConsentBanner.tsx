'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';

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
      aria-label="Consentement aux cookies analytiques"
      className="fixed bottom-0 inset-x-0 z-[60] bg-[var(--card)] border-t border-[var(--border-strong)] p-4 shadow-lg flex flex-col sm:flex-row items-center gap-3"
    >
      <p className="text-sm text-[var(--text-body)] flex-1">
        Nexus Réussite utilise des données analytiques anonymes pour améliorer votre expérience.
        Conformément au RGPD, votre consentement est requis.
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={refuse}
          className="px-4 py-2 text-sm font-semibold border border-[var(--border-strong)] rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--surface-warm)]"
        >
          Refuser
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 text-sm font-semibold bg-[var(--navy)] text-[var(--surface-parchment)] rounded-full transition-colors hover:bg-[var(--navy-dark)]"
        >
          Accepter
        </button>
      </div>
    </div>
  );
}
