'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

export function FinalCTA() {
  return (
    <section className="pb-20 pt-8 md:pb-24 md:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-[var(--navy)] bg-[var(--navy)] px-6 py-10 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">Passage à l’action</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Vérifie le produit, constate le cadre, puis décide si Premium vaut vraiment la peine.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
                Inscription gratuite, mise en route rapide, workflow lisible dès la première séance. Le bon ordre est simple : voir d’abord, choisir ensuite, payer seulement si l’usage le justifie.
              </p>
            </div>

            <div className="rounded-[24px] bg-[var(--navy-dark)] p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--border-warm)]">Dès l’entrée</p>
              <div className="mt-4 space-y-3">
                {[
                  "Compte créé et onboarding lancé en quelques minutes",
                  "Aucun paiement avant d’avoir vu le produit en situation",
                  "Aucune rédaction intégrale générée à la place de l’élève",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--border-warm)]" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'final_register', path: '/bienvenue' } })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--surface-parchment)] px-6 py-3.5 text-base font-bold text-[var(--navy)] transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              Créer mon espace gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              onClick={() => track({ name: 'cta_click', props: { cta: 'final_pricing', path: '/bienvenue' } })}
              className="inline-flex items-center justify-center rounded-full border border-white/16 px-6 py-3.5 text-base font-semibold text-[var(--surface-parchment)] transition-colors hover:bg-white/6"
            >
              Voir les plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
