import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test('Quiz 10 questions → validation → score affiché', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/quiz');

  await page.locator('#quiz-nb-questions').selectOption('10');
  await page.getByRole('button', { name: /^Générer$/i }).click();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible({ timeout: 20_000 });

  const radios = page.locator('input[type="radio"]');
  const count = await radios.count();
  for (let i = 0; i < count; i += 4) {
    await radios.nth(i).check();
  }

  await page.getByRole('button', { name: /Valider/i }).click();
  await expect(page.getByText(/Score:\s*\d+%/)).toBeVisible();
});
