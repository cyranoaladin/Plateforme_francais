import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/billing/gating', () => ({
  requirePlan: vi.fn().mockResolvedValue({ allowed: true }),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
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
import { orchestrate } from '@/lib/llm/orchestrator';

describe('POST /api/v1/tuteur/message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-1', profile: { badges: [] } } },
      errorResponse: null,
    } as never);
  });

  it('retourne 429 quand quota LLM tuteur depasse', async () => {
    const { QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    vi.mocked(orchestrate).mockRejectedValue(
      new QuotaExceededError('tuteur_libre', 'daily', 200),
    );
    const { POST } = await import('@/app/api/v1/tuteur/message/route');

    const req = new Request('http://localhost/api/v1/tuteur/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ message: 'Comment faire une intro ?', conversationHistory: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});

