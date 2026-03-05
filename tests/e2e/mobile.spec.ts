import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone SE'] });

test('Parcours mobile: login + dashboard + navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');

  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();

  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: /Quiz adaptatif/i })).toBeVisible();

  await page.goto('/atelier-oral');
  await expect(page.getByRole('heading', { name: /Oral EAF/i })).toBeVisible();
});
