import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

test.describe('Audit des rôles et isolation des dashboards', () => {
  test('Sécurité : Un élève ne peut pas accéder au dashboard admin', async ({ page }) => {
    await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');
    
    // Tentative d'accès direct
    await page.goto('/admin');
    
    // Attendu : Redirection vers /dashboard (comportement du layout)
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Tableau de bord admin')).not.toBeVisible();
  });

  test('Sécurité : Un élève ne peut pas accéder au dashboard enseignant', async ({ page }) => {
    await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');
    
    await page.goto('/enseignant');
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Espace enseignant')).not.toBeVisible();
  });

  test('Sécurité API : Un élève reçoit un 403 sur les routes API admin', async ({ page }) => {
    await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');
    
    const response = await page.request.get('/api/v1/admin/stats');
    expect(response.status()).toBe(403);
  });

  test('Rétrocompatibilité : Les noms de plans techniques ne fuitent pas (PRO/MAX)', async ({ page }) => {
    await login(page, 'admin@eaf.local', 'AdminTest2026!');
    await page.goto('/admin', { waitUntil: 'networkidle' });
    
    // Aller sur l'onglet Codes pour voir les sélecteurs
    await page.getByRole('tab', { name: "Codes d'activation" }).click();
    await expect(page.locator('#new-code-plan')).toBeVisible({ timeout: 10000 });
    
    const bodyContent = await page.textContent('body') ?? '';
    // On ne veut pas voir PRO ou MAX en majuscules isolés (labels techniques)
    expect(bodyContent).not.toMatch(/\b(PRO|MAX)\b/g);
    // On veut voir les labels commerciaux
    expect(bodyContent).toContain('Masterium');
  });
});
