'use client';

import Link from 'next/link';
import { GraduationCap, Mic, FileCheck, Shield, Eye, ArrowRight } from 'lucide-react';
import { track } from '@/components/analytics/events';

const BADGES = [
  { icon: Mic, label: 'Oral conforme : /2 /8 /2 /8' },
  { icon: FileCheck, label: 'Citations (BO / Eduscol / œuvres)' },
  { icon: Shield, label: 'Sécurité : session + CSRF' },
  { icon: Eye, label: 'Accessibilité : WCAG / mode dyslexie' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-16 relative">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1 mb-6 font-bold">
          <GraduationCap className="w-3.5 h-3.5" /> Préparation EAF Première 2025-2026
        </p>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground max-w-4xl leading-[1.15]">
          Prépare l&apos;EAF avec méthode, pas au hasard.
        </h1>

        <p className="text-muted-foreground text-base leading-7 max-w-2xl mt-5">
          Écrit, oral et langue : entraînement guidé, retours structurés, ressources à citations.
          L&apos;IA ne fait pas à ta place : elle t&apos;apprend à produire.
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          {BADGES.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-border bg-card/60 backdrop-blur text-foreground"
            >
              <badge.icon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              {badge.label}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
          <Link
            href="/login?mode=register"
            onClick={() => track({ name: 'cta_click', props: { cta: 'hero_register', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-bold text-base hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
          >
            Commencer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            onClick={() => track({ name: 'cta_click', props: { cta: 'hero_login', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold text-base hover:bg-muted transition-colors"
          >
            Se connecter
          </Link>
        </div>
        <a href="#comment-ca-marche" className="inline-block mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">
          Voir comment ça marche &darr;
        </a>
      </div>
    </section>
  );
}
