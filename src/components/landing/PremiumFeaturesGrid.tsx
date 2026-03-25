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
  },
  {
    icon: BarChart3,
    title: 'Suivi en temps réel',
    description:
      'Tableaux de bord clairs pour parents et élèves. Comprenez la progression sans surcharge de données.',
  },
  {
    icon: BookOpen,
    title: 'Parcours personnalisé',
    description:
      'IA intelligente qui s\'adapte au rythme et au style d\'apprentissage. Jamais trop facile, jamais trop difficile.',
  },
  {
    icon: Target,
    title: 'Objectifs clairs',
    description:
      'Jalons de performance visibles. Célébrez les petites victoires pour maintenir la motivation.',
  },
  {
    icon: Users,
    title: 'Support pédagogique',
    description:
      'Questions des élèves répondues rapidement. Enseignants et experts disponibles pour clarifier les concepts.',
  },
  {
    icon: Shield,
    title: 'Confiance & sécurité',
    description:
      'Données protégées. Aucun partage tiers. Respect strict des normes RGPD françaises.',
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
              <Card
                key={feature.title}
                variant="default"
                padding="lg"
                className="group border border-slate-200/60 bg-gradient-to-br from-white to-indigo-50/40 hover:border-indigo-300/60 hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="mb-2 font-playfair text-lg font-700 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
