import { NextResponse } from 'next/server';
import { externalRAG } from '@/lib/rag/external-client';

/**
 * GET /api/v1/rag/health
 * Health check for external RAG API connection.
 */
export async function GET() {
  const isConfigured = externalRAG.isConfigured();
  
  if (!isConfigured) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'RAG_API_TOKEN is not set',
      external_rag: {
        configured: false,
        healthy: false,
      },
    }, { status: 503 });
  }

  try {
    const health = await externalRAG.health();
    const stats = await externalRAG.getStats();

    return NextResponse.json({
      status: health.status === 'healthy' ? 'ok' : 'degraded',
      external_rag: {
        configured: true,
        healthy: health.status === 'healthy',
        url: process.env.RAG_API_URL,
        collection: process.env.RAG_COLLECTION,
        stats: stats ? {
          total_chunks: stats.total_chunks,
          embedding_model: stats.embedding_model,
        } : null,
      },
    }, { status: health.status === 'healthy' ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      external_rag: {
        configured: true,
        healthy: false,
      },
    }, { status: 503 });
  }
}
