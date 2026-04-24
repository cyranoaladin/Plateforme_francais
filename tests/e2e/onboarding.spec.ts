import { expect, test, type Page } from '@playwright/test';

async function registerAndLogin(page: Page): Promise<boolean> {
  const email = `e2e_onboarding_${Date.now()}_${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'TestInscr2026!';

  // Aller directement au mode inscription
  await page.goto('/login?mode=register');
  
  // Attendre le formulaire d'inscription
  await expect(page.getByTestId('auth-email')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  
  // Accepter les conditions
  await page.locator('input[type="checkbox"]').first().check();
  
  // Soumettre
  await page.getByTestId('auth-submit').click();
  
  // Attendre redirection vers onboarding
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
  return true;
}

test('Inscription → onboarding wizard → dashboard personnalisé', async ({ page }) => {
  test.setTimeout(90_000);
  const registered = await registerAndLogin(page);
  if (!registered) { test.skip(); return; }

  // Étape 1: Profil
  await page.locator('#ob-name').fill('E2E Élève');
  await page.locator('#ob-date').fill('2026-06-11');
  
  // Continuer vers étape 2
  const btn1 = page.getByRole('button', { name: /continuer/i });
  await expect(btn1).toBeEnabled({ timeout: 5_000 });
  await btn1.click();

  // Étape 2: Sélection d'une œuvre
  const oeuvreChoice = page.locator('text=Cahier de Douai').first();
  await expect(oeuvreChoice).toBeVisible({ timeout: 15_000 });
  await oeuvreChoice.click();
  
  const btn2 = page.getByRole('button', { name: /continuer/i });
  await expect(btn2).toBeEnabled({ timeout: 5_000 });
  await btn2.click();

  // Étape 3: Terminer
  const finishBtn = page.getByRole('button', { name: /terminer/i });
  await expect(finishBtn).toBeEnabled({ timeout: 5_000 });
  await finishBtn.click();
  
  // Redirection vers dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.locator('main').first()).toBeVisible();
});
