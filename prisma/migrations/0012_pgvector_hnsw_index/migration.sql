-- CreateIndex: IVFFlat index on Chunk.embedding for fast approximate nearest neighbor search
-- Using IVFFlat because production embeddings are 3072-dim (HNSW limited to 2000-dim)
-- Using cosine distance operator class (vector_cosine_ops) matching the <-> operator
-- NOTE: IVFFlat requires data to build lists — run this AFTER loading chunks
-- For small datasets (<10k rows), lists=100 is appropriate
CREATE INDEX IF NOT EXISTS "Chunk_embedding_ivfflat_idx"
ON "Chunk"
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 100);

-- Add unique constraint on (docId, chunkIndex) to prevent duplicate chunks
CREATE UNIQUE INDEX IF NOT EXISTS "Chunk_docId_chunkIndex_unique_idx"
ON "Chunk" ("docId", "chunkIndex");
