import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

function uniqueEmail() {
  return `e2e_ob_${Date.now()}_${Math.floor(Math.random() * 9999)}@nexus-eaf.local`;
}

async function registerAndGoToOnboarding(page: Page, password = 'NexusE2E2026!'): Promise<string> {
  const email = uniqueEmail();
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /cr[ée]er un compte/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /cr[ée]er un compte/i }).click();
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
  return email;
}

// ── Suite A : guards de validation (1 seule inscription) ────────────────────

test.describe.serial('01A — Guards de validation par étape', () => {
  test.setTimeout(120_000);

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    sharedPage = await ctx.newPage();
    await registerAndGoToOnboarding(sharedPage);
  });

  test('1.1 - Inscription redirige vers /onboarding et affiche #ob-name', async () => {
    await expect(sharedPage.locator('#ob-name')).toBeVisible({ timeout: 10_000 });
  });

  test('1.2 - StepRail indique étape courante (aria-current)', async () => {
    await expect(sharedPage.locator('[aria-current="step"]')).toBeVisible({ timeout: 5_000 });
    const label = await sharedPage.locator('[aria-current="step"]').textContent();
    expect(label).toBeTruthy();
  });

  test('1.3 - Étape 1 : bouton Continuer désactivé sans prénom ni date', async () => {
    const continuer = sharedPage.getByRole('button', { name: /continuer/i });
    await expect(continuer).toBeDisabled({ timeout: 5_000 });
  });

  test('1.4 - Étape 1 : bouton Continuer activé après prénom + date EAF', async () => {
    await sharedPage.locator('#ob-name').fill('Sophie Martin');
    await sharedPage.locator('#ob-date').fill('2026-06-11');
    await expect(sharedPage.getByRole('button', { name: /continuer/i })).toBeEnabled({ timeout: 5_000 });
    await sharedPage.getByRole('button', { name: /continuer/i }).click();
  });

  test('1.5 - Étape 2 : bouton Continuer désactivé sans œuvre sélectionnée', async () => {
    await expect(sharedPage.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(sharedPage.getByRole('button', { name: /continuer/i })).toBeDisabled({ timeout: 5_000 });
  });

  test('1.6 - Étape 2 : bouton Continuer activé après sélection d\'une œuvre', async () => {
    await sharedPage.getByText(/cahier de douai/i).first().click();
    await expect(sharedPage.getByRole('button', { name: /continuer/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('1.7 - Étape 3 : bouton Retour ramène à étape 2', async () => {
    await sharedPage.getByRole('button', { name: /continuer/i }).click();
    // Étape 3 visible
    await expect(sharedPage.getByRole('button', { name: /terminer/i })).toBeVisible({ timeout: 10_000 });
    // Retour → étape 2
    await sharedPage.getByRole('button', { name: /retour/i }).click();
    await expect(sharedPage.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 5_000 });
    // Revenir étape 3 pour les prochains tests
    await sharedPage.getByRole('button', { name: /continuer/i }).click();
  });

  test('1.8 - Étape 3 : sliders présents et modifiables (signal faible)', async () => {
    const sliders = sharedPage.locator('input[type="range"]');
    await expect(sliders.first()).toBeVisible({ timeout: 10_000 });
    expect(await sliders.count()).toBeGreaterThanOrEqual(1);
    await sliders.first().fill('1');
    await expect(sharedPage.getByRole('button', { name: /terminer/i })).toBeEnabled({ timeout: 5_000 });
  });
});

// ── Suite B : flux complet 3 étapes → /dashboard (1 seule inscription) ─────

test.describe('01B — Flux complet → /dashboard', () => {
  test.setTimeout(120_000);

  test('1.9 - Flux complet 3 étapes redirige vers /dashboard', async ({ page }) => {
    await registerAndGoToOnboarding(page);

    // Étape 1
    await expect(page.locator('#ob-name')).toBeVisible({ timeout: 10_000 });
    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 2
    await expect(page.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByText(/cahier de douai/i).first().click();
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 3
    await expect(page.getByRole('button', { name: /terminer/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /terminer/i }).click();

    // Redirection /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.locator('main').first()).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Application error');
  });
});

// ── Suite C : API non authentifiée ──────────────────────────────────────────

test.describe('01C — API guard', () => {
  test('1.10 - GET /api/v1/student/profile sans session → 401', async ({ page }) => {
    const res = await page.request.get('/api/v1/student/profile');
    expect(res.status()).toBe(401);
  });
});
