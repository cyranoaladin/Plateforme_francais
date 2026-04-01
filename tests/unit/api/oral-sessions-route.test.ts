import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
}));

vi.mock('@/lib/oral/repository', () => ({
  listOralSessionsByUser: vi.fn(),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { listOralSessionsByUser } from '@/lib/oral/repository';
import { GET } from '@/app/api/v1/oral/sessions/route';

describe('GET /api/v1/oral/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-1' } },
      errorResponse: null,
    } as never);
  });

  it("retourne 402 si l'historique oral n'est pas inclus dans le plan", async () => {
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      config: { flags: { ORAL_REPORT_HISTORY: false } },
    } as never);

    const response = await GET(new Request('http://localhost/api/v1/oral/sessions'));

    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.upgradeUrl).toBe('/pricing');
  });

  it("retourne la liste des sessions si l'historique est disponible", async () => {
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'PREMIUM',
      config: { flags: { ORAL_REPORT_HISTORY: true } },
    } as never);
    vi.mocked(listOralSessionsByUser).mockResolvedValue([
      { id: 's1', oeuvre: 'Manon Lescaut', score: 12, maxScore: 20 },
    ] as never);

    const response = await GET(new Request('http://localhost/api/v1/oral/sessions?limit=1'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessions).toEqual([{ id: 's1', status: undefined, mode: undefined, oeuvre: 'Manon Lescaut', score: 12, maxScore: 20, createdAt: undefined, endedAt: undefined, finalFeedback: undefined }]);
    expect(body.sessions[0].interactions).toBeUndefined();
    expect(body.nextCursor).toBe('s1');
    expect(listOralSessionsByUser).toHaveBeenCalledWith('user-1', { limit: 1, cursor: undefined });
  });
});
