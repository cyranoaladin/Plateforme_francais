'use client';

import Link from 'next/link';

export function StickyNav() {
  return (
    <nav
      className="sticky top-0 z-[100] flex items-center justify-between px-8"
      style={{
        height: '60px',
        background: 'rgba(5, 9, 19, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--eaf-border)',
      }}
    >
      {/* Logo + Nom */}
      <Link href="/" className="flex items-center gap-3">
        <div
          className="flex items-center justify-center text-white font-bold text-xs"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--eaf-indigo), var(--eaf-indigo-hover))',
          }}
        >
          N
        </div>
        <div className="flex flex-col">
          <span
            className="font-semibold text-white"
            style={{ fontSize: '15px', fontFamily: 'var(--eaf-font-display)' }}
          >
            Nexus Réussite
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--eaf-text-tertiary)',
              letterSpacing: '0.06em',
            }}
          >
            PRÉPARATION EAF
          </span>
        </div>
      </Link>

      {/* Liens nav */}
      <div className="flex items-center gap-8">
        <Link
          href="#ateliers"
          className="transition-colors duration-200"
          style={{ fontSize: '14px', color: 'var(--eaf-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eaf-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eaf-text-secondary)')}
        >
          Ateliers
        </Link>
        <Link
          href="#pricing"
          className="transition-colors duration-200"
          style={{ fontSize: '14px', color: 'var(--eaf-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eaf-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eaf-text-secondary)')}
        >
          Tarifs
        </Link>
        <Link
          href="/login"
          className="transition-all duration-200"
          style={{
            fontSize: '14px',
            color: 'var(--eaf-text-secondary)',
            background: 'transparent',
            border: '1px solid var(--eaf-border)',
            padding: '7px 16px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
            e.currentTarget.style.color = 'var(--eaf-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--eaf-border)';
            e.currentTarget.style.color = 'var(--eaf-text-secondary)';
          }}
        >
          Connexion
        </Link>
        <Link
          href="/login"
          className="font-semibold text-white transition-all duration-200"
          style={{
            fontSize: '14px',
            background: 'var(--eaf-orange)',
            padding: '8px 20px',
            borderRadius: '9px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--eaf-orange-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 20px var(--eaf-orange-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--eaf-orange)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Commencer gratuitement →
        </Link>
      </div>
    </nav>
  );
}
