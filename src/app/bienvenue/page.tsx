'use client';

import { useEffect } from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { Features } from './sections/Features';
import { Trust } from './sections/Trust';
import { PricingTeaser } from './sections/PricingTeaser';
import { FAQ } from './sections/FAQ';
import { FinalCTA } from './sections/FinalCTA';
import { track } from '@/components/analytics/events';

export default function BienvenuePage() {
  useEffect(() => {
    track({ name: 'page_view', props: { path: '/bienvenue' } });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-purple-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <PublicHeader />
      <Hero />
      <HowItWorks />
      <Features />
      <Trust />
      <PricingTeaser />
      <FAQ />
      <FinalCTA />
      <PublicFooter />
    </div>
  );
}
