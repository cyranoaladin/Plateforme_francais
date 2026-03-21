import type { Metadata } from 'next';
import { StickyNav } from '@/components/landing/StickyNav';
import { Hero } from '@/components/landing/Hero';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { StatsSection } from '@/components/landing/StatsSection';
import { AntiChatGPTBanner } from '@/components/landing/AntiChatGPTBanner';
import { MethodSteps } from '@/components/landing/MethodSteps';
import { WorkshopTabs } from '@/components/landing/WorkshopTabs';
import { DashboardToggle } from '@/components/landing/DashboardToggle';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { PricingSection } from '@/components/landing/PricingSection';
import { InlineCTA } from '@/components/landing/InlineCTA';
import { FooterCTA } from '@/components/landing/FooterCTA';
import { WhatsAppButton } from '@/components/landing/WhatsAppButton';
import { Footer } from '@/components/landing/Footer';

const BASE_URL = 'https://eaf.nexusreussite.academy';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Nexus Réussite — Prépare l'EAF avec l'IA officielle",
  description:
    "IA entraînée sur le BO 2026. Simulation d'oral /2 /8 /2 /8, correction en 3 min, anti-copie. Freemium gratuit.",
  openGraph: {
    title: "Nexus Réussite — De 10 à 17+ à l'oral EAF",
    description: "L'IA pédagogique entraînée sur le BO 2026 et les rapports de jury. Oral simulé, correction en 3 min, anti-copie.",
    url: BASE_URL,
    siteName: 'Nexus Réussite',
    images: [{ url: '/assets/og-cover.png', width: 1200, height: 630, alt: 'Nexus Réussite — Préparation EAF 2026' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nexus Réussite — Prépare l'EAF avec l'IA officielle",
    description: "Simulation d'oral /2 /8 /2 /8, correction en 3 min. Freemium gratuit, sans carte bancaire.",
    images: ['/assets/og-cover.png'],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <StickyNav />

      <main>
        <Hero />
        <SocialProofStrip />
        <StatsSection />

        <InlineCTA
          headline="Tu veux voir ce que ça donne sur une vraie copie ?"
          cta="Essayer une correction gratuite →"
          href="/login?mode=register"
          className="bg-white"
        />

        <AntiChatGPTBanner />
        <MethodSteps />

        <div id="ateliers">
          <WorkshopTabs />
        </div>

        <InlineCTA
          headline="1 200 élèves ont déjà progressé. Et toi ?"
          cta="Commencer gratuitement →"
          href="/login?mode=register"
          className="bg-gray-50"
        />

        <DashboardToggle />
        <TestimonialsSection />

        <InlineCTA
          headline="Toujours en train de comparer ? L'essai est gratuit."
          cta="Tester Nexus maintenant →"
          href="/login?mode=register"
          className="bg-white"
        />

        <ComparisonTable />

        <div id="tarifs">
          <PricingSection />
        </div>

        <FooterCTA />
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
