import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'https://eaf.nexusreussite.academy';

async function loginViaApi(page: import('@playwright/test').Page, email: string, password: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await page.request.post(`${baseURL}/api/v1/auth/login`, {
      data: { email, password },
    });

    if (response.ok()) {
      return;
    }

    if (response.status() === 429 && attempt === 0) {
      const retryAfter = Number(response.headers()['retry-after'] ?? '5');
      await page.waitForTimeout(retryAfter * 1000);
      continue;
    }

    expect(response.ok()).toBeTruthy();
  }
}

test.describe('Audit role dashboards on production', () => {
  test('parent dashboard is useful and free of legacy plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-parent-1774367337@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/parent`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Espace parent')).toBeVisible();
    await expect(page.getByText('Conseil parental de la semaine')).toBeVisible();
    await expect(page.getByText('Aucun élève n’est encore rattaché', { exact: false })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('PRO');
    await expect(page.locator('body')).not.toContainText('MAX');
  });

  test('teacher dashboard is useful and free of legacy plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-teacher-1774367337@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/enseignant`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Espace enseignant')).toBeVisible();
    await expect(page.getByText('Générer un code classe')).toBeVisible();
    await expect(page.getByText('Export CSV')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('PRO');
    await expect(page.locator('body')).not.toContainText('MAX');
  });

  test('admin dashboard is in French and uses only business plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-admin-1774370368@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Tableau de bord admin' })).toBeVisible();
    await page.getByRole('button', { name: "Codes d'activation" }).click();
    await expect(page.getByText('Générer un code d\'activation')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Dashboard Admin');
    await expect(page.locator('body')).not.toContainText('MAX');
  });
});
