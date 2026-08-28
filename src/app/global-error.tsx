'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[GlobalError]', error?.digest ?? error?.message);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#F7F8FA',
          padding: '2rem',
          textAlign: 'center',
          margin: 0,
          color: '#1F2937',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            padding: '48px 40px',
            width: '100%',
            maxWidth: '520px',
          }}
        >
          <div style={{ fontSize: '44px', lineHeight: 1, marginBottom: '16px' }}>⚠️</div>
          <h1
            style={{
              margin: '0 0 12px 0',
              color: '#1E3A5F',
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            Une erreur est survenue
          </h1>
          <p
            style={{
              margin: '0 0 16px 0',
              color: '#4B5563',
              lineHeight: 1.7,
              fontSize: '15px',
            }}
          >
            Une erreur inattendue s&apos;est produite hors du flux normal de l&apos;application. La page
            n&apos;a pas pu être reconstruite automatiquement, mais le problème a été journalisé pour
            diagnostic.
          </p>
          <p
            style={{
              margin: '0 0 28px 0',
              color: '#4B5563',
              lineHeight: 1.7,
              fontSize: '15px',
            }}
          >
            Si le problème persiste, contacte l&apos;équipe Nexus Réussite à{' '}
            <a
              href="mailto:contact@nexusreussite.academy"
              style={{ color: '#2E86C1', textDecoration: 'none', fontWeight: 600 }}
            >
              contact@nexusreussite.academy
            </a>
            {' '}en précisant l&apos;heure et l&apos;action effectuée.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '12px 28px',
                background: '#1E3A5F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
            <Link
              href="/"
              style={{
                color: '#2E86C1',
                fontSize: '14px',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              {"Retour à l'accueil"}
            </Link>
          </div>
        </div>
        <p
          style={{
            marginTop: '24px',
            color: '#9CA3AF',
            fontSize: '12px',
            letterSpacing: '0.02em',
          }}
        >
          Nexus Réussite — Préparation EAF
        </p>
      </body>
    </html>
  );
}
