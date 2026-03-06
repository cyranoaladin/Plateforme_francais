import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { logger } from '@/lib/logger';
import { runCorrectionWorker } from '@/lib/epreuves/worker';

export const CORRECTION_QUEUE_NAME = 'correction-jobs';

export type CorrectionJobPayload = {
  copieId: string;
  userId: string;
  epreuveId: string;
  ocrText?: string;
};

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

let connection: IORedis | null = null;
let queue: Queue | null = null;

/* ─── Circuit breaker state ─── */
let circuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_RESET_MS = 10_000; // 10s cooldown before retrying

function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
    circuitOpen = false;
    return false;
  }
  return true;
}

function openCircuit(): void {
  circuitOpen = true;
  circuitOpenedAt = Date.now();
}

function getConnection(): IORedis {
  if (connection) {
    return connection;
  }

  connection = new IORedis(redisUrl, {
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    logger.warn({ err: err.message }, 'redis.connection.error');
    openCircuit();
  });

  connection.on('connect', () => {
    circuitOpen = false;
  });

  return connection;
}

/**
 * Returns the shared Redis client.
 * Throws immediately if the circuit breaker is open (Redis recently failed).
 */
export function getRedisClient(): IORedis {
  if (isCircuitOpen()) {
    throw new Error('Redis circuit breaker open — skipping connection attempt');
  }
  return getConnection();
}

function getQueue(): Queue {
  if (queue) {
    return queue;
  }

  queue = new Queue<CorrectionJobPayload>(CORRECTION_QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  });

  return queue;
}

export async function enqueueCorrectionJob(payload: CorrectionJobPayload): Promise<void> {
  try {
    await getQueue().add('process-copie', payload, {
      attempts: 3,
    });
  } catch (error) {
    logger.warn(
      { route: 'queue/correction', error, copieId: payload.copieId },
      'BullMQ unavailable, fallback to in-process worker.',
    );
    runCorrectionWorker(payload.copieId);
  }
}

export async function getCorrectionQueueLength(): Promise<number> {
  try {
    const q = getQueue();
    const [waiting, active, delayed, prioritized] = await Promise.all([
      q.getWaitingCount(),
      q.getActiveCount(),
      q.getDelayedCount(),
      q.getPrioritizedCount(),
    ]);

    return waiting + active + delayed + prioritized;
  } catch {
    return 0;
  }
}
