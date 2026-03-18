'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, PenSquare, RefreshCcw } from 'lucide-react';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const STEPS = [
  {
    number: '01',
    title: 'Cadrer le point de départ',
    icon: Compass,
    description: 'Œuvres choisies, objectifs, niveau perçu, contraintes de rythme : la plateforme comprend d’abord le terrain de jeu.',
    student: 'L’élève renseigne son profil, ses œuvres et son niveau de départ.',
    platform: 'Nexus construit une base de progression cohérente et prépare les premiers ateliers.',
  },
  {
    number: '02',
    title: 'Produire dans un format exigeant',
    icon: PenSquare,
    description: 'Chaque atelier force une production concrète : réponse orale, analyse, correction de langue, copie déposée.',
    student: 'L’élève écrit, parle, justifie, reprend et corrige.',
    platform: 'La plateforme balise la méthode, cite les références utiles et refuse les demandes de copie intégrale.',
  },
  {
    number: '03',
    title: 'Réinjecter les retours au bon endroit',
    icon: RefreshCcw,
    description: 'Le retour n’est pas décoratif : il alimente les signaux faibles, le parcours et les prochaines relances.',
    student: 'L’élève sait précisément quoi retravailler et dans quel ordre.',
    platform: 'Nexus priorise les lacunes, propose la séance suivante et garde une mémoire utile.',
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">La méthode</p>
          <h2
            style={EDITORIAL_HEADING}
            className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl"
          >
            Une mécanique de progression, pas une accumulation d{'\u2019'}outils.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
            La différence n{'\u2019'}est pas dans le nombre de modules. Elle est dans la continuité entre le diagnostic,
            la production, la correction et la relance. Tout est pensé pour réduire la dispersion.
          </p>

          <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Ce que la page promet</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-body)]">
              {[
                'Une mise en route réellement utile, pas décorative.',
                'Des ateliers qui débouchent sur une production concrète.',
                'Chaque retour transformé en prochaine action.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--teal)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'how_it_works_register', path: '/bienvenue' } })}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-bold text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]"
            >
              Configurer mon parcours
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          {STEPS.map((step, index) => (
            <article
              key={step.number}
              className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] [animation:bienvenueFadeUp_.8s_ease-out_both]"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy)] text-sm font-bold text-[var(--surface-parchment)]">
                      {step.number}
                    </span>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-warm-accent)] text-[var(--teal)]">
                      <step.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 style={EDITORIAL_HEADING} className="mt-5 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{step.description}</p>
                </div>

                <div className="grid gap-3 md:w-[21rem]">
                  <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Côté élève</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{step.student}</p>
                  </div>
                  <div className="rounded-[24px] bg-[var(--navy)] p-4 text-[var(--surface-parchment)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Côté Nexus</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{step.platform}</p>
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
