import { expect, test } from '@playwright/test';

const copieId = '01b4ca73-656b-4758-ad9b-e77683b11998';
const epreuveId = 'db054b45-e652-4ae1-8f0e-5a91f2da5c84';

test('affiche un bilan exploitable pour une copie corrigée en prod', async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? '');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? '');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

  await page.goto(`/atelier-ecrit/correction/${copieId}?epreuveId=${epreuveId}`, {
    waitUntil: 'networkidle',
  });

  await expect(page.getByRole('heading', { name: /Bilan global/i })).toBeVisible({ timeout: 20_000 });
  await expect(
    page
      .getByText(/Correction indisponible|Soumettre à nouveau la copie|Reviens sur les rubriques/i)
      .first(),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Télécharger mon rapport PDF/i })).toBeVisible();

  // Surface hidden console/network regressions in test output.
  expect(consoleErrors).toEqual([]);
  expect(networkErrors.filter((item) => !item.includes('/api/v1/billing/status'))).toEqual([]);
});
