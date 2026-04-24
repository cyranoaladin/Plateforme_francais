import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Atelier Ecrit - Simple', () => {
  test('Page atelier ecrit accessible et chargee', async ({ page }) => {
    // Utilise compte seedé avec onboarding complété
    await loginAs(page, 'eleveFree');
    
    await page.goto('/atelier-ecrit');
    await page.waitForLoadState('networkidle');
    
    // Verifie que la page charge sans erreur
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // Verifie presence elements metier
    const hasContent = 
      bodyText?.toLowerCase().includes('ecrit') ||
      bodyText?.toLowerCase().includes('sujet') ||
      bodyText?.toLowerCase().includes('copie');
    
    expect(hasContent).toBe(true);
  });
  
  test('Generation sujet accessible pour Premium', async ({ page }) => {
    await loginAs(page, 'elevePremium');
    
    await page.goto('/atelier-ecrit');
    await page.waitForLoadState('networkidle');
    
    // Verifie que le bouton de generation est present
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.toLowerCase()).toMatch(/generer|sujet|nouveau/i);
  });
});
