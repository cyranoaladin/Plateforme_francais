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
    <div
      style={{
        background: 'var(--bg-warning, #FFF7ED)',
        border: '1px solid var(--color-amber-300, #FCD34D)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
      }}
    >
      <Mail size={20} style={{ color: 'var(--color-amber-600, #D97706)', flexShrink: 0 }} />

      <span style={{ color: 'var(--color-amber-800, #92400E)', fontSize: '14px', flex: 1 }}>
        Confirme ton adresse email pour sécuriser ton compte.
      </span>

      {sent ? (
        <span
          style={{
            color: 'var(--c-success-text, #047857)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Lien envoyé !
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          style={{
            background: 'var(--color-amber-500, #F59E0B)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Envoi\u2026' : 'Renvoyer le lien'}
        </button>
      )}

      {error && (
        <span style={{ color: '#DC2626', fontSize: '13px', width: '100%' }}>{error}</span>
      )}
    </div>
  );
}
