import { expect, test } from '@playwright/test';

async function dismissConsentIfPresent(page: Parameters<typeof test>[0]['page']) {
  const accept = page.getByRole('button', { name: 'Accepter' });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function expectHeaderNotToOverlapHero(page: Parameters<typeof test>[0]['page'], minGap: number) {
  const nav = page.locator('nav[aria-label="Navigation principale"]');
  const heading = page.getByRole('heading', { level: 1 }).first();

  await expect(nav).toBeVisible();
  await expect(heading).toBeVisible();

  const navBox = await nav.boundingBox();
  const headingBox = await heading.boundingBox();

  expect(navBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(headingBox!.y - (navBox!.y + navBox!.height)).toBeGreaterThanOrEqual(minGap);
}

test.describe('Landing header layout', () => {
  test('desktop hero starts below the floating navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await dismissConsentIfPresent(page);

    await expectHeaderNotToOverlapHero(page, 28);
  });

  test('mobile hero starts below the floating navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await dismissConsentIfPresent(page);

    await expectHeaderNotToOverlapHero(page, 18);
  });
});
