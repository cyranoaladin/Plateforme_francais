'use client';

import Link from 'next/link';
import { track } from '@/components/analytics/events';

export function PricingTeaser() {
  return (
    <section id="tarifs" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Un plan gratuit pour commencer, des quotas clairs.
        </h2>
        <p className="text-muted-foreground mt-3 text-base leading-7 max-w-lg mx-auto">
          Tu peux passer à Pro/Max quand tes besoins augmentent.
        </p>
        <div className="mt-8">
          <Link
            href="/pricing"
            onClick={() => track({ name: 'cta_click', props: { cta: 'pricing_teaser', path: '/bienvenue' } })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-md text-sm"
          >
            Voir les plans &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
