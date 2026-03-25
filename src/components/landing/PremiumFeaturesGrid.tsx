'use client';

import { Card } from '@/components/ui/card';
import {
  Zap,
  BookOpen,
  Target,
  BarChart3,
  Users,
  Shield,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Leçons interactives',
    description:
      'Contenu engageant basé sur le curriculum officiel. Apprentissage progressif adapté au niveau de chaque élève.',
    bgGradient: 'from-blue-50 to-cyan-50',
    iconBg: 'from-blue-100 to-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Suivi en temps réel',
    description:
      'Tableaux de bord clairs pour parents et élèves. Comprenez la progression sans surcharge de données.',
    bgGradient: 'from-purple-50 to-pink-50',
    iconBg: 'from-purple-100 to-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: BookOpen,
    title: 'Parcours personnalisé',
    description:
      'IA intelligente qui s\'adapte au rythme et au style d\'apprentissage. Jamais trop facile, jamais trop difficile.',
    bgGradient: 'from-emerald-50 to-teal-50',
    iconBg: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Target,
    title: 'Objectifs clairs',
    description:
      'Jalons de performance visibles. Célébrez les petites victoires pour maintenir la motivation.',
    bgGradient: 'from-amber-50 to-orange-50',
    iconBg: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Users,
    title: 'Support pédagogique',
    description:
      'Questions des élèves répondues rapidement. Enseignants et experts disponibles pour clarifier les concepts.',
    bgGradient: 'from-rose-50 to-red-50',
    iconBg: 'from-rose-100 to-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Shield,
    title: 'Confiance & sécurité',
    description:
      'Données protégées. Aucun partage tiers. Respect strict des normes RGPD françaises.',
    bgGradient: 'from-indigo-50 to-blue-50',
    iconBg: 'from-indigo-100 to-indigo-50',
    iconColor: 'text-indigo-600',
  },
] as const;

export function PremiumFeaturesGrid() {
  return (
    <section
      id="method"
      className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-white px-4 py-20 sm:px-6 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-balance font-playfair text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Une plateforme complète pour réussir
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 sm:mt-6">
            Conçue pour soutenir chaque élève dans son parcours d'apprentissage
            du français.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200/40 bg-gradient-to-br ${feature.bgGradient} p-8 hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 backdrop-blur-sm`}
              >
                {/* Animated background accent */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-white/30" />
                </div>

                <div className="relative z-10">
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconBg} shadow-md group-hover:shadow-lg transition-all`}>
                    <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mb-3 font-playfair text-lg font-700 text-slate-900 group-hover:text-slate-950 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 group-hover:text-slate-700 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
