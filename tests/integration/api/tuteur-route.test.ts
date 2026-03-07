import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
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
vi.mock('@/lib/rag/search', () => ({
  searchOfficialReferences: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/security/sanitize', () => ({
  sanitizeString: (s: string) => s,
}));
vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: vi.fn(),
}));
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockReturnValue({}),
}));
vi.mock('@/lib/llm/streaming', () => ({
  createLlmStream: vi.fn(),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { consumeQuota } from '@/lib/billing/usage';
import { orchestrate } from '@/lib/llm/orchestrator';

describe('Integration API /tuteur/message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u1', profile: {} } },
      errorResponse: null,
    } as never);
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      config: { quotas: { TUTOR_QUESTIONS: { limit: 10, period: 'day' } } },
      endsAt: null,
      isActive: true,
    } as never);
    vi.mocked(consumeQuota).mockResolvedValue({
      current: 1,
      limit: 10,
      remaining: 9,
    } as never);
  });

  it('retourne 429 quand quota LLM depasse', async () => {
    const { QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    vi.mocked(orchestrate).mockRejectedValue(new QuotaExceededError('tuteur_libre', 'daily', 200));
    const { POST } = await import('@/app/api/v1/tuteur/message/route');
    const req = new Request('http://localhost/api/v1/tuteur/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ message: 'Aide moi', conversationHistory: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('retourne 400 pour payload invalide', async () => {
    const { POST } = await import('@/app/api/v1/tuteur/message/route');
    const req = new Request('http://localhost/api/v1/tuteur/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ message: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
