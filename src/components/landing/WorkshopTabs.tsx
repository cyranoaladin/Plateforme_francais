'use client';

import { useState } from 'react';
import Link from 'next/link';

export function WorkshopTabs() {
  const [activeTab, setActiveTab] = useState<'oral' | 'ecrit' | 'langue' | 'quiz'>('oral');

  const tabContent = {
    oral: {
      features: [
        'Tirage au sort réel des œuvres, comme au bac',
        'Passage enregistrable, noté /2 /8 /2 /8 officiel',
        'Bilan PDF avec points forts et axes de progrès',
      ],
      cta: 'Simuler un oral gratuit →',
      href: '/atelier-oral',
    },
    ecrit: {
      features: [
        'Génération de sujets conformes au BO 2026',
        'Correction critériée sur le barème EAF officiel',
        'Feedback détaillé en 3 minutes',
      ],
      cta: 'Essayer une correction gratuite →',
      href: '/atelier-ecrit',
    },
    langue: {
      features: [
        'Exercices de grammaire ciblés selon tes lacunes',
        'Analyse syntaxique conforme à la Note de Service',
        'Progression sauvegardée dans ton profil',
      ],
      cta: 'Faire un exercice de langue →',
      href: '/atelier-langue',
    },
    quiz: {
      features: [
        'Quiz adaptatifs sur les œuvres du programme',
        'Répétition espacée pour mémoriser durablement',
        'Scores et classement avec tes amis',
      ],
      cta: 'Lancer un quiz gratuit →',
      href: '/quiz',
    },
  };

  const tabs = [
    { key: 'oral', label: 'Oral', badge: 'Recommandé' },
    { key: 'ecrit', label: 'Écrit', badge: null },
    { key: 'langue', label: 'Langue', badge: null },
    { key: 'quiz', label: 'Quiz', badge: null },
  ] as const;

  return (
    <div
      style={{
        background: 'var(--eaf-bg1)',
        border: '1px solid var(--eaf-border)',
        borderRadius: '24px',
        padding: '48px',
      }}
    >
      {/* Header */}
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
        Les modules
      </div>
      <h2
        style={{
          fontFamily: 'var(--eaf-font-display)',
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--eaf-text-primary)',
        }}
      >
        4 ateliers pour maîtriser chaque épreuve
      </h2>

      {/* Tabs */}
      <div
        className="flex gap-2"
        style={{
          background: 'var(--eaf-bg0)',
          border: '1px solid var(--eaf-border)',
          borderRadius: '12px',
          padding: '6px',
          margin: '32px 0 24px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="cursor-pointer transition-all duration-200"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background:
                activeTab === tab.key ? 'var(--eaf-bg3)' : 'transparent',
              color:
                activeTab === tab.key
                  ? 'var(--eaf-text-primary)'
                  : 'var(--eaf-text-secondary)',
              border:
                activeTab === tab.key
                  ? '1px solid var(--eaf-border)'
                  : 'none',
            }}
          >
            {tab.label}
            {tab.badge && activeTab === 'oral' && (
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,107,53,0.15)',
                  border: '1px solid rgba(255,107,53,0.30)',
                  color: 'var(--eaf-orange)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: '6px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        <div className="flex flex-col gap-2.5" style={{ maxWidth: '520px' }}>
          {tabContent[activeTab].features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5"
              style={{
                fontSize: '15px',
                color: 'var(--eaf-text-secondary)',
              }}
            >
              <span
                style={{
                  color: 'var(--eaf-teal)',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {feature}
            </div>
          ))}
        </div>

        <Link
          href={tabContent[activeTab].href}
          className="inline-block font-semibold transition-all duration-200"
          style={{
            background: 'transparent',
            border: '1px solid rgba(123,142,255,0.35)',
            color: 'var(--eaf-indigo)',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            marginTop: '24px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--eaf-indigo-dim)';
            e.currentTarget.style.borderColor = 'var(--eaf-indigo)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(123,142,255,0.35)';
          }}
        >
          {tabContent[activeTab].cta}
        </Link>
      </div>
    </div>
  );
}
