'use client';

import { useState } from 'react';
import Link from 'next/link';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Puis-je changer de formule en cours de mois ?',
      answer:
        "Oui, tu peux upgrader à tout moment. Le changement prend effet immédiatement après activation d'un nouveau code.",
    },
    {
      question: 'Y a-t-il un engagement minimum ?',
      answer:
        "Non. Chaque plan est activé par code pour une durée définie. Aucun prélèvement automatique ni reconduction tacite.",
    },
    {
      question: 'Le Freemium est-il vraiment gratuit ?',
      answer:
        "Oui, sans limite de durée. Pas de carte bancaire requise, pas de période d'essai qui expire.",
    },
    {
      question: "Puis-je vraiment utiliser la plateforme depuis mon téléphone ?",
      answer:
        "L'inscription, la découverte et les tarifs fonctionnent depuis ton téléphone. Pour travailler réellement — corriger une copie, simuler un oral, utiliser le tuteur — il faut un ordinateur. C'est intentionnel : l'EAF se prépare avec un vrai espace de travail, pas en multitâche sur mobile.",
    },
    {
      question: 'Comment activer un plan payant ?',
      answer:
        "Commence en Freemium, puis active Premium ou Masterium par code après règlement par virement bancaire ou espèces.",
    },
  ];

  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 20px' }}>
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
          FAQ
        </div>
        <h2
          className="hero-title-mobile"
          style={{
            fontFamily: 'var(--eaf-font-display)',
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--eaf-text-primary)',
          }}
        >
          Tout ce qu&apos;il faut savoir.
        </h2>
      </div>

      {/* Liste FAQ */}
      <div>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              borderBottom: '1px solid var(--eaf-border)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between text-left cursor-pointer transition-colors duration-200"
              style={{
                padding: '16px 0',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--eaf-text-primary)',
                background: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--eaf-indigo)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--eaf-text-primary)')
              }
            >
              <span style={{ paddingRight: '16px' }}>{faq.question}</span>
              <span
                style={{
                  fontSize: '16px',
                  color: 'var(--eaf-text-tertiary)',
                  transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                }}
              >
                ∨
              </span>
            </button>
            <div
              style={{
                maxHeight: openIndex === index ? '300px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--eaf-text-secondary)',
                  lineHeight: 1.7,
                  paddingBottom: '16px',
                }}
              >
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Note sous FAQ */}
      <p
        className="text-center mt-6"
        style={{ fontSize: '13px', color: 'var(--eaf-text-tertiary)' }}
      >
        Besoin d&apos;un plan payant ?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--eaf-indigo)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Commence en Freemium puis active Premium ou Masterium par code →
        </Link>
      </p>
    </section>
  );
}
