/**
 * Client RAG externe — collection rag_francais_premiere
 * POST /search { q, k, collection }
 * Auth: Bearer token via RAG_API_TOKEN
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

/* ─── Zod contract for external RAG response ─── */
const ExternalRAGChunkSchema = z.object({
  content: z.string().optional(),
  document: z.string().optional(),
  text: z.string().optional(),
  page_content: z.string().optional(),
  score: z.number().optional(),
  distance: z.number().optional(),
  relevance_score: z.number().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
}).transform((chunk) => ({
  content: chunk.content ?? chunk.document ?? chunk.text ?? chunk.page_content ?? '',
  score: chunk.score ?? chunk.relevance_score ?? (chunk.distance != null ? 1 - chunk.distance : 0.5),
  metadata: chunk.metadata,
}));

const ExternalRAGResponseSchema = z.object({
  results: z.array(ExternalRAGChunkSchema).optional(),
  hits: z.array(ExternalRAGChunkSchema).optional(),
  documents: z.array(ExternalRAGChunkSchema).optional(),
  data: z.array(ExternalRAGChunkSchema).optional(),
  query: z.string().optional(),
  collection: z.string().optional(),
  total_found: z.number().optional(),
  total: z.number().optional(),
  count: z.number().optional(),
  search_time_ms: z.number().optional(),
}).transform((data) => ({
  ...data,
  results: data.results ?? data.hits ?? data.documents ?? data.data ?? [],
  total_found: data.total_found ?? data.total ?? data.count,
}));

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
    this.baseUrl = process.env.RAG_API_URL ?? 'http://127.0.0.1:18001';
    this.token = process.env.RAG_API_TOKEN ?? '';
    this.collection = process.env.RAG_COLLECTION ?? 'rag_francais_premiere';
    this.defaultMatiere = process.env.RAG_MATIERE ?? 'Français';
    this.defaultNiveau = process.env.RAG_NIVEAU ?? 'Première';
    this.defaultTopK = parseInt(process.env.RAG_TOP_K ?? '6', 10);
    this.defaultRerank = process.env.RAG_RERANK === 'true';
    this.defaultAlpha = parseFloat(process.env.RAG_ALPHA ?? '0.7');
    this.timeout = parseInt(process.env.RAG_TIMEOUT_MS ?? '8000', 10);

    // Do not throw here as it breaks next build
    if (process.env.NODE_ENV === 'production' && !this.token) {
      logger.warn('[ExternalRAG] RAG_API_TOKEN is missing in production environment.');
    }
  }

  private ensureConfigured() {
    if (process.env.NODE_ENV === 'production' && !this.isConfigured()) {
      throw new Error('CRITICAL: RAG_API_TOKEN is missing in production environment.');
    }
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
    this.ensureConfigured();
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers(),
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        return { status: 'unhealthy' };
      }

      const data = await response.json();
      return {
        status: 'healthy',
        ...data,
      };
    } catch {
      // HTTP health may hang during model loading; fall back to TCP port check
      try {
        const url = new URL(this.baseUrl);
        const net = await import('net');
        const reachable = await new Promise<boolean>((resolve) => {
          const sock = new net.Socket();
          sock.setTimeout(3_000);
          sock.once('connect', () => { sock.destroy(); resolve(true); });
          sock.once('error', () => { sock.destroy(); resolve(false); });
          sock.once('timeout', () => { sock.destroy(); resolve(false); });
          sock.connect(Number(url.port) || 80, url.hostname);
        });
        if (reachable) {
          return { status: 'healthy' };
        }
      } catch { /* ignore */ }
      logger.warn({ baseUrl: this.baseUrl }, '[ExternalRAG] health_check_failed');
      return { status: 'unhealthy' };
    }
  }

  /**
   * Récupère les statistiques d'une collection.
   */
  async getStats(collection?: string): Promise<ExternalRAGStatsResponse | null> {
    this.ensureConfigured();
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
    this.ensureConfigured();
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RAG_API_TOKEN is not configured in production.');
      }
      logger.info('[ExternalRAG] not_configured, returning empty results');
      return {
        results: [],
        query: params.query,
        collection: this.collection,
        total_found: 0,
      };
    }

    const collection = params.collection ?? this.collection;
    const hasFilters = Boolean(
      params.filters?.matiere || params.filters?.niveau ||
      params.filters?.groupe || params.filters?.oeuvre || params.filters?.parcours
    );

    const filters = hasFilters ? {
      ...(params.filters?.matiere && { matiere: params.filters.matiere }),
      ...(params.filters?.niveau && { niveau: params.filters.niveau }),
      ...(params.filters?.groupe && { groupe: params.filters.groupe }),
      ...(params.filters?.oeuvre && { oeuvre: params.filters.oeuvre }),
      ...(params.filters?.parcours && { parcours: params.filters.parcours }),
    } : undefined;

    const basePayload = {
      q: params.query,
      query: params.query,
      collection,
      collection_name: collection,
      k: params.topK ?? this.defaultTopK,
      top_k: params.topK ?? this.defaultTopK,
      n_results: params.topK ?? this.defaultTopK,
      rerank: params.rerank ?? this.defaultRerank,
      alpha: params.alpha ?? this.defaultAlpha,
    };

    // Try with filters first, then without if 0 results
    const result = await this._executeSearch(
      { ...basePayload, ...(filters ? { filters } : {}) },
      params.query,
      collection,
    );

    // If filtered search returned 0 results and we had filters, retry without
    if (result.results.length === 0 && filters) {
      logger.info({
        query: params.query.slice(0, 50),
        filters,
      }, 'rag.external.retry_without_filters');
      return this._executeSearch(basePayload, params.query, collection);
    }

    return result;
  }

  /**
   * Execute a single search request against the external RAG API.
   */
  private async _executeSearch(
    payload: Record<string, unknown>,
    query: string,
    collection: string,
  ): Promise<ExternalRAGSearchResponse> {
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
          query: query.slice(0, 100),
        }, '[ExternalRAG] search_http_error');

        return {
          results: [],
          query,
          collection,
          total_found: 0,
        };
      }

      const rawData = await response.json();
      const latencyMs = Date.now() - startTime;

      // Strict Zod validation on external response
      const parsed = ExternalRAGResponseSchema.safeParse(rawData);
      if (!parsed.success) {
        logger.error({
          query: query.slice(0, 50),
          zodErrors: parsed.error.format(),
          rawKeys: Object.keys(rawData),
          latencyMs,
        }, 'rag.external.contract_violation');
        return {
          results: [],
          query,
          collection,
          total_found: 0,
        };
      }

      const data = parsed.data;
      const isEmpty = data.results.length === 0;

      logger.info({
        query: query.slice(0, 50),
        collection,
        resultsCount: data.results.length,
        latencyMs,
        isEmpty,
        statusCode: response.status,
      }, 'rag.external.search_success');

      return {
        results: data.results as ExternalRAGChunk[],
        query,
        collection,
        total_found: data.total_found ?? data.results.length,
        search_time_ms: latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.name === 'AbortError';

      if (isTimeout) {
        logger.warn({
          query: query.slice(0, 50),
          timeoutMs: this.timeout,
          latencyMs,
        }, 'rag.external.timeout');
      } else {
        logger.error({
          error,
          query: query.slice(0, 50),
          latencyMs,
        }, 'rag.external.search_error');
      }

      return {
        results: [],
        query,
        collection,
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
    this.ensureConfigured();
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
