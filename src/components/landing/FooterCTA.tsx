'use client';

import Link from 'next/link';

export function FooterCTA() {
  const trustItems = [
    'Freemium sans limite',
    'Sources BO 2026',
    'Anti-copie par design',
    'Tableau de bord parent',
  ];

  return (
    <section
      className="relative text-center overflow-hidden"
      style={{
        padding: '72px 20px 60px',
        background: 'linear-gradient(180deg, var(--eaf-bg0) 0%, #0a0e1a 50%, var(--eaf-bg0) 100%)',
        borderTop: '1px solid var(--eaf-border)',
        borderBottom: '1px solid var(--eaf-border)',
      }}
    >
      {/* Orbe centrale - masqué sur mobile */}
      <div
        className="absolute pointer-events-none hidden lg:block"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Contenu */}
      <div className="relative">
        {/* Countdown badge */}
        <div
          className="inline-flex items-center gap-2 font-medium"
          style={{
            background: 'var(--eaf-gradient-orange)',
            border: '1px solid var(--eaf-orange-border)',
            borderRadius: 'var(--eaf-radius-pill)',
            padding: '6px 16px',
            fontSize: '13px',
            marginBottom: '24px',
          }}
        >
          <span
            className="animate-eaf-pulse"
            style={{
              width: '7px',
              height: '7px',
              background: 'var(--eaf-orange)',
              borderRadius: '50%',
            }}
          />
          J-59 avant l&apos;épreuve EAF 2026
        </div>

        {/* H2 */}
        <h2
          className="hero-title-mobile"
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '36px',
            fontWeight: 700,
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            marginBottom: '16px',
            color: 'var(--eaf-text-primary)',
          }}
        >
          Le meilleur moment
          <br />
          pour commencer,{' '}
          <span style={{ color: 'var(--eaf-orange)', fontStyle: 'italic' }}>
            c&apos;est maintenant.
          </span>
        </h2>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: '15px',
            color: 'var(--eaf-text-secondary)',
            marginBottom: '32px',
            maxWidth: '320px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Le Freemium est gratuit, sans carte bancaire. Commence depuis ton téléphone et travaille sur PC.
        </p>

        {/* Grand CTA - pleine largeur mobile */}
        <Link
          href="/login"
          className="inline-block font-bold text-white transition-all duration-200"
          style={{
            width: '100%',
            maxWidth: '360px',
            background: 'var(--eaf-orange)',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '16px',
            border: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--eaf-orange-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,107,53,0.40)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--eaf-orange)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Commencer gratuitement →
        </Link>

        {/* Trust badges - 2 colonnes sur mobile */}
        <div
          className="grid gap-2 mt-5 mx-auto"
          style={{
            gridTemplateColumns: '1fr 1fr',
            maxWidth: '360px',
          }}
        >
          {trustItems.map((t) => (
            <div
              key={t}
              style={{
                fontSize: '12px',
                color: 'var(--eaf-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--eaf-teal)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {t}
            </div>
          ))}
        </div>

        {/* Note PC finale */}
        <div
          style={{
            marginTop: '24px',
            padding: '14px',
            background: 'var(--eaf-bg2)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--eaf-text-secondary)',
            maxWidth: '360px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}
        >
          🖥️ <strong style={{ color: 'var(--eaf-text-primary)' }}>Les ateliers s&apos;utilisent sur ordinateur.</strong>
          <br />
          Inscris-toi maintenant, puis reviens sur PC pour commencer.
        </div>
      </div>
    </section>
  );
}
