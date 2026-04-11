'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { track } from '@/components/analytics/events';

const PLANS = [
  {
    name: 'Freemium',
    kicker: 'Fais tes premiers pas vers le Bac.',
    bullets: ["Voir le vrai produit", "Configuration et premiers ateliers", "Vérifier si le cadre te convient"],
  },
  {
    name: 'Premium',
    kicker: 'La méthode complète pour assurer ta réussite.',
    bullets: ["Soutenir une vraie routine hebdomadaire", "Moins de friction sur oral, écrit et tuteur", "Le bon rythme sans surpayer"],
    featured: true,
  },
  {
    name: 'Masterium',
    kicker: "L\u2019excellence absolue pour décrocher la mention.",
    bullets: ["Volume élevé sans coupure", "Confort sur les semaines chargées", "Conçu pour un usage vraiment intensif"],
  },
];

export function PricingTeaser() {
  return (
    <section id="tarifs" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-teal)]">Plans et valeur</p>
            <h2 
              className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)] sm:text-5xl"
              style={{ fontFamily: 'var(--eaf-font-display)' }}
            >
              Teste d'abord le vrai workflow. Choisis ensuite le plan qui suit ton rythme.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--eaf-text-secondary)]">
              Chaque plan correspond à une intensité de préparation différente. Freemium sert à juger le produit sur pièce, Premium enlève les plafonds quand le besoin devient réel.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/pricing"
                onClick={() => track({ name: 'cta_click', props: { cta: 'pricing_teaser', path: '/' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--eaf-orange)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-active)]"
              >
                Voir les tarifs, quotas et paiements
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => track({ name: 'cta_click', props: { cta: 'pricing_register', path: '/' } })}
                className="inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-sm font-semibold text-[var(--eaf-orange)] transition-colors hover:bg-[var(--eaf-bg3)]"
                style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
              >
                Essayer gratuitement
              </Link>
            </div>

            <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--eaf-text-tertiary)]">
              Le plan gratuit permet déjà de configurer ton parcours, d'ouvrir les premiers ateliers et de voir si le produit tient sa promesse avant toute dépense.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article 
                key={plan.name} 
                className={`rounded-[var(--eaf-radius-2xl)] border p-6 ${plan.featured ? 'shadow-lg' : ''}`}
                style={{ 
                  background: plan.featured ? 'var(--eaf-orange)' : 'var(--eaf-bg2)',
                  borderColor: plan.featured ? 'var(--eaf-orange-active)' : 'var(--eaf-border)'
                }}
              >
                <p className={`text-[11px] font-bold uppercase tracking-[0.26em] ${plan.featured ? 'text-[#FDE68A]' : 'text-[var(--eaf-text-tertiary)]'}`}>
                  {plan.kicker}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h3 
                    className={`text-3xl tracking-[-0.03em] ${plan.featured ? 'text-white' : 'text-[var(--eaf-orange)]'}`}
                    style={{ fontFamily: 'var(--eaf-font-display)' }}
                  >
                    {plan.name}
                  </h3>
                  {plan.featured ? (
                    <span 
                      className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--eaf-orange)]"
                      style={{ background: 'white' }}
                    >
                      Recommandé
                    </span>
                  ) : null}
                </div>
                <ul className={`mt-6 space-y-3 text-sm leading-6 ${plan.featured ? 'text-white/90' : 'text-[var(--eaf-text-secondary)]'}`}>
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <Check className={`mt-1 h-4 w-4 shrink-0 ${plan.featured ? 'text-[var(--eaf-gold)]' : 'text-[var(--eaf-teal)]'}`} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
