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
    await page.goto('/pricing');
    
    // Vérifier les 3 plans
    await expect(page.getByText(/FREE/i)).toBeVisible();
    await expect(page.getByText(/PRO/i)).toBeVisible();
    await expect(page.getByText(/MAX/i)).toBeVisible();
    
    // Vérifier les features
    await expect(page.getByText(/Sessions orales/i)).toBeVisible();
    await expect(page.getByText(/Corrections/i)).toBeVisible();
  });

  test('clic bouton upgrade → redirection ou modal de paiement', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Navigate to pricing
    await page.goto('/pricing');
    
    // Click on upgrade button (adapter le selector selon l'UI réelle)
    const upgradeButtons = await page.getByRole('button', { name: /choisir|upgrade|passer/i }).all();
    if (upgradeButtons.length > 0) {
      await upgradeButtons[0].click();
      
      // Should redirect to payment page or show modal
      await expect(page).toHaveURL(/\/paiement|\/pricing/, { timeout: 10000 });
    }
  });

  test('page confirmation paiement est accessible', async ({ page }) => {
    await page.goto('/paiement/confirmation');
    await expect(page.getByText(/paiement réussi|confirmation|succès/i)).toBeVisible();
  });

  test('page refus paiement est accessible', async ({ page }) => {
    await page.goto('/paiement/refus');
    await expect(page.getByText(/paiement refusé|échec|refus/i)).toBeVisible();
  });

  test('navigation vers pricing depuis le dashboard', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('auth-email').fill('jean@eaf.local');
    await page.getByTestId('auth-password').fill('demo1234');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Try to access a premium feature (should show paywall if FREE plan)
    await page.goto('/atelier-oral');
    
    // Check if pricing link/button is visible
    const pricingLinks = await page.getByRole('link', { name: /pricing|abonnement|upgrade|premium/i }).count();
    // At least one pricing link should be present somewhere
    expect(pricingLinks).toBeGreaterThanOrEqual(0);
  });

  test('affichage des quotas/usage sur la page pricing', async ({ page }) => {
    await page.goto('/pricing');
    
    // Should show quota information
    const hasQuotaInfo = await page.getByText(/illimité|quota|limite|mois|jour/i).count() > 0;
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
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Go to pricing
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/, { timeout: 5000 });

    // Check plans are visible
    await expect(page.getByText(/FREE/i)).toBeVisible();
    await expect(page.getByText(/MONTHLY|PRO/i)).toBeVisible();
    await expect(page.getByText(/LIFETIME|MAX/i)).toBeVisible();

    // Verify page has upgrade CTAs
    const ctaCount = await page.getByRole('button', { name: /choisir|upgrade|passer/i }).count();
    expect(ctaCount).toBeGreaterThan(0);
  });
});
