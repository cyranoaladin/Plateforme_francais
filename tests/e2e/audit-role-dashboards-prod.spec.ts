import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'https://eaf.nexusreussite.academy';
const isProductionAuditBaseUrl = /https:\/\/eaf\.nexusreussite\.academy/i.test(baseURL);

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
  test.skip(!isProductionAuditBaseUrl, 'Ces comptes d’audit existent uniquement sur la production réelle.');

  const legacyPlansRegex = /\b(PRO|MAX)\b/g;

  test('parent dashboard is useful and free of legacy plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-parent-1774367337@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/parent`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Espace parent')).toBeVisible();
    await expect(page.getByText('Conseil parental de la semaine')).toBeVisible();
    await expect(page.getByText('Aucun élève n’est encore rattaché', { exact: false })).toHaveCount(0);
    
    // Leak detection
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toMatch(legacyPlansRegex);
  });

  test('teacher dashboard is useful and free of legacy plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-teacher-1774367337@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/enseignant`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Espace enseignant')).toBeVisible();
    await expect(page.getByText('Générer un code classe')).toBeVisible();
    await expect(page.getByText('Export CSV')).toBeVisible();
    
    // Leak detection
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toMatch(legacyPlansRegex);
  });

  test('admin dashboard is in French and uses only business plan labels', async ({ page }) => {
    await loginViaApi(page, 'audit-admin-1774370368@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Tableau de bord admin' })).toBeVisible();
    await page.getByRole('button', { name: "Codes d'activation" }).click();
    await expect(page.getByText('Générer un code d\'activation')).toBeVisible();
    
    // Leak detection
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toMatch(legacyPlansRegex);
    await expect(page.locator('body')).not.toContainText('Dashboard Admin');
  });

  test('role security: parent cannot access admin dashboard', async ({ page }) => {
    await loginViaApi(page, 'audit-parent-1774367337@test-nexus.dev', 'Audit2026!');
    const response = await page.goto(`${baseURL}/admin`);
    
    // Standard behavior: redirect to their own dashboard or home if unauthorized
    expect(page.url()).not.toContain('/admin');
    if (page.url().includes('/parent') || page.url() === `${baseURL}/`) {
      // Access blocked and redirected
    } else {
      expect(response?.status()).toBe(403);
    }
  });

  test('role security: teacher cannot access admin dashboard', async ({ page }) => {
    await loginViaApi(page, 'audit-teacher-1774367337@test-nexus.dev', 'Audit2026!');
    await page.goto(`${baseURL}/admin`);
    expect(page.url()).not.toContain('/admin');
  });
});
