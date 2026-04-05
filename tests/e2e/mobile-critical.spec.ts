/**
 * Tests E2E mobile — Flux critiques sur viewport 390×844 (iPhone 14)
 */
import { test, expect, devices } from '@playwright/test';

const iphone14 = devices['iPhone 14'];

test.use(iphone14);

test.describe('Mobile — Flux critiques', () => {
  test('Landing page : visible et pas de scroll horizontal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, 'Scroll horizontal détecté').toBe(false);
  });

  test('Formulaire de connexion : bouton submit ≥ 44px', async ({ page }) => {
    await page.goto('/connexion');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    const submitBtn = page.locator('button[type="submit"]');
    const box = await submitBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('Page pricing : visible et utilisable', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, 'Scroll horizontal détecté').toBe(false);
  });
});
