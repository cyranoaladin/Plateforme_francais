import { Worker, Job } from 'bullmq';
import { CORRECTION_QUEUE_NAME, getRedisClient, type CorrectionJobPayload } from './correction-queue';
import { processCorrection } from '@/lib/epreuves/worker';
import { logger } from '@/lib/logger';

export function startCorrectionWorker() {
    logger.info({ queue: CORRECTION_QUEUE_NAME }, 'worker.starting');

    const worker = new Worker<CorrectionJobPayload>(
        CORRECTION_QUEUE_NAME,
        async (job: Job<CorrectionJobPayload>) => {
            const { copieId } = job.data;
            logger.info({ copieId, jobId: job.id }, 'worker.processing_job');

            await job.updateProgress(10);

            // We call processCorrection with throwOnError=true so BullMQ can handle retries
            await processCorrection(copieId, 1, true);

            await job.updateProgress(100);
        },
        {
            connection: getRedisClient(),
            concurrency: 3, // Control LLM costs/concurrency as suggested by audit
        }
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id, copieId: job.data.copieId }, 'worker.job_completed');
    });

    worker.on('failed', (job, err) => {
        logger.error(
            { jobId: job?.id, error: err instanceof Error ? err.message : String(err), copieId: job?.data.copieId },
            'worker.job_failed_permanently'
        );
    });

    worker.on('error', (err) => {
        logger.error({ error: err }, 'worker.redis_error');
    });

    // Graceful shutdown: finish in-flight jobs before exiting (PM2 blue-green / Docker)
    async function gracefulShutdown(signal: string) {
        logger.info(`[CorrectionWorker] Signal ${signal} reçu. Fermeture gracieuse...`);
        await worker.pause();
        const forceTimeout = setTimeout(() => {
            logger.error('[CorrectionWorker] Timeout arrêt gracieux (30s). Arrêt forcé.');
            process.exit(1);
        }, 30_000);
        await worker.close();
        clearTimeout(forceTimeout);
        logger.info('[CorrectionWorker] Worker fermé proprement.');
        process.exit(0);
    }

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    return worker;
}
