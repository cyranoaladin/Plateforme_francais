-- CreateIndex: IVFFlat index on Chunk.embedding for fast approximate nearest neighbor search
-- New environments now create Chunk.embedding as vector(1024), which is compatible with IVFFlat.
-- Older environments may still have a wider legacy vector column (for example vector(3072));
-- in that case, skip the ANN index instead of failing the whole migration.
DO $$
DECLARE
  embedding_type TEXT;
  embedding_dims INTEGER := 0;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
  INTO embedding_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'Chunk'
    AND a.attname = 'embedding'
    AND n.nspname = current_schema()
    AND NOT a.attisdropped;

  embedding_dims := COALESCE(((regexp_match(COALESCE(embedding_type, ''), '\((\d+)\)'))[1])::INTEGER, 0);

  IF embedding_dims BETWEEN 1 AND 2000 THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS "Chunk_embedding_ivfflat_idx"
      ON "Chunk"
      USING ivfflat ("embedding" vector_cosine_ops)
      WITH (lists = 100)
    ';
  ELSE
    RAISE NOTICE 'Skipping Chunk_embedding_ivfflat_idx because embedding column type % uses % dimensions', COALESCE(embedding_type, 'unknown'), embedding_dims;
  END IF;
END
$$;

-- Add unique constraint on (docId, chunkIndex) to prevent duplicate chunks
CREATE UNIQUE INDEX IF NOT EXISTS "Chunk_docId_chunkIndex_unique_idx"
ON "Chunk" ("docId", "chunkIndex");
