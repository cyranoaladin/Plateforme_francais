import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('03 — Atelier Écrit EAF', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'eleve');
  });

  test('3.1 - Page atelier écrit accessible', async ({ page }) => {
    await page.goto('/atelier-ecrit');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('3.2 - Barème officiel affiché (sans introduction/conclusion séparés)', async ({ page }) => {
    await page.goto('/atelier-ecrit');
    const content = await page.content();
    // Ne doit PAS avoir introduction et conclusion comme critères séparés
    expect(content).not.toMatch(/Introduction\s*\d+\s*(pts|points)/i);
    expect(content).not.toMatch(/Conclusion\s*\d+\s*(pts|points)/i);
    // DOIT avoir les vrais critères
    expect(content).toMatch(/Compréhension|interprétation|réflexion|argumentation/i);
  });

  test('3.3 - API generate retourne un sujet', async ({ page }) => {
    const res = await page.request.post('/api/v1/epreuves/generate', {
      data: { type: 'commentaire', oeuvre: 'La Peau de chagrin' },
    });
    expect([200, 201, 429]).toContain(res.status());
  }, 20000);
});
