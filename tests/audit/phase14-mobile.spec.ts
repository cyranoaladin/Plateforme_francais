import { test, expect } from '@playwright/test';

const BASE = 'https://eaf.nexusreussite.academy';

test.describe('Phase 14 — Mobile Responsive Audit (375px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const publicPages = [
    '/',
    '/login',
    '/pricing',
    '/contact',
    '/mentions-legales',
    '/cgu',
    '/politique-de-confidentialite',
  ];

  for (const path of publicPages) {
    test(`${path}: no horizontal overflow at 375px`, async ({ page }) => {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test('Landing: WhatsApp button visible on mobile', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const whatsapp = page.locator('a[aria-label="Contacter via WhatsApp"]');
    await expect(whatsapp).toBeVisible();
  });

  test('Landing: at least one CTA "Commencer gratuitement" visible', async ({ page }) => {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const ctas = page.locator('text=Commencer gratuitement');
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
    let anyVisible = false;
    for (let i = 0; i < count; i++) {
      if (await ctas.nth(i).isVisible()) {
        anyVisible = true;
        break;
      }
    }
    expect(anyVisible).toBe(true);
  });

  test('Pricing: all 3 plan cards visible', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
    const text = await page.textContent('body');
    expect(text).toContain('Freemium');
    expect(text).toContain('Premium');
    expect(text).toContain('Masterium');
  });

  test('Login: form fields visible', async ({ page }) => {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('Contact: form visible', async ({ page }) => {
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('Pricing: no page-level horizontal overflow', async ({ page }) => {
    await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
