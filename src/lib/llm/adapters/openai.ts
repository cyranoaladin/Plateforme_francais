import OpenAI from 'openai';
import { normalizeEmbeddingDimension } from '@/lib/llm/embeddings';
import { type GenerateContentOptions, type LLMProvider, type ProviderChatMessage } from '@/lib/llm/provider';

const DEFAULT_GENERATION_MODEL = 'gpt-4o';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export class OpenAIProvider implements LLMProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY manquante.');
    }

    this.client = new OpenAI({ apiKey });
  }

  async generateContent(
    promptOrMessages: string | ProviderChatMessage[],
    options?: GenerateContentOptions,
  ) {
    const startedAt = Date.now();
    const prompt = Array.isArray(promptOrMessages)
      ? promptOrMessages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : promptOrMessages;
    const response = await this.client.responses.create({
      model: DEFAULT_GENERATION_MODEL,
      input: prompt,
      max_output_tokens: options?.maxTokens,
      temperature: options?.temperature,
      text:
        options?.responseMimeType === 'application/json'
          ? { format: { type: 'json_object' } }
          : undefined,
    });

    return {
      text: response.output_text,
      content: response.output_text,
      model: DEFAULT_GENERATION_MODEL,
      usage: {
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  async getEmbeddings(text: string) {
    const response = await this.client.embeddings.create({
      model: DEFAULT_EMBEDDING_MODEL,
      input: text,
    });

    return normalizeEmbeddingDimension(response.data[0]?.embedding ?? []);
  }
}
