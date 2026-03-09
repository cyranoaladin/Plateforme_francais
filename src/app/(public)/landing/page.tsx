import { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { ValueProps } from '@/components/landing/ValueProps';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Nexus Réussite - Maîtrisez le français en 8 semaines',
  description: 'Plateforme de préparation aux EAF. Tuteur IA 24/7, corrections d\'experts, progression garantie. Essai gratuit 7 jours.',
  keywords: ['EAF', 'français', 'préparation', 'tuteur IA', 'corrections', 'bac français'],
  openGraph: {
    title: 'Nexus Réussite - Préparation EAF',
    description: 'Maîtrisez le français en 8 semaines avec notre tuteur IA et nos experts',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <Hero />
        <ValueProps />
        <Pricing />
        <FAQ />
      </main>
      <LandingFooter />
    </>
  );
}
