import type { Metadata } from 'next';
import { PremiumNav } from '@/components/landing/PremiumNav';
import { PremiumHero } from '@/components/landing/PremiumHero';
import { PremiumFeaturesGrid } from '@/components/landing/PremiumFeaturesGrid';
import { PremiumTestimonials } from '@/components/landing/PremiumTestimonials';
import { PremiumPricing } from '@/components/landing/PremiumPricing';
import { PremiumSignupForm } from '@/components/landing/PremiumSignupForm';
import { PremiumFooter } from '@/components/landing/PremiumFooter';

export const metadata: Metadata = {
  title: 'Plateforme Français - Maîtriser le français, ouvrir les portes du futur',
  description:
    'Une plateforme complète pour l\'apprentissage du français. Leçons interactives, suivi en temps réel, parcours personnalisés. Essai gratuit 14 jours.',
  keywords: [
    'apprentissage français',
    'plateforme éducation',
    'français en ligne',
    'cours français',
  ],
  openGraph: {
    title: 'Plateforme Français',
    description:
      'Plateforme d\'apprentissage complète du français pour élèves et parents.',
    url: 'https://example.com/premium-landing',
    siteName: 'Plateforme Français',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function PremiumLandingPage() {
  return (
    <main className="bg-white">
      <PremiumNav />
      <PremiumHero />
      <PremiumFeaturesGrid />
      <PremiumTestimonials />
      <PremiumPricing />
      <PremiumSignupForm />
      <PremiumFooter />
    </main>
  );
}
