import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');
}

test('Sélection œuvre → démarrage simulation → affichage extrait', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/atelier-oral');

  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByTestId('start-session-btn').click();

  await expect(page.getByTestId('extrait-texte')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Préparation|30:00|29:/i)).toBeVisible({ timeout: 20_000 });
});
