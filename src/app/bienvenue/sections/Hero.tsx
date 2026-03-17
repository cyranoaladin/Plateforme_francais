'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  ChartColumn,
  Clock3,
  LibraryBig,
  ShieldCheck,
} from 'lucide-react';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const MICRO_PROOFS = [
  'Oral officiel : /2 /8 /2 /8',
  'Aucun paiement avant essai',
  'Anti-copie actif',
  'Sources internes visibles',
];

const FRICTION_REMOVERS = [
  'Inscription gratuite',
  'Onboarding ~3 minutes',
  'Voir le produit avant de payer',
];

const HERO_STATS = [
  { value: '3 min', label: 'pour un onboarding cadré' },
  { value: '4 ateliers', label: 'écrit, oral, langue, quiz' },
  { value: '12 œuvres', label: 'du programme voie générale' },
  { value: '1 cockpit', label: 'pour piloter la progression' },
];

const ORAL_PHASES = [
  { label: 'Lecture', score: '2/2' },
  { label: 'Explication', score: '6/8' },
  { label: 'Grammaire', score: '1.5/2' },
  { label: 'Entretien', score: '7/8' },
];

const SIGNALS = [
  { label: 'Question de grammaire', width: '72%' },
  { label: 'Structure de plan', width: '86%' },
  { label: 'Citations précises', width: '64%' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border-strong)]/70">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:px-8 lg:pb-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="max-w-3xl [animation:bienvenueFadeUp_.8s_ease-out_both]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--navy)] shadow-sm">
              <BadgeCheck className="h-4 w-4 text-[var(--teal)]" />
              Parcours EAF complet
            </div>

            <h1
              style={EDITORIAL_HEADING}
              className="mt-7 text-5xl leading-[0.96] tracking-[-0.04em] text-[var(--navy)] sm:text-6xl lg:text-7xl"
            >
              La préparation EAF qui se laisse vérifier avant d’être achetée,
              <span className="block text-[var(--teal)]">puis accompagne vraiment quand le rythme monte.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Nexus Réussite rassemble écrit, oral, langue, corpus officiel et historique de progression dans un même flux de travail.
              Tu vois le vrai produit en gratuit, tu mesures la qualité du cadre, puis tu montes en puissance seulement si le volume de travail le justifie.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login?mode=register"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_register', path: '/bienvenue' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-6 py-3.5 text-base font-bold text-[var(--surface-parchment)] shadow-[var(--shadow-lg)] transition-all hover:-translate-y-0.5 hover:bg-[var(--navy-dark)]"
              >
                Créer mon espace gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#comment-ca-marche"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_method', path: '/bienvenue' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-white/85 px-6 py-3.5 text-base font-semibold text-[var(--navy)] transition-colors hover:bg-white"
              >
                Voir la méthode
              </a>
              <Link
                href="/pricing"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_pricing', path: '/bienvenue' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-[var(--navy)]"
              >
                Comparer les plans
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {FRICTION_REMOVERS.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {MICRO_PROOFS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border-strong)] bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative [animation:bienvenueFadeUp_.95s_ease-out_.12s_both]">
            <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-full bg-[var(--gold-muted)]/18 blur-2xl lg:block" />
            <div className="absolute -right-4 top-20 hidden h-16 w-16 rounded-full bg-[var(--teal)]/20 blur-2xl lg:block [animation:bienvenueFloat_8s_ease-in-out_infinite]" />

            <div className="rounded-[24px] border border-white/10 bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-on-navy-soft)]">Cockpit élève</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white">
                    Une séance, des retours immédiatement exploitables.
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--surface-parchment)]">
                  <Clock3 className="h-3.5 w-3.5 text-[var(--text-on-navy-soft)]" />
                  Session 2026
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--border-warm)]">Simulation orale</p>
                    <p className="mt-1 text-sm text-slate-200">Score ventilé selon le format officiel, sans zone floue.</p>
                  </div>
                  <div className="rounded-full bg-[var(--teal)]/25 px-3 py-1 text-xs font-bold text-[var(--surface-parchment)]">16.5 / 20</div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ORAL_PHASES.map((phase) => (
                    <div key={phase.label} className="rounded-2xl border border-white/10 bg-[var(--navy-dark)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{phase.label}</p>
                      <p className="mt-2 text-lg font-bold text-white">{phase.score}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <LibraryBig className="h-4 w-4 text-[var(--text-on-navy-soft)]" />
                    Citations internes mobilisées
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-200">
                    <li className="rounded-2xl bg-black/10 px-3 py-2">BO 2025, annexe 3 — attendus de l{'\u2019'}explication</li>
                    <li className="rounded-2xl bg-black/10 px-3 py-2">Rapport jury EAF 2024 — erreurs fréquentes à l{'\u2019'}oral</li>
                    <li className="rounded-2xl bg-black/10 px-3 py-2">Œuvre au programme — extrait contextualisé</li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ChartColumn className="h-4 w-4 text-[var(--text-on-navy-soft)]" />
                    Axes prioritaires de relance
                  </div>
                  <div className="mt-4 space-y-4">
                    {SIGNALS.map((signal) => (
                      <div key={signal.label}>
                        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-300">
                          <span>{signal.label}</span>
                          <span>à retravailler</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-gradient-to-r from-[var(--gold-muted)] to-[var(--teal)]" style={{ width: signal.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] bg-[var(--surface-cream)] p-4 text-[var(--navy)] shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Chaîne de valeur</p>
                    <p className="mt-1 text-base font-semibold">Copie déposée → correction structurée → rapport PDF → relance ciblée</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-3 py-1.5 text-xs font-bold text-[var(--surface-parchment)]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    anti-copie actif
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HERO_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-[24px] border border-[var(--border-strong)] bg-white/80 px-5 py-5 shadow-[var(--shadow-sm)] [animation:bienvenueFadeUp_.8s_ease-out_both]"
              style={{ animationDelay: `${0.18 + index * 0.08}s` }}
            >
              <p style={EDITORIAL_HEADING} className="text-3xl tracking-[-0.03em] text-[var(--navy)]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
