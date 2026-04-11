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

// ── Test suite ────────────────────────────────────────────────────────────────

test.describe('01 — Inscription et onboarding complet', () => {

  test('1.1 - Inscription depuis /login?mode=register redirige vers /onboarding', async ({ page }) => {
    await registerAndGoToOnboarding(page);
    await expect(page.locator('#ob-name')).toBeVisible({ timeout: 10_000 });
  });

  test('1.2 - Étape 1 : bouton Continuer désactivé sans prénom ni date', async ({ page }) => {
    test.setTimeout(60_000);
    await registerAndGoToOnboarding(page);
    const continuer = page.getByRole('button', { name: /continuer/i });
    await expect(continuer).toBeDisabled({ timeout: 5_000 });
  });

  test('1.3 - Étape 1 : bouton Continuer activé après prénom + date EAF', async ({ page }) => {
    test.setTimeout(60_000);
    await registerAndGoToOnboarding(page);
    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await expect(page.getByRole('button', { name: /continuer/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('1.4 - Étape 2 : bouton Continuer désactivé sans œuvre sélectionnée', async ({ page }) => {
    test.setTimeout(90_000);
    await registerAndGoToOnboarding(page);

    // Passer étape 1
    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 2 sans sélection
    await expect(page.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 10_000 });
    const continuer2 = page.getByRole('button', { name: /continuer/i });
    await expect(continuer2).toBeDisabled({ timeout: 5_000 });
  });

  test('1.5 - Étape 2 : bouton Continuer activé après sélection d\'une œuvre', async ({ page }) => {
    test.setTimeout(90_000);
    await registerAndGoToOnboarding(page);

    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await page.getByRole('button', { name: /continuer/i }).click();

    await page.getByText(/cahier de douai/i).first().click();
    await expect(page.getByRole('button', { name: /continuer/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('1.6 - Flux complet 3 étapes → redirection /dashboard', async ({ page }) => {
    test.setTimeout(120_000);
    await registerAndGoToOnboarding(page);

    // Étape 1 : profil
    await expect(page.locator('#ob-name')).toBeVisible({ timeout: 10_000 });
    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    const nextBtn1 = page.getByRole('button', { name: /continuer/i });
    await expect(nextBtn1).toBeEnabled({ timeout: 5_000 });
    await nextBtn1.click();

    // Étape 2 : œuvres
    await expect(page.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 10_000 });
    await page.getByText(/cahier de douai/i).first().click();
    const nextBtn2 = page.getByRole('button', { name: /continuer/i });
    await expect(nextBtn2).toBeEnabled({ timeout: 5_000 });
    await nextBtn2.click();

    // Étape 3 : auto-évaluation (sliders déjà à 3 par défaut)
    const finishBtn = page.getByRole('button', { name: /terminer/i });
    await expect(finishBtn).toBeVisible({ timeout: 10_000 });
    await expect(finishBtn).toBeEnabled({ timeout: 5_000 });
    await finishBtn.click();

    // Après onboarding → /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.locator('main').first()).toBeVisible();
    // Pas d'erreur serveur
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Application error');
  });

  test('1.7 - Étape 3 : les sliders d\'auto-évaluation sont présents et modifiables', async ({ page }) => {
    test.setTimeout(90_000);
    await registerAndGoToOnboarding(page);

    // Étape 1
    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 2
    await page.getByText(/cahier de douai/i).first().click();
    await page.getByRole('button', { name: /continuer/i }).click();

    // Étape 3 : vérifier les sliders
    const sliders = page.locator('input[type="range"]');
    await expect(sliders.first()).toBeVisible({ timeout: 10_000 });
    const count = await sliders.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Mettre un slider à 1 (signal faible détecté)
    await sliders.first().fill('1');
    // L'état de priorisation doit s'afficher
    await expect(page.getByRole('button', { name: /terminer/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('1.8 - Étape 3 : bouton Retour ramène à étape 2', async ({ page }) => {
    test.setTimeout(90_000);
    await registerAndGoToOnboarding(page);

    await page.locator('#ob-name').fill('Sophie Martin');
    await page.locator('#ob-date').fill('2026-06-11');
    await page.getByRole('button', { name: /continuer/i }).click();
    await page.getByText(/cahier de douai/i).first().click();
    await page.getByRole('button', { name: /continuer/i }).click();

    // Depuis l'étape 3, cliquer Retour
    await expect(page.getByRole('button', { name: /retour/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /retour/i }).click();

    // Doit afficher les œuvres (étape 2)
    await expect(page.getByText(/cahier de douai/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('1.9 - Navigation StepRail indique l\'étape courante (aria-current)', async ({ page }) => {
    test.setTimeout(60_000);
    await registerAndGoToOnboarding(page);

    // En étape 1, le nav doit avoir aria-current="step"
    await expect(page.locator('[aria-current="step"]')).toBeVisible({ timeout: 5_000 });
    const stepLabel = await page.locator('[aria-current="step"]').textContent();
    expect(stepLabel).toBeTruthy();
  });

  test('1.10 - API /api/v1/student/profile nécessite une session valide', async ({ page }) => {
    const res = await page.request.get('/api/v1/student/profile');
    expect(res.status()).toBe(401);
  });
});
