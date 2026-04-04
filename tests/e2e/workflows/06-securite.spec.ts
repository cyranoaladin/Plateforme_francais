import { test, expect } from '@playwright/test';

test.describe('06 — Sécurité : routes protégées', () => {
  const PROTECTED_ROUTES = [
    '/api/v1/auth/me',
    '/api/v1/student/profile',
    '/api/v1/student/descriptif-lecture',
    '/api/v1/billing/status',
    '/api/v1/memory/timeline',
    '/api/v1/oral/capabilities',
    '/api/v1/admin/users',
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`${route} → 401 sans authentification`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(401);
    });
  }

  test('GET / → 200 (landing page publique)', async ({ request }) => {
    const res = await request.get('/');
    expect([200, 301, 302]).toContain(res.status());
  });

  test('Health check → status ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });
});
