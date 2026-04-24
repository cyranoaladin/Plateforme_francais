import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('dashboard eleve UI', () => {
  test('dashboard eleve accessible et chargé', async ({ page }) => {
    // Login avec compte seedé
    await loginAs(page, 'eleveFree');
    
    // Navigation vers dashboard
    await page.goto('/dashboard');
    
    // Attendre que la page charge
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page contient du contenu (pas une erreur 404/500)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(100);
    
    // Vérifier présence éléments typiques dashboard
    const hasDashboardContent = 
      bodyText?.toLowerCase().includes('dashboard') ||
      bodyText?.toLowerCase().includes('bienvenue') ||
      bodyText?.toLowerCase().includes('bonjour') ||
      bodyText?.toLowerCase().includes('oral') ||
      bodyText?.toLowerCase().includes('écrit');
    
    expect(hasDashboardContent).toBe(true);
  });
});
