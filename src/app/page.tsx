import { FAQ } from './bienvenue/sections/FAQ';
import { Features } from './bienvenue/sections/Features';
import { FinalCTA } from './bienvenue/sections/FinalCTA';
import { Hero } from './bienvenue/sections/Hero';
import { HowItWorks } from './bienvenue/sections/HowItWorks';
import { Navigation } from './bienvenue/sections/Navigation';
import { PricingTeaser } from './bienvenue/sections/PricingTeaser';
import { Trust } from './bienvenue/sections/Trust';
import { WhyNexus } from './bienvenue/sections/WhyNexus';

export const metadata = {
  title: 'Nexus Réussite — Préparation EAF Bac Français 2026',
  description: 'Prépare ton Bac de Français avec Nexus : correction de copies, simulation d\'oral officiel, tuteur IA avec sources citées. Inscris-toi gratuitement.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--eaf-bg0)] text-[var(--text-body)]">
      <Navigation />
      <Hero />
      <WhyNexus />
      <HowItWorks />
      <Features />
      <PricingTeaser />
      <Trust />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
