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
vi.mock('@/lib/rag/search', () => ({
  searchOfficialReferences: vi.fn(),
}));
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockReturnValue({}),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { searchOfficialReferences } from '@/lib/rag/search';

describe('Integration API /rag/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u1' } },
      errorResponse: null,
    } as never);
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 } as never);
  });

  it('retourne 400 pour query vide', async () => {
    const { POST } = await import('@/app/api/v1/rag/search/route');
    const req = new Request('http://localhost/api/v1/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ query: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 429 si rate limit depasse', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 30 } as never);
    const { POST } = await import('@/app/api/v1/rag/search/route');
    const req = new Request('http://localhost/api/v1/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ query: 'barème oral', maxResults: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('retourne 200 avec fallback citationsRequired=true quand aucun resultat', async () => {
    vi.mocked(searchOfficialReferences).mockResolvedValue([] as never);
    const { POST } = await import('@/app/api/v1/rag/search/route');
    const req = new Request('http://localhost/api/v1/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ query: 'requete inconnue', maxResults: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.citationsRequired).toBe(true);
  });
});

