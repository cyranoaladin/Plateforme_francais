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
      const dayOfWeek = now.getUTCDay() || 7;
      const thursday = new Date(now);
      thursday.setUTCDate(now.getUTCDate() + (4 - dayOfWeek));
      const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
      const wk = `${thursday.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      return { key: wk, ttlSec: 7 * 86_400 };
    }
    case 'month': {
      const nextMonth = new Date(Date.UTC(y, now.getUTCMonth() + 1, 1));
      const ttlSec = Math.ceil((nextMonth.getTime() - now.getTime()) / 1000);
      return { key: `${y}-${m}`, ttlSec };
    }
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

type NumericQuotaCheckResult = {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
};

type NumericQuotaEntry = QuotaEntry & { limit: number };

const QUOTA_CHECK_AND_CONSUME_LUA = `
  local current = redis.call('GET', KEYS[1])
  local count = current and tonumber(current) or 0
  local limit = tonumber(ARGV[1])
  local cost = tonumber(ARGV[2])

  if cost == 0 then
    return {1, count}
  end

  if limit ~= 0 and count + cost > limit then
    return {0, count}
  end

  local newCount = redis.call('INCRBY', KEYS[1], cost)
  if newCount == cost then
    redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
  end
  return {1, newCount}
`;

function parseEvalResult(raw: unknown): { allowed: boolean; count: number } {
  if (Array.isArray(raw)) {
    const [allowedRaw, countRaw] = raw;
    return {
      allowed: Number(allowedRaw) === 1,
      count: Number(countRaw) || 0,
    };
  }

  return {
    allowed: Number(raw) >= 0,
    count: Number(raw) || 0,
  };
}

async function runNumericQuotaCheck(input: {
  userId: string;
  entitlement: EntitlementKey;
  quotaEntry: NumericQuotaEntry;
  amount: number;
}): Promise<NumericQuotaCheckResult> {
  const { key: pk, ttlSec } = periodInfo(input.quotaEntry.period);
  const rk = redisKey(input.userId, input.entitlement, pk);
  const redis = getRedisClient();
  await redis.ping();

  const raw = await redis.eval(
    QUOTA_CHECK_AND_CONSUME_LUA,
    1,
    rk,
    input.quotaEntry.limit.toString(),
    input.amount.toString(),
    ttlSec.toString(),
  );
  const parsed = parseEvalResult(raw);

  return {
    allowed: parsed.allowed,
    current: parsed.count,
    limit: input.quotaEntry.limit,
    remaining: Math.max(0, input.quotaEntry.limit - parsed.count),
  };
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
  if (quotaEntry.limit === 0) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }
  if (typeof quotaEntry.limit !== 'number') {
    return { allowed: true, current: 0, limit: 'unlimited', remaining: 'unlimited' };
  }
  const numericQuotaEntry: NumericQuotaEntry = { ...quotaEntry, limit: quotaEntry.limit };

  const allowRedisFallback = process.env.NODE_ENV !== 'production' || process.env.E2E_DISABLE_RATE_LIMIT === '1';

  try {
    return await runNumericQuotaCheck({
      userId,
      entitlement,
      quotaEntry: numericQuotaEntry,
      amount: 0,
    });
  } catch (err) {
    if (allowRedisFallback) {
      logger.warn({ userId, entitlement, err }, 'quota:check:redis_unavailable (fallback allow)');
      return { allowed: true, current: 0, limit: numericQuotaEntry.limit, remaining: numericQuotaEntry.limit };
    }
    // FAIL-CLOSED in production
    logger.error({ userId, entitlement, err }, 'quota:check:redis_unavailable (fail-closed)');
    return { allowed: false, current: 0, limit: numericQuotaEntry.limit, remaining: 0 };
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
  if (quotaEntry.limit === 0) {
    throw new QuotaExceededError(entitlement, 0, 0, quotaEntry.period);
  }
  if (typeof quotaEntry.limit !== 'number') {
    return { current: 0, limit: 'unlimited', remaining: 'unlimited' };
  }
  const numericQuotaEntry: NumericQuotaEntry = { ...quotaEntry, limit: quotaEntry.limit };

  const allowRedisFallback = process.env.NODE_ENV !== 'production' || process.env.E2E_DISABLE_RATE_LIMIT === '1';

  try {
    const result = await runNumericQuotaCheck({
      userId,
      entitlement,
      quotaEntry: numericQuotaEntry,
      amount,
    });

    if (!result.allowed) {
      throw new QuotaExceededError(entitlement, numericQuotaEntry.limit, result.current, numericQuotaEntry.period);
    }

    return result;
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw err;
    }

    if (allowRedisFallback) {
      logger.warn({ userId, entitlement, err }, 'quota:consume:redis_unavailable (fallback allow)');
      return { current: 0, limit: numericQuotaEntry.limit, remaining: numericQuotaEntry.limit };
    }

    // FAIL-CLOSED in production
    logger.error({ userId, entitlement, err }, 'quota:consume:redis_unavailable (fail-closed)');
    throw new QuotaExceededError(entitlement, numericQuotaEntry.limit, 0, numericQuotaEntry.period);
  }
}

export async function rollbackQuota(
  userId: string,
  entitlement: EntitlementKey,
  quotaEntry: QuotaEntry,
  amount: number = 1,
): Promise<void> {
  if (quotaEntry.limit === 'unlimited' || quotaEntry.limit === 0) {
    return;
  }

  const { key: pk } = periodInfo(quotaEntry.period);
  const rk = redisKey(userId, entitlement, pk);
  const redis = getRedisClient();
  await redis.decrby(rk, amount);
  logger.info({ userId, entitlement, amount }, 'quota:rollback');
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
