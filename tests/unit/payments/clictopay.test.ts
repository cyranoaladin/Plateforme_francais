/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateClicToPayPayment, resolvePublicPaymentStatus } from '../../../src/lib/payments/clictopay';
import { prisma } from '../../../src/lib/db/client';

vi.mock('../../../src/lib/db/client', () => ({
  prisma: {
    paymentTransaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../src/lib/email/client', () => ({
  sendTransactionalEmail: vi.fn(),
}));

vi.mock('../../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('ClicToPay Payment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  describe('initiateClicToPayPayment', () => {
    it('should throw error if ClicToPay credentials are missing in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CLICTOPAY_USERNAME', '');
      vi.stubEnv('CLICTOPAY_PASSWORD', '');

      await expect(
        initiateClicToPayPayment({
          userId: 'user-123',
          plan: 'PREMIUM',
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });

    it('should create payment transaction with correct plan and amount', async () => {
      vi.stubEnv('CLICTOPAY_USERNAME', 'test-user');
      vi.stubEnv('CLICTOPAY_PASSWORD', 'test-pass');
      vi.stubEnv('CLICTOPAY_API_BASE_URL', 'https://test.gateway.com');

      const mockSubscriptionFindUnique = vi.mocked(prisma.subscription.findUnique);
      mockSubscriptionFindUnique.mockResolvedValue(null);

      const mockCreate = vi.mocked(prisma.paymentTransaction.create);
      mockCreate.mockResolvedValue({
        id: 'payment-123',
        orderRef: 'NEXUS-123',
        userId: 'user-123',
        plan: 'PREMIUM',
        amountMillimes: 99000,
        currency: 'TND',
        status: 'PENDING',
        provider: 'CLICTOPAY',
        providerRef: null,
        callbackPayload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const mockUpdate = vi.mocked(prisma.paymentTransaction.update);
      mockUpdate.mockResolvedValue({} as any);

      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          errorCode: '0',
          formUrl: 'https://payment.gateway.com/form',
          orderId: 'provider-order-123',
        }),
      } as any);

      const result = await initiateClicToPayPayment({
        userId: 'user-123',
        plan: 'PREMIUM',
        email: 'test@example.com',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            plan: 'PREMIUM',
            amountMillimes: 99000,
            currency: 'TND',
            status: 'PENDING',
            provider: 'CLICTOPAY',
          }),
        })
      );

      expect(result).toHaveProperty('redirectUrl');
      expect(result).toHaveProperty('orderRef');
      expect(result).toHaveProperty('providerOrderId');
    });
  });

  describe('resolvePublicPaymentStatus', () => {
    it('should return payment status for valid orderRef', async () => {
      vi.stubEnv('CLICTOPAY_USERNAME', 'test-user');
      vi.stubEnv('CLICTOPAY_PASSWORD', 'test-pass');

      const mockFindUnique = vi.mocked(prisma.paymentTransaction.findUnique);
      mockFindUnique.mockResolvedValue({
        id: 'payment-123',
        orderRef: 'ORDER-123',
        userId: 'user-123',
        plan: 'PREMIUM',
        amountMillimes: 99000,
        currency: 'TND',
        status: 'ACCEPTED',
        provider: 'CLICTOPAY',
        providerRef: 'provider-123',
        callbackPayload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await resolvePublicPaymentStatus({ orderRef: 'ORDER-123' });

      expect(result).toEqual({
        orderRef: 'ORDER-123',
        status: 'ACCEPTED',
        plan: 'PREMIUM',
        amountMillimes: 99000,
        currency: 'TND',
        updatedAt: expect.any(Date),
      });
    });

    it('should return null for non-existent orderRef', async () => {
      const mockFindUnique = vi.mocked(prisma.paymentTransaction.findUnique);
      mockFindUnique.mockResolvedValue(null);

      const result = await resolvePublicPaymentStatus({ orderRef: 'INVALID-ORDER' });

      expect(result).toBeNull();
    });

    it('should return null when no params provided', async () => {
      const result = await resolvePublicPaymentStatus({});

      expect(result).toBeNull();
    });
  });
});
