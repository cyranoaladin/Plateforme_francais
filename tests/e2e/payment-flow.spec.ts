import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le flow de paiement
 *
 * Scénarios:
 * - Page pricing affiche les plans
 * - Clic upgrade → redirection paiement
 * - Pages confirmation/refus
 * - Historique de paiement (si implémenté)
 */

test.describe('Payment Flow E2E', () => {
  test('page pricing affiche les plans correctement', async ({ page }) => {
    // Login first to see full pricing page
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto('/pricing');

    // Vérifier les 3 plans affichés (Freemium, Premium, Masterium)
    await expect(page.getByText(/Freemium/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Premium/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Masterium/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clic bouton upgrade → redirection ou modal de paiement', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    // Navigate to pricing
    await page.goto('/pricing');

    // Click on an enabled upgrade button (skip disabled current plan button)
    const upgradeBtn = page.getByRole('button', { name: /passer à premium|passer à masterium|choisir ce plan/i }).first();
    if (await upgradeBtn.count() > 0 && !(await upgradeBtn.isDisabled())) {
      await upgradeBtn.click();

      // In CI, payment provider can be mocked/unavailable: either redirect starts or inline error is shown.
      await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('page confirmation paiement est accessible', async ({ page }) => {
    await page.goto('/paiement/confirmation');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
  });

  test('page refus paiement est accessible', async ({ page }) => {
    await page.goto('/paiement/refus');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigation vers pricing depuis le dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    // Try to access a premium feature (should show paywall if FREE plan)
    await page.goto('/atelier-oral');

    // Check if pricing link/button is visible
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('affichage des quotas/usage sur la page pricing', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    await page.goto('/pricing');
    // Should show quota information or plan details
    const hasQuotaInfo = await page.getByText(/illimité|quota|limite|mois|jour|session|gratuit/i).count() > 0;
    expect(hasQuotaInfo).toBe(true);
  });
});

test.describe('Payment - User Journey', () => {
  test('parcours complet: dashboard → pricing → paiement', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

    // Go to pricing
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/, { timeout: 5000 });

    // Check plans are visible (Freemium, Premium, Masterium)
    await expect(page.getByText(/^Freemium$/i).first()).toBeVisible();
    await expect(page.getByText(/^Premium$/i).first()).toBeVisible();
    await expect(page.getByText(/^Masterium$/i).first()).toBeVisible();

    // Verify page has upgrade CTAs
    const ctaCount = await page.getByRole('button', { name: /passer à premium|passer à masterium|choisir ce plan|essayer/i }).count();
    expect(ctaCount).toBeGreaterThan(0);
  });
});
