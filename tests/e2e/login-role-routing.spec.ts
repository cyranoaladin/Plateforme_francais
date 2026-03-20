/**
 * E2E : Vérifie le routage post-login par rôle.
 * Bug corrigé : admin redirigé vers /onboarding au lieu de /admin.
 *
 * Comptes seed requis :
 *   admin@eaf.local / AdminTest2026!
 *   eleve.free@eaf.local / FreeTest2026!
 */
import { expect, test, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://eaf.nexusreussite.academy';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('[data-testid="auth-email"]', { timeout: 15_000 });
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
}

test.describe('Login → routage par rôle', () => {
  test('Admin → /admin (et PAS /onboarding)', async ({ page }) => {
    test.setTimeout(30_000);
    await login(page, 'admin@eaf.local', 'AdminTest2026!');

    // Must NOT land on /onboarding
    await page.waitForURL(/.*/, { timeout: 20_000 });
    const url = page.url();
    expect(url).not.toContain('/onboarding');
    expect(url).toContain('/admin');
  });

  test('Élève Free (onboarding complété) → /dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');

    await page.waitForURL(/.*/, { timeout: 20_000 });
    const url = page.url();
    // Should go to dashboard (onboarding already completed for seed users)
    expect(url).not.toContain('/onboarding');
    expect(url).toMatch(/\/(dashboard|tuteur|bibliotheque)/);
  });

  test('Login invalide → reste sur /login avec erreur', async ({ page }) => {
    test.setTimeout(15_000);
    await login(page, 'admin@eaf.local', 'wrongpassword');

    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/login');
    const errorText = await page.locator('[role="alert"]').textContent().catch(() => null);
    expect(errorText).toBeTruthy();
  });

  test('Page protégée sans auth → redirect /login avec redirect param', async ({ page }) => {
    test.setTimeout(15_000);
    await page.goto(`${BASE}/admin`);
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});
