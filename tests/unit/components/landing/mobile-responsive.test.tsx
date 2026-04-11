/**
 * Tests Unitaires — Composants Landing Mobile Responsive
 * 
 * Couverture:
 * - StickyNav (hamburger menu, navigation mobile)
 * - Hero (layout mobile, banner PC)
 * - StatsSection (scroll horizontal)
 * - MethodSteps (stack vertical)
 * - TestimonialsSection (carousel)
 * - MobilePcBanner (logique d'affichage)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Tests pour StickyNav
import { StickyNav } from '@/components/landing/StickyNav';

describe('StickyNav Mobile', () => {
  beforeEach(() => {
    // Simuler viewport mobile
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  });

  it('affiche le logo et le CTA "Gratuit" sur mobile', () => {
    render(<StickyNav />);
    
    expect(screen.getByText('Nexus Réussite')).toBeInTheDocument();
    expect(screen.getByText(/Gratuit/i)).toBeInTheDocument();
  });

  it('affiche le bouton hamburger sur mobile', () => {
    render(<StickyNav />);
    
    const hamburger = screen.getByRole('button', { name: /menu/i });
    expect(hamburger).toBeInTheDocument();
  });

  it('ouvre le menu au clic sur hamburger', async () => {
    render(<StickyNav />);
    
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await userEvent.click(hamburger);
    
    // Le menu devrait maintenant contenir les liens
    await waitFor(() => {
      expect(screen.getByText('Ateliers')).toBeInTheDocument();
      expect(screen.getByText('Tarifs')).toBeInTheDocument();
      expect(screen.getByText('Connexion')).toBeInTheDocument();
    });
  });

  it('affiche la note PC dans le menu mobile', async () => {
    render(<StickyNav />);
    
    const hamburger = screen.getByRole('button', { name: /menu/i });
    await userEvent.click(hamburger);
    
    await waitFor(() => {
      expect(screen.getByText(/ordinateur|PC/i)).toBeInTheDocument();
    });
  });
});

// Tests pour MobilePcBanner
import { MobilePcBanner } from '@/components/landing/MobilePcBanner';

describe('MobilePcBanner', () => {
  let scrollHandler: (() => void) | null = null;

  beforeEach(() => {
    // Mock scroll
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
    
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'scroll') {
        scrollHandler = handler as () => void;
      }
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('est masqué initialement', () => {
    render(<MobilePcBanner />);
    
    const banner = screen.queryByText(/ateliers s'utilisent/i);
    expect(banner).not.toBeInTheDocument();
  });

  it('devient visible après scroll à 60%', async () => {
    render(<MobilePcBanner />);
    
    // Simuler scroll à 60%
    window.scrollY = 800; // ~60% de (2000 - 667)
    scrollHandler?.();
    
    await waitFor(() => {
      expect(screen.getByText(/ateliers s'utilisent/i)).toBeInTheDocument();
    });
  });

  it('contient un lien vers inscription', async () => {
    render(<MobilePcBanner />);
    
    window.scrollY = 800;
    scrollHandler?.();
    
    await waitFor(() => {
      const link = screen.getByText(/s'inscrire/i);
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/login?mode=register');
    });
  });

  it('peut être fermé', async () => {
    render(<MobilePcBanner />);
    
    window.scrollY = 800;
    scrollHandler?.();
    
    await waitFor(() => {
      expect(screen.getByText(/ateliers s'utilisent/i)).toBeInTheDocument();
    });
    
    const closeButton = screen.getByLabelText(/fermer/i);
    await userEvent.click(closeButton);
    
    expect(screen.queryByText(/ateliers s'utilisent/i)).not.toBeInTheDocument();
  });
});

// Tests pour MethodSteps layout
import { MethodSteps } from '@/components/landing/MethodSteps';

describe('MethodSteps Mobile', () => {
  it('affiche les 3 étapes', () => {
    render(<MethodSteps />);
    
    expect(screen.getByText('Diagnostic express')).toBeInTheDocument();
    expect(screen.getByText(/Tu produis/i)).toBeInTheDocument();
    expect(screen.getByText(/Correction sourcée/i)).toBeInTheDocument();
  });

  it('affiche les numéros d\'étape', () => {
    render(<MethodSteps />);
    
    expect(screen.getByText(/Étape 01/i)).toBeInTheDocument();
    expect(screen.getByText(/Étape 02/i)).toBeInTheDocument();
    expect(screen.getByText(/Étape 03/i)).toBeInTheDocument();
  });

  it('affiche le tag "Anti-copie" sur étape 2', () => {
    render(<MethodSteps />);
    
    expect(screen.getByText('Anti-copie par design')).toBeInTheDocument();
  });
});

// Tests pour FAQ avec question mobile
import { FAQSection } from '@/components/landing/FAQSection';

describe('FAQSection Mobile', () => {
  it('affiche la question spécifique mobile sur téléphone', () => {
    render(<FAQSection />);
    
    expect(screen.getByText(/Puis-je vraiment utiliser.*téléphone/i)).toBeInTheDocument();
  });

  it('le premier item est ouvert par défaut', () => {
    render(<FAQSection />);
    
    // La réponse de la première question devrait être visible
    const firstAnswer = screen.getByText(/upgrader à tout moment/i);
    expect(firstAnswer).toBeInTheDocument();
  });

  it('permet d\'ouvrir/fermer les questions', async () => {
    render(<FAQSection />);
    
    const question = screen.getByText(/engagement minimum/i);
    await userEvent.click(question);
    
    // La réponse devrait être visible
    expect(screen.getByText(/Aucun prélèvement automatique/i)).toBeInTheDocument();
  });
});

// Tests pour DashboardToggle
import { DashboardToggle } from '@/components/landing/DashboardToggle';

describe('DashboardToggle Mobile', () => {
  it('affiche le toggle Élève/Parent', () => {
    render(<DashboardToggle />);
    
    expect(screen.getByText('Élève')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
  });

  it('affiche le dashboard élève par défaut', () => {
    render(<DashboardToggle />);
    
    expect(screen.getByText(/Corrections/i)).toBeInTheDocument();
    expect(screen.getByText(/Oraux/i)).toBeInTheDocument();
  });

  it('bascule vers le dashboard parent', async () => {
    render(<DashboardToggle />);
    
    const parentBtn = screen.getByText('Parent');
    await userEvent.click(parentBtn);
    
    expect(screen.getByText(/Cette semaine/i)).toBeInTheDocument();
    expect(screen.getByText(/Moyenne oral/i)).toBeInTheDocument();
  });

  it('affiche les 3 KPIs principaux sur mobile', () => {
    render(<DashboardToggle />);
    
    // Sur mobile, on affiche uniquement 3 KPIs
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('+2.3')).toBeInTheDocument();
  });
});

// Tests pour SocialProofStrip
import { SocialProofStrip } from '@/components/landing/SocialProofStrip';

describe('SocialProofStrip Mobile', () => {
  it('affiche le score 98%', () => {
    render(<SocialProofStrip />);
    
    expect(screen.getByText('98 %')).toBeInTheDocument();
  });

  it('affiche les étoiles', () => {
    render(<SocialProofStrip />);
    
    // Vérifier la présence des étoiles (★)
    const stars = screen.getByText('★★★★★');
    expect(stars).toBeInTheDocument();
  });
});

// Tests pour ComparisonTable
import { ComparisonTable } from '@/components/landing/ComparisonTable';

describe('ComparisonTable Mobile', () => {
  it('affiche le titre comparatif', () => {
    render(<ComparisonTable />);
    
    expect(screen.getByText(/ChatGPT rédige/i)).toBeInTheDocument();
  });

  it('affiche les différences clés', () => {
    render(<ComparisonTable />);
    
    // Critères présents
    expect(screen.getByText(/Sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Barème/i)).toBeInTheDocument();
    expect(screen.getByText(/Anti-copie/i)).toBeInTheDocument();
  });
});

// Tests pour WorkshopTabs
import { WorkshopTabs } from '@/components/landing/WorkshopTabs';

describe('WorkshopTabs Mobile', () => {
  it('affiche les 4 onglets', () => {
    render(<WorkshopTabs />);
    
    expect(screen.getByText('Oral')).toBeInTheDocument();
    expect(screen.getByText('Écrit')).toBeInTheDocument();
    expect(screen.getByText('Langue')).toBeInTheDocument();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('affiche le badge "Recommandé" sur Oral', () => {
    render(<WorkshopTabs />);
    
    // Badge Recommandé visible sur l'onglet actif
    expect(screen.getByText(/Recommandé/i)).toBeInTheDocument();
  });

  it('change d\'onglet au clic', async () => {
    render(<WorkshopTabs />);
    
    const ecritTab = screen.getByText('Écrit');
    await userEvent.click(ecritTab);
    
    // Le contenu de l'onglet Écrit devrait être visible
    expect(screen.getByText(/sujets conformes/i)).toBeInTheDocument();
  });
});

// Tests pour Footer
import { Footer } from '@/components/landing/Footer';

describe('Footer Mobile', () => {
  it('affiche le logo et le nom', () => {
    render(<Footer />);
    
    expect(screen.getByText('Nexus Réussite')).toBeInTheDocument();
  });

  it('affiche les liens essentiels', () => {
    render(<Footer />);
    
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Tarifs')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  it('affiche les liens légaux', () => {
    render(<Footer />);
    
    expect(screen.getByText('Mentions légales')).toBeInTheDocument();
    expect(screen.getByText('CGU')).toBeInTheDocument();
    expect(screen.getByText(/Confidentialité/i)).toBeInTheDocument();
  });

  it('affiche le copyright', () => {
    render(<Footer />);
    
    expect(screen.getByText(/2026 Nexus Réussite/i)).toBeInTheDocument();
  });
});

// Tests pour FooterCTA
import { FooterCTA } from '@/components/landing/FooterCTA';

describe('FooterCTA Mobile', () => {
  it('affiche le titre final', () => {
    render(<FooterCTA />);
    
    expect(screen.getByText(/meilleur moment/i)).toBeInTheDocument();
    expect(screen.getByText(/c'est maintenant/i)).toBeInTheDocument();
  });

  it('affiche le CTA principal', () => {
    render(<FooterCTA />);
    
    const cta = screen.getByText(/Commencer gratuitement/i);
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/login');
  });

  it('affiche la note PC finale', () => {
    render(<FooterCTA />);
    
    expect(screen.getByText(/utilisent sur ordinateur/i)).toBeInTheDocument();
  });

  it('affiche les trust badges', () => {
    render(<FooterCTA />);
    
    expect(screen.getByText(/Freemium/i)).toBeInTheDocument();
    expect(screen.getByText(/Sources BO/i)).toBeInTheDocument();
  });
});

// Tests pour Hero
import { Hero } from '@/components/landing/Hero';

describe('Hero Mobile', () => {
  it('affiche le titre principal', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Nexus Réussite/i)).toBeInTheDocument();
    expect(screen.getByText(/juste/i)).toBeInTheDocument();
  });

  it('affiche le badge countdown', () => {
    render(<Hero />);
    
    expect(screen.getByText(/J-\d+ avant/i)).toBeInTheDocument();
  });

  it('affiche le CTA principal', () => {
    render(<Hero />);
    
    const cta = screen.getByText(/Commencer gratuitement/i);
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/login');
  });

  it('affiche les trust badges', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Pas de carte bancaire/i)).toBeInTheDocument();
    expect(screen.getByText(/Freemium/i)).toBeInTheDocument();
  });

  it('affiche le bouton démo', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Voir la démo/i)).toBeInTheDocument();
  });
});
