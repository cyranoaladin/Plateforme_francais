/**
 * Client RAG externe pour rag-api.nexusreussite.academy
 * Connexion au système RAG éducation Français avec 13 661 chunks indexés.
 */

import { logger } from '@/lib/logger';

export interface ExternalRAGSearchParams {
  query: string;
  collection?: string;
  topK?: number;
  rerank?: boolean;
  alpha?: number;
  filters?: {
    matiere?: string;
    niveau?: string;
    groupe?: string;
    oeuvre?: string;
    parcours?: string;
  };
}

export interface ExternalRAGChunk {
  content: string;
  score: number;
  metadata: {
    source?: string;
    title?: string;
    matiere?: string;
    niveau?: string;
    groupe?: string;
    oeuvre?: string;
    parcours?: string;
    page?: number;
    chunk_id?: string;
    [key: string]: unknown;
  };
}

export interface ExternalRAGSearchResponse {
  results: ExternalRAGChunk[];
  query: string;
  collection: string;
  total_found?: number;
  search_time_ms?: number;
}

export interface ExternalRAGHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version?: string;
  collections?: string[];
}

export interface ExternalRAGStatsResponse {
  collection: string;
  total_documents: number;
  total_chunks: number;
  embedding_model: string;
  last_updated?: string;
}

class ExternalRAGClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly collection: string;
  private readonly defaultMatiere: string;
  private readonly defaultNiveau: string;
  private readonly defaultTopK: number;
  private readonly defaultRerank: boolean;
  private readonly defaultAlpha: number;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.RAG_API_URL ?? 'https://rag-api.nexusreussite.academy';
    this.token = process.env.RAG_API_TOKEN ?? '';
    this.collection = process.env.RAG_COLLECTION ?? 'rag_education';
    this.defaultMatiere = process.env.RAG_MATIERE ?? 'Français';
    this.defaultNiveau = process.env.RAG_NIVEAU ?? 'Première';
    this.defaultTopK = parseInt(process.env.RAG_TOP_K ?? '10', 10);
    this.defaultRerank = process.env.RAG_RERANK === 'true';
    this.defaultAlpha = parseFloat(process.env.RAG_ALPHA ?? '0.7');
    this.timeout = parseInt(process.env.RAG_TIMEOUT_MS ?? '8000', 10);
  }

  private headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Vérifie si le client RAG est configuré avec un token valide.
   */
  isConfigured(): boolean {
    return Boolean(this.token && this.token.length > 0);
  }

  /**
   * Vérifie la santé de l'API RAG.
   */
  async health(): Promise<ExternalRAGHealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return { status: 'unhealthy' };
      }

      const data = await response.json();
      return {
        status: 'healthy',
        ...data,
      };
    } catch (error) {
      logger.warn({ error, baseUrl: this.baseUrl }, '[ExternalRAG] health_check_failed');
      return { status: 'unhealthy' };
    }
  }

  /**
   * Récupère les statistiques d'une collection.
   */
  async getStats(collection?: string): Promise<ExternalRAGStatsResponse | null> {
    const targetCollection = collection ?? this.collection;
    try {
      const response = await fetch(`${this.baseUrl}/stats/${targetCollection}`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        logger.warn({ status: response.status, collection: targetCollection }, '[ExternalRAG] stats_failed');
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.warn({ error, collection: targetCollection }, '[ExternalRAG] stats_error');
      return null;
    }
  }

  /**
   * Recherche sémantique dans le RAG externe.
   */
  async search(params: ExternalRAGSearchParams): Promise<ExternalRAGSearchResponse> {
    if (!this.isConfigured()) {
      logger.info('[ExternalRAG] not_configured, returning empty results');
      return {
        results: [],
        query: params.query,
        collection: this.collection,
        total_found: 0,
      };
    }

    const payload = {
      q: params.query,
      collection: params.collection ?? this.collection,
      top_k: params.topK ?? this.defaultTopK,
      rerank: params.rerank ?? this.defaultRerank,
      alpha: params.alpha ?? this.defaultAlpha,
      filters: {
        matiere: params.filters?.matiere ?? this.defaultMatiere,
        ...(params.filters?.niveau && { niveau: params.filters.niveau }),
        ...(params.filters?.groupe && { groupe: params.filters.groupe }),
        ...(params.filters?.oeuvre && { oeuvre: params.filters.oeuvre }),
        ...(params.filters?.parcours && { parcours: params.filters.parcours }),
      },
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error({
          status: response.status,
          error: errorText,
          query: params.query.slice(0, 100),
        }, '[ExternalRAG] search_http_error');

        return {
          results: [],
          query: params.query,
          collection: payload.collection,
          total_found: 0,
        };
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      logger.info({
        query: params.query.slice(0, 50),
        collection: payload.collection,
        resultsCount: data.results?.length ?? 0,
        latencyMs,
        rerank: payload.rerank,
      }, '[ExternalRAG] search_success');

      return {
        results: data.results ?? [],
        query: params.query,
        collection: payload.collection,
        total_found: data.total_found ?? data.results?.length ?? 0,
        search_time_ms: latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error({
        error,
        query: params.query.slice(0, 50),
        latencyMs,
      }, '[ExternalRAG] search_error');

      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn(
          { query: params.query.slice(0, 50), timeoutMs: this.timeout },
          '[ExternalRAG] external_timeout_fallback_local',
        );
      }

      return {
        results: [],
        query: params.query,
        collection: params.collection ?? this.collection,
        total_found: 0,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Recherche optimisée pour le contexte EAF Français.
   * Applique les filtres par défaut et le reranking.
   */
  async searchFrancais(
    query: string,
    options?: {
      topK?: number;
      oeuvre?: string;
      parcours?: string;
      niveau?: string;
    }
  ): Promise<ExternalRAGChunk[]> {
    const response = await this.search({
      query,
      topK: options?.topK ?? this.defaultTopK,
      rerank: true,
      filters: {
        matiere: 'Français',
        niveau: options?.niveau ?? this.defaultNiveau,
        oeuvre: options?.oeuvre,
        parcours: options?.parcours,
      },
    });

    return response.results;
  }

  /**
   * Liste les collections disponibles.
   */
  async listCollections(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.collections ?? [];
    } catch (error) {
      logger.warn({ error }, '[ExternalRAG] list_collections_error');
      return [];
    }
  }
}

let singleton: ExternalRAGClient | null = null;

export function getExternalRAGClient(): ExternalRAGClient {
  if (!singleton) {
    singleton = new ExternalRAGClient();
  }
  return singleton;
}

export const externalRAG = getExternalRAGClient();
