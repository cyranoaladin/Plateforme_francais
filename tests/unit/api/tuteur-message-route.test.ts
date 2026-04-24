import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
    user: { findUnique: vi.fn() },
    session: { findUnique: vi.fn() },
    studentProfile: { findUnique: vi.fn() },
    memoryEvent: { create: vi.fn() },
    usageCounter: { findUnique: vi.fn(), upsert: vi.fn() },
    subscription: { findUnique: vi.fn() },
    agentInteraction: { create: vi.fn() },
  },
}));

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn().mockResolvedValue({
    plan: 'FREE',
    config: {
      id: 'FREE',
      quotas: {},
      flags: {},
    },
  }),
  BillingContextUnavailableError: class extends Error {},
}));
vi.mock('@/lib/billing/usage', () => ({
  consumeQuota: vi.fn().mockResolvedValue(undefined),
  QuotaExceededError: class extends Error {
    constructor(public entitlement: string, public period: string, public limit: number) {
      super();
    }
  },
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
  searchWithPersonalContext: vi.fn().mockResolvedValue([]),
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
import { searchOfficialReferences, searchWithPersonalContext } from '@/lib/rag/search';

describe('POST /api/v1/tuteur/message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          emailVerified: new Date().toISOString(),
          role: 'eleve',
          profile: {
            displayName: 'Test User',
            classLevel: 'Première générale',
            eafDate: '2026-06-11',
            selectedOeuvres: [],
            weakSkills: [],
            onboardingCompleted: true,
            badges: [],
            descriptifTextes: [],
          },
        },
        token: 'mock-token',
      },
      errorResponse: null,
    } as unknown as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
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

  it('n expose pas d url ou de chemin interne dans les citations visibles', async () => {
    vi.mocked(searchWithPersonalContext).mockResolvedValue([
      {
        id: 'ref-1',
        title: '/data/uploads/rapport-jury-eaf-2025.pdf',
        type: 'texte_officiel',
        level: 'Niveau B',
        sourceRef: '/data/uploads/secret.pdf',
        excerpt: 'Extrait utile',
        score: 0.9,
      },
      {
        id: 'ref-2',
        title: 'BO spécial 2025',
        type: 'texte_officiel',
        level: 'Niveau A',
        sourceRef: 'https://example.com/bo.pdf',
        excerpt: 'Extrait utile',
        score: 0.8,
      },
    ]);
    vi.mocked(orchestrate).mockResolvedValue({
      answer:
        'Réponse guidée [Source: /data/uploads/secret.pdf] et [Source: https://example.com/bo.pdf] avec renvoi /data/uploads/rapport-jury-eaf-2025.pdf',
      suggestions: ['Relance 1'],
    });

    const { POST } = await import('@/app/api/v1/tuteur/message/route');
    const req = new Request('http://localhost/api/v1/tuteur/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ message: 'Question', conversationHistory: [] }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.citations).toEqual([
      expect.objectContaining({ title: 'rapport jury eaf 2025', source: 'secret' }),
      expect.objectContaining({ title: 'BO spécial 2025', source: 'bo' }),
    ]);
    expect(body.answer).toContain('[Source: secret]');
    expect(body.answer).toContain('[Source: bo]');
    expect(body.answer).toContain('rapport jury eaf 2025');
    expect(JSON.stringify(body.citations)).not.toContain('/data/uploads');
    expect(JSON.stringify(body.citations)).not.toContain('https://');
    expect(body.answer).not.toContain('/data/uploads');
    expect(body.answer).not.toContain('https://');
  });
});
