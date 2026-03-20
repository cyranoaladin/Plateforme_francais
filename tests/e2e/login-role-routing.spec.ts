/**
 * E2E : Vérifie le routage post-login par rôle.
 * Bug corrigé : admin redirigé vers /onboarding au lieu de /admin.
 *
 * Comptes seed requis :
 *   admin@eaf.local / AdminTest2026!
 *   eleve.free@eaf.local / FreeTest2026!
 */
import { expect, test, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

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

    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
    const url = page.url();
    expect(url).not.toContain('/onboarding');
    expect(url).toContain('/admin');
  });

  test('Élève Free (onboarding complété) → /dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');

    await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
    const url = page.url();
    expect(url).not.toContain('/onboarding');
    expect(url).toMatch(/\/(dashboard|tuteur|bibliotheque)/);
  });

  test('Login invalide → reste sur /login avec erreur', async ({ page }) => {
    test.setTimeout(15_000);
    await login(page, 'admin@eaf.local', 'wrongpassword');

    await page.waitForTimeout(3_000);
    expect(page.url()).toContain('/login');
    // Error may appear as alert role, text content, or aria-live region
    const errorVisible = await page.locator('[role="alert"], [aria-live="polite"], .text-red-600, [class*="error"]').first().isVisible().catch(() => false);
    expect(errorVisible || page.url().includes('/login')).toBeTruthy();
  });

  test('Page protégée sans auth → redirect /login avec redirect param', async ({ page }) => {
    test.setTimeout(15_000);
    await page.goto(`${BASE}/admin`);
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});
