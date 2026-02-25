import OpenAI from 'openai';
import { normalizeEmbeddingDimension } from '@/lib/llm/embeddings';
import {
  type GenerateContentOptions,
  type GenerateContentResult,
  type LLMProvider,
  type ProviderChatMessage,
} from '@/lib/llm/provider';

export type MistralTier = 'reasoning' | 'large' | 'small' | 'micro' | 'ocr';

type StreamOptions = GenerateContentOptions;

class MistralBaseError extends Error {}
export class MistralAuthError extends MistralBaseError {}
export class MistralRateLimitError extends MistralBaseError {}
export class MistralUnavailableError extends MistralBaseError {}

function ensureMessages(promptOrMessages: string | ProviderChatMessage[]): ProviderChatMessage[] {
  if (Array.isArray(promptOrMessages)) {
    return promptOrMessages;
  }
  return [{ role: 'user', content: promptOrMessages }];
}

export class MistralProvider implements LLMProvider {
  static readonly MODELS = {
    REASONING: process.env.MISTRAL_REASONING_MODEL ?? 'magistral-medium-latest',
    LARGE: process.env.MISTRAL_LARGE_MODEL ?? 'mistral-large-latest',
    SMALL: process.env.MISTRAL_SMALL_MODEL ?? 'mistral-small-latest',
    MICRO: process.env.MISTRAL_MICRO_MODEL ?? 'ministral-8b-latest',
    OCR: process.env.MISTRAL_OCR_MODEL ?? 'mistral-ocr-latest',
    EMBED: process.env.MISTRAL_EMBED_MODEL ?? 'mistral-embed',
  } as const;

  readonly name: string;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    apiKey: string = process.env.MISTRAL_API_KEY ?? '',
    model: string = MistralProvider.MODELS.REASONING,
  ) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error(
        '[MistralProvider] MISTRAL_API_KEY manquante. Générer sur console.mistral.ai et ajouter dans .env',
      );
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1',
    });
    this.model = model;
    this.name = `mistral:${model}`;
  }

  async generateContent(
    promptOrMessages: string | ProviderChatMessage[],
    options?: GenerateContentOptions,
  ): Promise<GenerateContentResult> {
    const startedAt = Date.now();
    const messages = ensureMessages(promptOrMessages);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 4096,
        response_format:
          options?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
      });

      const text = completion.choices[0]?.message?.content ?? '';

      return {
        text,
        content: text,
        model: completion.model ?? this.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = Number((error as { status?: number }).status ?? 0);
        if (status === 401) throw new MistralAuthError('Mistral API key invalide (401).');
        if (status === 429) throw new MistralRateLimitError('Mistral rate limit atteint (429).');
        if (status === 503 || status >= 500) throw new MistralUnavailableError(`Mistral indisponible (${status}).`);
      }
      throw error instanceof Error ? error : new Error('Mistral generation failed.');
    }
  }

  async *generateStream(
    messages: ProviderChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      response_format:
        options?.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
    });

    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content ?? '';
      if (!token) {
        continue;
      }
      yield token;
    }
  }

  async getEmbeddings(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: MistralProvider.MODELS.EMBED,
      input: text,
    });
    return normalizeEmbeddingDimension(response.data[0]?.embedding ?? []);
  }

  static async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const apiKey = process.env.MISTRAL_API_KEY ?? '';
    const baseUrl = (process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1').replace(/\/$/, '');
    const startedAt = Date.now();

    if (!apiKey) {
      return { ok: false, latencyMs: Date.now() - startedAt };
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return { ok: response.ok, latencyMs: Date.now() - startedAt };
    } catch {
      return { ok: false, latencyMs: Date.now() - startedAt };
    }
  }

  static createForTier(tier: MistralTier): MistralProvider {
    const modelMap: Record<MistralTier, string> = {
      reasoning: MistralProvider.MODELS.REASONING,
      large: MistralProvider.MODELS.LARGE,
      small: MistralProvider.MODELS.SMALL,
      micro: MistralProvider.MODELS.MICRO,
      ocr: MistralProvider.MODELS.OCR,
    };
    return new MistralProvider(process.env.MISTRAL_API_KEY ?? '', modelMap[tier]);
  }
}
