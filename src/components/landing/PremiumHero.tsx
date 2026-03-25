'use client';

import Image from 'next/image';
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
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50/30 px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40 lg:pb-32 lg:pt-48">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-200/30 to-transparent" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl animate-pulse" />
        <div className="absolute left-0 bottom-0 h-72 w-96 rounded-full bg-indigo-100/25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="mb-6 flex sm:mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/80 px-4 py-2 backdrop-blur-sm shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-700">
                  {HERO_COPY.badge}
                </span>
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-balance font-playfair text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {HERO_COPY.title}
            </h1>

            {/* Subtitle */}
            <p className="text-balance mt-6 text-lg leading-relaxed text-slate-600 sm:mt-8">
              {HERO_COPY.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <a
                href="#signup"
                className="h-12 px-7 text-base rounded-lg font-semibold inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 font-medium"
              >
                {HERO_COPY.primaryCta}
              </a>
              <a
                href="#pricing"
                className="h-12 px-7 text-base rounded-lg font-semibold inline-flex items-center justify-center bg-white/80 text-indigo-700 border-2 border-indigo-200 hover:bg-white hover:border-indigo-400 transition-all duration-300 backdrop-blur-sm"
              >
                {HERO_COPY.secondaryCta}
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 grid grid-cols-1 gap-3 sm:gap-4">
              {HERO_COPY.trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg bg-white/60 px-4 py-3 backdrop-blur-sm border border-indigo-100/50 hover:bg-white/80 transition-all"
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

          {/* Right Image */}
          <div className="hidden lg:block relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/french-learning-hero.jpg"
                alt="Students learning French together"
                width={500}
                height={600}
                className="w-full h-auto object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
            </div>
            {/* Floating accent */}
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
