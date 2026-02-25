import { getRedisClient } from '@/lib/queue/correction-queue';

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || 'unknown';
}

export async function checkRateLimit(input: {
  request: Request;
  key: string;
  limit: number;
  windowMs?: number;
}): Promise<{ allowed: boolean; retryAfter: number }> {
  const windowMs = input.windowMs ?? 60_000;
  const windowSec = Math.ceil(windowMs / 1000);
  const ip = getClientIp(input.request);
  const redisKey = `rl:${input.key}:${ip}`;

  try {
    const redis = getRedisClient();
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (current > input.limit) {
      const ttl = await redis.ttl(redisKey);
      return { allowed: false, retryAfter: Math.max(1, ttl) };
    }

    return { allowed: true, retryAfter: 0 };
  } catch {
    // Fail-open si Redis indisponible.
    return { allowed: true, retryAfter: 0 };
  }
}
