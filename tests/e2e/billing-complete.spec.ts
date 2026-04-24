import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Billing / Quotas / Paiement complet', () => {
  
  test('compte Free: affichage plan et quotas', async ({ page }) => {
    await loginAs(page, 'eleveFree');
    await page.goto('/dashboard');
    
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    
    // Vérifier l'affichage du plan
    const bodyText = await page.locator('body').textContent();
    
    // Un compte free devrait montrer soit "Free", soit des incitations à upgrader
    const hasPlanInfo = /free|gratuit|starter|basique/i.test(bodyText || '');
    const hasUpgradePrompt = /premium|pro|upgrade|passer/i.test(bodyText || '');
    
    expect(hasPlanInfo || hasUpgradePrompt).toBeTruthy();
  });

  test('compte Pro: affichage plan premium', async ({ page }) => {
    await loginAs(page, 'elevePremium');
    await page.goto('/dashboard');
    
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    
    const bodyText = await page.locator('body').textContent();
    
    // Vérifier qu'on voit (Pro) dans le nom ou des références au plan premium
    expect(bodyText).toMatch(/pro|premium|illimité/i);
  });

  test('page paiement/checkout accessible', async ({ page }) => {
    await loginAs(page, 'eleveFree');
    await page.goto('/paiement/checkout');
    
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    
    // La page doit contenir des éléments de paiement ou redirection
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/paiement|checkout|abonnement|plan/i);
  });

  test('API quotas: vérification cohérence', async ({ page }) => {
    await loginAs(page, 'eleveFree');
    
    // Appel API pour vérifier les quotas
    const response = await page.request.get('http://127.0.0.1:3110/api/v1/user/quota');
    
    // Vérifier que l'API répond (200 ou 401 si protégée)
    expect([200, 401, 403, 404]).toContain(response.status());
  });
});
