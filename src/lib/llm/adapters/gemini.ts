import { GoogleGenerativeAI } from '@google/generative-ai';
import { normalizeEmbeddingDimension } from '@/lib/llm/embeddings';
import { type GenerateContentOptions, type LLMProvider, type ProviderChatMessage } from '@/lib/llm/provider';

const DEFAULT_GENERATION_MODEL = 'gemini-1.5-pro';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

export class GeminiProvider implements LLMProvider {
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY manquante.');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateContent(
    promptOrMessages: string | ProviderChatMessage[],
    options?: GenerateContentOptions,
  ) {
    const startedAt = Date.now();
    const model = this.client.getGenerativeModel({ model: DEFAULT_GENERATION_MODEL });
    const prompt = Array.isArray(promptOrMessages)
      ? promptOrMessages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : promptOrMessages;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        responseMimeType: options?.responseMimeType,
      },
    });

    return {
      text: result.response.text(),
      content: result.response.text(),
      model: DEFAULT_GENERATION_MODEL,
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount,
        latencyMs: Date.now() - startedAt,
      },
    };
  }

  async getEmbeddings(text: string) {
    const model = this.client.getGenerativeModel({ model: DEFAULT_EMBEDDING_MODEL });
    const embedding = await model.embedContent(text);
    return normalizeEmbeddingDimension(embedding.embedding.values ?? []);
  }
}
