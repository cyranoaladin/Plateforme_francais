import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');
}

test('Tentative API enseignant en tant qu’élève → 403', async ({ page }) => {
  await login(page);

  const status = await page.evaluate(async () => {
    const res = await fetch('/api/v1/enseignant/dashboard');
    return res.status;
  });

  expect(status).toBe(403);
});
