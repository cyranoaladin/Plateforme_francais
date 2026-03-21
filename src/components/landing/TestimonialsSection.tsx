import React from 'react';

interface Testimonial {
  initials: string;
  name: string;
  school: string;
  color: 'sapphire' | 'blue' | 'teal';
  before: string;
  after: string;
  mention: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    initials: 'MK',
    name: 'Mehdi K.',
    school: 'Lycée Pierre Mendès France Tunis',
    color: 'sapphire',
    before: '8/20',
    after: '16/20',
    mention: 'Mention Bien',
    quote:
      'Les simulations d&apos;oral m&apos;ont permis de prendre confiance. Le jour J, j&apos;avais l&apos;impression d&apos;avoir déjà passé l&apos;épreuve dix fois.',
  },
  {
    initials: 'SL',
    name: 'Sarah L.',
    school: 'Lycée International Lyon',
    color: 'blue',
    before: '9/20',
    after: '14/20',
    mention: 'Mention AB',
    quote:
      'ChatGPT me donnait des réponses génériques. Nexus corrige avec le barème réel et mes parents suivent tout depuis leur tableau de bord.',
  },
  {
    initials: 'YB',
    name: 'Youssef B.',
    school: 'Lycée Carthage Présidence Tunis',
    color: 'teal',
    before: 'grammaire catastrophique',
    after: '0 faute',
    mention: '',
    quote:
      'L&apos;atelier Langue a transformé ma copie. Mon prof n&apos;en revenait pas : zéro faute au dernier devoir.',
  },
];

const colorMap: Record<Testimonial['color'], { bg: string; text: string; badge: string }> = {
  sapphire: { bg: 'bg-sapphire-50', text: 'text-sapphire-700', badge: 'bg-sapphire-50 text-sapphire-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
};

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Ils ont transformé leurs notes
        </h2>
        <p className="mt-3 text-center text-gray-600">
          Des résultats concrets, vérifiables, reproductibles.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => {
            const colors = colorMap[t.color];
            return (
              <div
                key={t.initials}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-md"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div
                    className={
                      'flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ' +
                      colors.bg +
                      ' ' +
                      colors.text
                    }
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.school}</p>
                  </div>
                </div>

                {/* Transformation badge */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-400 line-through">{t.before}</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className={'rounded-full px-3 py-0.5 font-semibold ' + colors.badge}>
                    {t.after}
                  </span>
                  {t.mention && (
                    <span className="text-xs font-medium text-gray-500">{t.mention}</span>
                  )}
                </div>

                {/* Quote */}
                <blockquote className="mt-4 flex-1 text-sm italic text-gray-600">
                  &laquo;&nbsp;{t.quote}&nbsp;&raquo;
                </blockquote>

                {/* Stats footer */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">
                    {t.before} &rarr; {t.after}
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
