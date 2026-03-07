import { recordProviderError, recordProviderSuccess, selectProvider } from '@/lib/llm/router';
import { createAgentInteractionRecord, touchWorkMastery } from '@/lib/db/repositories/learningMemoryRepo';
import type { ProviderChatMessage, GenerateContentOptions } from '@/lib/llm/provider';
import type { Skill } from '@/lib/llm/skills/types';
import { MistralProvider } from '@/lib/llm/adapters/mistral';
import { OllamaProvider } from '@/lib/llm/adapters/ollama';
import { trackLlmCall } from '@/lib/llm/cost-tracker';

export function createLlmStream(params: {
  skill: string;
  messages: ProviderChatMessage[];
  options?: GenerateContentOptions;
  userId?: string;
  sessionId?: string;
  workId?: string;
  parcours?: string;
  ragSourcesCount?: number;
  contextSummary?: string;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const selectedInfo = selectProvider({
    skill: params.skill,
    contextTokens: params.messages.reduce((acc, item) => acc + Math.ceil(item.content.length / 4), 0),
    studentId: params.userId,
    streamingRequired: true,
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      const promptTokens = params.messages.reduce((acc, item) => acc + Math.ceil(item.content.length / 4), 0);
      let completionText = '';
      try {
        const provider = selectedInfo.provider;
        if ('generateStream' in provider && typeof provider.generateStream === 'function') {
          const stream = await (provider as MistralProvider | OllamaProvider).generateStream(
            params.messages,
            params.options,
          );

          if (stream && typeof stream === 'object' && Symbol.asyncIterator in stream) {
            for await (const chunk of stream as AsyncGenerator<string>) {
              completionText += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
            }
          } else {
            const reader = (stream as ReadableStream<string>).getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              completionText += value;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: value })}\n\n`));
            }
          }
        } else {
          const result = await provider.generateContent(params.messages, params.options);
          completionText += result.content ?? result.text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: result.content ?? result.text })}\n\n`));
        }

        recordProviderSuccess(selectedInfo.tier);
        await trackLlmCall({
          userId: params.userId,
          skill: params.skill,
          provider: selectedInfo.providerName,
          model: selectedInfo.model,
          tier: selectedInfo.tier,
          inputTokens: promptTokens,
          outputTokens: Math.ceil(completionText.length / 4),
          latencyMs: Date.now() - startedAt,
          success: true,
          contextSize: promptTokens,
        });
        await createAgentInteractionRecord({
          userId: params.userId ?? 'anonymous',
          skill: params.skill as Skill,
          sessionId: params.sessionId,
          inputSummary: [
            params.workId ? `workId=${params.workId}` : '',
            params.parcours ? `parcours=${params.parcours}` : '',
            params.contextSummary ?? '',
            params.messages.map((item) => `${item.role}: ${item.content}`).join('\n'),
          ].filter(Boolean).join('\n'),
          outputSummary: completionText,
          tokensUsed: promptTokens + Math.ceil(completionText.length / 4),
          latencyMs: Date.now() - startedAt,
          ragSourcesCount: params.ragSourcesCount ?? 0,
        }).catch(() => undefined);
        await touchWorkMastery({
          userId: params.userId ?? 'anonymous',
          workId: params.workId,
        }).catch(() => undefined);

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        recordProviderError(selectedInfo.tier);
        await trackLlmCall({
          userId: params.userId,
          skill: params.skill,
          provider: selectedInfo.providerName,
          model: selectedInfo.model,
          tier: selectedInfo.tier,
          inputTokens: promptTokens,
          outputTokens: Math.ceil(completionText.length / 4),
          latencyMs: Date.now() - startedAt,
          success: false,
          errorCode: error instanceof Error ? error.name || 'STREAM_ERROR' : 'STREAM_ERROR',
          contextSize: promptTokens,
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erreur de génération' })}\n\n`));
        controller.close();
      }
    },
  });
}
