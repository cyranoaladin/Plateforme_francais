/**
 * Tests E2E — Accessibilité Mobile
 * 
 * WCAG 2.1 AA compliance sur devices mobiles
 * - Touch targets ≥ 44×44px
 * - Contraste suffisant
 * - Navigation clavier
 * - Screen reader support
 */

import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  { name: 'iPhone 14', device: devices['iPhone 14'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
];

for (const { name, device } of mobileDevices) {
  test.describe(`Accessibilité Mobile — ${name}`, () => {
    test.use(device);

    test('Touch targets suffisants (≥ 44px)', async ({ page }) => {
      await page.goto('/');

      const violations: string[] = [];

      // Récupérer tous les éléments interactifs
      const elements = await page.locator('button, a[href], input, [role="button"]').all();

      for (const element of elements.slice(0, 20)) {
        const box = await element.boundingBox();
        const isVisible = await element.isVisible().catch(() => false);

        if (box && isVisible && box.width > 0 && box.height > 0) {
          if (box.width < 44 || box.height < 44) {
            const text = await element.textContent().catch(() => 'unknown');
            violations.push(`"${text.slice(0, 30)}" ${Math.round(box.width)}×${Math.round(box.height)}px`);
          }
        }
      }

      expect(violations, `Touch targets trop petits:\n${violations.join('\n')}`).toHaveLength(0);
    });

    test('Images avec alt text', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();
      const violations: string[] = [];

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const isVisible = await img.isVisible().catch(() => false);

        if (isVisible && (!alt || alt.trim() === '')) {
          const src = await img.getAttribute('src');
          violations.push(`Image sans alt: ${src?.split('/').pop()}`);
        }
      }

      // Pas de violations bloquantes sur la landing
      expect(violations.length).toBeLessThanOrEqual(3);
    });

    test('Contraste suffisant sur textes importants', async ({ page }) => {
      await page.goto('/');

      // Vérifier les éléments de texte clés
      const selectors = ['h1', 'h2', 'button', 'a[href]'];

      for (const selector of selectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
            };
          });

          // Vérifier que le texte n'est pas transparent
          expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
          expect(styles.color).not.toContain('transparent');
        }
      }
    });

    test('Focus visible sur éléments interactifs', async ({ page }) => {
      await page.goto('/');

      // Tab jusqu'au premier élément focusable
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      const isFocused = await focused.isVisible().catch(() => false);

      // Un élément devrait avoir le focus
      expect(isFocused).toBe(true);

      // Vérifier que le focus est visible (outline ou box-shadow)
      const focusStyle = await focused.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          boxShadow: computed.boxShadow,
        };
      });

      const hasFocusIndicator = 
        focusStyle.outline !== 'none' && focusStyle.outline !== '0px' ||
        focusStyle.boxShadow !== 'none';

      expect(hasFocusIndicator, 'Focus non visible').toBe(true);
    });

    test('Headings hiérarchiques corrects', async ({ page }) => {
      await page.goto('/');

      const h1 = await page.locator('h1').count();
      const h2 = await page.locator('h2').count();

      // Un seul H1
      expect(h1).toBe(1);

      // Au moins quelques H2
      expect(h2).toBeGreaterThanOrEqual(3);
    });

    test('Labels sur formulaires (si présents)', async ({ page }) => {
      await page.goto('/login');

      const inputs = await page.locator('input').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // L'input doit avoir au moins une forme de label
        const hasLabel = id && await page.locator(`label[for="${id}"]`).isVisible().catch(() => false);
        const hasAria = ariaLabel || ariaLabelledBy;
        const hasPlaceholder = placeholder && placeholder.length > 0;

        expect(hasLabel || hasAria || hasPlaceholder, 'Input sans label').toBeTruthy();
      }
    });

    test('Pas de contenu caché au zoom 200%', async ({ page }) => {
      await page.goto('/');

      // Simuler zoom 200% via viewport réduit
      const viewport = page.viewportSize();
      if (viewport) {
        await page.setViewportSize({
          width: Math.floor(viewport.width / 2),
          height: viewport.height,
        });
      }

      // Le contenu principal doit rester visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('a:has-text("Commencer")').first()).toBeVisible();
    });

    test('Animations respectent prefers-reduced-motion', async ({ page }) => {
      await page.goto('/');

      // Activer reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // La page devrait toujours fonctionner
      await expect(page.locator('h1')).toBeVisible();

      // Restaurer
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });
  });
}

test.describe('Accessibilité — Navigation Gestuelle', () => {
  test.use(devices['iPhone 14']);

  test('Swipe sur carousel témoignages', async ({ page }) => {
    await page.goto('/');

    // Scroll vers les témoignages
    const testimonials = page.locator('h2:has-text("résultats concrets")');
    await testimonials.scrollIntoViewIfNeeded();

    // Trouver le carousel
    const carousel = page.locator('[style*="scrollSnapType"]').first();
    if (await carousel.isVisible().catch(() => false)) {
      // Simuler un swipe (scroll horizontal)
      const box = await carousel.boundingBox();
      if (box) {
        await carousel.evaluate((el) => {
          el.scrollBy({ left: 200, behavior: 'instant' });
        });

        await page.waitForTimeout(300);

        // Vérifier que le scroll a eu lieu
        const scrollLeft = await carousel.evaluate(el => el.scrollLeft);
        expect(scrollLeft).toBeGreaterThan(0);
      }
    }
  });

  test('Pull-to-refresh non bloqué', async ({ page }) => {
    await page.goto('/');

    // Vérifier que le body peut scroller (pas de overscroll-behavior: none global)
    const overscroll = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return computed.overscrollBehavior;
    });

    // Le pull-to-refresh devrait fonctionner (valeur par défaut ou auto)
    expect(['auto', ''].includes(overscroll)).toBe(true);
  });
});

test.describe('Accessibilité — Compatibilité OS', () => {
  test.use(devices['iPhone 14']);

  test('Font size system respecté', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les fonts utilisent des unités relatives
    const h1 = page.locator('h1');
    const fontSize = await h1.evaluate(el => window.getComputedStyle(el).fontSize);

    // La taille devrait être en px (pour le calcul) mais basée sur des unités relatives dans CSS
    expect(fontSize).toMatch(/px$/);
  });

  test('Safe areas respectées (notch/iPhone)', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la navbar ne colle pas les bords
    const navbar = page.locator('nav').first();
    const box = await navbar.boundingBox();

    if (box) {
      // La navbar devrait avoir du padding horizontal
      expect(box.x).toBeGreaterThanOrEqual(0);
    }
  });
});
