import { startCorrectionWorker } from './worker';
import { logger } from '@/lib/logger';

/**
 * Script d'entrée pour le worker de production BullMQ.
 * Lancé via PM2 ou `npm run worker`.
 */
try {
    startCorrectionWorker();
    logger.info('Background Correction Worker started successfully.');
} catch (error) {
    logger.error({ error }, 'Failed to start Background Correction Worker.');
    process.exit(1);
}
