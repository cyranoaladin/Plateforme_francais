import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));

vi.mock('@/lib/admin/audit', () => ({
  logAdminAction: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const mockCodeFindMany = vi.fn();
const mockCodeCreate = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    activationCode: {
      findMany: (...args: unknown[]) => mockCodeFindMany(...args),
      create: (...args: unknown[]) => mockCodeCreate(...args),
    },
  },
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

vi.mock('@/lib/billing/redeem', () => ({
  hashCode: vi.fn().mockReturnValue('hashed-code'),
  normalizeCode: vi.fn((c: string) => c),
}));

vi.mock('@/lib/billing/plan-catalog', () => ({
  parseCommercialPlanId: vi.fn((p: string) => p),
  formatPlanLabel: vi.fn((p: string) => p),
}));

import { requireUserRole } from '@/lib/auth/guard';
import { parseJsonBody } from '@/lib/validation/request';
import { logAdminAction } from '@/lib/admin/audit';

function makeAdminAuth() {
  return {
    auth: { user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } },
    errorResponse: null,
  } as never;
}

describe('GET /api/v1/admin/activation-codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('returns list of activation codes', async () => {
    mockCodeFindMany.mockResolvedValue([
      { id: 'c1', codeHash: 'abc123', plan: 'PREMIUM', durationDays: 30, status: 'CREATED', createdAt: new Date() },
    ]);

    const { GET } = await import('@/app/api/v1/admin/activation-codes/route');
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.codes).toHaveLength(1);
    expect(body.codes[0].plan).toBe('PREMIUM');
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { GET } = await import('@/app/api/v1/admin/activation-codes/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/admin/activation-codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('generates a new activation code', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { plan: 'PREMIUM', durationDays: 30 },
    } as never);
    mockCodeCreate.mockResolvedValue({
      id: 'c-new',
      codeHash: 'hashed-code',
      plan: 'PREMIUM',
      durationDays: 30,
      status: 'CREATED',
    });

    const { POST } = await import('@/app/api/v1/admin/activation-codes/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: 'PREMIUM', durationDays: 30 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.code.plainCode).toMatch(/^EAF-/);
    expect(body.code.plan).toBe('PREMIUM');

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'code.generate' }),
    );
  });

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 30 } as never);

    const { POST } = await import('@/app/api/v1/admin/activation-codes/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ plan: 'PREMIUM' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
