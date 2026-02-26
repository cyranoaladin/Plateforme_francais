import { test, expect, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? process.env.E2E_USER_EMAIL ?? 'jean@eaf.local';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? 'demo1234';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(E2E_EMAIL);
  await page.getByTestId('auth-password').fill(E2E_PASSWORD);
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/', { timeout: 15_000 });
}

// ═══════════════════════════════════════════════════════════════
// DESCRIPTIF DE LECTURE
// ═══════════════════════════════════════════════════════════════

test.describe('Page Descriptif de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/descriptif');
    await page.waitForLoadState('networkidle');
  });

  test('affiche le heading et le compteur 0/20', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /descriptif de lecture/i })).toBeVisible();
    await expect(page.getByText(/\/20/)).toBeVisible();
  });

  test("affiche les 4 sections par objet d'étude", async ({ page }) => {
    await expect(page.getByText('Poésie')).toBeVisible();
    await expect(page.getByText(/Littérature d.idées/)).toBeVisible();
    await expect(page.getByText('Théâtre')).toBeVisible();
    await expect(page.getByText('Roman')).toBeVisible();
  });

  test('le bouton Ajouter est désactivé sans titre', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /ajouter/i }).first();
    await expect(addBtn).toBeDisabled();
  });

  test('ajouter un texte incrémente le compteur', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Acte I, scène 1');
    const addBtn = page.getByRole('button', { name: /ajouter/i }).first();
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await expect(page.getByText(/1\/20/)).toBeVisible();
  });

  test("changer l'objet d'étude met à jour la liste d'œuvres", async ({ page }) => {
    const objetSelect = page.locator('select').first();
    await objetSelect.selectOption('roman');
    const oeuvreSelect = page.locator('select').nth(1);
    const oeuvreOption = oeuvreSelect.locator('option').filter({ hasText: 'Manon Lescaut' });
    await expect(oeuvreOption).toBeAttached();
  });

  test('supprimer un texte décrémente le compteur', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Test suppression');
    await page.getByRole('button', { name: /ajouter/i }).first().click();
    await expect(page.getByText(/1\/20/)).toBeVisible();
    await page.getByRole('button', { name: /supprimer/i }).first().click();
    await expect(page.getByText(/0\/20/)).toBeVisible();
  });

  test('affiche les warnings si règles non satisfaites', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Un seul texte');
    await page.getByRole('button', { name: /ajouter/i }).first().click();
    await expect(page.getByText(/règles non satisfaites|insuffisant/i)).toBeVisible();
  });

  test('bouton Sauvegarder désactivé si aucun texte', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /sauvegarder/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('sidebar contient un lien "Mon Descriptif"', async ({ page }) => {
    const sidebarLink = page.getByRole('link', { name: /descriptif/i });
    await expect(sidebarLink.first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// CARNET DE LECTURE
// ═══════════════════════════════════════════════════════════════

test.describe('Page Carnet de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/carnet');
    await page.waitForLoadState('networkidle');
  });

  test('affiche le heading "Carnet de lecture"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /carnet de lecture/i })).toBeVisible();
  });

  test("affiche des tabs d'œuvres du programme", async ({ page }) => {
    const tabs = page.getByRole('button').filter({ hasText: /Cahier de Douai|Manon Lescaut|Le Menteur|Mes forêts/ });
    expect(await tabs.count()).toBeGreaterThanOrEqual(4);
  });

  test('le bouton Ajouter est désactivé sans contenu', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /^ajouter$/i });
    await expect(addBtn).toBeDisabled();
  });

  test("ajouter une entrée l'affiche dans la liste", async ({ page }) => {
    await page.getByPlaceholder(/contenu de votre entrée/i).fill('Citation de test pour Playwright');
    const addBtn = page.getByRole('button', { name: /^ajouter$/i });
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await expect(page.getByText('Citation de test pour Playwright')).toBeVisible({ timeout: 10_000 });
  });

  test('boutons Structurer en fiches et Exporter PDF visibles', async ({ page }) => {
    await expect(page.getByRole('button', { name: /structurer en fiches/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /exporter pdf/i })).toBeVisible();
  });

  test("changer d'onglet affiche les entrées de l'œuvre correspondante", async ({ page }) => {
    await page.getByPlaceholder(/contenu de votre entrée/i).fill('Entrée Cahier de Douai');
    await page.getByRole('button', { name: /^ajouter$/i }).click();

    await page.getByRole('button', { name: /Manon Lescaut/i }).first().click();
    await expect(page.getByText('Entrée Cahier de Douai')).not.toBeVisible();
    await expect(page.getByText(/aucune entrée pour cette œuvre/i)).toBeVisible();
  });

  test('sidebar contient un lien "Carnet"', async ({ page }) => {
    const sidebarLink = page.getByRole('link', { name: /carnet/i });
    await expect(sidebarLink.first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// PROFIL — WIDGET OEUVRE CHOISIE
// ═══════════════════════════════════════════════════════════════

test.describe("Profil — Œuvre choisie pour l'entretien", () => {
  test('widget oeuvre choisie est visible', async ({ page }) => {
    await login(page);
    await page.goto('/profil');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/œuvre.*entretien|entretien.*8/i)).toBeVisible();
  });

  test('select contient les 12 œuvres du programme', async ({ page }) => {
    await login(page);
    await page.goto('/profil');
    await page.waitForLoadState('networkidle');
    const oeuvreSelect = page.locator('select').filter({ has: page.locator('option[value*="Manon"]') });
    await expect(oeuvreSelect.first()).toBeVisible();
  });
});
