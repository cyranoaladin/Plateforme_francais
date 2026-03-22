import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: vi.fn(),
}));

vi.mock('@/lib/epreuves/repository', () => ({
  createEpreuve: vi.fn(),
}));

vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn().mockResolvedValue({
    planId: 'PRO',
    isActive: true,
    config: {
      id: 'PRO',
      label: 'Masterium',
      priceTnd: 129,
      billingCycle: 'monthly',
      quotas: {
        WRITTEN_CORRECTIONS: { limit: 999, period: 'month' },
        OCR_COPIES: { limit: 50, period: 'month' },
      },
      flags: {},
    },
  }),
  BillingContextUnavailableError: class extends Error {},
}));

vi.mock('@/lib/billing/usage', () => ({
  checkQuota: vi.fn().mockResolvedValue({ allowed: true, current: 0, limit: 999, remaining: 999 }),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createEpreuve } from '@/lib/epreuves/repository';

describe('POST /api/v1/epreuves/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-1' } },
      errorResponse: null,
    } as never);
  });

  it('retourne 429 quand le quota LLM est depasse', async () => {
    const { QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    vi.mocked(orchestrate).mockRejectedValue(new QuotaExceededError('coach_ecrit', 'daily', 50));
    const { POST } = await import('@/app/api/v1/epreuves/generate/route');

    const req = new Request('http://localhost/api/v1/epreuves/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ type: 'commentaire' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(createEpreuve).not.toHaveBeenCalled();
  });
});

