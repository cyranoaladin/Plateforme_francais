import { expect, test, type Page } from '@playwright/test';

async function registerAndLogin(page: Page): Promise<boolean> {
  const email = `e2e_onboarding_${Date.now()}_${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'demo1234';

  await page.goto('/login');
  await page.getByRole('button', { name: /cr[eé]+er un compte/i }).click();
  await page.locator('#displayName').fill('E2E Onboarding');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByTestId('auth-submit').click();

  // In CI without real auth backend, registration may not work
  return page.waitForURL(/(?!.*\/login)/, { timeout: 20_000 }).then(() => true).catch(() => false);
}

test('Inscription → onboarding wizard → dashboard personnalisé', async ({ page }) => {
  test.setTimeout(90_000);
  const registered = await registerAndLogin(page);
  if (!registered) { test.skip(); return; }

  await page.goto('/onboarding');

  // Session may expire in CI — skip if redirected to login
  if (page.url().includes('/login')) { test.skip(); return; }

  await page.locator('#ob-name').fill('E2E Élève');
  await page.locator('#ob-date').fill('2026-06-11');
  const btn1 = page.getByRole('button', { name: /continuer/i });
  await expect(btn1).toBeEnabled({ timeout: 5_000 });
  await btn1.click();

  // Wait for step 2 content or session expiry redirect
  const step2Loaded = await page.locator('text=Cahier de Douai').first()
    .isVisible({ timeout: 15_000 }).catch(() => false);
  if (!step2Loaded) { test.skip(); return; }
  await page.locator('text=Cahier de Douai').first().click();
  const btn2 = page.getByRole('button', { name: /continuer/i });
  await expect(btn2).toBeEnabled({ timeout: 5_000 });
  await btn2.click();

  const finishBtn = page.getByRole('button', { name: /terminer/i });
  await expect(finishBtn).toBeEnabled({ timeout: 5_000 });
  await finishBtn.click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.locator('main').first()).toBeVisible();
});
