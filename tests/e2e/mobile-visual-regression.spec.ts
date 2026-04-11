/**
 * Tests E2E — Visual Regression Mobile
 * 
 * Capture et comparaison des screenshots sur différents viewports
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone-SE', width: 375, height: 667 },
  { name: 'iPhone-14', width: 390, height: 844 },
  { name: 'iPhone-14-Pro-Max', width: 430, height: 932 },
  { name: 'Pixel-7', width: 412, height: 915 },
] as const;

test.describe('Visual Regression — Mobile', () => {
  for (const viewport of VIEWPORTS) {
    test(`Landing page — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Attendre que la page soit stable
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Screenshot complet
      expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
        `landing-${viewport.name}.png`
      );
    });

    test(`Landing page — ${viewport.name} (hero only)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Screenshot du hero uniquement
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible();

      // Prendre un screenshot de la viewport (pas full page)
      expect(await page.screenshot({ fullPage: false })).toMatchSnapshot(
        `landing-${viewport.name}-viewport.png`
      );
    });
  }
});

test.describe('Visual Regression — Sections', () => {
  test('Section Stats', async ({ page }) => {
    await page.goto('/');

    const stats = page.locator('text=/résultats mesurables/i');
    await stats.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    expect(await page.screenshot()).toMatchSnapshot('mobile-section-stats.png');
  });

  test('Section Ateliers', async ({ page }) => {
    await page.goto('/#ateliers');
    await page.waitForTimeout(500);

    expect(await page.screenshot()).toMatchSnapshot('mobile-section-ateliers.png');
  });

  test('Section Pricing', async ({ page }) => {
    await page.goto('/#pricing');
    await page.waitForTimeout(500);

    expect(await page.screenshot()).toMatchSnapshot('mobile-section-pricing.png');
  });

  test('Menu mobile ouvert', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('button:has-text("☰")');
    await hamburger.click();
    await page.waitForTimeout(300);

    expect(await page.screenshot()).toMatchSnapshot('mobile-menu-open.png');
  });
});

test.describe('Visual Regression — États spéciaux', () => {
  test('Banner sticky visible', async ({ page }) => {
    await page.goto('/');

    // Scroll à 60%
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.6);
    });

    await page.waitForTimeout(600);

    // Screenshot bas de page avec banner
    expect(await page.screenshot()).toMatchSnapshot('mobile-banner-sticky.png');
  });

  test('Dashboard toggle — Élève', async ({ page }) => {
    await page.goto('/');

    const dashboard = page.locator('h2:has-text("progression")');
    await dashboard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    expect(await page.screenshot()).toMatchSnapshot('mobile-dashboard-eleve.png');
  });

  test('Dashboard toggle — Parent', async ({ page }) => {
    await page.goto('/');

    const dashboard = page.locator('h2:has-text("progression")');
    await dashboard.scrollIntoViewIfNeeded();

    const parentBtn = page.locator('button:has-text("Parent")');
    await parentBtn.click();
    await page.waitForTimeout(300);

    expect(await page.screenshot()).toMatchSnapshot('mobile-dashboard-parent.png');
  });
});
