import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = {
  activationCode: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)),
  },
}));

describe('redeemActivationCode rejects disabled legacy plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BILLING_CODE_PEPPER = 'test-pepper';
  });

  it('rejects a MAX activation code even if it exists in storage', async () => {
    const { hashCode, redeemActivationCode, RedeemError } = await import('@/lib/billing/redeem');
    tx.activationCode.findUnique.mockResolvedValue({
      id: 'code-1',
      codeHash: hashCode('EAFMAXCODE123'),
      status: 'CREATED',
      plan: 'MAX',
      durationDays: 30,
      expiresAt: null,
    });

    await expect(redeemActivationCode('user-1', 'EAFMAXCODE123')).rejects.toMatchObject({
      name: RedeemError.name,
      code: 'PLAN_UNKNOWN',
    });
    expect(tx.subscription.upsert).not.toHaveBeenCalled();
    expect(tx.activationCode.update).not.toHaveBeenCalled();
  });
});
