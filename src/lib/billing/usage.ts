/**
 * Quota enforcement via Redis (INCRBY + TTL).
 * Fail-closed in production: if Redis is down, deny the action.
 *
 * Key format: quota:{userId}:{entitlementKey}:{periodStart}
 */

import { getRedisClient } from '@/lib/queue/correction-queue';
import { logger } from '@/lib/logger';
import { type EntitlementKey, type Period, type QuotaEntry } from './plan-catalog';

/* ─────────────────── Error ─────────────────── */

export class QuotaExceededError extends Error {
  readonly status = 402;
  readonly code = 'QUOTA_EXCEEDED';

  constructor(
    public readonly entitlement: EntitlementKey,
    public readonly limit: number,
    public readonly current: number,
    public readonly period: Period,
  ) {
    super(`Quota dépassé : ${entitlement} (${current}/${limit} par ${period}).`);
    this.name = 'QuotaExceededError';
  }
}

/* ─────────────────── Period helpers ─────────────────── */

/**
 * Compute the period start key and TTL in seconds for a given period.
 */
function periodInfo(period: Period, now: Date = new Date()): { key: string; ttlSec: number } {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');

  switch (period) {
    case 'day':
      return { key: `${y}-${m}-${d}`, ttlSec: 86_400 };
    case 'week': {
      // ISO week start (Monday)
      const dayOfWeek = now.getUTCDay() || 7; // Sunday=7
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - dayOfWeek + 1);
      const wk = `${monday.getUTCFullYear()}-W${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
      return { key: wk, ttlSec: 7 * 86_400 };
    }
    case 'month':
      return { key: `${y}-${m}`, ttlSec: 31 * 86_400 };
  }
}

export function getPeriodKey(period: Period, now: Date = new Date()): string {
  return periodInfo(period, now).key;
}

/**
 * Build the Redis key for a given quota.
 */
function redisKey(userId: string, entitlement: EntitlementKey, periodKey: string): string {
  return `quota:${userId}:${entitlement}:${periodKey}`;
}

/* ─────────────────── Core functions ─────────────────── */

/**
 * Check if the user still has quota, WITHOUT consuming.
 * Returns { allowed, current, limit, remaining }.
 */
export async function checkQuota(
  userId: string,
  entitlement: EntitlementKey,
  quotaEntry: QuotaEntry,
): Promise<{ allowed: boolean; current: number; limit: number | 'unlimited'; remaining: number | 'unlimited' }> {
  if (quotaEntry.limit === 'unlimited') {
    return { allowed: true, current: 0, limit: 'unlimited', remaining: 'unlimited' };
  }

  const { key: pk } = periodInfo(quotaEntry.period);
  const rk = redisKey(userId, entitlement, pk);
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    const redis = getRedisClient();
    await redis.ping();

    const current = Number(await redis.get(rk)) || 0;
    const remaining = Math.max(0, quotaEntry.limit - current);

    return {
      allowed: remaining > 0,
      current,
      limit: quotaEntry.limit,
      remaining,
    };
  } catch (err) {
    if (isDev) {
      logger.warn({ userId, entitlement, err }, 'quota:check:redis_unavailable (dev fallback allow)');
      return { allowed: true, current: 0, limit: quotaEntry.limit, remaining: quotaEntry.limit };
    }
    // FAIL-CLOSED in production
    logger.error({ userId, entitlement, err }, 'quota:check:redis_unavailable (fail-closed)');
    return { allowed: false, current: 0, limit: quotaEntry.limit, remaining: 0 };
  }
}

/**
 * Consume one unit of quota. Throws QuotaExceededError if over limit.
 * Uses Redis INCRBY atomically.
 */
export async function consumeQuota(
  userId: string,
  entitlement: EntitlementKey,
  quotaEntry: QuotaEntry,
  amount: number = 1,
): Promise<{ current: number; limit: number | 'unlimited'; remaining: number | 'unlimited' }> {
  if (quotaEntry.limit === 'unlimited') {
    return { current: 0, limit: 'unlimited', remaining: 'unlimited' };
  }

  const { key: pk, ttlSec } = periodInfo(quotaEntry.period);
  const rk = redisKey(userId, entitlement, pk);
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    const redis = getRedisClient();
    await redis.ping();
    const luaScript = `
      local current = redis.call('GET', KEYS[1])
      local count = tonumber(current) or 0
      if count + tonumber(ARGV[1]) > tonumber(ARGV[2]) then
        return -1
      end
      local newVal = redis.call('INCRBY', KEYS[1], ARGV[1])
      if newVal == tonumber(ARGV[1]) then
        redis.call('EXPIRE', KEYS[1], ARGV[3])
      end
      return newVal
    `;
    const newCount = Number(
      await redis.eval(
        luaScript,
        1,
        rk,
        amount.toString(),
        quotaEntry.limit.toString(),
        ttlSec.toString(),
      ),
    );

    if (newCount === -1) {
      const current = Number(await redis.get(rk)) || 0;
      throw new QuotaExceededError(entitlement, quotaEntry.limit, current, quotaEntry.period);
    }

    return {
      current: newCount,
      limit: quotaEntry.limit,
      remaining: Math.max(0, quotaEntry.limit - newCount),
    };
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }

    if (isDev) {
      logger.warn({ userId, entitlement, err }, 'quota:consume:redis_unavailable (dev fallback allow)');
      return { current: 0, limit: quotaEntry.limit, remaining: quotaEntry.limit };
    }

    // FAIL-CLOSED in production
    logger.error({ userId, entitlement, err }, 'quota:consume:redis_unavailable (fail-closed)');
    throw new QuotaExceededError(entitlement, quotaEntry.limit, 0, quotaEntry.period);
  }
}

/**
 * Convenience: check + consume a quota for a user's plan in one call.
 * Requires the plan config quota entry for the given entitlement.
 */
export async function requireQuota(
  userId: string,
  entitlement: EntitlementKey,
  quotaEntry: QuotaEntry | undefined,
  amount: number = 1,
): Promise<void> {
  if (!quotaEntry) {
    logger.warn(
      { userId, entitlement },
      'quota:missing_config — entitlement not defined in plan, defaulting to unlimited. Verify plan-catalog.ts.',
    );
    return;
  }

  await consumeQuota(userId, entitlement, quotaEntry, amount);
}
