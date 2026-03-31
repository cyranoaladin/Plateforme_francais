/**
 * Hero — Main hero section with urgency, promise, and hierarchical CTAs.
 * Dependencies: ./CountdownBadge
 */
'use client';

import Link from 'next/link';
import { CountdownBadge } from './CountdownBadge';
import { ROUTES } from '@/lib/routes';

const HERO_COPY = {
  eyebrow: 'Oral, écrit, tuteur et suivi réel',
  titleLead: 'La préparation EAF qui fait enfin',
  titleAccent: 'travailler juste.',
  body: 'Nexus transforme l\u2019entraînement en pilotage concret\u00A0: simulation orale officielle, correction écrite rapide, tuteur pédagogique et progression suivie sans rédiger à ta place.',
  primaryCta: 'Commencer gratuitement - 3 min',
  secondaryCta: 'Voir la démo en 45 s',
  previewEyebrow: 'Simulation orale',
  previewTitle: 'Lecture, explication, grammaire, entretien',
  previewBadge: 'BO 2026',
  cards: {
    quick: 'Repère rapide',
    correction: 'Correction',
    posture: 'Posture',
    quickValue: '/2 /8 /2 /8',
    correctionValue: '3 min',
    postureValue: 'Anti-copie',
    quickBody: 'Grille orale officielle directement exploitable.',
    correctionBody: 'Retour immédiat sur l\u2019écrit et les axes de progression.',
    postureBody: 'Le système guide, questionne et entraîne sans faire à ta place.',
  },
  previewMeta: {
    diagnostic: 'Diagnostic',
    diagnosticValue: 'Axes prioritaires',
    feedback: 'Feedback',
    feedbackValue: 'Commentaires utiles',
    tracking: 'Suivi',
    trackingValue: 'Progression lisible',
  },
} as const;

const TRUST_ITEMS = [
  'Pas de carte bancaire',
  'Freemium illimité en temps',
  'Sources BO 2026 officielles',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-900 px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-36 lg:pb-28 lg:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute left-[8%] top-[18%] h-80 w-80 rounded-full bg-brand/24 blur-3xl" />
        <div className="absolute right-[10%] top-[20%] h-72 w-72 rounded-full bg-brand/14 blur-3xl" />
        <div className="absolute bottom-[-8%] left-1/2 h-72 w-[34rem] -translate-x-1/2 rounded-full bg-white/6 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-6 flex justify-start">
            <CountdownBadge />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-success" />
            {HERO_COPY.eyebrow}
          </div>

          <h1 className="editorial-heading mt-6 max-w-3xl text-4xl text-white sm:text-5xl lg:text-[4.35rem]">
            {HERO_COPY.titleLead}
            <span className="block bg-gradient-to-r from-white via-sapphire-300 to-sapphire-500 bg-clip-text text-transparent">
              {HERO_COPY.titleAccent}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{HERO_COPY.body}</p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href={ROUTES.register}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-indigo-800)] bg-[linear-gradient(135deg,rgba(99,102,241,0.98),rgba(67,56,202,0.98))] px-6 py-4 text-base font-semibold text-[var(--text-on-primary)] shadow-[0_16px_36px_rgba(67,56,202,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(67,56,202,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              {HERO_COPY.primaryCta}
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-white/6 px-5 py-4 text-sm font-medium text-white/86 backdrop-blur-md transition-colors hover:border-white/28 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
              </svg>
              {HERO_COPY.secondaryCta}
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {TRUST_ITEMS.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3.5 py-2 backdrop-blur-sm">
                <svg className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{HERO_COPY.cards.quick}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{HERO_COPY.cards.quickValue}</p>
              <p className="mt-1 text-sm text-slate-300">{HERO_COPY.cards.quickBody}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{HERO_COPY.cards.correction}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{HERO_COPY.cards.correctionValue}</p>
              <p className="mt-1 text-sm text-slate-300">{HERO_COPY.cards.correctionBody}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{HERO_COPY.cards.posture}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{HERO_COPY.cards.postureValue}</p>
              <p className="mt-1 text-sm text-slate-300">{HERO_COPY.cards.postureBody}</p>
            </div>
          </div>
        </div>

        <div id="demo" className="relative lg:pl-4">
          <div className="absolute inset-x-6 top-5 h-32 rounded-full bg-brand/14 blur-3xl" />
          <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] p-3 shadow-[0_30px_80px_rgba(2,6,23,0.30)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between rounded-[22px] border border-white/10 bg-black/16 px-4 py-3 text-left backdrop-blur-md">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{HERO_COPY.previewEyebrow}</p>
                <p className="mt-1 text-base font-semibold text-white">{HERO_COPY.previewTitle}</p>
              </div>
              <div className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                {HERO_COPY.previewBadge}
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1227]">
              <img
                src="/assets/oral-simulator-preview.svg"
                width={720}
                height={460}
                alt="Simulation d'oral EAF Nexus Réussite — notation officielle /2 /8 /2 /8"
                fetchPriority="high"
                decoding="async"
                className="w-full"
                style={{ aspectRatio: '720/460' }}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-white/10 bg-black/14 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{HERO_COPY.previewMeta.diagnostic}</p>
                <p className="mt-2 text-lg font-semibold text-white">{HERO_COPY.previewMeta.diagnosticValue}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/14 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{HERO_COPY.previewMeta.feedback}</p>
                <p className="mt-2 text-lg font-semibold text-white">{HERO_COPY.previewMeta.feedbackValue}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/14 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{HERO_COPY.previewMeta.tracking}</p>
                <p className="mt-2 text-lg font-semibold text-white">{HERO_COPY.previewMeta.trackingValue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
