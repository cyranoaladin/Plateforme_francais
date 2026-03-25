'use client';

import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      "C'est exactement ce que je cherchais pour mon fils. Interface claire, progrès mesurables, et mon fils reste motivé.",
    author: 'Sophie M.',
    role: 'Mère, Lyon',
    metric: '+42% en compréhension',
    avatar: '👩‍👦',
  },
  {
    quote:
      'Le suivi en temps réel me rassure. Je vois précisément où mon enfant progresse et où il a besoin de soutien.',
    author: 'Jean P.',
    role: 'Père, Bordeaux',
    metric: '3.8/5 en écriture',
    avatar: '👨‍👧',
  },
  {
    quote:
      'Enfin une plateforme qui prend le français au sérieux. Le contenu est riche, pas infantilisant, et les résultats parlent.',
    author: 'Isabelle V.',
    role: 'Enseignante, Paris',
    metric: 'Recommandé à 12 parents',
    avatar: '👩‍🏫',
  },
  {
    quote:
      'Mon enfant a gagné en confiance. Il comprend mieux la grammaire et adore les leçons interactives.',
    author: 'Marc T.',
    role: 'Parent, Toulouse',
    metric: '+1.5 points de moyenne',
    avatar: '👨‍💼',
  },
] as const;

export function PremiumTestimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-gradient-to-b from-indigo-50/30 via-white to-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="text-balance font-playfair text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Témoignages de parents et d'enseignants
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 sm:mt-6">
            Découvrez comment notre plateforme transforme l'apprentissage du
            français.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <Card
              key={testimonial.author}
              variant="default"
              padding="lg"
              className="border border-slate-200/60 bg-gradient-to-br from-white to-indigo-50/20 hover:border-indigo-300/60 hover:shadow-lg transition-all duration-300"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 leading-relaxed text-slate-700">
                "{testimonial.quote}"
              </p>

              {/* Metric Badge */}
              <div className="mb-4 inline-flex items-center rounded-full bg-emerald-100/60 px-3 py-1">
                <span className="text-xs font-semibold text-emerald-700">
                  {testimonial.metric}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">{testimonial.avatar}</div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
