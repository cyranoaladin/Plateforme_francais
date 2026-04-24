'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, UsersRound } from '@/components/ui/icons';
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
    body: "La valeur perçue vient d'un cadre visible : workflow clair, garde-fous nets, progression compréhensible.",
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
        <div 
          className="rounded-[var(--eaf-radius-2xl)] border p-6 shadow-md md:p-8 lg:p-10"
          style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
        >
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-teal)]">Pourquoi cette page convertit</p>
              <h2
                className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--eaf-orange)] sm:text-5xl"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                Un bon produit EAF doit convaincre trois personnes en même temps.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--eaf-text-secondary)]">
                L'élève veut une aide actionnable. Le parent veut un cadre crédible. L'enseignant doit reconnaître
                une logique scolaire sérieuse. La landing doit rendre ce triangle évident dès les premiers scrolls.
              </p>

              <div className="mt-8 grid gap-3">
                {AUDIENCE_CARDS.map((card) => (
                  <article 
                    key={card.title} 
                    className="rounded-[var(--eaf-radius-2xl)] border p-4"
                    style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[var(--eaf-orange)]"
                        style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
                      >
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--eaf-orange)]">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--eaf-text-secondary)]">{card.body}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/login?mode=register"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_register', path: '/' } })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--eaf-orange)] px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-active)]"
                >
                  Essayer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => track({ name: 'cta_click', props: { cta: 'why_nexus_pricing', path: '/' } })}
                  className="inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-sm font-semibold text-[var(--eaf-orange)] transition-colors hover:bg-[var(--eaf-bg3)]"
                  style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {FRICTION_POINTS.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border px-3.5 py-1.5 text-xs font-semibold text-[var(--eaf-text-secondary)]"
                    style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div 
              className="rounded-[var(--eaf-radius-2xl)] p-5 shadow-md md:p-6"
              style={{ 
                background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
                border: '1px solid var(--eaf-indigo-border)'
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Différenciation utile</p>
                  <h3 
                    className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white"
                    style={{ fontFamily: 'var(--eaf-font-display)' }}
                  >
                    Là où un outil généraliste s'arrête à une réponse, Nexus construit une continuité de travail.
                  </h3>
                </div>
                <div 
                  className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--eaf-gold)]"
                  style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                >
                  Comparaison produit
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {COMPARISON_ROWS.map((row) => (
                  <div 
                    key={row.label} 
                    className="rounded-[var(--eaf-radius-2xl)] border p-4"
                    style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">{row.label}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div 
                        className="rounded-[var(--eaf-radius-xl)] border p-4"
                        style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--eaf-text-tertiary)]">Outil généraliste</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--eaf-text-secondary)]">{row.generic}</p>
                      </div>
                      <div 
                        className="rounded-[var(--eaf-radius-xl)] border p-4 text-[var(--eaf-orange)]"
                        style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--eaf-text-tertiary)]">Nexus Réussite</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--eaf-text-primary)]">{row.nexus}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div 
                className="mt-6 rounded-[var(--eaf-radius-2xl)] border p-4"
                style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--eaf-gold)]" />
                  <p className="text-sm leading-6 text-[var(--eaf-text-secondary)]">
                    L'objectif n'est pas de paraître « intelligent ». L'objectif est de rendre le travail plus cadré,
                    plus crédible et plus simple à reprendre d'une séance à l'autre.
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
