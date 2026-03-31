'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';

interface EmailVerificationBannerProps {
  emailVerified: boolean;
}

export function EmailVerificationBanner({ emailVerified }: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (emailVerified) return null;

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<{ ok: boolean }>('/api/v1/auth/resend-verification', {
        method: 'POST',
        json: {},
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Erreur lors de l\u2019envoi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-reward)] bg-[var(--bg-warning)] px-4 py-3">
      <Mail size={20} className="shrink-0 text-[var(--c-reward)]" />

      <span className="flex-1 text-sm text-[var(--text-reward-on-subtle)]">
        Confirme ton adresse email pour sécuriser ton compte.
      </span>

      {sent ? (
        <span className="text-sm font-semibold text-[var(--c-success-text)]" role="status" aria-live="polite">
          Lien envoyé !
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[var(--c-reward)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-reward)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-warning)] disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? 'Envoi\u2026' : 'Renvoyer le lien'}
        </button>
      )}

      {error && (
        <span className="w-full text-sm text-[var(--c-accent-text)]" role="alert" aria-live="assertive">{error}</span>
      )}
    </div>
  );
}
