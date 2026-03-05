import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/.*(?<!login)$/); // URL should NOT end with login
}

test('Sélection œuvre → démarrage simulation → affichage extrait', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

  test.setTimeout(60_000);
  await login(page);
  await page.goto('/atelier-oral');

  await page.getByTestId('oeuvre-select').selectOption({ index: 1 });
  await page.getByTestId('start-session-btn').click();

  await expect(page.getByTestId('extrait-texte')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Préparation|30:00|29:/i)).toBeVisible({ timeout: 20_000 });
});
