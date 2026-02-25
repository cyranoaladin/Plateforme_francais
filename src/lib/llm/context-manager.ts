import type { ProviderChatMessage } from '@/lib/llm/provider';
type RoutingTier = 'reasoning' | 'large' | 'standard' | 'micro' | 'ocr' | 'local';
import { estimateTokens } from '@/lib/llm/token-estimate';

type RagChunk = { content: string; score: number; authorityLevel: string };

const CONTEXT_LIMITS = {
  reasoning: {
    maxInputTokens: 32_000,
    maxRagChunks: 8,
    maxRagTokensPerChunk: 500,
    maxConversationTurns: 10,
  },
  large: {
    maxInputTokens: 60_000,
    maxRagChunks: 12,
    maxRagTokensPerChunk: 500,
    maxConversationTurns: 12,
  },
  standard: {
    maxInputTokens: 16_000,
    maxRagChunks: 5,
    maxRagTokensPerChunk: 400,
    maxConversationTurns: 6,
  },
  micro: {
    maxInputTokens: 4_000,
    maxRagChunks: 3,
    maxRagTokensPerChunk: 300,
    maxConversationTurns: 4,
  },
  ocr: {
    maxInputTokens: 4_000,
    maxRagChunks: 0,
    maxRagTokensPerChunk: 0,
    maxConversationTurns: 2,
  },
  local: {
    maxInputTokens: 4_000,
    maxRagChunks: 3,
    maxRagTokensPerChunk: 300,
    maxConversationTurns: 4,
  },
} as const;

function authorityBonus(level: string): number {
  const normalized = level.trim().toUpperCase();
  if (normalized === 'A') return 0.3;
  if (normalized === 'B') return 0.2;
  if (normalized === 'C') return 0.1;
  return 0;
}

function truncateByTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

export function buildOptimizedContext(params: {
  systemPrompt: string;
  userMessage: string;
  ragChunks: RagChunk[];
  conversationHistory: ProviderChatMessage[];
  tier: RoutingTier;
}): ProviderChatMessage[] {
  const limits = CONTEXT_LIMITS[params.tier];
  const baseMessages: ProviderChatMessage[] = [
    { role: 'system', content: params.systemPrompt },
    { role: 'user', content: params.userMessage },
  ];

  const baseTokens = estimateTokens(baseMessages);
  const tokenBudget = Math.max(0, limits.maxInputTokens - baseTokens);

  const sortedChunks = [...params.ragChunks].sort(
    (a, b) => (b.score + authorityBonus(b.authorityLevel)) - (a.score + authorityBonus(a.authorityLevel)),
  );

  let ragTokens = 0;
  const selectedChunks: RagChunk[] = [];
  for (const chunk of sortedChunks) {
    if (selectedChunks.length >= limits.maxRagChunks) break;
    const truncated = truncateByTokens(chunk.content, limits.maxRagTokensPerChunk);
    const chunkTokens = Math.ceil(truncated.length / 4);
    if (ragTokens + chunkTokens > tokenBudget) continue;
    ragTokens += chunkTokens;
    selectedChunks.push({ ...chunk, content: truncated });
  }

  const contextMessage: ProviderChatMessage | null = selectedChunks.length
    ? {
        role: 'system',
        content: `Contexte RAG:\n${selectedChunks
          .map((chunk, index) => `[${index + 1}|${chunk.authorityLevel}] ${chunk.content}`)
          .join('\n\n')}`,
      }
    : null;

  const remainingTokens = Math.max(0, tokenBudget - ragTokens);
  const turns = params.conversationHistory;
  const head = turns.length > 0 ? [turns[0]] : [];
  const tailCount = Math.max(0, limits.maxConversationTurns - head.length);
  const tail = tailCount > 0 ? turns.slice(-tailCount) : [];
  const history = [...head, ...tail].filter((item, index, arr) => arr.findIndex((x) => x === item) === index);

  const selectedHistory: ProviderChatMessage[] = [];
  let historyTokens = 0;
  for (const message of history) {
    const messageTokens = Math.ceil(message.content.length / 4);
    if (historyTokens + messageTokens > remainingTokens) break;
    selectedHistory.push(message);
    historyTokens += messageTokens;
  }

  return [
    baseMessages[0],
    ...(contextMessage ? [contextMessage] : []),
    ...selectedHistory,
    baseMessages[1],
  ];
}

export { CONTEXT_LIMITS };
