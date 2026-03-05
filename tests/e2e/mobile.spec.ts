import { devices, expect, test } from '@playwright/test';

const iPhoneSE = devices['iPhone SE'];
test.use({
  viewport: iPhoneSE.viewport,
  userAgent: iPhoneSE.userAgent,
  deviceScaleFactor: iPhoneSE.deviceScaleFactor,
  isMobile: iPhoneSE.isMobile,
  hasTouch: iPhoneSE.hasTouch,
});

test('Parcours mobile: login + dashboard + navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/login');
  const consentDialog = page.getByRole('dialog', { name: /consentement/i });
  if (await consentDialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /Refuser|Accepter/i }).first().click();
  }
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

  await expect(page.locator('main').first()).toBeVisible();

  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: /Quiz adaptatif/i }).first()).toBeVisible();

  await page.goto('/atelier-oral');
  await expect(page.getByRole('heading', { name: /Atelier Oral IA|Oral EAF/i }).first()).toBeVisible();
});
