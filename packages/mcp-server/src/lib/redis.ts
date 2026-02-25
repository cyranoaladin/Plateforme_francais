import IORedis from 'ioredis'
import type { Redis } from 'ioredis'
import { logger } from './logger.js'

let redisInstance: Redis | null = null

export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
    const RedisCtor = IORedis as unknown as new (
      redisUrl: string,
      options: Record<string, unknown>
    ) => Redis
    const client = new RedisCtor(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
    })
    redisInstance = client

    client.on('connect', () => logger.info('[Redis] Connected'))
    client.on('error', (err: unknown) => logger.error({ err }, '[Redis] Error'))
    client.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'))
  }
  return redisInstance as Redis
}

export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    redisInstance.disconnect()
    redisInstance = null
    logger.info('[Redis] Disconnected')
  }
}

// Health check Redis
export async function checkRedisHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    const redis = getRedis()
    const result = await redis.ping()
    return { healthy: result === 'PONG', latencyMs: Date.now() - start }
  } catch {
    return { healthy: false, latencyMs: Date.now() - start }
  }
}

// Helpers rate limiting
export async function checkRateLimit(
  key: string,
  maxPerWindow: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedis()
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  const ttl = await redis.ttl(key)
  const remaining = Math.max(0, maxPerWindow - current)

  return {
    allowed: current <= maxPerWindow,
    remaining,
    resetIn: ttl > 0 ? ttl : windowSeconds,
  }
}

// Helpers cache
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    const value = await redis.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis()
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Cache failure non-bloquant
  }
}

// Accès queue BullMQ (lecture seule pour monitoring)
export async function getQueueLength(queueName: string): Promise<number> {
  try {
    const redis = getRedis()
    const waiting = await redis.llen(`bull:${queueName}:wait`)
    const active = (await redis.smembers(`bull:${queueName}:active`)).length
    return waiting + active
  } catch {
    return -1
  }
}
