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

vi.mock('@/lib/db/client', () => ({
  prisma: {
    activationCode: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { requireUserRole } from '@/lib/auth/guard';

describe('Admin billing routes reject legacy MAX plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: { user: { id: 'admin-1', profile: {} } },
      errorResponse: null,
    } as never);
  });

  it('rejects MAX plan for activation code creation', async () => {
    const { POST } = await import('@/app/api/v1/admin/activation-codes/route');

    const response = await POST(new Request('http://localhost/api/v1/admin/activation-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf' },
      body: JSON.stringify({ plan: 'MAX', durationDays: 30 }),
    }));

    expect(response.status).toBe(400);
  });

  it('rejects MAX plan for manual payment validation', async () => {
    const { POST } = await import('@/app/api/v1/admin/manual-payment/route');

    const response = await POST(new Request('http://localhost/api/v1/admin/manual-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf' },
      body: JSON.stringify({
        userId: '3d9a2762-df4a-4f12-b51e-1f8a6ef5ef17',
        plan: 'MAX',
        amountMillimes: 129000,
        paymentMethod: 'VIREMENT',
        reference: 'AUDIT-MAX',
      }),
    }));

    expect(response.status).toBe(400);
  });
});
