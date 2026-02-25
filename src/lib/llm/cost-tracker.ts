import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const PRICING_CENTS_PER_MILLION: Record<string, {
  input: number;
  output: number;
  description: string;
}> = {
  'magistral-medium-latest': { input: 200, output: 600, description: 'Raisonnement EAF' },
  'magistral-medium-2509': { input: 200, output: 600, description: 'Raisonnement EAF' },
  'mistral-large-latest': { input: 200, output: 600, description: 'Long contexte' },
  'mistral-large-2512': { input: 200, output: 600, description: 'Long contexte' },
  'mistral-small-latest': { input: 10, output: 30, description: 'Standard interactif' },
  'mistral-small-2506': { input: 10, output: 30, description: 'Standard interactif' },
  'ministral-8b-latest': { input: 10, output: 10, description: 'Micro volumétrique' },
  'ministral-8b-2512': { input: 10, output: 10, description: 'Micro volumétrique' },
  'mistral-ocr-latest': { input: 100, output: 100, description: 'OCR copies' },
  'mistral-ocr-2512': { input: 100, output: 100, description: 'OCR copies' },
  'mistral-embed': { input: 10, output: 0, description: 'Embeddings RAG' },
  'mistral-embed-2312': { input: 10, output: 0, description: 'Embeddings RAG' },
  ollama: { input: 0, output: 0, description: 'Local gratuit' },
};

export const COST_BENCHMARKS_CENTS = {
  correctionCopie: 25,
  diagnosticInitial: 15,
  rapportHebdo: 8,
  messageTuteur: 0.3,
  quizAdaptatif: 0.5,
  ocrCopie: 5,
  totalMensuelEleve: 22,
} as const;

type TrackParams = {
  userId?: string;
  skill: string;
  provider: string;
  model: string;
  tier: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  contextSize?: number;
};

let callCount = 0;

function trackingEnabled() {
  return process.env.LLM_COST_TRACKING === 'true';
}

function pricingForModel(model: string) {
  return PRICING_CENTS_PER_MILLION[model] ?? PRICING_CENTS_PER_MILLION.ollama;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = pricingForModel(model);
  const input = (inputTokens * pricing.input) / 1_000_000;
  const output = (outputTokens * pricing.output) / 1_000_000;
  return input + output;
}

export async function trackLlmCall(params: TrackParams): Promise<void> {
  if (!trackingEnabled()) return;

  const cost = calculateCost(params.model, params.inputTokens, params.outputTokens);
  const costEurCents = Math.round(cost);

  if (costEurCents > 50) {
    logger.warn({ skill: params.skill, model: params.model, costEurCents }, 'llm.cost.anomaly');
  }

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "LlmCostLog"
        ("userId","skill","provider","model","tier","inputTokens","outputTokens","costEurCents","latencyMs","success","errorCode","contextSize","createdAt")
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
      params.userId ?? null,
      params.skill,
      params.provider,
      params.model,
      params.tier,
      params.inputTokens,
      params.outputTokens,
      costEurCents,
      params.latencyMs,
      params.success,
      params.errorCode ?? null,
      params.contextSize ?? null,
    );
  } catch (error) {
    logger.warn(
      { error, skill: params.skill, provider: params.provider, model: params.model },
      'llm.cost_tracking.db_error',
    );
    return;
  }

  callCount += 1;
  if (callCount % 100 === 0) {
    void checkBudgetAlerts().catch(() => undefined);
  }
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function startOfUtcMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function checkBudgetAlerts(): Promise<void> {
  if (!trackingEnabled()) return;

  const dailyThreshold = Math.round((Number.parseFloat(process.env.MISTRAL_DAILY_BUDGET_EUR ?? '5') || 5) * 100);
  const monthlyThreshold = Math.round((Number.parseFloat(process.env.MISTRAL_MONTHLY_BUDGET_EUR ?? '50') || 50) * 100);

  let dayTotal = 0;
  let monthTotal = 0;

  try {
    const [dayRows, monthRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ total: number | null }>>(
        `SELECT COALESCE(SUM("costEurCents"), 0) AS total FROM "LlmCostLog" WHERE "createdAt" >= $1`,
        startOfUtcDay(),
      ),
      prisma.$queryRawUnsafe<Array<{ total: number | null }>>(
        `SELECT COALESCE(SUM("costEurCents"), 0) AS total FROM "LlmCostLog" WHERE "createdAt" >= $1`,
        startOfUtcMonth(),
      ),
    ]);
    dayTotal = Number(dayRows[0]?.total ?? 0);
    monthTotal = Number(monthRows[0]?.total ?? 0);
  } catch (error) {
    logger.warn({ error }, 'llm.budget.query_error');
    return;
  }

  if (dayTotal > dailyThreshold) {
    logger.warn({ dayTotal, dailyThreshold }, 'llm.budget.daily_exceeded');
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LlmBudgetAlert" ("period","totalEurCents","threshold","alertedAt")
         VALUES ('daily',$1,$2,NOW())`,
        dayTotal,
        dailyThreshold,
      );
    } catch (error) {
      logger.warn({ error }, 'llm.budget.daily_alert_insert_error');
    }
  }

  if (monthTotal > monthlyThreshold) {
    logger.error({ monthTotal, monthlyThreshold }, 'llm.budget.monthly_exceeded');
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "LlmBudgetAlert" ("period","totalEurCents","threshold","alertedAt")
         VALUES ('monthly',$1,$2,NOW())`,
        monthTotal,
        monthlyThreshold,
      );
    } catch (error) {
      logger.warn({ error }, 'llm.budget.monthly_alert_insert_error');
    }
  }
}

export async function getLlmCostReport(params?: {
  userId?: string;
  days?: number;
  groupBy?: 'skill' | 'model' | 'tier' | 'day';
}): Promise<{
  totalEurCents: number;
  totalEur: number;
  byModel: Record<string, { inputTokens: number; outputTokens: number; costEurCents: number }>;
  bySkill: Record<string, { calls: number; costEurCents: number; avgLatencyMs: number }>;
  byTier: Record<string, { calls: number; costEurCents: number }>;
  avgCostPerActiveStudent: number;
  topCostSkills: Array<{ skill: string; costEurCents: number; pct: number }>;
}> {
  const days = params?.days ?? 30;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      userId: string | null;
      skill: string;
      model: string;
      tier: string;
      inputTokens: number;
      outputTokens: number;
      costEurCents: number;
      latencyMs: number;
    }>
  >(
    `SELECT "userId","skill","model","tier","inputTokens","outputTokens","costEurCents","latencyMs"
     FROM "LlmCostLog"
     WHERE "createdAt" >= $1
       AND ($2::text IS NULL OR "userId" = $2::text)`,
    start,
    params?.userId ?? null,
  );

  const byModel: Record<string, { inputTokens: number; outputTokens: number; costEurCents: number }> = {};
  const bySkill: Record<string, { calls: number; costEurCents: number; avgLatencyMs: number }> = {};
  const byTier: Record<string, { calls: number; costEurCents: number }> = {};
  const skillLatencySum = new Map<string, number>();
  const activeStudents = new Set<string>();
  let totalEurCents = 0;

  for (const row of rows) {
    totalEurCents += row.costEurCents;
    if (row.userId) activeStudents.add(row.userId);

    byModel[row.model] ??= { inputTokens: 0, outputTokens: 0, costEurCents: 0 };
    byModel[row.model].inputTokens += row.inputTokens;
    byModel[row.model].outputTokens += row.outputTokens;
    byModel[row.model].costEurCents += row.costEurCents;

    bySkill[row.skill] ??= { calls: 0, costEurCents: 0, avgLatencyMs: 0 };
    bySkill[row.skill].calls += 1;
    bySkill[row.skill].costEurCents += row.costEurCents;
    skillLatencySum.set(row.skill, (skillLatencySum.get(row.skill) ?? 0) + row.latencyMs);

    byTier[row.tier] ??= { calls: 0, costEurCents: 0 };
    byTier[row.tier].calls += 1;
    byTier[row.tier].costEurCents += row.costEurCents;
  }

  for (const [skill, agg] of Object.entries(bySkill)) {
    const totalLatency = skillLatencySum.get(skill) ?? 0;
    agg.avgLatencyMs = agg.calls > 0 ? Math.round(totalLatency / agg.calls) : 0;
  }

  const topCostSkills = Object.entries(bySkill)
    .map(([skill, value]) => ({
      skill,
      costEurCents: value.costEurCents,
      pct: totalEurCents > 0 ? Math.round((value.costEurCents / totalEurCents) * 100) : 0,
    }))
    .sort((a, b) => b.costEurCents - a.costEurCents)
    .slice(0, 10);

  return {
    totalEurCents,
    totalEur: Number((totalEurCents / 100).toFixed(2)),
    byModel,
    bySkill,
    byTier,
    avgCostPerActiveStudent:
      activeStudents.size > 0 ? Number((totalEurCents / activeStudents.size / 100).toFixed(2)) : 0,
    topCostSkills,
  };
}

export async function getTodayCostCents(): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ total: number | null }>>(
    `SELECT COALESCE(SUM("costEurCents"), 0) AS total
     FROM "LlmCostLog"
     WHERE "createdAt" >= $1`,
    startOfUtcDay(),
  );
  return Number(rows[0]?.total ?? 0);
}
