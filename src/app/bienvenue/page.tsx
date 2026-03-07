'use client';

import { useEffect } from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Hero } from './sections/Hero';
import { WhyNexus } from './sections/WhyNexus';
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
    <div className="relative isolate min-h-screen overflow-x-clip bg-[#f4efe5] text-slate-900 [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,239,229,1))]">
      <style jsx global>{`
        @keyframes bienvenueFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bienvenueFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.88),transparent_65%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[44rem] h-72 w-[74rem] -translate-x-1/2 rounded-full bg-[#0f766e]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-32 h-64 w-64 rounded-full bg-[#b87333]/14 blur-3xl" />

      <PublicHeader />
      <Hero />
      <WhyNexus />
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
