import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = {
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
};

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

function makeRequest(ip: string) {
  return new Request('http://localhost/', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    redisMock.expire.mockResolvedValue(1);
    redisMock.ttl.mockResolvedValue(55);
  });

  it('permet la première requête (count=1)', async () => {
    redisMock.incr.mockResolvedValue(1);
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const result = await checkRateLimit({ request: makeRequest('1.2.3.4'), key: 'test', limit: 5 });
    expect(result.allowed).toBe(true);
    expect(redisMock.expire).toHaveBeenCalledOnce();
  });

  it('bloque si le compteur dépasse la limite', async () => {
    redisMock.incr.mockResolvedValue(6);
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const result = await checkRateLimit({ request: makeRequest('1.2.3.4'), key: 'test', limit: 5 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('fail-open si Redis est indisponible', async () => {
    redisMock.incr.mockRejectedValue(new Error('ECONNREFUSED'));
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const result = await checkRateLimit({ request: makeRequest('1.2.3.4'), key: 'test', limit: 5 });
    expect(result.allowed).toBe(true);
  });

  it('scinde les requêtes par IP — deux IPs différentes ont des compteurs distincts', async () => {
    redisMock.incr.mockResolvedValue(1);
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    await checkRateLimit({ request: makeRequest('10.0.0.1'), key: 'login', limit: 3 });
    await checkRateLimit({ request: makeRequest('10.0.0.2'), key: 'login', limit: 3 });
    const calls = redisMock.incr.mock.calls.map((c: string[]) => c[0]);
    expect(calls[0]).toContain('10.0.0.1');
    expect(calls[1]).toContain('10.0.0.2');
    expect(calls[0]).not.toBe(calls[1]);
  });

  it('utilise x-real-ip si x-forwarded-for est absent', async () => {
    redisMock.incr.mockResolvedValue(1);
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '5.6.7.8' },
    });
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    await checkRateLimit({ request: req, key: 'test', limit: 5 });
    expect(redisMock.incr.mock.calls[0][0]).toContain('5.6.7.8');
  });

  it('expire est positionné seulement lors du premier incr (count===1)', async () => {
    redisMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    await checkRateLimit({ request: makeRequest('1.1.1.1'), key: 'k', limit: 10 });
    await checkRateLimit({ request: makeRequest('1.1.1.1'), key: 'k', limit: 10 });
    expect(redisMock.expire).toHaveBeenCalledOnce();
  });

  it('getClientIp retourne "unknown" si aucun header IP', async () => {
    const { getClientIp } = await import('@/lib/security/rate-limit');
    const req = new Request('http://localhost/');
    expect(getClientIp(req)).toBe('unknown');
  });
});
