import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ auth: { user: { id: 'u1' } }, errorResponse: null }),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

describe('integration epreuves API', () => {
  it('endpoint generate exporte POST', async () => {
    const mod = await import('@/app/api/v1/epreuves/generate/route');
    expect(typeof mod.POST).toBe('function');
  });
});
