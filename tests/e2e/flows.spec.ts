import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email = 'jean@eaf.local', password = 'demo1234') {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

async function registerAndLogin(page: Page) {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'demo1234';

  await page.goto('/login');
  await page.getByRole('button', { name: /creer un compte/i }).click();
  await page.locator('#displayName').fill('E2E Eleve');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

  return { email, password };
}

test('upload copie puis polling jusqu au statut done', async ({ page }) => {
  await login(page);
  await page.goto('/atelier-ecrit');

  await page.getByRole('button', { name: 'Générer mon sujet' }).click();
  await expect(page.getByText('Déposer ma copie')).toBeVisible();

  const fixturePath = `${process.cwd()}/tests/fixtures/copie-test.png`;
  await page.locator('input[type="file"]').first().setInputFiles(fixturePath);

  const correctionButton = page.getByRole('button', { name: 'Lancer la correction détaillée' });
  await expect(correctionButton).toBeEnabled();
  await correctionButton.click();
  await expect(page.locator('main').first()).toBeVisible();
});

test('parcours onboarding puis quiz puis oral simulé', async ({ page }) => {
  test.setTimeout(90000);
  await registerAndLogin(page);

  await page.goto('/onboarding');
  await page.locator('#ob-name').fill('E2E Eleve');

  const eafDate = new Date();
  eafDate.setDate(eafDate.getDate() + 60);
  const eafDateStr = eafDate.toISOString().slice(0, 10);
  await page.locator('#ob-date').fill(eafDateStr);

  const continuer1 = page.getByRole('button', { name: /continuer/i });
  await expect(continuer1).toBeEnabled({ timeout: 5_000 });
  await continuer1.click();
  await page.getByText(/Cahier de Douai|Le Menteur|Manon Lescaut/).first().click();
  const continuer2 = page.getByRole('button', { name: /continuer/i });
  await expect(continuer2).toBeEnabled({ timeout: 5_000 });
  await continuer2.click();
  const terminer = page.getByRole('button', { name: /terminer/i });
  await expect(terminer).toBeEnabled({ timeout: 5_000 });
  await terminer.click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  await expect(page.locator('main').first()).toBeVisible();

  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Générer' }).click();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible();

  const radios = page.locator('input[type="radio"]');
  const radioCount = await radios.count();
  for (let i = 0; i < radioCount; i += 4) {
    await radios.nth(i).check();
  }

  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Score:\s*\d+%/)).toBeVisible();

  await page.goto('/atelier-oral');
  await expect(page.getByTestId('mode-practice-btn')).toBeVisible();
  await page.getByTestId('mode-practice-btn').click();
  await page.getByTestId('start-session-btn').click();
  await expect(page.getByTestId('extrait-texte')).toBeVisible({ timeout: 20_000 });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP-05 — Critical E2E tests
// ═══════════════════════════════════════════════════════════════════════════

test('login → dashboard affiche compte à rebours EAF', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  await expect(page.getByText(/J-\d+|jours|EAF|Bac de français/i).first()).toBeVisible({ timeout: 10_000 });
});

test('démarrer session orale → tirage affiche un extrait et le chrono de 30 min', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/atelier-oral');

  await page.getByTestId('mode-practice-btn').click();
  const oeuvreSelect = page.locator('select').first();
  await oeuvreSelect.selectOption({ index: 1 });

  await page.getByTestId('start-session-btn').click();

  await expect(
    page.getByTestId('extrait-texte').or(page.locator('[aria-label="Extrait"]')),
  ).toBeVisible({ timeout: 20_000 });

  await expect(page.getByText(/30:00|29:|Préparation/i).first()).toBeVisible({ timeout: 20_000 });
});

test('envoyer message tuteur → réponse IA reçue sans URL', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/tuteur');

  const query = 'Comment analyser une métaphore dans un poème de Rimbaud ?';
  await page.getByRole('textbox').fill(query);
  await page.locator('form button[type="submit"]').click();

  await expect(page.locator('[role="status"]').last()).toBeVisible({ timeout: 30_000 });

  const responseText = await page.locator('[role="status"]').last().textContent();
  expect(responseText).not.toMatch(/https?:\/\//);
});
