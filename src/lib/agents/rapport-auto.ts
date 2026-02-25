import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { logger } from '@/lib/logger';
import {
  getErrorBankItems,
  getOrCreateSkillMap,
  getPlan7Days,
  getLatestWeeklyReport,
  saveWeeklyReport,
} from '@/lib/store/premium-store';
import type { SkillAxis, WeeklyReport } from '@/lib/types/premium';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { mcpClient } from '@/lib/mcp';

const RapportAutoPayloadSchema = z.object({
  prediction: z.string().min(1).max(1600),
  nextWeekFocus: z.array(z.string().min(1)).min(1).max(5),
});

function weekLabel(date = new Date()): string {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (value: Date) =>
    value.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `Semaine du ${format(monday)} au ${format(sunday)}`;
}

function axisDelta(current: number, previous: number): number {
  return Number((current - previous).toFixed(2));
}

async function generateNarrative(input: {
  userId: string;
  adherenceRate: number;
  topErrors: string[];
}): Promise<{ prediction: string; nextWeekFocus: string[] }> {
  const prompt = `Tu es l'agent rapport_auto.
Contrainte: pas d'inférence émotionnelle, pas de score psychologique.
Retourne JSON:
{"prediction":"...","nextWeekFocus":["...", "..."]}
Contexte:
- adherenceRate: ${Math.round(input.adherenceRate * 100)}%
- erreurs récurrentes: ${input.topErrors.join(', ') || 'aucune'}`;
  const messages: ProviderChatMessage[] = [{ role: 'user', content: prompt }];
  const provider = getRouterProvider('rapport_auto', estimateTokens(messages));

  try {
    const response = await provider.generateContent(messages, {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxTokens: 700,
    });
    const raw = response.text.trim();
    const json = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    return RapportAutoPayloadSchema.parse(JSON.parse(json));
  } catch (error) {
    logger.warn({ error, userId: input.userId, route: 'rapport_auto' }, 'rapport_auto.fallback');
    return {
      prediction:
        "La dynamique de progression reste stable. Le maintien d'un rythme de sessions courtes et régulières améliore la consolidation.",
      nextWeekFocus: [
        'Renforcer la précision des procédés littéraires',
        'Structurer les introductions et conclusions',
      ],
    };
  }
}

export async function generateWeeklyReport(studentId: string): Promise<WeeklyReport> {
  const [skillMap, previousReport, errors, plan] = await Promise.all([
    getOrCreateSkillMap(studentId),
    getLatestWeeklyReport(studentId),
    getErrorBankItems(studentId),
    getPlan7Days(studentId),
  ]);

  let mcpWeeklyStats: { sessionsPlanned?: number; sessionsCompleted?: number; adherenceRate?: number } | null = null;
  try {
    const stats = await mcpClient.analytics.getWeeklyStats(studentId, -1) as {
      sessionsPlanned?: number;
      sessionsCompleted?: number;
      adherenceRate?: number;
    };
    mcpWeeklyStats = stats;
    void mcpClient.analytics.getSkillDelta(
      studentId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    ).catch(() => undefined);
    void mcpClient.student.getErrorBank(studentId, 'rapport-auto').catch(() => undefined);
  } catch {
    mcpWeeklyStats = null;
  }

  const axes = Object.entries(skillMap.axes) as Array<[SkillAxis, typeof skillMap.axes[SkillAxis]]>;
  const skillMapDelta = axes.map(([axis, skills]) => {
    const current = skills.length ? skills.reduce((sum, item) => sum + item.score, 0) / skills.length : 0;
    const previousAxis = previousReport?.skillMapDelta.find((item) => item.axis === axis);
    return {
      axis,
      current: Number(current.toFixed(2)),
      delta: axisDelta(current, previousAxis?.current ?? current),
    };
  });

  const planSlots = plan?.slots ?? [];
  const planned = mcpWeeklyStats?.sessionsPlanned ?? planSlots.length;
  const completed = mcpWeeklyStats?.sessionsCompleted ?? planSlots.filter((slot) => slot.completed).length;
  const adherenceRate = mcpWeeklyStats?.adherenceRate ?? (planned > 0 ? completed / planned : 0);

  const unresolved = errors.filter((item) => !item.resolved);
  const topErrors = unresolved.slice(0, 5).map((item) => ({
    errorType: item.errorType,
    context: item.example.slice(0, 160),
  }));

  const narrative = await generateNarrative({
    userId: studentId,
    adherenceRate,
    topErrors: topErrors.map((item) => item.errorType),
  });

  const report: WeeklyReport = {
    id: randomUUID(),
    studentId,
    weekLabel: weekLabel(),
    generatedAt: new Date().toISOString(),
    skillMapDelta,
    sessionsStats: {
      planned,
      completed,
      adherenceRate: Number(adherenceRate.toFixed(2)),
    },
    topErrors,
    prediction: narrative.prediction,
    nextWeekFocus: narrative.nextWeekFocus,
    pdfUrl: `/api/v1/rapport/${studentId}/pdf/latest`,
  };

  await saveWeeklyReport(report);
  return report;
}
