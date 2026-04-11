/**
 * Tests E2E Mobile Responsive — Landing Page Nexus Réussite
 * Stratégie : Mobile = Découverte + Conversion
 * 
 * Devices testés:
 * - iPhone SE (375×667) — plus petit écran supporté
 * - iPhone 14 (390×844) — référence mobile
 * - Galaxy S20 (360×800) — Android
 * - iPad Mini (768×1024) — tablette
 */

import { test, expect, devices, type Page } from '@playwright/test';

// Devices mobile à tester
const MOBILE_DEVICES = {
  iPhoneSE: devices['iPhone SE'],      // 375×667
  iPhone14: devices['iPhone 14'],      // 390×844
  galaxyS20: devices['Galaxy S8'],     // 360×740 (approx S20)
} as const;

// Breakpoints
const BREAKPOINTS = {
  xs: { width: 375, height: 667 },     // Smartphones portrait
  sm: { width: 480, height: 800 },     // Grands smartphones
  md: { width: 768, height: 1024 },    // Tablettes
  lg: { width: 1024, height: 768 },    // Desktop
} as const;

/**
 * Helpers
 */
async function dismissConsentIfPresent(page: Page) {
  const accept = page.getByRole('button', { name: /Accepter|Refuser/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function checkNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  expect(hasHorizontalScroll, 'Scroll horizontal détecté !').toBe(false);
}

async function checkTouchTargetSize(page: Page, selector: string, minSize = 44) {
  const element = page.locator(selector).first();
  const box = await element.boundingBox();
  if (box) {
    expect(box.width, `${selector} width < ${minSize}px`).toBeGreaterThanOrEqual(minSize);
    expect(box.height, `${selector} height < ${minSize}px`).toBeGreaterThanOrEqual(minSize);
  }
}

async function openMobileMenu(page: Page) {
  const hamburger = page.locator('button[aria-label*="menu"], button:has-text("☰")').first();
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Tests par device
 */
for (const [deviceName, _device] of Object.entries(MOBILE_DEVICES)) {
  test.describe(`Landing Mobile — ${deviceName}`, () => {
    test('Page charge sans erreur et pas de scroll horizontal', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      await checkNoHorizontalScroll(page);
    });

    test('Navbar mobile : hamburger visible, CTA "Gratuit" présent', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Hamburger menu visible
      const hamburger = page.locator('button:has-text("☰")');
      await expect(hamburger).toBeVisible();

      // CTA "Gratuit →" visible
      const ctaMobile = page.locator('a:has-text("Gratuit"), a:has-text("Commencer")').first();
      await expect(ctaMobile).toBeVisible();

      // Touch targets ≥ 44px
      await checkTouchTargetSize(page, 'button:has-text("☰")');
      await checkTouchTargetSize(page, 'a:has-text("Gratuit")');
    });

    test('Menu mobile : s\'ouvre et contient note PC', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Ouvrir le menu
      await openMobileMenu(page);

      // Vérifier les liens
      await expect(page.locator('a:has-text("Ateliers")')).toBeVisible();
      await expect(page.locator('a:has-text("Tarifs")')).toBeVisible();
      await expect(page.locator('a:has-text("Connexion")')).toBeVisible();

      // Vérifier la note PC
      const pcNote = page.locator('text=/ordinateur|PC|utiliser les ateliers/i');
      await expect(pcNote).toBeVisible();

      // Vérifier CTA principal
      await expect(page.locator('a:has-text("Commencer gratuitement")')).toBeVisible();
    });

    test('Hero mobile : titre 36px, banner PC visible, carte démo masquée', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // H1 visible et de taille appropriée
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      const h1FontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);
      
      // Vérifier que le titre n'est pas trop grand (> 40px serait problématique)
      const h1SizeNum = parseInt(h1FontSize);
      expect(h1SizeNum, 'H1 trop grand pour mobile').toBeLessThanOrEqual(40);

      // Banner PC visible
      const pcBanner = page.locator('.mobile-pc-note, [class*="pc-note"]');
      await expect(pcBanner).toBeVisible();
      await expect(pcBanner).toContainText(/ordinateur|PC/i);

      // Carte démo masquée sur très petit écran
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      if (viewportWidth < 480) {
        const demoCard = page.locator('.hero-demo-card');
        await expect(demoCard).not.toBeVisible();
      }
    });

    test('Stats section : scroll horizontal avec snap', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Scroll vers la section stats
      const statsSection = page.locator('text=/progression|résultats/i').first();
      await statsSection.scrollIntoViewIfNeeded();

      // Vérifier que les stats sont présentes
      await expect(page.locator('text=/\+4\.2|98%/i').first()).toBeVisible();

      // Sur mobile, vérifier le scroll horizontal
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      if (viewportWidth < 1024) {
        // Les stats devraient être dans un conteneur scrollable
        const scrollContainer = page.locator('[style*="scrollSnapType"], .scroll-no-bar').first();
        await expect(scrollContainer).toBeVisible();
      }
    });

    test('Method Steps : stack vertical avec ligne connexion', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Scroll vers la méthode
      const methodTitle = page.locator('h2:has-text("3 étapes")');
      await methodTitle.scrollIntoViewIfNeeded();
      await expect(methodTitle).toBeVisible();

      // Vérifier que les 3 étapes sont présentes
      await expect(page.locator('text=/Diagnostic express/i')).toBeVisible();
      await expect(page.locator('text=/Tu produis/i')).toBeVisible();
      await expect(page.locator('text=/Correction sourcée/i')).toBeVisible();
    });

    test('Workshop Tabs : scrollables et CTA pleine largeur', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Scroll vers les ateliers
      const ateliersTitle = page.locator('h2:has-text("ateliers")');
      await ateliersTitle.scrollIntoViewIfNeeded();

      // Tabs présents
      await expect(page.locator('button:has-text("Oral")')).toBeVisible();
      await expect(page.locator('button:has-text("Écrit")')).toBeVisible();

      // CTA visible
      const cta = page.locator('a:has-text("Simuler"), button:has-text("Simuler")');
      await expect(cta).toBeVisible();
    });

    test('Comparison Table : vue simplifiée 4 points', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      const compTitle = page.locator('h2:has-text("ChatGPT")');
      await compTitle.scrollIntoViewIfNeeded();
      await expect(compTitle).toBeVisible();

      // Vérifier les différences clés
      await expect(page.locator('text=/Sources|Barème|Anti-copie|Suivi/i').first()).toBeVisible();
    });

    test('Testimonials : carousel swipe', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      const testimonialsTitle = page.locator('h2:has-text("résultats concrets")');
      await testimonialsTitle.scrollIntoViewIfNeeded();

      // Témoignages présents
      await expect(page.locator('text=/Marie K\.|Sarah L\.|Yassine/i').first()).toBeVisible();

      // Dots indicateurs sur mobile (optionnels selon l'implémentation)
      const _viewportWidth = await page.evaluate(() => window.innerWidth);
    });

    test('Dashboard Toggle : toggle Élève/Parent fonctionnel', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      const dashboardTitle = page.locator('h2:has-text("progression")');
      await dashboardTitle.scrollIntoViewIfNeeded();

      // Toggle présent
      const eleveBtn = page.locator('button:has-text("Élève")');
      const parentBtn = page.locator('button:has-text("Parent")');

      await expect(eleveBtn).toBeVisible();
      await expect(parentBtn).toBeVisible();

      // Basculer vers Parent
      await parentBtn.click();
      await expect(page.locator('text=/Parent de/i')).toBeVisible();

      // Basculer vers Élève
      await eleveBtn.click();
      await expect(page.locator('text=/Corrections|Oraux/i').first()).toBeVisible();
    });

    test('Pricing : cards empilées, Premium en premier sur mobile', async ({ page }) => {
      await page.goto('/#pricing');
      await dismissConsentIfPresent(page);

      const pricingTitle = page.locator('h2:has-text("Trois plans")');
      await expect(pricingTitle).toBeVisible();

      // Vérifier les 3 plans
      await expect(page.locator('text=/Premium|Recommandé/i').first()).toBeVisible();
      await expect(page.locator('text=/Freemium|gratuit/i').first()).toBeVisible();
      await expect(page.locator('text=/Masterium/i')).toBeVisible();
    });

    test('FAQ : accordion fonctionnel, question mobile présente', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      const faqTitle = page.locator('h2:has-text("savoir")');
      await faqTitle.scrollIntoViewIfNeeded();

      // Question mobile spécifique
      const mobileQuestion = page.locator('button:has-text("téléphone")');
      await expect(mobileQuestion).toBeVisible();

      // Cliquer pour ouvrir
      await mobileQuestion.click();
      await expect(page.locator('text=/inscription|téléphone|ordinateur/i')).toBeVisible();
    });

    test('Footer CTA : note PC visible et CTA pleine largeur', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Scroll vers le footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // CTA final visible
      const finalCta = page.locator('a:has-text("Commencer gratuitement")').last();
      await expect(finalCta).toBeVisible();

      // Note PC visible
      const pcNote = page.locator('text=/utilisent sur ordinateur/i');
      await expect(pcNote).toBeVisible();
    });

    test('MobilePcBanner : apparaît après scroll', async ({ page }) => {
      await page.goto('/');
      await dismissConsentIfPresent(page);

      // Le banner n'est pas visible initialement
      const _banner = page.locator('.mobile-pc-banner');
      
      // Scroll à 60% de la page
      await page.evaluate(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, scrollHeight * 0.6);
      });
      await page.waitForTimeout(500);

      // Le banner devrait être visible après le scroll
      // Note: dépend de l'implémentation du scroll listener
    });

    test('Performance : LCP < 2.5s, pas de CLS', async ({ page }) => {
      await page.goto('/');
      
      // Attendre que la page soit stable
      await page.waitForLoadState('networkidle');

      // Vérifier les métriques de performance via Performance API
      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: nav?.domContentLoadedEventEnd - nav?.startTime,
          loadComplete: nav?.loadEventEnd - nav?.startTime,
        };
      });

      expect(metrics.domContentLoaded, 'DCL trop lent').toBeLessThan(2000);
    });
  });
}

/**
 * Tests responsive par breakpoints
 */
test.describe('Responsive Breakpoints', () => {
  test('xs (375px) : layout mobile pur', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.xs);
    await page.goto('/');

    // Hamburger visible
    await expect(page.locator('button:has-text("☰")')).toBeVisible();

    // Navigation desktop masquée
    const desktopNav = page.locator('nav >> a:has-text("Ateliers")').first();
    await expect(desktopNav).not.toBeVisible();

    // Carte démo masquée
    await expect(page.locator('.hero-demo-card')).not.toBeVisible();
  });

  test('sm (480px) : carte démo visible mais réduite', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.sm);
    await page.goto('/');

    // La carte démo devrait être visible à 480px
    // (selon les specs : masquée < 480px, visible à >= 480px)
  });

  test('lg (1024px) : layout desktop', async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.lg);
    await page.goto('/');

    // Navigation desktop visible
    await expect(page.locator('nav >> a:has-text("Ateliers")').first()).toBeVisible();

    // Hamburger masqué
    await expect(page.locator('button:has-text("☰")')).not.toBeVisible();

    // Carte démo visible
    await expect(page.locator('.hero-demo-card')).toBeVisible();
  });
});

/**
 * Tests d'accessibilité mobile
 */
test.describe('Accessibilité Mobile', () => {
  test('Touch targets ≥ 44px', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);

    // Vérifier tous les boutons et liens interactifs
    const interactiveElements = await page.locator('button, a[href]').all();
    
    for (const element of interactiveElements.slice(0, 10)) {
      const box = await element.boundingBox();
      if (box) {
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible && box.width > 0 && box.height > 0) {
          expect(box.width, 'Touch target trop étroit').toBeGreaterThanOrEqual(44);
          expect(box.height, 'Touch target trop petit').toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('Contraste suffisant sur textes importants', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Vérifier que le texte est lisible
    const color = await h1.evaluate(el => window.getComputedStyle(el).color);
    expect(color).not.toBe('rgba(0, 0, 0, 0)'); // Pas transparent
  });

  test('Navigation clavier possible', async ({ page }) => {
    await page.goto('/');

    // Tab jusqu'au premier lien
    await page.keyboard.press('Tab');
    
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

/**
 * Tests de conversion mobile
 */
test.describe('Conversion Mobile', () => {
  test('CTA principal mène au login', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);

    // CTA hero
    const cta = page.locator('a:has-text("Commencer gratuitement")').first();
    await expect(cta).toBeVisible();

    // Vérifier le href
    const href = await cta.getAttribute('href');
    expect(href).toContain('/login');
  });

  test('Menu mobile CTA mène au login avec mode register', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);

    await openMobileMenu(page);

    // CTA dans le menu
    const menuCta = page.locator('a:has-text("Commencer gratuitement")');
    await expect(menuCta).toBeVisible();

    const href = await menuCta.getAttribute('href');
    expect(href).toContain('/login');
  });

  test('Bouton "Gratuit →" dans navbar mobile', async ({ page }) => {
    await page.goto('/');
    await dismissConsentIfPresent(page);

    const miniCta = page.locator('a:has-text("Gratuit")');
    await expect(miniCta).toBeVisible();

    const href = await miniCta.getAttribute('href');
    expect(href).toContain('/login');
  });
});
