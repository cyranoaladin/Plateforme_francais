import React from 'react';

interface Testimonial {
  initials: string;
  name: string;
  school: string;
  color: 'brand' | 'info' | 'success';
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
    color: 'brand',
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
    color: 'info',
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
    color: 'success',
    before: 'grammaire catastrophique',
    after: '0 faute',
    mention: '',
    quote:
      'L&apos;atelier Langue a transformé ma copie. Mon prof n&apos;en revenait pas : zéro faute au dernier devoir.',
  },
];

const colorMap: Record<Testimonial['color'], { bg: string; text: string; badge: string }> = {
  brand: { bg: 'bg-brand-subtle', text: 'text-brand', badge: 'bg-brand-subtle text-brand' },
  info: { bg: 'bg-[var(--info-bg)]', text: 'text-info', badge: 'bg-[var(--info-bg)] text-info' },
  success: { bg: 'bg-success-subtle', text: 'text-success', badge: 'bg-success-subtle text-success' },
};

export function TestimonialsSection() {
  return (
    <section className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-heading sm:text-3xl lg:text-4xl">
          Ils ont transformé leurs notes
        </h2>
        <p className="mt-3 text-center text-body">
          Des résultats concrets, vérifiables, reproductibles.
        </p>

        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {testimonials.map((t) => {
            const colors = colorMap[t.color];
            return (
              <div
                key={t.initials}
                className="flex min-w-[300px] shrink-0 flex-col rounded-2xl bg-surface p-6 shadow-md snap-center sm:min-w-0 sm:shrink"
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
                    <p className="font-semibold text-heading">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.school}</p>
                  </div>
                </div>

                {/* Transformation badge */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">{t.before}</span>
                  <span className="text-muted-foreground">&rarr;</span>
                  <span className={'rounded-full px-3 py-0.5 font-semibold ' + colors.badge}>
                    {t.after}
                  </span>
                  {t.mention && (
                    <span className="text-xs font-medium text-muted-foreground">{t.mention}</span>
                  )}
                </div>

                {/* Quote */}
                <blockquote className="mt-4 flex-1 text-sm italic text-body">
                  &laquo;&nbsp;{t.quote}&nbsp;&raquo;
                </blockquote>

                {/* Stats footer */}
                <div className="mt-4 border-t border-[var(--border-default)] pt-3">
                  <p className="text-xs text-muted-foreground">
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
