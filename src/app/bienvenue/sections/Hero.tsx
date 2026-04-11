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

const MICRO_PROOFS = [
  'Oral officiel : /2 /8 /2 /8',
  'Aucun paiement avant essai',
  'Anti-copie actif',
  'Sources internes visibles',
];

const FRICTION_REMOVERS = [
  'Inscription gratuite',
  'Prêt en 3 minutes',
  'Voir le produit avant de payer',
];

const HERO_STATS = [
  { value: '3 min', label: 'pour configurer ton parcours', animationClass: 'animation-delay-180' },
  { value: '4 ateliers', label: 'écrit, oral, langue, quiz', animationClass: 'animation-delay-260' },
  { value: '12 œuvres', label: 'du programme voie générale', animationClass: 'animation-delay-340' },
  { value: '1 tableau de bord', label: 'pour suivre ta progression', animationClass: 'animation-delay-420' },
];

const ORAL_PHASES = [
  { label: 'Lecture', score: '2/2' },
  { label: 'Explication', score: '6/8' },
  { label: 'Grammaire', score: '1.5/2' },
  { label: 'Entretien', score: '7/8' },
];

const SIGNALS = [
  { label: 'Question de grammaire', widthClass: 'w-[72%]' },
  { label: 'Structure de plan', widthClass: 'w-[86%]' },
  { label: 'Citations précises', widthClass: 'w-[64%]' },
];

export function Hero() {
  return (
    <section 
      className="relative overflow-hidden border-b border-[var(--eaf-indigo-border)]"
      style={{ background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)' }}
    >
      {/* Decorative orb */}
      <div 
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px]"
        style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
      />
      <div 
        className="pointer-events-none absolute -left-20 top-1/2 h-[400px] w-[400px]"
        style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.05), transparent 70%)' }}
      />
      
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:px-8 lg:pb-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="max-w-3xl animate-bienvenue-fade-up">
            <div 
              className="inline-flex items-center gap-2 rounded-full border border-[var(--eaf-border)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--eaf-orange)]"
              style={{ background: 'var(--eaf-bg3)' }}
            >
              <BadgeCheck className="h-4 w-4 text-[var(--eaf-teal)]" />
              Parcours EAF complet
            </div>

            <h1
              className="mt-7 text-5xl leading-[0.96] tracking-[-0.04em] text-[var(--eaf-orange)] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: 'var(--eaf-font-display)' }}
            >
              La préparation EAF qui se laisse vérifier avant d'être achetée,
              <span className="block text-[var(--eaf-teal)]">puis accompagne vraiment quand le rythme monte.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--eaf-text-secondary)] sm:text-xl">
              Nexus Réussite rassemble écrit, oral, langue, corpus officiel et historique de progression dans un même flux de travail.
              Tu vois le vrai produit en gratuit, tu mesures la qualité du cadre, puis tu montes en puissance seulement si le volume de travail le justifie.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/login?mode=register"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_register', path: '/' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--eaf-orange)] px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-active)]"
              >
                Créer mon espace gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#comment-ca-marche"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_method', path: '/' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--eaf-border)] px-6 py-3.5 text-base font-semibold text-[var(--eaf-orange)] transition-colors hover:bg-[var(--eaf-bg2)]"
                style={{ background: 'var(--eaf-bg2)' }}
              >
                Voir la méthode
              </a>
              <Link
                href="/pricing"
                onClick={() => track({ name: 'cta_click', props: { cta: 'hero_pricing', path: '/' } })}
                className="inline-flex items-center justify-center gap-2 rounded-full px-2 py-3 text-sm font-semibold text-[var(--eaf-text-secondary)] transition-colors hover:text-[var(--eaf-orange)]"
              >
                Comparer les plans
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--eaf-text-secondary)]">
              {FRICTION_REMOVERS.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--eaf-teal)]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {MICRO_PROOFS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--eaf-border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--eaf-text-secondary)]"
                  style={{ background: 'var(--eaf-bg3)' }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-bienvenue-fade-up-delay-1">
            <div 
              className="absolute -left-6 top-12 hidden h-24 w-24 rounded-full lg:block"
              style={{ background: 'var(--eaf-gold)', opacity: 0.18, filter: 'blur(30px)' }}
            />
            <div 
              className="absolute -right-4 top-20 hidden h-16 w-16 rounded-full lg:block animate-bienvenue-float"
              style={{ background: 'var(--eaf-teal)', opacity: 0.2, filter: 'blur(20px)' }}
            />

            <div 
              className="rounded-[var(--eaf-radius-2xl)] border p-6 text-white shadow-lg md:p-8"
              style={{ 
                background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
                borderColor: 'var(--eaf-indigo-border)'
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--eaf-text-tertiary)]">Ton tableau de bord</p>
                  <h2 
                    className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-white"
                    style={{ fontFamily: 'var(--eaf-font-display)' }}
                  >
                    Une séance, des retours immédiatement exploitables.
                  </h2>
                </div>
                <div 
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--eaf-text-secondary)]"
                  style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                >
                  <Clock3 className="h-3.5 w-3.5 text-[var(--eaf-text-tertiary)]" />
                  Session 2026
                </div>
              </div>

              <div 
                className="mt-6 rounded-[var(--eaf-radius-2xl)] border p-4"
                style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--eaf-gold)]">Simulation orale</p>
                    <p className="mt-1 text-sm text-[var(--eaf-text-secondary)]">Score ventilé selon le format officiel, sans zone floue.</p>
                  </div>
                  <div 
                    className="rounded-full px-3 py-1 text-xs font-bold text-[var(--eaf-orange)]"
                    style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                  >
                    16.5 / 20
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ORAL_PHASES.map((phase) => (
                    <div 
                      key={phase.label} 
                      className="rounded-[var(--eaf-radius-lg)] border px-3 py-3"
                      style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--eaf-text-tertiary)]">{phase.label}</p>
                      <p className="mt-2 text-lg font-bold text-[var(--eaf-text-primary)]">{phase.score}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div 
                  className="rounded-[var(--eaf-radius-2xl)] border p-4"
                  style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--eaf-text-primary)]">
                    <LibraryBig className="h-4 w-4 text-[var(--eaf-text-tertiary)]" />
                    Citations internes mobilisées
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-[var(--eaf-text-secondary)]">
                    <li 
                      className="rounded-[var(--eaf-radius-lg)] px-3 py-2"
                      style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                    >
                      BO 2025, annexe 3 — attendus de l{'\u2019'}explication
                    </li>
                    <li 
                      className="rounded-[var(--eaf-radius-lg)] px-3 py-2"
                      style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                    >
                      Rapport jury EAF 2024 — erreurs fréquentes à l{'\u2019'}oral
                    </li>
                    <li 
                      className="rounded-[var(--eaf-radius-lg)] px-3 py-2"
                      style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                    >
                      Œuvre au programme — extrait contextualisé
                    </li>
                  </ul>
                </div>

                <div 
                  className="rounded-[var(--eaf-radius-2xl)] border p-4"
                  style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--eaf-text-primary)]">
                    <ChartColumn className="h-4 w-4 text-[var(--eaf-text-tertiary)]" />
                    Axes prioritaires de relance
                  </div>
                  <div className="mt-4 space-y-4">
                    {SIGNALS.map((signal) => (
                      <div key={signal.label}>
                        <div className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--eaf-text-tertiary)]">
                          <span>{signal.label}</span>
                          <span>à retravailler</span>
                        </div>
                        <div 
                          className="h-2 rounded-full"
                          style={{ background: 'var(--eaf-bg3)' }}
                        >
                          <div className={`h-2 rounded-full bg-gradient-to-r from-[var(--eaf-gold)] to-[var(--eaf-teal)] ${signal.widthClass}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div 
                className="mt-4 rounded-[var(--eaf-radius-2xl)] p-4"
                style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-text-tertiary)]">Chaîne de valeur</p>
                    <p className="mt-1 text-base font-semibold text-[var(--eaf-text-primary)]">Copie déposée → correction structurée → rapport PDF → relance ciblée</p>
                  </div>
                  <div 
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-[var(--eaf-orange)]"
                    style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    anti-copie actif
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-[var(--eaf-radius-2xl)] border px-5 py-5 shadow-sm animate-bienvenue-fade-up ${stat.animationClass}`}
              style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
            >
              <p 
                className="text-3xl tracking-[-0.03em] text-[var(--eaf-orange)]"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--eaf-text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
