import { getRedisClient } from '@/lib/queue/correction-queue';
import { logger } from '@/lib/logger';

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  return realIp?.trim() || 'unknown';
}

// Fallback in-memory pour dev sans Redis ou quand Redis est indisponible
const memoryStore = new Map<string, { count: number; resetAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 60_000).unref();
}

/**
 * Rate limiting avec fallback in-memory
 */
function checkRateLimitMemory(input: {
  key: string;
  limit: number;
  windowMs?: number;
}): { allowed: boolean; retryAfter: number } {
  const windowMs = input.windowMs ?? 60_000;
  const now = Date.now();
  const windowKey = Math.floor(now / windowMs);
  const storeKey = `${input.key}:${windowKey}`;

  const entry = memoryStore.get(storeKey);
  if (!entry) {
    memoryStore.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;
  if (entry.count > input.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Vérifie le rate limit avec stratégie FAIL-CLOSED.
 * 
 * Stratégie:
 * - Production: FAIL-CLOSED (bloque si Redis indisponible)
 * - Développement: Fallback in-memory pour permettre le dev local
 * 
 * Cette approche prévient les attaques DoS en production tout en
 * permettant le développement sans Redis.
 */
export async function checkRateLimit(input: {
  request: Request;
  key: string;
  limit: number;
  windowMs?: number;
}): Promise<{ allowed: boolean; retryAfter: number }> {
  // E2E runs through `next start`, which sets NODE_ENV=production.
  // Keep the bypass explicitly opt-in via env so test flows stay deterministic.
  if (process.env.E2E_DISABLE_RATE_LIMIT === '1') {
    return { allowed: true, retryAfter: 0 };
  }

  const windowMs = input.windowMs ?? 60_000;
  const windowSec = Math.ceil(windowMs / 1000);
  const ip = getClientIp(input.request);
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    const redis = getRedisClient();
    
    // Test de connexion Redis (léger, sans overhead)
    try {
      await redis.ping();
    } catch {
      // Redis non connecté
      if (isDev) {
        // En dev: fallback in-memory pour permettre le développement
        logger.warn(
          { key: input.key, ip },
          'rate_limit:redis_unavailable, using memory fallback (dev mode)',
        );
        return checkRateLimitMemory({ key: `${input.key}:${ip}`, limit: input.limit, windowMs: input.windowMs });
      } else {
        // En production: FAIL-CLOSED pour sécurité mais avec retryAfter court
        logger.error(
          { key: input.key, ip },
          'rate_limit:redis_unavailable, fail_closed (production)',
        );
        return { allowed: false, retryAfter: 5 }; // 5 secondes au lieu de 60
      }
    }

    const redisKey = `rl:${input.key}:${ip}`;
    const current = await redis.incr(redisKey);

    if (current === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (current > input.limit) {
      const ttl = await redis.ttl(redisKey);
      return { allowed: false, retryAfter: Math.max(1, ttl) };
    }

    return { allowed: true, retryAfter: 0 };
  } catch (error) {
    // ⚠️ FAIL-CLOSED: En cas d'erreur Redis imprévue, on bloque
    // pour prévenir les attaques DoS et l'abus de quotas LLM.
    logger.error(
      { key: input.key, ip, error: error instanceof Error ? error.message : String(error) },
      'rate_limit:redis_error, fail_closed — blocking request',
    );

    // Retourner FAIL-CLOSED avec retryAfter court (5 secondes)
    return { allowed: false, retryAfter: 5 };
  }
}
