'use client';

import Link from 'next/link';

export function FooterCTA() {
  return (
    <section
      className="relative text-center overflow-hidden"
      style={{
        padding: '100px 2rem',
        background: 'linear-gradient(180deg, var(--eaf-bg0) 0%, #0a0e1a 50%, var(--eaf-bg0) 100%)',
        borderTop: '1px solid var(--eaf-border)',
        borderBottom: '1px solid var(--eaf-border)',
      }}
    >
      {/* Orbe centrale */}
      <div
        className="absolute pointer-events-none"
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
          J-59 avant l'épreuve EAF 2026
        </div>

        {/* H2 */}
        <h2
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '52px',
            fontWeight: 700,
            letterSpacing: '-2px',
            lineHeight: 1.1,
            marginBottom: '20px',
            color: 'var(--eaf-text-primary)',
          }}
        >
          Le meilleur moment
          <br />
          pour commencer,{' '}
          <span style={{ color: 'var(--eaf-orange)', fontStyle: 'italic' }}>
            c'est maintenant.
          </span>
        </h2>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: '16px',
            color: 'var(--eaf-text-secondary)',
            marginBottom: '40px',
          }}
        >
          Chaque jour sans entraînement, c'est un point de moins à l'oral.
          <br />
          Le Freemium est gratuit, sans carte bancaire, et tu peux commencer en 3 minutes.
        </p>

        {/* Grand CTA */}
        <Link
          href="/login"
          className="inline-block font-bold text-white transition-all duration-200"
          style={{
            background: 'var(--eaf-orange)',
            padding: '18px 44px',
            borderRadius: '14px',
            fontSize: '17px',
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
          Commencer gratuitement — sans carte bancaire →
        </Link>

        {/* Trust badges */}
        <div
          className="flex items-center justify-center gap-6 mt-6 flex-wrap"
          style={{ fontSize: '13px', color: 'var(--eaf-text-tertiary)' }}
        >
          {['Freemium sans limite', 'Sources BO 2026 officielles', 'Anti-copie par design', 'Tableau de bord parent inclus'].map(
            (badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    background: 'var(--eaf-teal)',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
