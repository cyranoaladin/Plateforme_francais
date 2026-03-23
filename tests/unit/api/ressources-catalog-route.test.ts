import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FREE_LIBRARY_LIMITS } from '@/lib/billing/library-gating';
import { RESSOURCES } from '@/data/ressources';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';

describe('GET /api/v1/ressources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      config: { quotas: {} },
      endsAt: null,
      isActive: true,
    } as never);
  });

  it('requires authentication before serving the catalog', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    } as never);

    const { GET } = await import('@/app/api/v1/ressources/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns a sanitized freemium catalog without internal paths and marks locked resources', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u-free', profile: {} } },
      errorResponse: null,
    } as never);

    const blockedResource = RESSOURCES.find((resource) => {
      const categoryResources = RESSOURCES.filter((candidate) => candidate.category === resource.category);
      const indexInCategory = categoryResources.findIndex((candidate) => candidate.id === resource.id);
      const limit = FREE_LIBRARY_LIMITS[resource.category] ?? 2;
      return indexInCategory >= limit;
    });

    expect(blockedResource).toBeDefined();

    const { GET } = await import('@/app/api/v1/ressources/route');
    const response = await GET();
    const payload = await response.json() as {
      resources: Array<Record<string, unknown> & { id: string; locked: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(payload.resources.length).toBe(RESSOURCES.length);
    expect(payload.resources[0]).not.toHaveProperty('filePath');
    expect(payload.resources[0]).not.toHaveProperty('url');
    expect(payload.resources.some((resource) => resource.locked)).toBe(true);

    const blockedEntry = payload.resources.find((resource) => resource.id === blockedResource?.id);
    expect(blockedEntry?.locked).toBe(true);
  });
});
