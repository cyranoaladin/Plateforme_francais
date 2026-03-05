import { describe, expect, it } from 'vitest';

describe('integration auth API', () => {
  it('module login route exporte POST', async () => {
    const mod = await import('@/app/api/v1/auth/login/route');
    expect(typeof mod.POST).toBe('function');
  });
});
