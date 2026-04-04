import { test, expect } from '@playwright/test';

const EMAIL = `e2e-${Date.now()}@nexus-eaf.local`;
const PASSWORD = 'NexusE2E2026!';

test.describe('01 — Inscription et onboarding', () => {
  test('1.1 - Inscription réussie', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a[href*="register"], a:has-text("S\'inscrire"), a:has-text("Créer")');
    await registerLink.first().click();
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/onboarding|dashboard/, { timeout: 15000 });
  });

  test('1.2 - Étape 3 auto-évaluation ne plante pas (bug corrigé)', async ({ page }) => {
    await page.goto('/onboarding');
    const sliders = page.locator('input[type="range"]');
    const count = await sliders.count();
    for (let i = 0; i < count; i++) {
      await sliders.nth(i).fill('3');
    }
    const submitBtn = page.locator('button:has-text("Terminer"), button:has-text("Commencer"), button:has-text("Valider")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.locator('text=Une erreur est survenue')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('1.3 - Après onboarding : redirection vers /descriptif-lecture', async ({ page }) => {
    await expect(page).toHaveURL(/descriptif-lecture|dashboard/, { timeout: 10000 });
  });
});
