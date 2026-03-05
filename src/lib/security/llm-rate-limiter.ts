import { getRedisClient } from '@/lib/queue/correction-queue';
import { logger } from '@/lib/logger';
import type { Skill } from '@/lib/llm/skills/types';

export type LimitedSkill =
  | 'tuteur_libre'
  | 'correcteur'
  | 'coach_oral'
  | 'quiz_maitre'
  | 'coach_ecrit';

const DEFAULT_LIMITS = { rpm: 15, daily: 150 };

const LLM_LIMITS: Record<LimitedSkill, { rpm: number; daily: number }> = {
  tuteur_libre: { rpm: 20, daily: 200 },
  correcteur: { rpm: 5, daily: 50 },
  coach_oral: { rpm: 10, daily: 100 },
  quiz_maitre: { rpm: 30, daily: 300 },
  coach_ecrit: { rpm: 5, daily: 50 },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function minuteKey(): string {
  return new Date().toISOString().slice(0, 16);
}

function normalizeSkill(skill: Skill | string): LimitedSkill | null {
  if (skill in LLM_LIMITS) {
    return skill as LimitedSkill;
  }
  return null;
}

export class QuotaExceededError extends Error {
  readonly status = 429;
  constructor(
    public readonly skill: string,
    public readonly scope: 'rpm' | 'daily',
    public readonly limit: number,
  ) {
    super(`Quota LLM dépassé pour ${skill} (${scope}:${limit}).`);
    this.name = 'QuotaExceededError';
  }
}

export async function checkLLMQuota(userId: string, skill: Skill | string): Promise<void> {
  const normalized = normalizeSkill(skill);
  const limits = normalized ? LLM_LIMITS[normalized] : DEFAULT_LIMITS;
  const resolvedSkill = normalized ?? skill;

  const redis = getRedisClient();
  const day = todayKey();
  const minute = minuteKey();
  const dailyKey = `llm_quota:${userId}:${resolvedSkill}:daily:${day}`;
  const rpmKey = `llm_quota:${userId}:${resolvedSkill}:rpm:${minute}`;

  try {
    const [dailyCount, minuteCount] = await Promise.all([redis.incr(dailyKey), redis.incr(rpmKey)]);
    await Promise.all([redis.expire(dailyKey, 86_400), redis.expire(rpmKey, 60)]);

    if (minuteCount > limits.rpm) {
      throw new QuotaExceededError(resolvedSkill, 'rpm', limits.rpm);
    }
    if (dailyCount > limits.daily) {
      throw new QuotaExceededError(resolvedSkill, 'daily', limits.daily);
    }
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      throw error;
    }

    logger.error(
      {
        userId,
        skill: resolvedSkill,
        error: error instanceof Error ? error.message : String(error),
      },
      'llm.rate_limit.redis_error_fail_closed',
    );
    throw new QuotaExceededError(resolvedSkill, 'rpm', limits.rpm);
  }
}

