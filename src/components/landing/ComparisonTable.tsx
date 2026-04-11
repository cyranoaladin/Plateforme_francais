'use client';

import Link from 'next/link';

export function ComparisonTable() {
  const rows = [
    { label: 'Sources', chatgpt: 'Hallucinations fréquentes, non vérifiables', nexus: 'Corpus certifié EAF, chaque réponse sourcée' },
    { label: 'Correction', chatgpt: 'Feedback générique, pas de barème', nexus: 'Correction critériée sur le barème officiel EAF' },
    { label: 'Barème EAF', chatgpt: 'Ne connaît pas le barème', nexus: 'Intégré nativement, mis à jour chaque session' },
    { label: 'Anti-copie', chatgpt: 'Génère du contenu copiable', nexus: 'Anti-copie par design : tu produis, Nexus corrige' },
    { label: 'Rapidité', chatgpt: 'Réponse instantanée mais non fiable', nexus: 'Correction sourcée en 3 minutes' },
    { label: 'Suivi', chatgpt: 'Aucun historique ni suivi', nexus: 'Tableau de bord élève + parent en temps réel' },
    { label: 'Expertise', chatgpt: 'IA généraliste, pas spécialisée', nexus: 'Conçu par des enseignants agréés de Français' },
  ];

  // Les 4 différences clés pour mobile
  const keyDiffs = [
    { critere: 'Sources', chatgpt: 'Hallucinations, non vérifiables', nexus: 'Corpus certifié EAF, sourcé' },
    { critere: 'Barème EAF', chatgpt: 'Ne connaît pas le barème', nexus: 'Intégré, mis à jour chaque session' },
    { critere: 'Anti-copie', chatgpt: 'Génère du contenu copiable', nexus: 'Anti-copie par design' },
    { critere: 'Suivi', chatgpt: 'Aucun historique', nexus: 'Tableau de bord élève + parent' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
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
          Pourquoi pas ChatGPT ?
        </div>
        <h2
          className="hero-title-mobile"
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--eaf-text-primary)',
          }}
        >
          ChatGPT rédige.{' '}
          <span style={{ color: 'var(--eaf-orange)', fontStyle: 'italic' }}>
            Nexus t&apos;apprend.
          </span>
        </h2>
        <p
          className="hidden sm:block"
          style={{
            fontSize: '16px',
            color: 'var(--eaf-text-secondary)',
            marginTop: '8px',
          }}
        >
          Une IA généraliste ne remplace pas un outil conçu pour l&apos;EAF.
        </p>
      </div>

      {/* Mobile: Vue simplifiée avec 4 différences clés */}
      <div className="lg:hidden" style={{ padding: '0 20px' }}>
        {keyDiffs.map((diff, i) => (
          <div
            key={i}
            style={{
              background: 'var(--eaf-bg1)',
              border: '1px solid var(--eaf-border)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--eaf-text-tertiary)',
                marginBottom: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {diff.critere}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#f87171', lineHeight: 1.4 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ef4444',
                    marginBottom: '2px',
                  }}
                >
                  ✗ ChatGPT
                </span>
                {diff.chatgpt}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--eaf-text-primary)', lineHeight: 1.4 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--eaf-teal)',
                    marginBottom: '2px',
                  }}
                >
                  ✓ Nexus
                </span>
                {diff.nexus}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Tableau complet */}
      <div
        className="hidden lg:grid"
        style={{
          gridTemplateColumns: '200px 1fr 1fr',
          background: 'var(--eaf-bg1)',
          border: '1px solid var(--eaf-border)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            padding: '20px 24px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--eaf-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid var(--eaf-border)',
          }}
        >
          Critère
        </div>
        <div
          style={{
            padding: '20px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.05)',
            borderBottom: '1px solid rgba(239,68,68,0.10)',
          }}
        >
          ✗ ChatGPT / IA générique
        </div>
        <div
          style={{
            padding: '20px 24px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--eaf-teal)',
            background: 'rgba(26,213,160,0.05)',
            borderBottom: '1px solid rgba(26,213,160,0.10)',
          }}
        >
          ✓ Nexus Réussite
        </div>

        {/* Data rows */}
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              display: 'contents',
            }}
          >
            <div
              className="transition-colors duration-200 hover:bg-white/5"
              style={{
                padding: '16px 24px',
                fontSize: '14px',
                color: 'var(--eaf-text-secondary)',
                borderBottom: index < rows.length - 1 ? '1px solid var(--eaf-border)' : 'none',
                borderRight: '1px solid var(--eaf-border)',
              }}
            >
              {row.label}
            </div>
            <div
              className="transition-colors duration-200 hover:bg-white/5"
              style={{
                padding: '16px 24px',
                fontSize: '14px',
                color: '#f87171',
                borderBottom: index < rows.length - 1 ? '1px solid var(--eaf-border)' : 'none',
                borderRight: '1px solid var(--eaf-border)',
              }}
            >
              {row.chatgpt}
            </div>
            <div
              className="transition-colors duration-200 hover:bg-white/5"
              style={{
                padding: '16px 24px',
                fontSize: '14px',
                color: 'var(--eaf-text-primary)',
                borderBottom: index < rows.length - 1 ? '1px solid var(--eaf-border)' : 'none',
              }}
            >
              {row.nexus}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-8" style={{ padding: '0 20px' }}>
        <Link
          href="/login"
          className="inline-block font-semibold text-white transition-all duration-200 w-full lg:w-auto"
          style={{
            background: 'var(--eaf-orange)',
            padding: '14px 32px',
            borderRadius: '12px',
            fontSize: '15px',
            maxWidth: '340px',
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
          Essayer gratuitement — sans carte bancaire →
        </Link>
      </div>
    </div>
  );
}
