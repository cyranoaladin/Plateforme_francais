'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Découverte',
    description: 'Parfait pour explorer',
    price: 'Gratuit',
    period: 'illimité',
    features: [
      'Accès à 5 leçons',
      'Suivi de base',
      'Dashboard parent simplifié',
      'Support communautaire',
      'Pas de carte bancaire',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    name: 'Réussite',
    description: 'Le plus populaire',
    price: '19,99 €',
    period: '/mois',
    features: [
      'Accès complet à toutes les leçons',
      'Suivi avancé en temps réel',
      'Dashboard parent détaillé',
      'Support par email (24h)',
      'Rapports de progrès mensuels',
      'Personnalisation avancée',
      'Accès hors ligne',
    ],
    cta: 'Essayer maintenant',
    highlighted: true,
    badge: 'Plus populaire',
  },
  {
    name: 'Excellence',
    description: 'Pour les plus ambitieux',
    price: '34,99 €',
    period: '/mois',
    features: [
      'Tout ce qui est dans Réussite',
      'Mentorat 1-à-1 avec experts',
      'Correction de devoirs personnalisée',
      'Support prioritaire (live chat)',
      'Analyses détaillées des points faibles',
      'Certification de progression',
      'Accès aux ressources premium',
      'Modules spécialisés (littérature, grammaire)',
    ],
    cta: 'Essayer maintenant',
    highlighted: false,
  },
] as const;

export function PremiumPricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-indigo-50/30 px-4 py-20 sm:px-6 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-balance font-playfair text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Tarification transparente et juste
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 sm:mt-6">
            Commencez gratuitement. Passez à un plan payant quand vous êtes prêt.
            Annulez à tout moment.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-3 lg:gap-8">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`${
                tier.highlighted
                  ? 'sm:scale-105 sm:ring-2 sm:ring-indigo-600/50'
                  : ''
              }`}
            >
              <Card
                variant={tier.highlighted ? 'elevated' : 'default'}
                padding="lg"
                className={`relative flex h-full flex-col border transition-all duration-300 ${
                  tier.highlighted
                    ? 'border-indigo-600/50 bg-gradient-to-br from-indigo-50 to-indigo-100/20 shadow-xl'
                    : 'border-slate-200/60 bg-gradient-to-br from-white to-slate-50/40'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1">
                    <Crown className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-bold text-white">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className="font-playfair text-2xl font-700 text-slate-900">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {tier.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-slate-500">{tier.period}</span>
                </div>

                {/* CTA Button */}
                <a
                  href="#signup"
                  className={`w-full mb-6 h-12 px-7 text-base rounded-[var(--radius-md)] font-medium inline-flex items-center justify-center transition-all duration-[var(--transition-normal)] ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-[var(--c-reward)] to-[var(--color-amber-300)] text-[var(--text-reward-on-subtle)] font-semibold hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)]'
                      : 'bg-[var(--bg-surface)] text-[var(--c-primary)] border border-[var(--c-primary)] hover:bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  {tier.cta}
                </a>

                {/* Features List */}
                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span className="text-sm text-slate-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-slate-600 sm:mt-16">
          <p>Tous les plans incluent un essai gratuit de 14 jours. Aucune carte bancaire requise.</p>
        </div>
      </div>
    </section>
  );
}
