'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function MobilePcBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      if (scrollPercent > 0.6) setVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Masqué sur PC (≥1024px) - géré par CSS media query
  // Masqué si l'utilisateur a cliqué "×"
  if (dismissed || !visible) return null;

  return (
    <div
      className="mobile-pc-banner"
      style={{
        position: 'fixed',
        bottom: '70px', // au-dessus du bouton WhatsApp
        left: '16px',
        right: '16px',
        background: 'var(--eaf-bg1)',
        border: '1px solid var(--eaf-indigo-border)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 150,
      }}
    >
      {/* Icône */}
      <div style={{ fontSize: '24px', flexShrink: 0 }}>🖥️</div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--eaf-text-primary)',
            marginBottom: '2px',
          }}
        >
          Les ateliers s&apos;utilisent sur PC
        </div>
        <div style={{ fontSize: '12px', color: 'var(--eaf-text-secondary)' }}>
          Inscris-toi maintenant, travaille sur ordinateur.
        </div>
      </div>

      {/* CTA + Dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <Link
          href="/login?mode=register"
          style={{
            background: 'var(--eaf-orange)',
            color: '#fff',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          S&apos;inscrire
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--eaf-text-tertiary)',
            fontSize: '18px',
            lineHeight: 1,
            padding: '4px',
            minWidth: '32px',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
