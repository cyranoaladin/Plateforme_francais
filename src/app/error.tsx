'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[Error]', error?.digest ?? error?.message);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-6xl font-bold text-[var(--c-primary)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Oups
      </p>
      <p className="mt-3 text-lg text-[var(--c-primary)]/70">
        Une erreur inattendue est survenue.
      </p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Nos équipes ont été notifiées.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--c-success)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--c-success)]/90"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-bold text-[var(--c-primary)] transition-colors hover:bg-[var(--bg-surface-secondary)]"
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
