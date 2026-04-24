import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('parent: page accessible et chargee', async ({ page }) => {
  // Un éleve peut accéder à /parent (pour voir son profil parent si lié)
  await loginAs(page, 'eleveFree');
  await page.goto('/parent');
  await page.waitForLoadState('networkidle');
  
  // La page doit charger sans erreur 500
  const bodyText = await page.locator('body').textContent();
  expect(bodyText).toBeTruthy();
  expect(bodyText?.length).toBeGreaterThan(50);
});
