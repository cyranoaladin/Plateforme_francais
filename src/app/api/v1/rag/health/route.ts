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
      message: 'Service RAG non configuré',
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
        stats: stats ? {
          total_chunks: stats.total_chunks,
        } : null,
      },
    }, { status: health.status === 'healthy' ? 200 : 503 });
  } catch {
    return NextResponse.json({
      status: 'error',
      message: 'Erreur de connexion au service RAG',
      external_rag: {
        configured: true,
        healthy: false,
      },
    }, { status: 503 });
  }
}
