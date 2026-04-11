'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { track } from '@/components/analytics/events';

export function FinalCTA() {
  return (
    <section className="pb-20 pt-8 md:pb-24 md:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div 
          className="rounded-[var(--eaf-radius-2xl)] border px-6 py-10 shadow-lg md:px-10 md:py-12"
          style={{ 
            background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
            borderColor: 'var(--eaf-indigo-border)'
          }}
        >
          {/* Decorative orb */}
          <div 
            className="pointer-events-none absolute right-20 h-[300px] w-[300px] opacity-50"
            style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
          />
          
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--eaf-gold)]">Passage à l'action</p>
              <h2 
                className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                Vérifie le produit, constate le cadre, puis décide si Premium vaut vraiment la peine.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--eaf-text-secondary)]">
                Inscription gratuite, mise en route rapide, workflow lisible dès la première séance. Le bon ordre est simple : voir d'abord, choisir ensuite, payer seulement si l'usage le justifie.
              </p>
            </div>

            <div 
              className="rounded-[var(--eaf-radius-2xl)] border p-6"
              style={{ background: 'var(--eaf-bg2)', borderColor: 'var(--eaf-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">Dès l'entrée</p>
              <div className="mt-4 space-y-3">
                {[
                  "Compte créé et parcours configuré en quelques minutes",
                  "Aucun paiement avant d'avoir vu le produit en situation",
                  "Aucune rédaction intégrale générée à la place de l'élève",
                ].map((item) => (
                  <div 
                    key={item} 
                    className="flex items-start gap-3 rounded-[var(--eaf-radius-xl)] border px-4 py-3"
                    style={{ background: 'var(--eaf-bg3)', borderColor: 'var(--eaf-border)' }}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--eaf-gold)]" />
                    <p className="text-sm leading-6 text-[var(--eaf-text-secondary)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'final_register', path: '/' } })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--eaf-orange)] px-6 py-3.5 text-base font-bold text-[var(--eaf-bg0)] transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-active)]"
            >
              Créer mon espace gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              onClick={() => track({ name: 'cta_click', props: { cta: 'final_pricing', path: '/' } })}
              className="inline-flex items-center justify-center rounded-full border px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[var(--eaf-bg2)]"
              style={{ borderColor: 'var(--eaf-border)' }}
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
