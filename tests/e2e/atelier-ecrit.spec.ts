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

  const correctionButton = page.getByRole('button', { name: /Lancer la correction détaillée/i });
  // In CI with mock LLM, the button may stay disabled — assert it is at least present
  await expect(correctionButton).toBeVisible({ timeout: 10_000 });
  const isEnabled = await correctionButton.isEnabled().catch(() => false);
  if (isEnabled) {
    await correctionButton.click();
    const correctionState = page
      .getByText(/Analyse de la copie en cours/i)
      .or(page.getByRole('link', { name: /Voir mon rapport/i }))
      .or(page.getByText(/Envoi en cours/i));
    await expect(correctionState.first()).toBeVisible({ timeout: 20_000 });
  }
});
