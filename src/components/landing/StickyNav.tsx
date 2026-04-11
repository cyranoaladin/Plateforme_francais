'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function StickyNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Reset menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  return (
    <>
      <nav
        className="sticky top-0 z-[100] flex items-center justify-between px-4 md:px-8"
        style={{
          height: '56px',
          background: 'rgba(5, 9, 19, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--eaf-border)',
        }}
      >
        {/* Logo + Nom */}
        <Link href="/" className="flex items-center gap-2.5">
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
              style={{ fontSize: '14px', fontFamily: 'var(--eaf-font-display)' }}
            >
              Nexus Réussite
            </span>
            <span
              className="hidden sm:block"
              style={{
                fontSize: '10px',
                color: 'var(--eaf-text-tertiary)',
                letterSpacing: '0.06em',
              }}
            >
              PRÉPARATION EAF
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
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

        {/* Mobile CTA + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/login"
            className="font-semibold text-white"
            style={{
              fontSize: '13px',
              background: 'var(--eaf-orange)',
              padding: '7px 14px',
              borderRadius: '8px',
            }}
          >
            Gratuit →
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: '1px solid var(--eaf-border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <span style={{ fontSize: '18px', color: 'var(--eaf-text-primary)' }}>
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 9, 19, 0.97)',
            backdropFilter: 'blur(16px)',
            zIndex: 99,
            overflowY: 'auto',
            animation: 'slideDown 0.2s ease',
          }}
        >
          <div
            style={{
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Liens principaux */}
            <Link
              href="#ateliers"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                color: 'var(--eaf-text-primary)',
                textDecoration: 'none',
              }}
            >
              Ateliers
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                color: 'var(--eaf-text-primary)',
                textDecoration: 'none',
              }}
            >
              Tarifs
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 500,
                color: 'var(--eaf-text-primary)',
                textDecoration: 'none',
              }}
            >
              Connexion
            </Link>

            <div
              style={{
                height: '1px',
                background: 'var(--eaf-border)',
                margin: '8px 0',
              }}
            />

            {/* CTA Principal */}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                background: 'var(--eaf-orange)',
                color: '#fff',
                padding: '15px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                marginTop: '8px',
              }}
            >
              Commencer gratuitement — sans carte bancaire →
            </Link>

            {/* Note PC */}
            <div
              style={{
                background: 'var(--eaf-bg2)',
                border: '1px solid var(--eaf-border)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--eaf-text-secondary)',
                marginTop: '12px',
                lineHeight: 1.5,
              }}
            >
              🖥️ Pour utiliser les ateliers, ouvre cette page sur ton ordinateur.
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
