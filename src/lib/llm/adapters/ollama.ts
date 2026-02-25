import {
  type GenerateContentOptions,
  type GenerateContentResult,
  type LLMProvider,
  type ProviderChatMessage,
} from '@/lib/llm/provider';
import { logger } from '@/lib/logger';

type StreamOptions = GenerateContentOptions & { onToken?: (token: string) => void };

type OllamaChatResponse = {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

type OllamaEmbeddingsResponse = {
  embedding?: number[];
  embeddings?: number[][];
};

const DEFAULT_TIMEOUT_MS = 60_000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveTimeout(options?: GenerateContentOptions): number {
  if ((options?.maxTokens ?? 0) > 3000) {
    return 120_000;
  }

  const configured = Number.parseInt(process.env.OLLAMA_TIMEOUT_MS ?? `${DEFAULT_TIMEOUT_MS}`, 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function toMessages(promptOrMessages: string | ProviderChatMessage[]): ProviderChatMessage[] {
  if (Array.isArray(promptOrMessages)) {
    return promptOrMessages;
  }
  return [{ role: 'user', content: promptOrMessages }];
}

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly embeddingModel: string;

  constructor(
    baseUrl: string = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: string = process.env.OLLAMA_MODEL ?? 'llama3.1:70b',
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text';
  }

  private async callWithRetry<T>(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    attempts = 2,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Ollama ${path} ${response.status}: ${text}`);
          }
          throw new Error(`Ollama ${path} ${response.status}: ${text}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await wait(1000);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Ollama request failed');
  }

  async generateContent(
    promptOrMessages: string | ProviderChatMessage[],
    options?: GenerateContentOptions,
  ): Promise<GenerateContentResult> {
    const startedAt = Date.now();
    const payload = {
      model: this.model,
      messages: toMessages(promptOrMessages),
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.3,
        num_predict: options?.maxTokens ?? 4096,
      },
      format: options?.responseMimeType === 'application/json' ? 'json' : undefined,
    };

    try {
      const response = await this.callWithRetry<OllamaChatResponse>(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        resolveTimeout(options),
      );

      if (response.error && response.error.includes('model')) {
        logger.warn({ model: this.model, route: 'llm/ollama' }, 'ollama.model_not_found');
        const fallback = '{"error":"MODEL_NOT_FOUND","message":"Modele Ollama indisponible."}';
        return {
          text: fallback,
          content: fallback,
          model: this.model,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            latencyMs: Date.now() - startedAt,
          },
        };
      }

      const text = response.message?.content ?? '';

      return {
        text,
        content: text,
        model: this.model,
        usage: {
          promptTokens: response.prompt_eval_count ?? 0,
          completionTokens: response.eval_count ?? 0,
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('model')) {
        logger.warn({ model: this.model, error }, 'ollama.model_not_found');
        const fallback = '{"error":"MODEL_NOT_FOUND","message":"Modele Ollama indisponible."}';
        return {
          text: fallback,
          content: fallback,
          model: this.model,
          usage: { promptTokens: 0, completionTokens: 0, latencyMs: Date.now() - startedAt },
        };
      }

      throw error;
    }
  }

  async generateStream(
    messages: ProviderChatMessage[],
    options?: StreamOptions,
  ): Promise<ReadableStream<string>> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.maxTokens ?? 4096,
        },
        format: options?.responseMimeType === 'application/json' ? 'json' : undefined,
      }),
      signal: AbortSignal.timeout(resolveTimeout(options)),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama streaming error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const parsed = JSON.parse(trimmed) as {
                message?: { content?: string };
                done?: boolean;
              };
              const token = parsed.message?.content ?? '';
              if (token.length > 0) {
                options?.onToken?.(token);
                controller.enqueue(token);
              }
              if (parsed.done) {
                controller.close();
                return;
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  async getEmbeddings(text: string): Promise<number[]> {
    const payload = {
      model: this.embeddingModel,
      prompt: text,
    };

    const primary = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (primary.ok) {
      const body = (await primary.json()) as OllamaEmbeddingsResponse;
      if (Array.isArray(body.embedding)) {
        return body.embedding;
      }
      if (Array.isArray(body.embeddings?.[0])) {
        return body.embeddings[0] ?? [];
      }
    }

    const fallback = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.embeddingModel, input: [text] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!fallback.ok) {
      throw new Error(`Ollama embedding error (${fallback.status})`);
    }
    const data = (await fallback.json()) as OllamaEmbeddingsResponse;
    if (Array.isArray(data.embedding)) {
      return data.embedding;
    }
    return data.embeddings?.[0] ?? [];
  }

  static async healthCheck(baseUrl: string = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'): Promise<boolean> {
    const normalized = baseUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${normalized}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
