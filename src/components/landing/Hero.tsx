/**
 * Hero — Main hero section with urgency, promise, and hierarchical CTAs.
 * Dependencies: ./CountdownBadge
 */
'use client';

import Link from 'next/link';
import { CountdownBadge } from './CountdownBadge';

const TRUST_ITEMS = [
  'Pas de carte bancaire',
  'Freemium illimité en temps',
  'Sources BO 2026 officielles',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 px-4 pb-16 pt-20 text-white sm:px-6 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-36">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Countdown badge */}
        <div className="mb-6 flex justify-center">
          <CountdownBadge />
        </div>

        {/* H1 */}
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Passe de 10 à 17+ à l&apos;oral EAF.
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-violet-300 bg-clip-text text-transparent">
            En 3 minutes de correction, pas 48h.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
          Nexus est l&apos;IA pédagogique entraînée sur le BO 2026 et les rapports de jury officiels.
          Elle simule l&apos;oral /2 /8 /2 /8, corrige tes dissertations et ne rédige
          jamais à ta place.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login?mode=register"
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105 hover:bg-violet-700"
            aria-label="Commencer gratuitement"
          >
            Commencer gratuitement — 3 min
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-gray-200 transition-colors hover:border-white/40 hover:bg-white/5"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
            </svg>
            Voir la démo en 45s
          </a>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {item}
            </span>
          ))}
        </div>

        {/* Product preview placeholder */}
        <div id="demo" className="mx-auto mt-12 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">Atelier Oral — Nexus Réussite</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">Simulation officielle EAF</p>
                  <p className="mt-1 text-lg font-bold text-white">Oral sur Lettres d&apos;une Péruvienne — Graffigny</p>
                </div>
                <span className="rounded-lg bg-orange-500 px-3 py-1 text-sm font-bold text-white">
                  /2 /8 /2 /8
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm leading-relaxed text-gray-300">
                  &quot;Comment Zilia déconstruit-elle la vision que les Européens ont de leur propre civilisation ?
                  Analyse les lettres 18 et 29 pour montrer le renversement du regard.&quot;
                </p>
                <p className="mt-2 text-xs text-gray-500">Sources : BO 2026, Rapport jury 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
