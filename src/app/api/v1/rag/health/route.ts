import { NextResponse } from 'next/server';
import { externalRAG } from '@/lib/rag/external-client';

/**
 * GET /api/v1/rag/health
 * Health check + diagnostic for external RAG API connection.
 * Add ?diag=1 for a test search.
 */
export async function GET(request: Request) {
  const isConfigured = externalRAG.isConfigured();
  const url = new URL(request.url);
  const runDiag = url.searchParams.get('diag') === '1';

  if (!isConfigured) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Service RAG non configuré (RAG_API_TOKEN manquant)',
      external_rag: {
        configured: false,
        healthy: false,
      },
    }, { status: 503 });
  }

  try {
    const [health, stats, collections] = await Promise.all([
      externalRAG.health(),
      externalRAG.getStats(),
      externalRAG.listCollections().catch(() => [] as string[]),
    ]);

    const result: Record<string, unknown> = {
      status: health.status === 'healthy' ? 'ok' : 'degraded',
      external_rag: {
        configured: true,
        healthy: health.status === 'healthy',
        collections,
        stats: stats ? {
          total_chunks: stats.total_chunks,
          total_documents: stats.total_documents,
          embedding_model: stats.embedding_model,
        } : null,
      },
    };

    // Optional diagnostic search
    if (runDiag) {
      try {
        const diagResult = await externalRAG.search({
          query: 'Phèdre Racine tragédie',
          topK: 3,
        });
        result.diagnostic = {
          query: 'Phèdre Racine tragédie',
          results_count: diagResult.results.length,
          total_found: diagResult.total_found,
          search_time_ms: diagResult.search_time_ms,
          first_result: diagResult.results[0]
            ? { score: diagResult.results[0].score, content_preview: diagResult.results[0].content.slice(0, 200) }
            : null,
        };
      } catch (error) {
        result.diagnostic = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json(result, {
      status: health.status === 'healthy' ? 200 : 503,
    });
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
