'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { usesStudentAppShell } from '@/lib/navigation/app-shell-paths';
import { useDialogAccessibility } from '@/components/ui/use-dialog-accessibility';

const CONSENT_COPY = {
  ariaLabel: 'Consentement aux cookies analytiques',
  body: 'Nexus Réussite utilise des données analytiques anonymes pour améliorer votre expérience. Conformément au RGPD, votre consentement est requis.',
  refuse: 'Refuser',
  accept: 'Accepter',
} as const;

function useHasConsent(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    document.addEventListener('visibilitychange', onStoreChange);
    return () => document.removeEventListener('visibilitychange', onStoreChange);
  }, []);
  const getSnapshot = () => document.cookie.includes('eaf_analytics_consent=');
  const getServerSnapshot = () => true;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ConsentBanner() {
  const hasConsent = useHasConsent();
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const isStudentShellPage = usesStudentAppShell(pathname);
  const bannerRef = useRef<HTMLDivElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const isOpen = !hasConsent && !dismissed;

  const accept = useCallback(() => {
    document.cookie = 'eaf_analytics_consent=true; max-age=31536000; path=/; SameSite=Lax';
    setDismissed(true);
  }, []);

  const refuse = useCallback(() => {
    document.cookie = 'eaf_analytics_consent=false; max-age=31536000; path=/; SameSite=Lax';
    setDismissed(true);
  }, []);

  useDialogAccessibility({
    open: isOpen,
    dialogRef: bannerRef,
    initialFocusRef: acceptRef,
    onClose: refuse,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-label={CONSENT_COPY.ariaLabel}
      tabIndex={-1}
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
          className="min-h-[44px] px-4 py-2 text-sm font-semibold border border-[var(--border-strong)] rounded-full text-[var(--text-body)] transition-colors hover:bg-[var(--bg-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        >
          {CONSENT_COPY.refuse}
        </button>
        <button
          ref={acceptRef}
          onClick={accept}
          className="min-h-[44px] px-4 py-2 text-sm font-semibold bg-[var(--c-primary)] text-[var(--text-on-primary)] rounded-full transition-colors hover:bg-[var(--c-primary-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        >
          {CONSENT_COPY.accept}
        </button>
      </div>
    </div>
  );
}
