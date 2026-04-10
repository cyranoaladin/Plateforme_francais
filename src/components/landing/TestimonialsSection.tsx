'use client';

export function TestimonialsSection() {
  const testimonials = [
    {
      initials: 'MK',
      gradient: 'linear-gradient(135deg, var(--eaf-indigo), #4458D4)',
      quote: 'J\'avais peur de l\'oral. Avec Nexus, j\'ai fait <strong>8 simulations réelles</strong>. Le jour J, j\'étais habitué au stress — le tuteur me guidait pour que JE trouve. Résultat : 16/20 et mention Bien.',
      name: 'Marie K.',
      school: 'Lycée Pierre Mendès France, Tunis',
      score: '8/20 → 16/20',
      scoreColor: 'var(--eaf-gold)',
    },
    {
      initials: 'SL',
      gradient: 'linear-gradient(135deg, var(--eaf-teal), #0f6e56)',
      quote: 'ChatGPT me donnait des réponses génériques. Nexus corrige avec <strong>le barème réel</strong> et mes parents suivent tout depuis leur tableau de bord.',
      name: 'Sarah L.',
      school: 'Lycée International, Lyon',
      score: '9/20 → 14/20',
      scoreColor: 'var(--eaf-gold)',
    },
    {
      initials: 'YB',
      gradient: 'linear-gradient(135deg, var(--eaf-gold), #854f0b)',
      quote: 'L\'atelier Langue a transformé ma copie. <strong>Mon prof n\'en revenait pas</strong> : zéro faute au dernier devoir.',
      name: 'Yassine B.',
      school: 'Lycée Carthage Présidence, Tunis',
      score: 'Gram. cata. → 0 faute',
      scoreColor: 'var(--eaf-teal)',
      scoreStyle: {
        background: 'rgba(26,213,160,0.10)',
        border: '1px solid rgba(26,213,160,0.30)',
        color: 'var(--eaf-teal)',
      },
    },
  ];

  return (
    <div>
      {/* Header */}
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
          Ils ont transformé leurs notes
        </div>
        <h2
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--eaf-text-primary)',
          }}
        >
          Des résultats concrets,
          <br />
          vérifiables, reproductibles.
        </h2>
      </div>

      {/* Grille */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '48px' }}
      >
        {testimonials.map((t, index) => (
          <div
            key={index}
            className="relative overflow-hidden transition-all duration-200 group"
            style={{
              background: 'var(--eaf-bg1)',
              border: '1px solid var(--eaf-border)',
              borderRadius: '18px',
              padding: '28px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = 'rgba(123,142,255,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--eaf-border)';
            }}
          >
            {/* Ligne de dégradé en haut */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'var(--eaf-gradient-indigo-teal)' }}
            />

            {/* Avatar */}
            <div
              className="flex items-center justify-center text-white font-bold mb-4"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: t.gradient,
                fontSize: '16px',
              }}
            >
              {t.initials}
            </div>

            {/* Citation */}
            <p
              style={{
                fontSize: '14px',
                color: 'var(--eaf-text-secondary)',
                lineHeight: 1.7,
                fontStyle: 'italic',
                marginBottom: '18px',
              }}
              dangerouslySetInnerHTML={{
                __html: t.quote.replace(
                  /<strong>(.*?)<\/strong>/g,
                  '<span style="color: var(--eaf-text-primary); font-style: normal; font-weight: 600;">$1</span>'
                ),
              }}
            />

            {/* Méta */}
            <div className="flex items-center justify-between">
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--eaf-text-primary)',
                  }}
                >
                  {t.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--eaf-text-tertiary)',
                  }}
                >
                  {t.school}
                </div>
              </div>

              {/* Score badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background:
                    t.scoreStyle?.background ||
                    'linear-gradient(135deg, rgba(255,181,71,0.15), rgba(255,107,53,0.15))',
                  border: t.scoreStyle?.border || '1px solid rgba(255,181,71,0.30)',
                  color: t.scoreStyle?.color || 'var(--eaf-gold)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--eaf-font-display)',
                }}
              >
                {t.score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
