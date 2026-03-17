import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for key public surfaces.
 *
 * Usage:
 *   npx playwright test --config=playwright.visual.config.ts
 *
 * First run creates baseline screenshots under tests/visual/*.spec.ts-snapshots/.
 * Subsequent runs compare against them with a 1 % pixel tolerance.
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test --config=playwright.visual.config.ts --update-snapshots
 */

const SCREENSHOT_OPTS = {
  fullPage: true,
  maxDiffPixelRatio: 0.01,
} as const;

const pages = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'login', path: '/login' },
  { name: 'contact', path: '/contact' },
  { name: 'mentions-legales', path: '/mentions-legales' },
  { name: 'cgu', path: '/cgu' },
] as const;

for (const { name, path } of pages) {
  test(`visual: ${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });

    // Dismiss any consent banner so it does not flicker between runs
    const consentBtn = page.locator('[data-testid="consent-accept"], button:has-text("Accepter")');
    if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page).toHaveScreenshot(`${name}.png`, SCREENSHOT_OPTS);
  });
}
