'use client';

export function StatsSection() {
  const stats = [
    {
      value: '+4.2',
      unit: 'pts',
      label: 'de progression moyenne à l\'oral',
      note: 'Observé sur 4 semaines d\'entraînement régulier*',
      color: 'var(--eaf-orange)',
    },
    {
      value: '3',
      unit: 'min',
      label: 'pour un premier retour IA',
      note: 'Feedback initial automatisé, hors relecture enseignant',
      color: 'var(--eaf-indigo)',
    },
    {
      value: '98',
      unit: '%',
      label: 'de mention (AB et plus)',
      note: 'Élèves Premium actifs, session 2025 (n=47)*',
      color: 'var(--eaf-gold)',
    },
  ];

  return (
    <section
      style={{
        background: 'var(--eaf-gradient-stats-bg)',
        borderTop: '1px solid var(--eaf-border)',
        borderBottom: '1px solid var(--eaf-border)',
      }}
    >
      <div
        style={{ maxWidth: '1100px', margin: '0 auto', padding: '70px 2rem' }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--eaf-indigo)',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Les chiffres parlent
          </div>
          <h2
            style={{
              fontFamily: 'var(--eaf-font-display)',
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              color: 'var(--eaf-text-primary)',
            }}
          >
            Des résultats mesurables, pas des promesses.
          </h2>
        </div>

        {/* Grille stats */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            background: 'var(--eaf-border)',
          }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
              style={{
                background: 'var(--eaf-bg1)',
                padding: '40px 32px',
              }}
            >
              {/* Ligne de hover */}
              <div
                className="absolute bottom-0 left-8 right-8 h-0.5 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'var(--eaf-gradient-indigo-teal)',
                }}
              />

              {/* Valeur */}
              <div
                style={{
                  fontFamily: 'var(--eaf-font-display)',
                  fontSize: '56px',
                  fontWeight: 900,
                  letterSpacing: '-3px',
                  lineHeight: 1,
                  marginBottom: '8px',
                  color: stat.color,
                }}
              >
                {stat.value}
                <span
                  style={{
                    fontSize: '28px',
                    color: stat.color === 'var(--eaf-gold)' ? 'var(--eaf-text-tertiary)' : stat.color,
                  }}
                >
                  {stat.unit}
                </span>
              </div>

              {/* Label */}
              <div
                style={{
                  fontSize: '15px',
                  color: 'var(--eaf-text-secondary)',
                  lineHeight: 1.5,
                  maxWidth: '200px',
                }}
              >
                {stat.label}
              </div>

              {/* Note */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--eaf-text-tertiary)',
                  marginTop: '8px',
                }}
              >
                {stat.note}
              </div>
            </div>
          ))}
        </div>

        {/* Note légale */}
        <div
          className="text-center mt-5"
          style={{ fontSize: '11px', color: 'var(--eaf-text-tertiary)' }}
        >
          * Étude interne sur cohorte Premium, avril 2025
        </div>
      </div>
    </section>
  );
}
