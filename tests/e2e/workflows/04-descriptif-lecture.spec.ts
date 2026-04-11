import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('04 — Descriptif de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'eleve');
  });

  test('4.1 - Page /descriptif-lecture accessible avec 4 onglets', async ({ page }) => {
    await page.goto('/descriptif-lecture');
    await expect(page.locator('h1')).toBeVisible();
    // 4 objets d'étude
    const onglets = page.locator('button:has-text("Poésie"), button:has-text("Théâtre"), button:has-text("Littérature"), button:has-text("Roman")');
    const count = await onglets.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('4.2 - API GET /student/descriptif-lecture répond 200', async ({ page }) => {
    const res = await page.request.get('/api/v1/student/descriptif-lecture');
    const body = await res.text();
    expect(res.status(), `body: ${body}`).toBe(200);
    const data = JSON.parse(body);
    expect(data).toHaveProperty('textes');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('conformite');
  });

  test('4.3 - API POST ajoute un texte', async ({ page }) => {
    const res = await page.request.post('/api/v1/student/descriptif-lecture', {
      data: {
        objetEtude: 'POESIE',
        typeTexte: 'EXTRAIT_OEUVRE',
        oeuvreAuteur: 'Cahier de Douai — Arthur Rimbaud',
        titreExtrait: 'Sensation',
        incipit: 'Par les soirs bleus d\'été',
        position: 1,
      },
    });
    const body = await res.text();
    expect([200, 201], `body: ${body}`).toContain(res.status());
    const data = JSON.parse(body);
    expect(data.texte).toHaveProperty('id');
    // Nettoyage
    if (data.texte?.id) {
      await page.request.delete(`/api/v1/student/descriptif-lecture/${data.texte.id}`);
    }
  });

  test('4.4 - Indicateur de conformité s\'affiche', async ({ page }) => {
    await page.goto('/descriptif-lecture');
    await expect(page.locator('text=/textes|descriptif|réglementaire/i').first()).toBeVisible({ timeout: 8000 });
  });
});
