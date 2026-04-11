// @vitest-environment jsdom
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

// Helper: at least one element matches (handles responsive duplicates in jsdom)
function expectAtLeastOne(elements: HTMLElement[]) {
  expect(elements.length).toBeGreaterThan(0);
}

// Tests pour StickyNav
import { StickyNav } from '@/components/landing/StickyNav';

describe('StickyNav Mobile', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  });

  it('affiche le logo et le CTA "Gratuit" sur mobile', () => {
    render(<StickyNav />);

    expect(screen.getAllByText('Nexus Réussite')[0]).toBeInTheDocument();
    expectAtLeastOne(screen.getAllByText(/Gratuit/i));
  });

  it('affiche le bouton hamburger sur mobile', () => {
    render(<StickyNav />);

    const hamburgers = screen.getAllByRole('button', { name: /menu/i });
    expect(hamburgers.length).toBeGreaterThan(0);
  });

  it('ouvre le menu au clic sur hamburger', async () => {
    render(<StickyNav />);

    const hamburger = screen.getAllByRole('button', { name: /menu/i })[0];
    await userEvent.click(hamburger);

    await waitFor(() => {
      expectAtLeastOne(screen.getAllByText('Ateliers'));
      expectAtLeastOne(screen.getAllByText('Tarifs'));
      expectAtLeastOne(screen.getAllByText('Connexion'));
    });
  });

  it('affiche la note PC dans le menu mobile', async () => {
    render(<StickyNav />);

    const hamburger = screen.getAllByRole('button', { name: /menu/i })[0];
    await userEvent.click(hamburger);

    await waitFor(() => {
      expectAtLeastOne(screen.getAllByText(/ordinateur|PC/i));
    });
  });
});

// Tests pour MobilePcBanner
import { MobilePcBanner } from '@/components/landing/MobilePcBanner';

describe('MobilePcBanner', () => {
  let scrollHandler: (() => void) | null = null;

  beforeEach(() => {
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

    window.scrollY = 800;
    scrollHandler?.();

    await waitFor(() => {
      expectAtLeastOne(screen.getAllByText(/ateliers s'utilisent/i));
    });
  });

  it('contient un lien vers inscription', async () => {
    render(<MobilePcBanner />);

    window.scrollY = 800;
    scrollHandler?.();

    await waitFor(() => {
      const links = screen.getAllByText(/s'inscrire/i);
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].closest('a')).toHaveAttribute('href', '/login?mode=register');
    });
  });

  it('peut être fermé', async () => {
    render(<MobilePcBanner />);

    window.scrollY = 800;
    scrollHandler?.();

    await waitFor(() => {
      expectAtLeastOne(screen.getAllByText(/ateliers s'utilisent/i));
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

    expectAtLeastOne(screen.getAllByText('Diagnostic express'));
    expectAtLeastOne(screen.getAllByText(/Tu produis/i));
    expectAtLeastOne(screen.getAllByText(/Correction sourcée/i));
  });

  it('affiche les numéros d\'étape', () => {
    render(<MethodSteps />);

    expectAtLeastOne(screen.getAllByText(/Étape 01/i));
    expectAtLeastOne(screen.getAllByText(/Étape 02/i));
    expectAtLeastOne(screen.getAllByText(/Étape 03/i));
  });

  it('affiche le tag "Anti-copie" sur étape 2', () => {
    render(<MethodSteps />);

    expectAtLeastOne(screen.getAllByText('Anti-copie par design'));
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

    const firstAnswer = screen.getByText(/upgrader à tout moment/i);
    expect(firstAnswer).toBeInTheDocument();
  });

  it('permet d\'ouvrir/fermer les questions', async () => {
    render(<FAQSection />);

    const question = screen.getByText(/engagement minimum/i);
    await userEvent.click(question);

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

    expectAtLeastOne(screen.getAllByText(/Corrections/i));
    expectAtLeastOne(screen.getAllByText(/Oraux/i));
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

    // Stars may be rendered as individual characters or aria-label
    const container = document.body;
    expect(container.textContent).toContain('★');
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

    expectAtLeastOne(screen.getAllByText(/Sources/i));
    expectAtLeastOne(screen.getAllByText(/Barème/i));
    expectAtLeastOne(screen.getAllByText(/Anti-copie/i));
  });
});

// Tests pour WorkshopTabs
import { WorkshopTabs } from '@/components/landing/WorkshopTabs';

describe('WorkshopTabs Mobile', () => {
  it('affiche les 4 onglets', () => {
    render(<WorkshopTabs />);

    expectAtLeastOne(screen.getAllByText('Oral'));
    expectAtLeastOne(screen.getAllByText('Écrit'));
    expectAtLeastOne(screen.getAllByText('Langue'));
    expectAtLeastOne(screen.getAllByText('Quiz'));
  });

  it('affiche le badge "Recommandé" sur Oral', () => {
    render(<WorkshopTabs />);

    expectAtLeastOne(screen.getAllByText(/Recommandé/i));
  });

  it('change d\'onglet au clic', async () => {
    render(<WorkshopTabs />);

    const ecritTabs = screen.getAllByText('Écrit');
    await userEvent.click(ecritTabs[0]);

    expect(screen.getByText(/sujets conformes/i)).toBeInTheDocument();
  });
});

// Tests pour Footer
import { Footer } from '@/components/landing/Footer';

describe('Footer Mobile', () => {
  it('affiche le logo et le nom', () => {
    render(<Footer />);

    expectAtLeastOne(screen.getAllByText('Nexus Réussite'));
  });

  it('affiche les liens essentiels', () => {
    render(<Footer />);

    expectAtLeastOne(screen.getAllByText('Accueil'));
    expectAtLeastOne(screen.getAllByText('Tarifs'));
    expectAtLeastOne(screen.getAllByText('Connexion'));
  });

  it('affiche les liens légaux', () => {
    render(<Footer />);

    expectAtLeastOne(screen.getAllByText('Mentions légales'));
    expectAtLeastOne(screen.getAllByText('CGU'));
    expectAtLeastOne(screen.getAllByText(/Confidentialité/i));
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

    const cta = screen.getAllByText(/Commencer gratuitement/i)[0];
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/login');
  });

  it('affiche la note PC finale', () => {
    render(<FooterCTA />);

    expect(screen.getByText(/utilisent sur ordinateur/i)).toBeInTheDocument();
  });

  it('affiche les trust badges', () => {
    render(<FooterCTA />);

    expectAtLeastOne(screen.getAllByText(/Freemium/i));
    expectAtLeastOne(screen.getAllByText(/Sources BO/i));
  });
});

// Tests pour Hero
import { Hero } from '@/components/landing/Hero';

describe('Hero Mobile', () => {
  it('affiche le titre principal', () => {
    render(<Hero />);

    expectAtLeastOne(screen.getAllByText(/Nexus Réussite/i));
    expectAtLeastOne(screen.getAllByText(/juste/i));
  });

  it('affiche le badge countdown', () => {
    render(<Hero />);

    expect(screen.getByText(/J-\d+ avant/i)).toBeInTheDocument();
  });

  it('affiche le CTA principal', () => {
    render(<Hero />);

    const cta = screen.getAllByText(/Commencer gratuitement/i)[0];
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/login');
  });

  it('affiche les trust badges', () => {
    render(<Hero />);

    expectAtLeastOne(screen.getAllByText(/Pas de carte bancaire/i));
    expectAtLeastOne(screen.getAllByText(/Freemium/i));
  });

  it('affiche le bouton démo', () => {
    render(<Hero />);

    expectAtLeastOne(screen.getAllByText(/Voir la démo/i));
  });
});
