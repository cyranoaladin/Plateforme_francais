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

function getConnection(): IORedis {
  if (connection) {
    return connection;
  }

  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  return connection;
}

export function getRedisClient(): IORedis {
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
