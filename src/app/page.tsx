import { StickyNav } from '@/components/landing/StickyNav';
import { Hero } from '@/components/landing/Hero';
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';
import { StatsSection } from '@/components/landing/StatsSection';
import { MethodSteps } from '@/components/landing/MethodSteps';
import { WorkshopTabs } from '@/components/landing/WorkshopTabs';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { DashboardToggle } from '@/components/landing/DashboardToggle';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FooterCTA } from '@/components/landing/FooterCTA';
import { Footer } from '@/components/landing/Footer';
import { WhatsAppButton } from '@/components/landing/WhatsAppButton';
import { MobilePcBanner } from '@/components/landing/MobilePcBanner';

export const metadata = {
  title: 'Nexus Réussite — Préparation EAF Bac Français 2026',
  description: 'Prépare ton Bac de Français avec Nexus : correction de copies, simulation d\'oral officiel, tuteur IA avec sources citées. Inscris-toi gratuitement.',
};

export default function LandingPage() {
  return (
    <main
      style={{
        background: 'var(--eaf-bg0)',
        color: 'var(--eaf-text-primary)',
        fontFamily: 'var(--eaf-font-body)',
        minHeight: '100vh',
      }}
    >
      <StickyNav />
      <Hero />
      <SocialProofStrip />
      <StatsSection />
      <section style={{ padding: '60px 0 48px' }}>
        <MethodSteps />
      </section>
      <section style={{ padding: '0 20px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <WorkshopTabs />
      </section>
      <section style={{ padding: '60px 0', maxWidth: '1100px', margin: '0 auto' }}>
        <ComparisonTable />
      </section>
      <section style={{ padding: '60px 0', maxWidth: '1100px', margin: '0 auto' }}>
        <TestimonialsSection />
      </section>
      <section style={{ padding: '0 20px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <DashboardToggle />
      </section>
      <section style={{ padding: '60px 0', maxWidth: '1100px', margin: '0 auto' }} id="pricing">
        <PricingSection />
      </section>
      <FAQSection />
      <FooterCTA />
      <Footer />
      <WhatsAppButton />
      <MobilePcBanner />
    </main>
  );
}
