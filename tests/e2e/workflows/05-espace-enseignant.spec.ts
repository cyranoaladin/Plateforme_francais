import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('05 — Espace Enseignant', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'enseignant');
  });

  test('5.1 - Dashboard enseignant accessible', async ({ page }) => {
    await page.goto('/enseignant');
    await expect(page).toHaveURL(/enseignant/);
    await expect(page.locator('body')).not.toContainText('403');
    await expect(page.locator('body')).not.toContainText('Non autorisé');
  });

  test('5.2 - API dashboard répond 200', async ({ page }) => {
    const res = await page.request.get('/api/v1/enseignant/dashboard');
    expect(res.status()).toBe(200);
  });

  test('5.3 - Élève non enseignant ne peut pas accéder', async ({ page }) => {
    await loginAs(page, 'eleve');
    await page.goto('/enseignant');
    await expect(page).not.toHaveURL(/enseignant(?!.*\/(login|register))/);
  });
});
