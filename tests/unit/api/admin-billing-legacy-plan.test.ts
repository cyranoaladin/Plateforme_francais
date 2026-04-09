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

vi.mock('@/lib/billing/redeem', () => ({
  hashCode: vi.fn().mockReturnValue('hashed'),
  normalizeCode: vi.fn((c: string) => c),
}));

vi.mock('@/lib/admin/audit', () => ({
  logAdminAction: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/email/service', () => ({
  sendSubscriptionConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
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
    studentProfile: {
      findUnique: vi.fn().mockResolvedValue({ displayName: 'Test' }),
    },
  },
}));

import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

describe('Admin billing routes reject legacy MAX plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: { user: { id: 'admin-1', profile: {} } },
      errorResponse: null,
    } as never);
    vi.mocked(prisma.activationCode.create).mockResolvedValue({
      id: 'code-1',
      codeHash: 'hash',
      plan: 'PRO',
      durationDays: 30,
      status: 'CREATED',
      expiresAt: null,
      batchId: null,
      notes: null,
      createdAt: new Date(),
      redeemedAt: null,
      redeemedByUserId: null,
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

  it('accepts MASTERIUM and stores internal PRO for activation code creation', async () => {
    const { POST } = await import('@/app/api/v1/admin/activation-codes/route');

    const response = await POST(new Request('http://localhost/api/v1/admin/activation-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf' },
      body: JSON.stringify({ plan: 'MASTERIUM', durationDays: 30 }),
    }));

    expect(response.status).toBe(201);
    expect(prisma.activationCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'PRO' }),
      }),
    );
  });

  it('rejects legacy PRO label from admin public payloads', async () => {
    const { POST } = await import('@/app/api/v1/admin/activation-codes/route');

    const response = await POST(new Request('http://localhost/api/v1/admin/activation-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf' },
      body: JSON.stringify({ plan: 'PRO', durationDays: 30 }),
    }));

    expect(response.status).toBe(400);
  });
});
