import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');
}

test('Accès espace enseignant (élève) → accès refusé ou erreur explicite', async ({ page }) => {
  await login(page);
  await page.goto('/enseignant');

  await expect(
    page.getByText(/Accès refusé|Impossible de charger les données enseignant/i),
  ).toBeVisible({ timeout: 15_000 });
});
