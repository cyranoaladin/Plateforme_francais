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
import { WhatsAppButton } from '@/components/landing/WhatsAppButton';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <StickyNav />

      <main>
        {/* 1. Hero — urgence + promesse + CTA */}
        <Hero />

        {/* 2. Social proof rapide — 1 testimonial fort */}
        <SocialProofStrip />

        {/* 3. Stats — 3 métriques avec counter-up */}
        <StatsSection />

        {/* CTA intermédiaire */}
        <InlineCTA
          headline="Tu veux voir ce que ça donne sur une vraie copie ?"
          cta="Essayer une correction gratuite →"
          href="/login?mode=register"
          className="bg-white"
        />

        {/* 4. Anti-ChatGPT — différenciateur standalone */}
        <AntiChatGPTBanner />

        {/* 5. Méthode — 3 étapes condensées */}
        <MethodSteps />

        {/* 6. Ateliers — tabs interactifs */}
        <WorkshopTabs />

        {/* CTA intermédiaire */}
        <InlineCTA
          headline="1 200 élèves ont déjà progressé. Et toi ?"
          cta="Commencer gratuitement →"
          href="/login?mode=register"
          className="bg-gray-50"
        />

        {/* 7. Dashboard — toggle élève/parent */}
        <DashboardToggle />

        {/* 8. Témoignages complets — 3 profils */}
        <TestimonialsSection />

        {/* CTA intermédiaire */}
        <InlineCTA
          headline="Toujours en train de comparer ? L'essai est gratuit."
          cta="Tester Nexus maintenant →"
          href="/login?mode=register"
          className="bg-white"
        />

        {/* 9. Tableau comparatif */}
        <ComparisonTable />

        {/* 10. Tarifs + FAQ */}
        <PricingSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* WhatsApp sticky — mobile only */}
      <WhatsAppButton />
    </>
  );
}
