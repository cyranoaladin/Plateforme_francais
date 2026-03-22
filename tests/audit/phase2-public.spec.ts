import { test, expect } from '@playwright/test';

const BASE = 'https://eaf.nexusreussite.academy';

test.describe('Phase 2 — Public Pages Audit', () => {
  test.describe('Mobile overflow (375px Samsung Galaxy)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('Landing: no horizontal overflow', async ({ page }) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('Pricing: no horizontal overflow', async ({ page }) => {
      await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('Login: no horizontal overflow', async ({ page }) => {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('Contact: no horizontal overflow', async ({ page }) => {
      await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('No element exceeds viewport on landing', async ({ page }) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const overflows = await page.evaluate(() => {
        const all = document.querySelectorAll('*');
        const results: string[] = [];
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > 376 && !el.closest('[class*="overflow"]')) {
            results.push(`${el.tagName}.${el.className?.toString().slice(0, 50)} right=${Math.round(rect.right)}`);
          }
        }
        return results.slice(0, 10);
      });
      expect(overflows).toEqual([]);
    });
  });

  test.describe('Public pages HTTP status', () => {
    const pages = [
      { path: '/', expected: 200 },
      { path: '/login', expected: 200 },
      { path: '/pricing', expected: 200 },
      { path: '/contact', expected: 200 },
      { path: '/mentions-legales', expected: 200 },
      { path: '/cgu', expected: 200 },
      { path: '/politique-de-confidentialite', expected: 200 },
    ];

    for (const { path, expected } of pages) {
      test(`${path} returns ${expected}`, async ({ page }) => {
        const resp = await page.goto(BASE + path);
        expect(resp?.status()).toBe(expected);
      });
    }
  });

  test.describe('Forbidden labels absent', () => {
    test('Landing page has no PRO/MAX/MONTHLY/LIFETIME/clictopay', async ({ page }) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      expect(text).not.toMatch(/\bPRO\b/);
      expect(text).not.toMatch(/\bMAX\b/);
      expect(text).not.toMatch(/MONTHLY/i);
      expect(text).not.toMatch(/LIFETIME/i);
      expect(text).not.toMatch(/clictopay/i);
      expect(text).not.toMatch(/flouci/i);
    });

    test('Pricing page has no PRO/MAX/MONTHLY/LIFETIME/clictopay', async ({ page }) => {
      await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      expect(text).not.toMatch(/\bPRO\b/);
      expect(text).not.toMatch(/\bMAX\b/);
      expect(text).not.toMatch(/MONTHLY/i);
      expect(text).not.toMatch(/LIFETIME/i);
      expect(text).not.toMatch(/clictopay/i);
    });

    test('Pricing shows 3 plans: Freemium, Premium, Masterium', async ({ page }) => {
      await page.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
      const text = await page.textContent('body');
      expect(text).toContain('Freemium');
      expect(text).toContain('Premium');
      expect(text).toContain('Masterium');
    });
  });

  test.describe('CTA buttons', () => {
    test('Landing CTA "Commencer gratuitement" exists and links correctly', async ({ page }) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const cta = page.locator('text=Commencer gratuitement').first();
      await expect(cta).toBeVisible();
    });

    test('Countdown J-X is displayed and valid', async ({ page }) => {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      const countdown = page.locator('text=/J-\\d+/').first();
      await expect(countdown).toBeVisible();
      const text = await countdown.textContent();
      const days = parseInt(text?.match(/J-(\d+)/)?.[1] ?? '0');
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThan(500);
    });
  });

  test.describe('SEO and meta', () => {
    test('robots.txt accessible', async ({ page }) => {
      const resp = await page.goto(BASE + '/robots.txt');
      expect(resp?.status()).toBe(200);
      const text = await resp?.text();
      expect(text).toContain('User-Agent');
      expect(text).toContain('Sitemap');
    });

    test('sitemap.xml accessible', async ({ page }) => {
      const resp = await page.goto(BASE + '/sitemap.xml');
      expect(resp?.status()).toBe(200);
    });

    test('favicon accessible', async ({ page }) => {
      const resp = await page.goto(BASE + '/favicon.ico');
      expect(resp?.status()).toBe(200);
    });
  });
});
