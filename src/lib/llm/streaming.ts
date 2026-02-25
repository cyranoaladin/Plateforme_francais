import { selectProvider } from '@/lib/llm/router';
import type { ProviderChatMessage, GenerateContentOptions } from '@/lib/llm/provider';
import { MistralProvider } from '@/lib/llm/adapters/mistral';
import { OllamaProvider } from '@/lib/llm/adapters/ollama';

export function createLlmStream(params: {
  skill: string;
  messages: ProviderChatMessage[];
  options?: GenerateContentOptions;
  userId?: string;
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
      try {
        const provider = selectedInfo.provider;
        if ('generateStream' in provider && typeof provider.generateStream === 'function') {
          const stream = await (provider as MistralProvider | OllamaProvider).generateStream(
            params.messages,
            params.options,
          );

          if (stream && typeof stream === 'object' && Symbol.asyncIterator in stream) {
            for await (const chunk of stream as AsyncGenerator<string>) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
            }
          } else {
            const reader = (stream as ReadableStream<string>).getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: value })}\n\n`));
            }
          }
        } else {
          const result = await provider.generateContent(params.messages, params.options);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: result.content ?? result.text })}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erreur de génération' })}\n\n`));
        controller.close();
      }
    },
  });
}
