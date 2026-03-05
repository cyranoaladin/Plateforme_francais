'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { track } from '@/components/analytics/events';

export function FinalCTA() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Prêt à progresser&nbsp;?
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7 max-w-lg mx-auto">
          Rejoins des centaines d&apos;élèves qui préparent l&apos;EAF avec méthode.
          Inscription gratuite, onboarding en 3 minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link
            href="/login?mode=register"
            onClick={() => track({ name: 'cta_click', props: { cta: 'final_register', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25 text-base"
          >
            Commencer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            onClick={() => track({ name: 'cta_click', props: { cta: 'final_login', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border bg-card text-foreground font-semibold hover:bg-muted transition-colors text-base"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </section>
  );
}
