import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

const mockMemoryEventFindMany = vi.fn();
const mockMemoryEventGroupBy = vi.fn();
const mockLlmCostLogGroupBy = vi.fn();
const mockLlmCostLogAggregate = vi.fn();
const mockQueryRawUnsafe = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    memoryEvent: {
      findMany: (...args: unknown[]) => mockMemoryEventFindMany(...args),
      groupBy: (...args: unknown[]) => mockMemoryEventGroupBy(...args),
    },
    llmCostLog: {
      groupBy: (...args: unknown[]) => mockLlmCostLogGroupBy(...args),
      aggregate: (...args: unknown[]) => mockLlmCostLogAggregate(...args),
    },
    $queryRawUnsafe: (...args: unknown[]) => mockQueryRawUnsafe(...args),
  },
}));

import { requireUserRole } from '@/lib/auth/guard';

function makeAdminAuth() {
  return {
    auth: { user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } },
    errorResponse: null,
  } as never;
}

describe('GET /api/v1/admin/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
    mockMemoryEventFindMany.mockResolvedValue([]);
    mockMemoryEventGroupBy.mockResolvedValue([]);
    mockLlmCostLogGroupBy.mockResolvedValue([]);
    mockLlmCostLogAggregate.mockResolvedValue({
      _sum: { costEurCents: 0, inputTokens: 0, outputTokens: 0 },
      _count: { id: 0 },
    });
    mockQueryRawUnsafe.mockResolvedValue([]);
  });

  it('returns activity data for default 7 days', async () => {
    mockMemoryEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        type: 'interaction',
        feature: 'oral',
        createdAt: new Date(),
        user: { email: 'user@test.com' },
      },
    ]);
    mockMemoryEventGroupBy
      .mockResolvedValueOnce([{ feature: 'oral', _count: { feature: 5 } }])
      .mockResolvedValueOnce([{ type: 'interaction', _count: { type: 10 } }]);

    const { GET } = await import('@/app/api/v1/admin/activity/route');
    const req = new Request('http://localhost/api/v1/admin/activity');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.period.days).toBe(7);
    expect(body.recentEvents).toHaveLength(1);
    expect(body.featureBreakdown).toHaveLength(1);
    expect(body.typeBreakdown).toHaveLength(1);
    expect(body.llm.totals).toBeDefined();
  });

  it('respects days parameter capped at 90', async () => {
    const { GET } = await import('@/app/api/v1/admin/activity/route');
    const req = new Request('http://localhost/api/v1/admin/activity?days=200');
    const res = await GET(req);
    const body = await res.json();
    expect(body.period.days).toBe(90);
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { GET } = await import('@/app/api/v1/admin/activity/route');
    const req = new Request('http://localhost/api/v1/admin/activity');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
