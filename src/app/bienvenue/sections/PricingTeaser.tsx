'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const PLANS = [
  {
    name: 'Freemium',
    accent: 'border-[var(--border-strong)] bg-[var(--card)] text-[var(--navy)]',
    kicker: 'Fais tes premiers pas vers le Bac.',
    bullets: ["Voir le vrai produit", "Configuration et premiers ateliers", "Vérifier si le cadre te convient"],
  },
  {
    name: 'Premium',
    accent: 'border-[var(--navy)] bg-[var(--navy)] text-[var(--surface-parchment)] shadow-[var(--shadow-lg)]',
    kicker: 'La méthode complète pour assurer ta réussite.',
    bullets: ["Soutenir une vraie routine hebdomadaire", "Moins de friction sur oral, écrit et tuteur", "Le bon rythme sans surpayer"],
    featured: true,
  },
  {
    name: 'Masterium',
    accent: 'border-[var(--border-strong)] bg-[var(--surface-warm-accent)] text-[var(--navy)]',
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
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Plans et valeur</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              Teste d’abord le vrai workflow. Choisis ensuite le plan qui suit ton rythme.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
              Chaque plan correspond à une intensité de préparation différente. Freemium sert à juger le produit sur pièce, Premium enlève les plafonds quand le besoin devient réel.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/pricing"
                onClick={() => track({ name: 'cta_click', props: { cta: 'pricing_teaser', path: '/bienvenue' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-6 py-3.5 text-sm font-bold text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]"
              >
                Voir les plans, quotas et paiements
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => track({ name: 'cta_click', props: { cta: 'pricing_register', path: '/bienvenue' } })}
                className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--card)] px-6 py-3.5 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-[var(--card)]"
              >
                Essayer gratuitement
              </Link>
            </div>

            <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--text-muted)]">
              Le plan gratuit permet déjà de configurer ton parcours, d’ouvrir les premiers ateliers et de voir si le produit tient sa promesse avant toute dépense.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article key={plan.name} className={`${plan.accent} rounded-[24px] border p-6`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] opacity-70">{plan.kicker}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <h3 style={EDITORIAL_HEADING} className="text-3xl tracking-[-0.03em]">{plan.name}</h3>
                  {plan.featured ? (
                    <span className="rounded-full bg-[var(--surface-parchment)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--navy)]">
                      Recommandé
                    </span>
                  ) : null}
                </div>
                <ul className="mt-6 space-y-3 text-sm leading-6">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0" />
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
