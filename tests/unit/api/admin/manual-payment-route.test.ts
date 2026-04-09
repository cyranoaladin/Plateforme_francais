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

const mockUserFindUnique = vi.fn();
const mockPaymentCreate = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockSubscriptionCreate = vi.fn();
const mockProfileFindUnique = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    paymentTransaction: {
      create: (...args: unknown[]) => mockPaymentCreate(...args),
    },
    subscription: {
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
      create: (...args: unknown[]) => mockSubscriptionCreate(...args),
    },
    studentProfile: {
      findUnique: (...args: unknown[]) => mockProfileFindUnique(...args),
    },
  },
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

vi.mock('@/lib/billing/plan-catalog', () => ({
  parseCommercialPlanId: vi.fn((p: string) => p),
  formatPlanLabel: vi.fn((p: string) => p),
}));

vi.mock('@/lib/email/service', () => ({
  sendSubscriptionConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
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

describe('POST /api/v1/admin/manual-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
    mockProfileFindUnique.mockResolvedValue({ displayName: 'Test User' });
  });

  it('validates payment and activates subscription for user with existing sub', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {
        userId: 'u-1',
        plan: 'PREMIUM',
        amountMillimes: 99000,
        paymentMethod: 'VIREMENT',
        reference: 'REF-001',
      },
    } as never);

    mockUserFindUnique.mockResolvedValue({
      id: 'u-1',
      email: 'user@test.com',
      subscription: { id: 'sub-1', plan: 'FREE' },
    });
    mockPaymentCreate.mockResolvedValue({ id: 'pay-1' });
    mockSubscriptionUpdate.mockResolvedValue({});

    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockPaymentCreate).toHaveBeenCalledOnce();
    expect(mockSubscriptionUpdate).toHaveBeenCalledOnce();
    expect(mockSubscriptionCreate).not.toHaveBeenCalled();

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment.manual', targetId: 'u-1' }),
    );
  });

  it('creates subscription for user without one', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {
        userId: 'u-2',
        plan: 'MASTERIUM',
        amountMillimes: 129000,
        paymentMethod: 'ESPECES',
        reference: 'REF-002',
      },
    } as never);

    mockUserFindUnique.mockResolvedValue({
      id: 'u-2',
      email: 'user2@test.com',
      subscription: null,
    });
    mockPaymentCreate.mockResolvedValue({ id: 'pay-2' });
    mockSubscriptionCreate.mockResolvedValue({});

    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockSubscriptionCreate).toHaveBeenCalledOnce();
    expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown user', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {
        userId: 'u-nope',
        plan: 'PREMIUM',
        amountMillimes: 99000,
        paymentMethod: 'VIREMENT',
        reference: 'REF-X',
      },
    } as never);

    mockUserFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(mockPaymentCreate).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 60 } as never);

    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
