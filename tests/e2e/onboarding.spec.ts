import { expect, test, type Page } from '@playwright/test';

async function registerAndLogin(page: Page) {
  const email = `e2e_onboarding_${Date.now()}_${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'demo1234';

  await page.goto('/login');
  await page.getByRole('button', { name: 'Inscription' }).click();
  await page.getByLabel('Nom affiché').fill('E2E Onboarding');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');
}

test('Inscription → onboarding wizard → dashboard personnalisé', async ({ page }) => {
  test.setTimeout(90_000);
  await registerAndLogin(page);

  await page.goto('/onboarding');
  await page.getByPlaceholder('Ton prénom...').fill('E2E Élève');
  await page.locator('input[type="date"]').fill('2026-06-11');
  await page.getByRole('button', { name: /suivant/i }).click();

  await page.locator('text=Cahier de Douai').first().click();
  await page.getByRole('button', { name: /suivant/i }).click();

  await page.getByRole('button', { name: /générer mon parcours|terminer/i }).click();
  await expect(page).toHaveURL('/', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
});
