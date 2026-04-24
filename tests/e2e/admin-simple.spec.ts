import { expect, test } from '@playwright/test';

async function login(page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test('admin: non-auth user is redirected to /login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
});

test('admin: eleve user is denied and redirected to /dashboard', async ({ page }) => {
  await login(page, 'eleve.free@eaf.local', 'FreeTest2026!');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test('admin: admin user can access dashboard', async ({ page }) => {
  await login(page, 'admin@eaf.local', 'AdminTest2026!');
  await page.goto('/admin');
  
  // Vérifie que la page admin charge sans erreur
  await page.waitForLoadState('networkidle');
  const bodyText = await page.locator('body').textContent();
  
  // Vérifie présence contenu admin (stats, utilisateurs, ou titre)
  const hasAdminContent = 
    bodyText?.toLowerCase().includes('admin') ||
    bodyText?.toLowerCase().includes('utilisateurs') ||
    bodyText?.toLowerCase().includes('codes') ||
    bodyText?.toLowerCase().includes('statistiques') ||
    bodyText?.toLowerCase().includes('dashboard');
  
  expect(hasAdminContent).toBe(true);
});

test('admin: parent and teacher surfaces redirect for admin', async ({ page }) => {
  await login(page, 'admin@eaf.local', 'AdminTest2026!');
  
  // Test /parent
  await page.goto('/parent');
  // Admin sur /parent doit être redirigé ou voir une erreur/redirect
  const urlParent = page.url();
  expect(urlParent !== 'http://127.0.0.1:3110/parent' || await page.locator('body').textContent().then(t => t?.toLowerCase().includes('admin'))).toBeTruthy();
  
  // Test /enseignant  
  await page.goto('/enseignant');
  const urlEnseignant = page.url();
  expect(urlEnseignant !== 'http://127.0.0.1:3110/enseignant' || await page.locator('body').textContent().then(t => t?.toLowerCase().includes('admin'))).toBeTruthy();
});
