import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('enseignant: page accessible et chargee', async ({ page }) => {
  // Un éleve peut accéder à /enseignant (pour voir son profil enseignant si lié)
  // ou être redirigé - on teste juste que la page ne crashe pas
  await loginAs(page, 'eleveFree');
  await page.goto('/enseignant');
  await page.waitForLoadState('networkidle');
  
  // La page doit charger sans erreur 500
  const bodyText = await page.locator('body').textContent();
  expect(bodyText).toBeTruthy();
  expect(bodyText?.length).toBeGreaterThan(50);
});
