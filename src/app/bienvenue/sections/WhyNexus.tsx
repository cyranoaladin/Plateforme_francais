'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { track } from '@/components/analytics/events';

const AUDIENCE_CARDS = [
  {
    icon: GraduationCap,
    title: "Pour l\u2019élève",
    body: "Le produit dit quoi faire maintenant, quoi reprendre ensuite et comment progresser sans se disperser.",
  },
  {
    icon: UsersRound,
    title: 'Pour les parents',
    body: "La valeur perçue vient d’un cadre visible : workflow clair, garde-fous nets, progression compréhensible.",
  },
  {
    icon: ShieldCheck,
    title: 'Pour les enseignants',
    body: 'Le langage, les formats et les priorités restent compatibles avec les attendus EAF, pas avec un outil généraliste déconnecté du programme.',
  },
];

const COMPARISON_ROWS = [
  {
    label: 'Structure du travail',
    generic: 'Une réponse isolée à chaque prompt, sans mémoire réelle du parcours.',
    nexus: 'Un flux continu : produire, corriger, relancer, puis prioriser la suite.',
  },
  {
    label: 'Cadre pédagogique',
    generic: 'Risque de dérive vers la copie complète ou le corrigé prêt à rendre.',
    nexus: 'Refus de la copie intégrale et redirection vers une aide exploitable et méthodique.',
  },
  {
    label: 'Références',
    generic: 'Sources peu lisibles ou réponses déconnectées du cadre EAF.',
    nexus: 'Citations internes, corpus mobilisable et références rendues visibles quand elles comptent.',
  },
  {
    label: 'Format EAF',
    generic: "Pas de structure native pour l\u2019oral, les barèmes officiels ou les ateliers vraiment scolaires.",
    nexus: 'Oral cadré en /2 /8 /2 /8, ateliers dédiés et retour réutilisable séance après séance.',
  },
];

const FRICTION_POINTS = [
  'Inscription gratuite',
  'Prêt en 3 minutes',
  "Premiers ateliers accessibles dès l\u2019arrivée",
];

export function WhyNexus() {
  return (
    <section id="pourquoi-nexus" className="scroll-mt-24 py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Pourquoi cette page convertit</p>
              <h2
                className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
              >
                Un bon produit EAF doit convaincre trois personnes en même temps.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
                L’élève veut une aide actionnable. Le parent veut un cadre crédible. L’enseignant doit reconnaître
                une logique scolaire sérieuse. La landing doit rendre ce triangle évident dès les premiers scrolls.
              </p>

              <div className="mt-8 grid gap-3">
                {AUDIENCE_CARDS.map((card) => (
                  <article key={card.title} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)] text-[var(--bg-page)]">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--c-primary)]">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{card.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/login?mode=register"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_register', path: '/bienvenue' } })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-6 py-3.5 text-sm font-bold text-[var(--bg-page)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
                >
                  Essayer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_pricing', path: '/bienvenue' } })}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:bg-[var(--bg-surface)]"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {FRICTION_POINTS.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-body)]"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[var(--c-primary)] p-5 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">Différenciation utile</p>
                  <h3 className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                    Là où un outil généraliste s'arrête à une réponse, Nexus construit une continuité de travail.
                  </h3>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-amber-300)]">
                  Comparaison produit
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">{row.label}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Outil généraliste</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{row.generic}</p>
                      </div>
                      <div className="rounded-[22px] bg-[var(--bg-surface-secondary)] p-4 text-[var(--c-primary)]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nexus Réussite</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{row.nexus}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[var(--c-primary-active)] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber-300)]" />
                  <p className="text-sm leading-6 text-slate-200">
                    L’objectif n’est pas de paraître « intelligent ». L’objectif est de rendre le travail plus cadré,
                    plus crédible et plus simple à reprendre d’une séance à l’autre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
