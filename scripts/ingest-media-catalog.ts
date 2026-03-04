// scripts/ingest-media-catalog.ts
// Usage : npx ts-node scripts/ingest-media-catalog.ts
// Indexe les entrées du catalogue média dans le vector store RAG.

import { indexMediaCatalogToVectorStore } from '../src/lib/rag/media-indexer';
import { logger } from '../src/lib/logger';

async function main() {
  const result = await indexMediaCatalogToVectorStore();

  if (result.skipped) {
    logger.warn(
      { route: 'scripts/ingest-media-catalog', success: false },
      'Indexation média ignorée : base PostgreSQL indisponible.',
    );
    return;
  }

  logger.info(
    { route: 'scripts/ingest-media-catalog', indexed: result.indexed, success: true },
    'Indexation du catalogue média terminée.',
  );
}

main().catch((error: unknown) => {
  logger.error(
    { route: 'scripts/ingest-media-catalog', error, success: false },
    'Erreur pendant l\'indexation du catalogue média.',
  );
  process.exit(1);
});
