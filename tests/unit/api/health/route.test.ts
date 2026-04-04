/**
 * @file tests/unit/api/health/route.test.ts
 * @description Test de la route health pour valider la logique de liveness
 * @author Codex
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/v1/health/route';
import { prisma } from '@/lib/db/client';
import { getRedisClient } from '@/lib/queue/correction-queue';

// Mock DB
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

// Mock Redis
vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch (for RAG)
global.fetch = vi.fn();

describe('GET /api/v1/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HEALTH_CHECK_READY = 'false';
  });

  it('devrait retourner 200 quand tout est OK', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([1]);
    vi.mocked(getRedisClient).mockReturnValue({ ping: vi.fn().mockResolvedValue('PONG') } as unknown as ReturnType<typeof getRedisClient>);
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.checks.db).toBe('ok');
    expect(data.checks.redis).toBe('ok');
    expect(data.checks.rag).toBe('ok');
  });

  it('devrait retourner 200 (degraded) si seul RAG est down', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([1]);
    vi.mocked(getRedisClient).mockReturnValue({ ping: vi.fn().mockResolvedValue('PONG') } as unknown as ReturnType<typeof getRedisClient>);
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('RAG down'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.checks.db).toBe('ok');
    expect(data.checks.redis).toBe('ok');
    expect(data.checks.rag).toBe('down');
  });

  it('devrait retourner 503 si la DB est down', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValueOnce(new Error('DB connection failed'));
    vi.mocked(getRedisClient).mockReturnValue({ ping: vi.fn().mockResolvedValue('PONG') } as unknown as ReturnType<typeof getRedisClient>);
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('critical');
    expect(data.checks.db).toBe('down');
  });

  it('devrait retourner 503 si Redis est down', async () => {
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([1]);
    vi.mocked(getRedisClient).mockReturnValue({ ping: vi.fn().mockRejectedValue(new Error('Redis down')) } as unknown as ReturnType<typeof getRedisClient>);
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('critical');
    expect(data.checks.redis).toBe('down');
  });
});
