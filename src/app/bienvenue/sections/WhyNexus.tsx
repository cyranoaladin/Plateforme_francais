'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const AUDIENCE_CARDS = [
  {
    icon: GraduationCap,
    title: 'Pour l’élève',
    body: 'Le produit dit quoi faire maintenant, quoi reprendre ensuite et comment progresser sans se disperser.',
  },
  {
    icon: UsersRound,
    title: 'Pour les parents',
    body: 'La valeur perçue vient d’un cadre visible : workflow clair, garde-fous nets, progression compréhensible.',
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
    label: 'Anti-triche',
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
    generic: 'Pas de structure native pour l’oral, les barèmes officiels ou les ateliers vraiment scolaires.',
    nexus: 'Oral cadré en /2 /8 /2 /8, ateliers dédiés et retour réutilisable séance après séance.',
  },
];

const FRICTION_POINTS = [
  'Inscription gratuite',
  'Onboarding en ~3 minutes',
  'Premiers ateliers accessibles dès l’arrivée',
];

export function WhyNexus() {
  return (
    <section id="pourquoi-nexus" className="scroll-mt-24 py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-[#d8ccb9] bg-white/80 p-6 shadow-[0_18px_55px_rgba(23,50,77,0.07)] md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Pourquoi cette page convertit</p>
              <h2
                style={EDITORIAL_HEADING}
                className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl"
              >
                Un bon produit EAF doit convaincre trois personnes en même temps.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                L’élève veut une aide actionnable. Le parent veut un cadre crédible. L’enseignant doit reconnaître
                une logique scolaire sérieuse. La landing doit rendre ce triangle évident dès les premiers scrolls.
              </p>

              <div className="mt-8 grid gap-3">
                {AUDIENCE_CARDS.map((card) => (
                  <article key={card.title} className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#17324d] text-[#f7f2ea]">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#17324d]">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/login?mode=register"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_register', path: '/bienvenue' } })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17324d] px-6 py-3.5 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]"
                >
                  Essayer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_pricing', path: '/bienvenue' } })}
                  className="inline-flex items-center justify-center rounded-full border border-[#cabaa5] bg-white px-6 py-3.5 text-sm font-semibold text-[#17324d] transition-colors hover:bg-[#fcfaf6]"
                >
                  Voir les plans
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {FRICTION_POINTS.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-[#d8ccb9] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-[#17324d] p-5 text-[#f7f2ea] shadow-[0_26px_70px_rgba(23,50,77,0.16)] md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Différenciation utile</p>
                  <h3 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                    Là où un outil généraliste s arrête à une réponse, Nexus construit une continuité de travail.
                  </h3>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#e7dbc9]">
                  comparaison produit
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.label} className="rounded-[26px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">{row.label}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Outil généraliste</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{row.generic}</p>
                      </div>
                      <div className="rounded-[22px] bg-[#f4efe5] p-4 text-[#17324d]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nexus Réussite</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{row.nexus}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[26px] border border-white/10 bg-[#0f2740] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                  <p className="text-sm leading-6 text-slate-200">
                    L’objectif n’est pas de paraître “intelligent”. L’objectif est de rendre le travail plus cadré,
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
