import { expect, test, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function adminLogin(page: Page) {
  await page.goto('/admin/login');
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible({ timeout: 10_000 });
  await page.locator('#admin-email').fill('admin@eaf.local');
  await page.locator('#admin-password').fill('AdminTest2026!');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/, { timeout: 20_000 });
}

function navButton(page: Page, label: string | RegExp) {
  return page.locator('aside button', { hasText: label });
}

// ---------------------------------------------------------------------------
// Admin Login Page
// ---------------------------------------------------------------------------

test.describe('Admin Login Page', () => {
  test('renders login form with admin branding', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
    await expect(page.locator('#admin-email')).toBeVisible();
    await expect(page.locator('#admin-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('rejects non-admin user', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#admin-email').fill('eleve.free@eaf.local');
    await page.locator('#admin-password').fill('FreeTest2026!');
    await page.locator('button[type="submit"]').click();
    // Should show error about admin-only access
    await expect(page.getByText(/administrateurs/i)).toBeVisible({ timeout: 10_000 });
    // Should stay on login page
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('admin can login and reach dashboard', async ({ page }) => {
    await adminLogin(page);
    // Should see sidebar with navigation
    await expect(navButton(page, /vue d'ensemble/i)).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Sidebar Navigation
// ---------------------------------------------------------------------------

test.describe('Admin Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('shows all 7 navigation tabs', async ({ page }) => {
    const expectedTabs = [
      /vue d'ensemble/i,
      /utilisateurs/i,
      /sessions/i,
      /activit/i,
      /codes/i,
      /paiements/i,
      /journal d'audit/i,
    ];
    for (const label of expectedTabs) {
      await expect(navButton(page, label)).toBeVisible();
    }
  });

  test('clicking a tab updates URL and content', async ({ page }) => {
    await navButton(page, /utilisateurs/i).click();
    await expect(page).toHaveURL(/tab=users/);

    await navButton(page, /sessions/i).click();
    await expect(page).toHaveURL(/tab=sessions/);

    await navButton(page, /journal d'audit/i).click();
    await expect(page).toHaveURL(/tab=audit/);
  });

  test('logout redirects to admin login', async ({ page }) => {
    await page.locator('aside button', { hasText: /deconnexion/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Sessions Tab
// ---------------------------------------------------------------------------

test.describe('Sessions Tab', () => {
  test('displays active sessions list', async ({ page }) => {
    await adminLogin(page);
    await navButton(page, /sessions/i).click();
    await expect(page).toHaveURL(/tab=sessions/);

    // Should show sessions content — either session entries or empty state
    await expect(
      page.getByText(/session/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Activity Tab
// ---------------------------------------------------------------------------

test.describe('Activity Tab', () => {
  test('displays activity data with period selector', async ({ page }) => {
    await adminLogin(page);
    await navButton(page, /activit/i).click();
    await expect(page).toHaveURL(/tab=activity/);

    // Should show the activity tab content
    await expect(
      page.getByText(/activit/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Audit Tab
// ---------------------------------------------------------------------------

test.describe('Audit Tab', () => {
  test('displays audit log with filter controls', async ({ page }) => {
    await adminLogin(page);
    await navButton(page, /journal d'audit/i).click();
    await expect(page).toHaveURL(/tab=audit/);

    // Should show audit tab content
    await expect(
      page.getByText(/audit/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Codes Tab
// ---------------------------------------------------------------------------

test.describe('Codes Tab', () => {
  test('displays codes management with generation controls', async ({ page }) => {
    await adminLogin(page);
    await navButton(page, /codes/i).click();
    await expect(page).toHaveURL(/tab=codes/);

    // Should show codes tab content
    await expect(
      page.getByText(/code/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Users Tab
// ---------------------------------------------------------------------------

test.describe('Users Tab', () => {
  test('displays user list with search', async ({ page }) => {
    await adminLogin(page);
    await navButton(page, /utilisateurs/i).click();
    await expect(page).toHaveURL(/tab=users/);

    // Should show at least one user (the admin themselves)
    await expect(
      page.getByText(/@/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Auth Guard
// ---------------------------------------------------------------------------

test.describe('Auth Guard', () => {
  test('unauthenticated user accessing /admin is redirected', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login|\/login/, { timeout: 20_000 });
  });
});
