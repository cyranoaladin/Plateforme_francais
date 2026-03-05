'use client';

import Link from 'next/link';
import { Users, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { track } from '@/components/analytics/events';

const STEPS = [
  {
    number: '1',
    title: 'Je crée mon compte',
    description: 'Inscription gratuite en 30 secondes avec email et mot de passe.',
    icon: Users,
  },
  {
    number: '2',
    title: 'Onboarding 3 minutes',
    description: 'Profil, choix des œuvres au programme, auto-évaluation de départ.',
    icon: GraduationCap,
  },
  {
    number: '3',
    title: 'Je démarre une séance',
    description: 'Atelier écrit, oral, quiz ou parcours selon mes besoins identifiés.',
    icon: Sparkles,
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-20 py-16 md:py-24 bg-white/50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center text-foreground">Comment ça marche&nbsp;?</h2>
        <p className="text-muted-foreground text-center mt-2 text-base leading-7">3 étapes, 3 minutes, tu es prêt.</p>

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {STEPS.map((step) => (
            <div key={step.number} className="relative rounded-2xl border border-border bg-card p-6 text-center hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <step.icon className="w-7 h-7" />
              </div>
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                {step.number}
              </div>
              <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/login?mode=register"
            onClick={() => track({ name: 'cta_click', props: { cta: 'how_it_works_register', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-md text-sm"
          >
            Faire l&apos;onboarding <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
