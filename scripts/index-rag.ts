import { indexReferencesToVectorStore } from '../src/lib/rag/indexer';
import { logger } from '../src/lib/logger';

async function main() {
  const result = await indexReferencesToVectorStore();

  if (result.skipped) {
    logger.warn({ route: 'scripts/index-rag', success: false }, 'Indexation ignorée: base PostgreSQL indisponible.');
    return;
  }

  logger.info({ route: 'scripts/index-rag', indexed: result.indexed, success: true }, 'Indexation terminée.');
}

main().catch((error: unknown) => {
  logger.error({ route: 'scripts/index-rag', error, success: false }, 'Erreur pendant l indexation RAG.');
  process.exit(1);
});
