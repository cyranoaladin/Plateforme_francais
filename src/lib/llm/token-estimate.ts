import type { ProviderChatMessage } from '@/lib/llm/provider'

export function estimateTokens(messages: Array<Pick<ProviderChatMessage, 'content'>>): number {
  return messages.reduce((sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4), 0)
}
