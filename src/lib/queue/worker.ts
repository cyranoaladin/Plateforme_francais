import { Worker, Job } from 'bullmq';
import { CORRECTION_QUEUE_NAME, getWorkerRedisClient, getDeadLetterQueue, type CorrectionJobPayload, DEAD_LETTER_QUEUE_NAME } from './correction-queue';
import { processCorrection } from '@/lib/epreuves/worker';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/client';

const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout

export function startCorrectionWorker() {
    logger.info({ queue: CORRECTION_QUEUE_NAME }, 'worker.starting');

    const worker = new Worker<CorrectionJobPayload>(
        CORRECTION_QUEUE_NAME,
        async (job: Job<CorrectionJobPayload>) => {
            const { copieId } = job.data;
            const startTime = Date.now();
            
            logger.info({ copieId, jobId: job.id }, 'worker.processing_job');

            // Mettre à jour le statut en "processing"
            await prisma.copieDeposee.update({
                where: { id: copieId },
                data: { status: 'processing' },
            });

            await job.updateProgress(10);

            try {
                // Timeout wrapper pour la correction
                const correctionPromise = processCorrection(copieId, 1, true);
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Correction timeout')), JOB_TIMEOUT_MS);
                });

                await Promise.race([correctionPromise, timeoutPromise]);

                await job.updateProgress(100);
                
                logger.info({ 
                    copieId, 
                    jobId: job.id, 
                    durationMs: Date.now() - startTime 
                }, 'worker.job_completed');
                
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                logger.error({ 
                    copieId, 
                    jobId: job.id, 
                    error: err.message,
                    durationMs: Date.now() - startTime 
                }, 'worker.job_failed');

                // Mettre à jour le statut de la copie en échec
                await prisma.copieDeposee.update({
                    where: { id: copieId },
                    data: { 
                        status: 'error',
                    },
                });

                // Créer un événement de progression pour notifier l'élève
                await prisma.copieProgressEvent.create({
                    data: {
                        copieId,
                        stage: 'error',
                        message: err.message,
                        progress: 0,
                        payload: { timestamp: new Date().toISOString() },
                    },
                });

                // Si c'est le dernier essai, déplacer vers DLQ
                if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
                    await moveToDeadLetter(job.data, err);
                }

                throw err; // Re-throw pour que BullMQ gère les retries
            }
        },
        {
            connection: getWorkerRedisClient(),
            concurrency: 3,
            // Configuration du lock pour éviter les jobs bloqués
            lockDuration: 6 * 60 * 1000, // 6 minutes (supérieur au timeout)
            stalledInterval: 30 * 1000, // Vérifier les jobs bloqués toutes les 30s
            maxStalledCount: 1, // Marquer comme failed après 1 stalled
        }
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id, copieId: job.data.copieId }, 'worker.job_completed');
    });

    worker.on('failed', async (job, err) => {
        if (!job) return;
        
        logger.error(
            { jobId: job.id, error: err instanceof Error ? err.message : String(err), copieId: job.data.copieId },
            'worker.job_failed_permanently'
        );

        // Déplacer vers DLQ si tous les retries ont échoué
        if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
            await moveToDeadLetter(job.data, err instanceof Error ? err : new Error(String(err)));
        }
    });

    worker.on('stalled', (jobId) => {
        logger.warn({ jobId }, 'worker.job_stalled');
    });

    worker.on('error', (err) => {
        logger.error({ error: err }, 'worker.redis_error');
    });

    // Graceful shutdown
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

async function moveToDeadLetter(jobData: CorrectionJobPayload, error: Error): Promise<void> {
    try {
        const dlq = getDeadLetterQueue();
        await dlq.add('failed-correction', {
            ...jobData,
            errorMessage: error.message,
            failedAt: new Date().toISOString(),
        });
        logger.info({ copieId: jobData.copieId, error: error.message }, 'worker.moved_to_dlq');
    } catch (dlqError) {
        logger.error({ copieId: jobData.copieId, error: dlqError }, 'worker.dlq_failed');
    }
}
