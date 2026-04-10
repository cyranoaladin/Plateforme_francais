'use client';

import Link from 'next/link';

export function Hero() {
  return (
    <section
      className="relative"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '80px 2rem 100px',
      }}
    >
      {/* Orbe de lumière */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(123,142,255,0.07) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
        }}
      />

      <div
        className="grid items-center"
        style={{ gridTemplateColumns: '1fr 1fr', gap: '60px' }}
      >
        {/* Colonne gauche */}
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
              marginBottom: '20px',
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

          {/* Eyebrow */}
          <div
            className="flex items-center gap-2 font-medium uppercase"
            style={{
              fontSize: '12px',
              letterSpacing: '0.08em',
              color: 'var(--eaf-teal)',
              marginBottom: '20px',
            }}
          >
            <span style={{ width: '24px', height: '1px', background: 'var(--eaf-teal)' }} />
            ORAL · ÉCRIT · TUTEUR · SUIVI RÉEL
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '56px',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-2px',
              marginBottom: '24px',
              color: 'var(--eaf-text-primary)',
            }}
          >
            Nexus Réussite : La préparation EAF
            <br />
            qui fait enfin travailler{' '}
            <span
              style={{
                color: 'var(--eaf-orange)',
                fontStyle: 'italic',
                fontWeight: 300,
              }}
            >
              juste.
            </span>
          </h1>

          {/* Paragraphe */}
          <p
            style={{
              fontSize: '16px',
              color: 'var(--eaf-text-secondary)',
              lineHeight: 1.7,
              maxWidth: '420px',
              marginBottom: '36px',
            }}
          >
            Nexus transforme l'entraînement en pilotage concret : simulation orale officielle,
            correction écrite rapide, tuteur pédagogique et progression suivie sans rédiger à ta place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3.5">
            <Link
              href="/login"
              className="font-semibold text-white text-center transition-all duration-200"
              style={{
                fontSize: '16px',
                background: 'var(--eaf-orange)',
                padding: '15px 32px',
                borderRadius: '12px',
                width: 'fit-content',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--eaf-shadow-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Commencer gratuitement - 3 min
            </Link>

            <button
              className="flex items-center gap-2 transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                width: 'fit-content',
                cursor: 'pointer',
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
              <span
                className="flex items-center justify-center text-white"
                style={{
                  width: '20px',
                  height: '20px',
                  background: 'rgba(123,142,255,0.2)',
                  borderRadius: '50%',
                  fontSize: '8px',
                }}
              >
                ▶
              </span>
              Voir la démo en 45 s
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-5 mt-5">
            {['Pas de carte bancaire', 'Freemium sans limite de durée', 'Sources BO 2026 officielles'].map(
              (badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5"
                  style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}
                >
                  <span style={{ color: 'var(--eaf-teal)' }}>✓</span>
                  {badge}
                </div>
              )
            )}
          </div>
        </div>

        {/* Colonne droite - Carte démo */}
        <DemoCard />
      </div>
    </section>
  );
}

function DemoCard() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'var(--eaf-bg1)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '20px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, var(--eaf-bg2), var(--eaf-bg3))',
          padding: '18px 20px',
          borderBottom: '1px solid var(--eaf-border)',
        }}
      >
        {/* Dots macOS */}
        <div className="flex gap-1.5">
          <span style={{ width: '9px', height: '9px', background: '#ff5f57', borderRadius: '50%' }} />
          <span style={{ width: '9px', height: '9px', background: '#febc2e', borderRadius: '50%' }} />
          <span style={{ width: '9px', height: '9px', background: '#28c840', borderRadius: '50%' }} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
          Atelier Oral — Nexus Réussite
        </span>
        <span
          style={{
            background: 'rgba(123,142,255,0.15)',
            border: '1px solid rgba(123,142,255,0.30)',
            color: 'var(--eaf-indigo)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          BO 2026
        </span>
      </div>

      {/* Corps */}
      <div style={{ padding: '20px' }}>
        {/* Label */}
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--eaf-teal)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          SIMULATION OFFICIELLE EAF
        </div>

        {/* Titre */}
        <h3
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '14px',
          }}
        >
          Oral sur Lettres d'une Péruvienne — Graffigny
        </h3>

        {/* Bulle IA */}
        <div
          style={{
            background: 'var(--eaf-bg2)',
            border: '1px solid var(--eaf-border)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '10px',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="flex items-center justify-center text-white font-bold"
              style={{
                width: '20px',
                height: '20px',
                background: 'var(--eaf-gradient-indigo-deep)',
                borderRadius: '5px',
                fontSize: '9px',
              }}
            >
              IA
            </span>
            <span
              style={{ fontSize: '11px', color: 'var(--eaf-indigo)', fontWeight: 600 }}
            >
              Tuteur IA
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '10px',
                color: 'var(--eaf-text-tertiary)',
              }}
            >
              Source : BO 2026, Rapport jury 2025
            </span>
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--eaf-text-secondary)',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            « Comment Zilia déconstruit-elle la vision que les Européens ont de leur propre
            civilisation ? Analysez les lettres 18 et 29 pour montrer le renversement du regard. »
          </p>
        </div>

        {/* Timer ligne */}
        <div className="flex items-center justify-between my-3">
          <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--eaf-text-tertiary)' }}>
            <span
              className="animate-eaf-pulse"
              style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}
            />
            En cours
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--eaf-text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            18:42
          </span>
          <button
            className="font-semibold text-white border-none cursor-pointer transition-all duration-200"
            style={{
              background: 'var(--eaf-orange)',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--eaf-orange-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--eaf-orange)')}
          >
            Commencer le passage →
          </button>
        </div>

        {/* Grille scores */}
        <div
          className="grid gap-1.5 mt-2.5"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {[
            { score: '/2', label: 'Lecture' },
            { score: '/8', label: 'Explication' },
            { score: '/2', label: 'Grammaire' },
            { score: '/8', label: 'Entretien' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: 'var(--eaf-bg2)',
                border: '1px solid var(--eaf-border)',
                borderRadius: '8px',
                padding: '8px 12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--eaf-font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--eaf-gold)',
                }}
              >
                {item.score}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--eaf-text-tertiary)', marginTop: '2px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-1.5"
        style={{
          padding: '12px 20px',
          background: 'var(--eaf-teal-dim)',
          borderTop: '1px solid var(--eaf-teal-border)',
          fontSize: '11px',
          color: 'var(--eaf-teal)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#1AD5A0" strokeWidth="1.5" />
          <path
            d="M4 6l1.5 1.5L8 4"
            stroke="#1AD5A0"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Session d'oral simulée — avec transcription et notation en temps réel
      </div>
    </div>
  );
}
