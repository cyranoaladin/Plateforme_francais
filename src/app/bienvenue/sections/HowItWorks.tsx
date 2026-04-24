'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, PenSquare, RefreshCcw } from '@/components/ui/icons';
import { track } from '@/components/analytics/events';

const STEPS = [
  {
    number: '01',
    title: 'Cadrer le point de départ',
    icon: Compass,
    animationClass: 'animation-delay-100',
    description: 'Œuvres choisies, objectifs, niveau perçu, contraintes de rythme : la plateforme comprend d\u2019abord le terrain de jeu.',
    student: 'L\u2019élève renseigne son profil, ses œuvres et son niveau de départ.',
    platform: 'Nexus construit une base de progression cohérente et prépare les premiers ateliers.',
  },
  {
    number: '02',
    title: 'Produire dans un format exigeant',
    icon: PenSquare,
    animationClass: 'animation-delay-180',
    description: 'Chaque atelier force une production concrète : réponse orale, analyse, correction de langue, copie déposée.',
    student: 'L\u2019élève écrit, parle, justifie, reprend et corrige.',
    platform: 'La plateforme balise la méthode, cite les références utiles et refuse les demandes de copie intégrale.',
  },
  {
    number: '03',
    title: 'Réinjecter les retours au bon endroit',
    icon: RefreshCcw,
    animationClass: 'animation-delay-260',
    description: 'Le retour n\u2019est pas décoratif : il alimente les points à surveiller, le parcours et les prochaines relances.',
    student: 'L\u2019élève sait précisément quoi retravailler et dans quel ordre.',
    platform: 'Nexus priorise les lacunes, propose la séance suivante et garde une mémoire utile.',
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-teal)]">La méthode</p>
          <h2
            className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)] sm:text-5xl"
            style={{ fontFamily: 'var(--eaf-font-display)' }}
          >
            Une mécanique de progression, pas une accumulation d'outils.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--eaf-text-secondary)]">
            La différence n'est pas dans le nombre de modules. Elle est dans la continuité entre le diagnostic,
            la production, la correction et la relance. Tout est pensé pour réduire la dispersion.
          </p>

          <div 
            className="mt-8 rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md"
            style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-text-tertiary)]">Ce que la page promet</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--eaf-text-secondary)]">
              {[
                'Une mise en route réellement utile, pas décorative.',
                'Des ateliers qui débouchent sur une production concrète.',
                'Chaque retour transformé en prochaine action.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--eaf-teal)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'how_it_works_register', path: '/' } })}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--eaf-orange)] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-active)]"
            >
              Configurer mon parcours
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          {STEPS.map((step) => (
            <article
              key={step.number}
              className={`rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md animate-bienvenue-fade-up ${step.animationClass}`}
              style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span 
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
                      style={{ background: 'var(--eaf-orange)' }}
                    >
                      {step.number}
                    </span>
                    <div 
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--eaf-teal)]"
                      style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 
                    className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)]"
                    style={{ fontFamily: 'var(--eaf-font-display)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--eaf-text-secondary)] sm:text-base">{step.description}</p>
                </div>

                <div className="grid gap-3 md:w-[21rem]">
                  <div 
                    className="rounded-[var(--eaf-radius-2xl)] border p-4"
                    style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-text-tertiary)]">Côté élève</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--eaf-text-secondary)]">{step.student}</p>
                  </div>
                  <div 
                    className="rounded-[var(--eaf-radius-2xl)] border p-4"
                    style={{ background: 'var(--eaf-orange)', borderColor: 'var(--eaf-orange-active)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Côté Nexus</p>
                    <p className="mt-2 text-sm leading-6 text-white/90">{step.platform}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
