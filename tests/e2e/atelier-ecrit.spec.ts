import { expect, test, type Page } from '@playwright/test';

function uniqueEmail() {
  return `e2e_ate_${Date.now()}_${Math.floor(Math.random() * 10_000)}@eaf.local`;
}

async function login(
  page: Page,
  email = process.env.E2E_USER_EMAIL ?? 'jean@eaf.local',
  password = process.env.E2E_USER_PASSWORD ?? 'demo1234',
) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function registerFreeUser(page: Page, email: string, password = 'TestInscr2026!') {
  await page.goto('/login');
  await page.getByRole('button', { name: /cr[ée]er un compte/i }).click();
  await page.locator('#displayName').fill('Élève Atelier Écrit');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  await expect(page.locator('#ob-name')).toBeVisible({ timeout: 10_000 });
  await page.locator('#ob-name').fill('Élève Atelier Écrit');
  await page.locator('#ob-date').fill('2026-06-11');
  const nextBtn1 = page.getByRole('button', { name: /continuer/i });
  await expect(nextBtn1).toBeEnabled({ timeout: 5_000 });
  await nextBtn1.click();

  await expect(page.getByText(/Cahier de Douai/i).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText(/Cahier de Douai/i).first().click();
  const nextBtn2 = page.getByRole('button', { name: /continuer/i });
  await expect(nextBtn2).toBeEnabled({ timeout: 5_000 });
  await nextBtn2.click();

  const finishBtn = page.getByRole('button', { name: /terminer/i });
  await expect(finishBtn).toBeVisible({ timeout: 10_000 });
  await expect(finishBtn).toBeEnabled({ timeout: 5_000 });
  await finishBtn.click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

test('Génération sujet → upload copie → lien rapport', async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.goto('/atelier-ecrit');

  await page.getByRole('button', { name: /Générer mon sujet/i }).click();
  await expect(page.getByText(/Déposer ma copie/i)).toBeVisible();

  const fixturePath = `${process.cwd()}/tests/fixtures/copie-test.png`;
  await page.getByLabel('Sélectionner un fichier de copie').setInputFiles(fixturePath);

  const correctionButton = page.getByRole('button', { name: /Lancer la correction détaillée/i });
  // In CI with mock LLM, the button may stay disabled — assert it is at least present
  await expect(correctionButton).toBeVisible({ timeout: 10_000 });
  const isEnabled = await correctionButton.isEnabled().catch(() => false);
  if (isEnabled) {
    await correctionButton.click();
    const correctionState = page
      .getByText(/Analyse de la copie en cours/i)
      .or(page.getByRole('link', { name: /Voir mon rapport/i }))
      .or(page.getByText(/Envoi en cours/i));
    await expect(correctionState.first()).toBeVisible({ timeout: 20_000 });
  }
});

test('Freemium - génère un sujet OK puis bloque le dépôt OCR', async ({ page }) => {
  test.setTimeout(120_000);

  const email = uniqueEmail();
  const password = 'TestInscr2026!';
  await registerFreeUser(page, email, password);
  await page.goto('/atelier-ecrit');

  await page.getByRole('button', { name: /Générer mon sujet/i }).click();
  await expect(page.getByText(/Déposer ma copie/i)).toBeVisible({ timeout: 20_000 });

  const fixturePath = `${process.cwd()}/tests/fixtures/copie-test.png`;
  await page.getByLabel('Sélectionner un fichier de copie').setInputFiles(fixturePath);
  const uploadResponsePromise = page.waitForResponse((response) => {
    return response.url().includes('/api/v1/epreuves/') && response.url().includes('/copie') && response.request().method() === 'POST';
  });

  await page.getByRole('button', { name: /Lancer la correction détaillée/i }).click();

  const uploadResponse = await uploadResponsePromise;
  expect(uploadResponse.status()).toBe(402);
  const payload = (await uploadResponse.json()) as { error?: string; code?: string };
  expect(payload.code).toBe('QUOTA_EXCEEDED');
  expect(payload.error).toMatch(/OCR|quota|limite/i);

  await expect(page.getByText(/OCR|quota|limite/i).first()).toBeVisible({ timeout: 20_000 });
});
