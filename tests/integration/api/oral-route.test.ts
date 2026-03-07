import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
  BillingContextUnavailableError: class BillingContextUnavailableError extends Error {},
}));
vi.mock('@/lib/billing/usage', () => ({
  consumeQuota: vi.fn(),
  QuotaExceededError: class QuotaExceededError extends Error {
    limit: number;
    constructor(_entitlement: string, limit: number) {
      super('quota');
      this.limit = limit;
    }
  },
}));
vi.mock('@/lib/oral/repository', () => ({
  createOralSession: vi.fn(),
}));
vi.mock('@/lib/oral/service', () => ({
  pickOralExtrait: vi.fn().mockReturnValue({
    texte: 'Extrait',
    questionGrammaire: 'Question',
    phraseGrammaire: 'Phrase',
  }),
}));
vi.mock('@/lib/db/client', () => ({
  prisma: {},
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getBillingContext } from '@/lib/billing/context';
import { consumeQuota, QuotaExceededError } from '@/lib/billing/usage';
import { createOralSession } from '@/lib/oral/repository';

describe('Integration API /oral/session/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u1', profile: { selectedOeuvres: [] } } },
      errorResponse: null,
    } as never);
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      config: { quotas: { ORAL_SESSIONS: { limit: 2, period: 'week' } } },
      endsAt: null,
      isActive: true,
    } as never);
    vi.mocked(consumeQuota).mockResolvedValue({
      current: 1,
      limit: 2,
      remaining: 1,
    } as never);
    vi.mocked(createOralSession).mockResolvedValue({
      id: 'os_1',
    } as never);
  });

  it('retourne 429 si rate limit oral depasse', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 120 } as never);
    const { POST } = await import('@/app/api/v1/oral/session/start/route');
    const req = new Request('http://localhost/api/v1/oral/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ oeuvre: 'Manon Lescaut' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('retourne 402 si quota plan depasse', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 } as never);
    vi.mocked(consumeQuota).mockRejectedValue(new QuotaExceededError('ORAL_SESSIONS', 2, 0, 'week') as never);
    const { POST } = await import('@/app/api/v1/oral/session/start/route');
    const req = new Request('http://localhost/api/v1/oral/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ oeuvre: 'Manon Lescaut' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });
});
