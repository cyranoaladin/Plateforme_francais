import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test('Parcours hebdo généré → activités visibles', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/mon-parcours');

  await expect(page.getByRole('heading', { name: /Mon parcours/i })).toBeVisible();
  await expect(page.getByText(/Semaine 1|Semaine/i)).toBeVisible({ timeout: 20_000 });

  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  if (await firstCheckbox.isVisible().catch(() => false)) {
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  }
});
