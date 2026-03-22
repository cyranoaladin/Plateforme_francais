import { randomUUID } from 'crypto';
import { getRouterProvider } from '@/lib/llm/factory';
import { logger } from '@/lib/logger';
import { getDueErrorBankItems, recordRevisionAttempt } from '@/lib/store/premium-store';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { estimateTokens } from '@/lib/llm/token-estimate';
import { mcpClient } from '@/lib/mcp';

export type RappelExercise = {
  id: string;
  errorId: string;
  prompt: string;
  expected: string;
};

export async function generateDueRevisionExercise(studentId: string): Promise<{
  dueCount: number;
  exercise: RappelExercise | null;
}> {
  let due = await getDueErrorBankItems(studentId);
  try {
    const mcpResult = await mcpClient.student.getErrorBank(studentId, 'rappel-agent') as {
      dueToday?: Array<{
        id: string;
        errorType: string;
        errorContext: string;
        revisionCount?: number;
        severity?: string;
      }>;
      totalActive?: number;
    };
    const dueToday = mcpResult?.dueToday;
    if (Array.isArray(dueToday) && dueToday.length > 0) {
      due = dueToday.map((item) => ({
        id: item.id,
        errorType: item.errorType,
        example: item.errorContext,
        correction: '',
        resolved: false,
      })) as typeof due;
    }
  } catch {
    // keep local fallback
  }
  if (due.length === 0) {
    return { dueCount: 0, exercise: null };
  }

  const first = due[0];
  const fallback = {
    prompt: `Réécris et corrige ce point: ${first.example}`,
    expected: first.correction,
  };

  try {
    const prompt = `Tu es un professeur de Français EAF 2026. Crée un micro-exercice de révision ciblé (2-3 minutes) pour corriger une erreur récurrente de l'élève.

ERREUR IDENTIFIÉE : ${first.errorType}
EXEMPLE DANS LA COPIE : "${first.example}"
CORRECTION ATTENDUE : "${first.correction}"

EXIGENCES :
- Le "prompt" doit être un exercice concret et court (1-3 phrases) que l'élève peut résoudre en 2 minutes
- L'exercice doit cibler EXACTEMENT l'erreur identifiée (pas un exercice générique)
- Le "expected" doit être la réponse correcte attendue (1-3 phrases)
- Si l'erreur porte sur un procédé stylistique → demander d'identifier le procédé dans un extrait
- Si l'erreur porte sur la méthode → demander de reformuler un passage selon la méthode correcte
- Si l'erreur porte sur la langue → proposer une phrase à corriger

Format JSON strict : {"prompt":"exercice ciblé","expected":"réponse attendue"}`;
    const messages: ProviderChatMessage[] = [{ role: 'user', content: prompt }];
    const provider = await getRouterProvider('rappel_agent', estimateTokens(messages));
    const completion = await provider.generateContent(messages, {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxTokens: 300,
    });

    const raw = completion.text.trim();
    const json = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as { prompt?: string; expected?: string };
    return {
      dueCount: due.length,
      exercise: {
        id: randomUUID(),
        errorId: first.id,
        prompt: parsed.prompt?.trim() || fallback.prompt,
        expected: parsed.expected?.trim() || fallback.expected,
      },
    };
  } catch (error) {
    logger.warn({ error, studentId, route: 'rappel_agent' }, 'rappel_agent.fallback');
    return {
      dueCount: due.length,
      exercise: {
        id: randomUUID(),
        errorId: first.id,
        prompt: fallback.prompt,
        expected: fallback.expected,
      },
    };
  }
}

export async function finalizeRevisionExercise(input: {
  errorId: string;
  studentId?: string;
  taskId?: string;
  success: boolean;
  notes?: string;
}) {
  const phase = input.success ? 'j7' : 'j2';
  await recordRevisionAttempt(input.errorId, {
    date: new Date().toISOString(),
    phase,
    success: input.success,
    notes: input.notes,
  });

  if (input.studentId && input.taskId) {
    void mcpClient.planning.markTaskComplete({
      taskId: input.taskId,
      studentId: input.studentId,
      completedAt: new Date().toISOString(),
    }, input.studentId).catch(() => undefined);
  }
}
