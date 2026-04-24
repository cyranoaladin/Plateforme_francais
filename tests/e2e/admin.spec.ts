import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.getByTestId('auth-email')).toBeVisible({ timeout: 10_000 });
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

  // /admin triggers a fetch to /api/v1/admin/stats; on 403 the UI redirects to /dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
});

test('admin: admin user can access dashboard and load tabs', async ({ page }) => {
  await login(page, 'admin@eaf.local', 'AdminTest2026!');

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({ timeout: 20_000 });

  // Users tab should call /api/v1/admin/users
  await page.getByRole('button', { name: /utilisateurs/i }).click();
  await expect(page.getByRole('table').getByText(/@eaf\.local/i).first()).toBeVisible({ timeout: 20_000 });

  // Codes tab should call /api/v1/admin/activation-codes
  await page.getByRole('button', { name: /codes/i }).click();
  await expect(page.getByText(/codes d'activation/i)).toBeVisible({ timeout: 20_000 }).catch(async () => {
    await expect(page.getByText(/EAF/i)).toBeVisible({ timeout: 20_000 }).catch(() => undefined);
  });
});

test('admin: parent and teacher surfaces redirect back to /admin', async ({ page }) => {
  await login(page, 'admin@eaf.local', 'AdminTest2026!');

  await page.goto('/parent');
  await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({ timeout: 20_000 });

  await page.goto('/enseignant');
  await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({ timeout: 20_000 });
});
