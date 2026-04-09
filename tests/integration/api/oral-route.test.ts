import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
  requireVerifiedEmail: vi.fn().mockResolvedValue({ errorResponse: null }),
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
  rollbackQuota: vi.fn(),
  QuotaExceededError: class QuotaExceededError extends Error {
    limit: number;
    period: string;
    constructor(_entitlement: string, limit: number, current = 0, period = 'month') {
      super('quota');
      void current;
      this.limit = limit;
      this.period = period;
    }
  },
}));
vi.mock('@/lib/oral/repository', () => ({
  createOralSession: vi.fn(),
}));
const { texteDescriptifFindMany } = vi.hoisted(() => ({
  texteDescriptifFindMany: vi.fn(),
}));
vi.mock('@/lib/db/client', () => ({
  prisma: {
    texteDescriptif: {
      findMany: texteDescriptifFindMany,
    },
  },
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getBillingContext } from '@/lib/billing/context';
import { consumeQuota, rollbackQuota, QuotaExceededError } from '@/lib/billing/usage';
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
      config: { quotas: { ORAL_SESSIONS: { limit: 1, period: 'month' } } },
      endsAt: null,
      isActive: true,
    } as never);
    vi.mocked(consumeQuota).mockResolvedValue({
      current: 0,
      limit: 1,
      remaining: 1,
    } as never);
    vi.mocked(createOralSession).mockResolvedValue({
      id: 'os_1',
    } as never);
    texteDescriptifFindMany.mockResolvedValue([
      {
        id: 'td_1',
        oeuvreAuteur: 'Manon Lescaut — Abbé Prévost',
        titreExtrait: 'Extrait test',
        contenuTexte: 'Extrait',
        incipit: 'Extrait',
        position: 1,
      },
    ]);
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
    vi.mocked(consumeQuota).mockRejectedValue(new QuotaExceededError('ORAL_SESSIONS', 1, 0, 'month') as never);
    const { POST } = await import('@/app/api/v1/oral/session/start/route');
    const req = new Request('http://localhost/api/v1/oral/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ oeuvre: 'Manon Lescaut' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
    expect(createOralSession).not.toHaveBeenCalled();
  });

  it("rollback le quota si la sélection de l'extrait échoue après réservation", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 } as never);
    texteDescriptifFindMany.mockRejectedValue(new Error('selection failed'));

    const { POST } = await import('@/app/api/v1/oral/session/start/route');
    const req = new Request('http://localhost/api/v1/oral/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ oeuvre: 'Manon Lescaut' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(consumeQuota).toHaveBeenCalled();
    expect(rollbackQuota).toHaveBeenCalledWith('u1', 'ORAL_SESSIONS', { limit: 1, period: 'month' });
    expect(createOralSession).not.toHaveBeenCalled();
  });

  it('rollback le quota si la création de session échoue après réservation', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 } as never);
    vi.mocked(createOralSession).mockRejectedValue(new Error('db down') as never);

    const { POST } = await import('@/app/api/v1/oral/session/start/route');
    const req = new Request('http://localhost/api/v1/oral/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ oeuvre: 'Manon Lescaut' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(consumeQuota).toHaveBeenCalled();
    expect(rollbackQuota).toHaveBeenCalledWith('u1', 'ORAL_SESSIONS', { limit: 1, period: 'month' });
  });
});
