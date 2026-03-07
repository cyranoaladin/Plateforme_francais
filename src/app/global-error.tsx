'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log for production monitoring (Sentry, server logs, etc.)
  console.error('[GlobalError]', error?.digest ?? error?.message);

  return (
    <html lang="fr">
      <body style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#C0392B' }}>Une erreur inattendue est survenue</h1>
        <p style={{ color: '#555' }}>Nos équipes ont été notifiées.</p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#1E3A5F',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
