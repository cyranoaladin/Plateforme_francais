'use client';

export function MethodSteps() {
  const steps = [
    {
      icon: '🎯',
      number: 'Étape 01',
      title: 'Diagnostic express',
      description:
        'Un test rapide identifie tes forces et lacunes pour personnaliser ton parcours dès la première session.',
      tag: null,
    },
    {
      icon: '✏️',
      number: 'Étape 02',
      title: 'Tu produis, pas l\'IA',
      description:
        'Tu rédiges toi-même. Nexus ne génère jamais de contenu à ta place.',
      tag: 'Anti-copie par design',
    },
    {
      icon: '📊',
      number: 'Étape 03',
      title: 'Correction sourcée en 3 min',
      description:
        'Feedback détaillé avec le barème EAF officiel et des sources vérifiées. Pas d\'hallucination.',
      tag: null,
    },
  ];

  return (
    <div>
      {/* Header - Desktop */}
      <div className="hidden lg:flex justify-between items-end mb-12">
        <div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--eaf-indigo)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            La méthode
          </div>
          <h2
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '40px',
              fontWeight: 700,
              letterSpacing: '-1px',
              color: 'var(--eaf-text-primary)',
            }}
          >
            3 étapes. Simple, efficace,{' '}
            <span
              style={{
                color: 'var(--eaf-orange)',
                fontStyle: 'italic',
              }}
            >
              sans triche.
            </span>
          </h2>
        </div>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--eaf-text-secondary)',
            textAlign: 'right',
            maxWidth: '300px',
            marginBottom: '16px',
          }}
        >
          Chaque atelier reproduit les conditions réelles de l&apos;examen.
        </p>
      </div>

      {/* Header - Mobile */}
      <div className="lg:hidden text-center mb-8">
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--eaf-indigo)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          La méthode
        </div>
        <h2
          className="hero-title-mobile"
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-1px',
            color: 'var(--eaf-text-primary)',
          }}
        >
          3 étapes. Simple, efficace,{' '}
          <span
            style={{
              color: 'var(--eaf-orange)',
              fontStyle: 'italic',
            }}
          >
            sans triche.
          </span>
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--eaf-text-secondary)',
            marginTop: '8px',
          }}
        >
          Chaque atelier reproduit les conditions réelles de l&apos;examen.
        </p>
      </div>

      {/* Desktop: Grid 3 colonnes avec ligne de connexion horizontale */}
      <div
        className="hidden lg:grid relative gap-6"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '48px' }}
      >
        {/* Ligne de connexion horizontale */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '32px',
            left: '16.5%',
            right: '16.5%',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, var(--eaf-border) 20%, var(--eaf-border) 80%, transparent)',
          }}
        />

        {steps.map((step, index) => (
          <StepCard key={index} step={step} isMobile={false} />
        ))}
      </div>

      {/* Mobile: Stack vertical avec ligne de connexion verticale */}
      <div
        className="lg:hidden relative"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '0 20px',
        }}
      >
        {/* Ligne verticale de connexion */}
        <div
          style={{
            position: 'absolute',
            left: '36px',
            top: '48px',
            bottom: '48px',
            width: '1px',
            background:
              'linear-gradient(to bottom, transparent, var(--eaf-border) 15%, var(--eaf-border) 85%, transparent)',
          }}
        />

        {steps.map((step, index) => (
          <StepCard key={index} step={step} isMobile={true} index={index} />
        ))}
      </div>
    </div>
  );
}

interface StepCardProps {
  step: {
    icon: string;
    number: string;
    title: string;
    description: string;
    tag: string | null;
  };
  isMobile: boolean;
  index?: number;
}

function StepCard({ step, isMobile, index }: StepCardProps) {
  if (isMobile) {
    return (
      <div
        style={{
          background: 'var(--eaf-bg1)',
          border: '1px solid var(--eaf-border)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Icône */}
        <div
          style={{
            width: '40px',
            height: '40px',
            background: 'var(--eaf-indigo-dim)',
            border: '1px solid rgba(123,142,255,0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
          }}
        >
          {step.icon}
        </div>

        {/* Texte */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--eaf-indigo)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            Étape {String((index || 0) + 1).padStart(2, '0')}
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '4px',
              color: 'var(--eaf-text-primary)',
            }}
          >
            {step.title}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--eaf-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {step.description}
          </div>
          {step.tag && (
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,107,53,0.10)',
                border: '1px solid rgba(255,107,53,0.25)',
                color: '#ff8f61',
                padding: '2px 7px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 600,
                marginTop: '8px',
              }}
            >
              {step.tag}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="transition-colors duration-200"
      style={{
        background: 'var(--eaf-bg1)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '16px',
        padding: '28px',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = 'rgba(123, 142, 255, 0.35)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = 'var(--eaf-border)')
      }
    >
      {/* Icône */}
      <div
        className="flex items-center justify-center mb-4.5"
        style={{
          width: '48px',
          height: '48px',
          background: 'var(--eaf-indigo-dim)',
          border: '1px solid rgba(123,142,255,0.25)',
          borderRadius: '12px',
          fontSize: '20px',
        }}
      >
        {step.icon}
      </div>

      {/* Numéro */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--eaf-indigo)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {step.number}
      </div>

      {/* Titre */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '-0.3px',
          marginBottom: '8px',
          color: 'var(--eaf-text-primary)',
        }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: 'var(--eaf-text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {step.description}
      </p>

      {/* Tag spécial */}
      {step.tag && (
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(255, 107, 53, 0.10)',
            border: '1px solid rgba(255, 107, 53, 0.25)',
            color: '#ff8f61',
            padding: '3px 8px',
            borderRadius: '5px',
            fontSize: '11px',
            fontWeight: 600,
            marginTop: '10px',
          }}
        >
          {step.tag}
        </div>
      )}
    </div>
  );
}
