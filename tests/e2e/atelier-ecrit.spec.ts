import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test('Génération sujet → upload copie → lien rapport', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.goto('/atelier-ecrit');

  await page.getByRole('button', { name: /Générer mon sujet/i }).click();
  await expect(page.getByText(/Déposer ma copie/i)).toBeVisible();

  const fixturePath = `${process.cwd()}/tests/fixtures/copie-test.png`;
  await page.locator('input[type="file"]').first().setInputFiles(fixturePath);
  await page.getByRole('button', { name: /Lancer la correction IA/i }).click();

  await expect(page.getByText(/Analyse IA en cours|Correction en cours/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('link', { name: /Voir mon rapport/i })).toBeVisible({ timeout: 90_000 });
});
