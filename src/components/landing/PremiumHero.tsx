'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Award, Clock } from 'lucide-react';

const HERO_COPY = {
  badge: 'Approche innovante',
  title: 'Maîtriser le français, ouvrir les portes du futur',
  subtitle:
    'Une plateforme complète conçue pour parents responsables et apprenants ambitieux. Curriculum officiel + IA intelligente + suivi transparent.',
  primaryCta: 'Commencer maintenant',
  secondaryCta: 'Voir les plans',
  trustItems: [
    {
      icon: CheckCircle2,
      label: 'Aucune carte bancaire',
    },
    {
      icon: Clock,
      label: 'Essai gratuit illimité',
    },
    {
      icon: Award,
      label: 'Curriculum officiel',
    },
  ],
} as const;

export function PremiumHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:pb-32 lg:pt-48">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-100/40 to-transparent" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-72 w-96 rounded-full bg-indigo-100/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Badge */}
        <div className="mb-6 flex justify-center sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-700">
              {HERO_COPY.badge}
            </span>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-balance text-center font-playfair text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          {HERO_COPY.title}
        </h1>

        {/* Subtitle */}
        <p className="text-balance mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-600 sm:mt-8 sm:text-xl">
          {HERO_COPY.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            variant="gold"
            size="lg"
            className="w-full sm:w-auto"
            asChild
          >
            <a href="#signup">{HERO_COPY.primaryCta}</a>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            asChild
          >
            <a href="#pricing">{HERO_COPY.secondaryCta}</a>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:flex sm:justify-center sm:gap-8">
          {HERO_COPY.trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/60 px-4 py-3 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
