import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests garde-fous : vérifier l'idempotence réelle du callback ClicToPay.
 *
 * Objectif : documenter et protéger contre régression replay callback paiement.
 * Scope : Lot 1-C / F-009
 */

const mockPrisma = {
  paymentTransaction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockSendTransactionalEmail = vi.fn();

// Mock global fetch pour simuler réponses API ClicToPay
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@/lib/email/client', () => ({
  sendTransactionalEmail: mockSendTransactionalEmail,
}));

describe('ClicToPay Callback - Idempotence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockSendTransactionalEmail.mockResolvedValue(undefined);

    // Stub env vars nécessaires pour getOrderStatus
    vi.stubEnv('CLICTOPAY_USERNAME', 'test-user');
    vi.stubEnv('CLICTOPAY_PASSWORD', 'test-pass');

    // Mock fetch par défaut (sera surchargé dans tests spécifiques si besoin)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  describe('A. Callback ACCEPTED rejoué', () => {
    it('premier passage traite ACCEPTED et crée subscription', async () => {
      // Transaction initiale en PENDING
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-1',
        userId: 'user-1',
        orderRef: 'NEXUS-123',
        plan: 'PREMIUM',
        status: 'PENDING',
        providerRef: 'gateway-order-1',
        amountMillimes: 99_000,
        currency: 'TND',
      });

      // Gateway retourne ACCEPTED (via fetch mock)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderStatus: 2, // authorized
          actionCode: 0, // success
          amount: 99_000,
          currency: '788',
        }),
      } as Response);

      // Pas de subscription existante
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      mockPrisma.paymentTransaction.update.mockResolvedValueOnce({
        id: 'tx-1',
        status: 'ACCEPTED',
      });

      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        userId: 'user-1',
        plan: 'PREMIUM',
        status: 'ACTIVE',
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-123',
      });

      // Vérifier traitement normal
      expect(result.status).toBe('ACCEPTED');
      expect(result.updated).toBe(true);

      // Vérifier appel gateway (via fetch)
      expect(mockFetch).toHaveBeenCalled();

      // Vérifier update transaction
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx-1' },
          data: expect.objectContaining({
            status: 'ACCEPTED',
            completedAt: expect.any(Date),
          }),
        }),
      );

      // Vérifier création subscription
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          create: expect.objectContaining({
            userId: 'user-1',
            plan: 'PREMIUM',
            status: 'ACTIVE',
          }),
        }),
      );

      // Pas de log idempotent_skip au premier passage
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.objectContaining({}),
        'clictopay.apply_status.idempotent_skip',
      );
    });

    it('passages suivants skip traitement, pas de double effet subscription', async () => {
      // Transaction déjà en ACCEPTED (état final)
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-1',
        userId: 'user-1',
        orderRef: 'NEXUS-123',
        plan: 'PREMIUM',
        status: 'ACCEPTED', // ⚠️ Déjà final
        providerRef: 'gateway-order-1',
        amountMillimes: 99_000,
        currency: 'TND',
        completedAt: new Date('2026-03-10'),
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-123',
      });

      // Vérifier idempotence
      expect(result.status).toBe('ACCEPTED');
      expect(result.updated).toBe(false); // ⚠️ Pas de mise à jour

      // Vérifier log idempotent_skip
      expect(mockLogger.info).toHaveBeenCalledWith(
        { orderRef: 'NEXUS-123', status: 'ACCEPTED' },
        'clictopay.apply_status.idempotent_skip',
      );

      // Vérifier AUCUN appel gateway (fetch pas appelé)
      expect(mockFetch).not.toHaveBeenCalled();

      // Vérifier AUCUNE update transaction
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled();

      // Vérifier AUCUNE création/update subscription
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.findUnique).not.toHaveBeenCalled();
    });

    it('replay multiple fois ACCEPTED reste stable, aucun effet métier', async () => {
      // Transaction déjà ACCEPTED
      const mockTransaction = {
        id: 'tx-1',
        userId: 'user-1',
        orderRef: 'NEXUS-123',
        plan: 'PREMIUM',
        status: 'ACCEPTED',
        providerRef: 'gateway-order-1',
        amountMillimes: 99_000,
        currency: 'TND',
        completedAt: new Date('2026-03-10'),
      };

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      // Rejouer 5 fois
      for (let i = 0; i < 5; i++) {
        mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce(mockTransaction);

        const result = await applyClicToPayStatusToTransaction({
          orderRef: 'NEXUS-123',
        });

        expect(result.status).toBe('ACCEPTED');
        expect(result.updated).toBe(false);
      }

      // Vérifier 5 logs idempotent_skip
      expect(mockLogger.info).toHaveBeenCalledTimes(5);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { orderRef: 'NEXUS-123', status: 'ACCEPTED' },
        'clictopay.apply_status.idempotent_skip',
      );

      // Vérifier AUCUN appel gateway (5 replays, fetch jamais appelé)
      expect(mockFetch).not.toHaveBeenCalled();

      // Vérifier AUCUNE mutation DB (5 replays)
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('B. Callback REFUSED rejoué', () => {
    it('premier passage traite REFUSED, pas de subscription créée', async () => {
      // Transaction initiale en PENDING
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-2',
        userId: 'user-2',
        orderRef: 'NEXUS-456',
        plan: 'PRO',
        status: 'PENDING',
        providerRef: 'gateway-order-2',
        amountMillimes: 129_000,
        currency: 'TND',
      });

      // Gateway retourne REFUSED (via fetch mock)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderStatus: 6, // declined
          actionCode: 5, // card declined
          amount: 129_000,
          currency: '788',
        }),
      } as Response);

      mockPrisma.paymentTransaction.update.mockResolvedValueOnce({
        id: 'tx-2',
        status: 'REFUSED',
      });

      // Mock user pour email notification
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'user2@test.fr',
        profile: { displayName: 'Utilisateur Test' },
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-456',
      });

      // Vérifier traitement REFUSED
      expect(result.status).toBe('REFUSED');
      expect(result.updated).toBe(true);

      // Vérifier update transaction
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx-2' },
          data: expect.objectContaining({
            status: 'REFUSED',
            completedAt: expect.any(Date),
          }),
        }),
      );

      // Vérifier AUCUNE création subscription (REFUSED = échec)
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();

      // Email d'échec envoyé
      expect(mockSendTransactionalEmail).toHaveBeenCalled();
    });

    it('passages suivants REFUSED skip traitement, état stable', async () => {
      // Transaction déjà REFUSED (état final)
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-2',
        userId: 'user-2',
        orderRef: 'NEXUS-456',
        plan: 'PRO',
        status: 'REFUSED', // ⚠️ Déjà final
        providerRef: 'gateway-order-2',
        amountMillimes: 129_000,
        currency: 'TND',
        completedAt: new Date('2026-03-10'),
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-456',
      });

      // Vérifier idempotence
      expect(result.status).toBe('REFUSED');
      expect(result.updated).toBe(false);

      // Vérifier log idempotent_skip
      expect(mockLogger.info).toHaveBeenCalledWith(
        { orderRef: 'NEXUS-456', status: 'REFUSED' },
        'clictopay.apply_status.idempotent_skip',
      );

      // Vérifier AUCUN appel gateway (fetch pas appelé)
      expect(mockFetch).not.toHaveBeenCalled();

      // Vérifier AUCUNE update transaction
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled();

      // Vérifier AUCUNE création subscription indue
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();

      // Vérifier AUCUN email supplémentaire
      expect(mockSendTransactionalEmail).not.toHaveBeenCalled();
    });

    it('replay multiple fois REFUSED reste stable, aucune subscription créée', async () => {
      // Transaction déjà REFUSED
      const mockTransaction = {
        id: 'tx-2',
        userId: 'user-2',
        orderRef: 'NEXUS-456',
        plan: 'PRO',
        status: 'REFUSED',
        providerRef: 'gateway-order-2',
        amountMillimes: 129_000,
        currency: 'TND',
        completedAt: new Date('2026-03-10'),
      };

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      // Rejouer 3 fois
      for (let i = 0; i < 3; i++) {
        mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce(mockTransaction);

        const result = await applyClicToPayStatusToTransaction({
          orderRef: 'NEXUS-456',
        });

        expect(result.status).toBe('REFUSED');
        expect(result.updated).toBe(false);
      }

      // Vérifier 3 logs idempotent_skip
      expect(mockLogger.info).toHaveBeenCalledTimes(3);

      // Vérifier AUCUN appel gateway (3 replays, fetch jamais appelé)
      expect(mockFetch).not.toHaveBeenCalled();

      // Vérifier AUCUNE mutation DB (3 replays)
      expect(mockPrisma.paymentTransaction.update).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();

      // Vérifier AUCUN email notification envoyé (3 replays)
      expect(mockSendTransactionalEmail).not.toHaveBeenCalled();
    });
  });

  describe('C. Idempotence sur états intermédiaires', () => {
    it('PENDING peut être retraité (pas idempotent sur états non-finaux)', async () => {
      // Transaction en PENDING (pas un état final)
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-3',
        userId: 'user-3',
        orderRef: 'NEXUS-789',
        plan: 'MAX',
        status: 'PENDING', // ⚠️ Pas final
        providerRef: 'gateway-order-3',
        amountMillimes: 149_000,
        currency: 'TND',
      });

      // Gateway retourne maintenant ACCEPTED (via fetch mock)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderStatus: 2,
          actionCode: 0,
          amount: 149_000,
          currency: '788',
        }),
      } as Response);

      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.paymentTransaction.update.mockResolvedValueOnce({
        id: 'tx-3',
        status: 'ACCEPTED',
      });
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        userId: 'user-3',
        plan: 'MAX',
        status: 'ACTIVE',
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-789',
      });

      // Vérifier traitement normal (pas d'idempotence sur PENDING)
      expect(result.status).toBe('ACCEPTED');
      expect(result.updated).toBe(true);

      // Vérifier appel gateway (PENDING n'est pas idempotent, fetch appelé)
      expect(mockFetch).toHaveBeenCalled();

      // Vérifier update transaction
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalled();

      // Vérifier création subscription
      expect(mockPrisma.subscription.upsert).toHaveBeenCalled();

      // PAS de log idempotent_skip (PENDING peut évoluer)
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.objectContaining({}),
        'clictopay.apply_status.idempotent_skip',
      );
    });

    it('ERROR peut être retraité (pas idempotent sur états non-finaux)', async () => {
      // Transaction en ERROR (pas un état final stable)
      mockPrisma.paymentTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-4',
        userId: 'user-4',
        orderRef: 'NEXUS-999',
        plan: 'PREMIUM',
        status: 'ERROR', // ⚠️ Pas final selon code réel (ligne 262)
        providerRef: 'gateway-order-4',
        amountMillimes: 99_000,
        currency: 'TND',
      });

      // Gateway retourne maintenant ACCEPTED (via fetch mock)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderStatus: 2,
          actionCode: 0,
          amount: 99_000,
          currency: '788',
        }),
      } as Response);

      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.paymentTransaction.update.mockResolvedValueOnce({
        id: 'tx-4',
        status: 'ACCEPTED',
      });
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        userId: 'user-4',
        plan: 'PREMIUM',
        status: 'ACTIVE',
      });

      const { applyClicToPayStatusToTransaction } = await import(
        '@/lib/payments/clictopay'
      );

      const result = await applyClicToPayStatusToTransaction({
        orderRef: 'NEXUS-999',
      });

      // Vérifier traitement normal (ERROR peut être récupéré)
      expect(result.status).toBe('ACCEPTED');
      expect(result.updated).toBe(true);

      // Vérifier appel gateway (fetch appelé)
      expect(mockFetch).toHaveBeenCalled();

      // Vérifier update transaction
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalled();
    });
  });
});
