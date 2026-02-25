/**
 * Diagnosticien Agent — positionnement initial + plan 6 semaines.
 * Entrées : profil + auto-évaluation + échantillons optionnels.
 */

import { getRouterProvider } from "@/lib/llm/factory";
import { selectProvider } from "@/lib/llm/router";
import type { ProviderChatMessage } from "@/lib/llm/provider";
import { estimateTokens } from "@/lib/llm/token-estimate";
import {
  createDefaultSkillMap,
  updateSkillMap,
  saveStudyPlan,
  saveDiagnosticResult,
} from "@/lib/store/premium-store";
import { getOrRefreshPlan7Days } from "@/lib/agents/planner";
import type {
  AgentResponse,
  DiagnosticRequest,
  DiagnosticResult,
  SkillMap,
  StudyPlan,
  PlannedSession,
  SkillAxis,
} from "@/lib/types/premium";
import { randomUUID } from "crypto";
import { mcpClient } from "@/lib/mcp";

const SYSTEM_PROMPT = `Tu es Diagnosticien EAF voie générale. Tu positionnes l'élève sur 5 axes (écrit, oral, langue, œuvres, méthode) et tu proposes un plan d'action sur 6 semaines.

RÈGLES :
1. Tu ne rédiges JAMAIS à la place de l'élève.
2. Tu produis un plan actionnable avec objectifs mesurables.
3. Tu identifies les 3 priorités principales.
4. Tu adaptes le plan au mode de progression choisi par l'élève.
5. Tu ne fais AUCUNE inférence émotionnelle.

MODES DE PROGRESSION :
- difficulte : micro-tâches guidées, feedback très directif
- objectif_14_plus : exigences élevées, nuance, procédés, problématisation
- fort_desorganise : structure, plan, transitions, gestion du temps
- oral_prioritaire : entraînement oral intensif + simulation jury`;

/**
 * Run the diagnostic and generate skill map + study plan.
 */
export async function runDiagnostic(
  request: DiagnosticRequest
): Promise<AgentResponse> {
  const { studentId, progressionMode, selfAssessment, sampleWriting } = request;

  // ── Telemetry MCP (fire-and-forget, non-bloquant) ────────────────────────
  // Ces appels MCP enrichissent les données mais ne bloquent pas le flux métier.
  // Si le MCP server est indisponible, la réponse reste correcte via premium-store.
  void mcpClient.student.getProfile(studentId, "diagnosticien").catch(() => undefined);
  // Traçabilité: enregistre l'accès au profil dans les logs MCP.

  // 1. Create initial skill map from self-assessment
  let skillMap = createDefaultSkillMap(studentId);

  if (selfAssessment) {
    const updates = [
      {
        microSkillId: "ecrit_problematique",
        score: selfAssessment.ecrit / 20,
      },
      { microSkillId: "ecrit_plan", score: selfAssessment.ecrit / 20 },
      { microSkillId: "ecrit_citations", score: selfAssessment.ecrit / 20 },
      { microSkillId: "ecrit_expression", score: selfAssessment.ecrit / 20 },
      { microSkillId: "oral_lecture", score: selfAssessment.oral / 20 },
      { microSkillId: "oral_mouvements", score: selfAssessment.oral / 20 },
      { microSkillId: "oral_procedes", score: selfAssessment.oral / 20 },
      { microSkillId: "oral_entretien", score: selfAssessment.oral / 20 },
      {
        microSkillId: "langue_phrase_complexe",
        score: selfAssessment.langue / 20,
      },
      { microSkillId: "langue_relatives", score: selfAssessment.langue / 20 },
    ];
    skillMap = await updateSkillMap(studentId, updates);
  }

  // 2. Try LLM-powered analysis if sample writing is provided
  let llmAnalysis: string | null = null;
  let parsedAnalysis: { priorities?: string[]; risks?: string[] } | null = null;
  if (sampleWriting) {
    try {
      const messages: ProviderChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `PROFIL ÉLÈVE :
- Mode de progression : ${progressionMode}
- Auto-évaluation : Écrit ${selfAssessment?.ecrit ?? "?"}/20, Oral ${selfAssessment?.oral ?? "?"}/20, Langue ${selfAssessment?.langue ?? "?"}/20

ÉCHANTILLON D'ÉCRITURE :
${sampleWriting.slice(0, 2000)}

Analyse cet échantillon et propose :
1. Un diagnostic sur les 5 axes (écrit, oral, langue, œuvres, méthode) avec score estimé 0-1
2. Les 3 priorités principales
3. Un plan de 6 semaines adapté au mode "${progressionMode}"

Réponds en JSON :
{
  "scores": {"ecrit": 0.X, "oral": 0.X, "langue": 0.X, "oeuvres": 0.X, "methode": 0.X},
  "priorities": ["priorité 1", "priorité 2", "priorité 3"],
  "risks": ["risque 1", "risque 2"],
  "plan_summary": "résumé du plan"
}`,
        },
      ];

      const provider = getRouterProvider("diagnosticien", estimateTokens(messages));
      const llmResult = await provider.generateContent(messages, {
        temperature: 0.3,
        maxTokens: 1500,
        responseMimeType: "application/json",
      });
      llmAnalysis = llmResult.content ?? llmResult.text;

      // Try to parse and update skill map
      const jsonMatch = llmAnalysis?.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          scores: Record<string, number>;
          priorities: string[];
          risks: string[];
          plan_summary: string;
        };
        parsedAnalysis = parsed;

        if (parsed.scores) {
          const axisUpdates: Array<{
            microSkillId: string;
            score: number;
          }> = [];
          const axisMapping: Record<string, string[]> = {
            ecrit: [
              "ecrit_problematique",
              "ecrit_plan",
              "ecrit_citations",
              "ecrit_transitions",
              "ecrit_conclusion",
              "ecrit_expression",
            ],
            oral: [
              "oral_lecture",
              "oral_mouvements",
              "oral_procedes",
              "oral_grammaire",
              "oral_entretien",
            ],
            langue: [
              "langue_phrase_complexe",
              "langue_interrogation",
              "langue_negation",
              "langue_relatives",
              "langue_conjonctives",
              "langue_concordance",
              "langue_connecteurs",
            ],
            oeuvres: [
              "oeuvres_reperes",
              "oeuvres_themes",
              "oeuvres_citations",
              "oeuvres_comparaisons",
              "oeuvres_cursives",
            ],
            methode: [
              "methode_temps",
              "methode_brouillon",
              "methode_relecture",
              "methode_orthographe",
              "methode_strategie",
            ],
          };

          for (const [axis, score] of Object.entries(parsed.scores)) {
            const skills = axisMapping[axis];
            if (skills) {
              for (const skillId of skills) {
                axisUpdates.push({
                  microSkillId: skillId,
                  score: Math.max(0, Math.min(1, score)),
                });
              }
            }
          }

          if (axisUpdates.length > 0) {
            skillMap = await updateSkillMap(studentId, axisUpdates);
          }
        }
      }
    } catch {
      // LLM unavailable, continue with self-assessment based map
    }
  }

  // 3. Generate study plan (legacy 6-week + new 7-day adaptive)
  const studyPlan = generateStudyPlan(studentId, skillMap, progressionMode);
  await saveStudyPlan(studyPlan);

  // P0-4: Also generate 7-day adaptive plan
  const plan7Days = await getOrRefreshPlan7Days(studentId);

  // P0-1: Extract priorities and risks from LLM analysis
  let priorities: string[] = [
    "Renforcer les axes les plus faibles",
    "Consolider la méthodologie",
    "Pratiquer régulièrement",
  ];
  let risks: string[] = [];

  if (parsedAnalysis?.priorities && parsedAnalysis.priorities.length > 0) {
    priorities = parsedAnalysis.priorities;
  }
  if (parsedAnalysis?.risks) {
    risks = parsedAnalysis.risks;
  }

  // P0-1: Persist DiagnosticResult in DB
  const diagnosticResult: DiagnosticResult = {
    id: randomUUID(),
    studentId,
    completedAt: new Date().toISOString(),
    durationMinutes: 0, // Will be set by frontend
    input: {
      displayName: request.displayName,
      age: request.age,
      progressionMode: request.progressionMode,
      selfAssessment: request.selfAssessment,
      hasSampleWriting: !!request.sampleWriting,
      hasSampleOral: !!request.sampleOralTranscript,
    },
    skillMap,
    priorities,
    risks,
    studyPlanId: studyPlan.studentId,
    llmProvider: ((): DiagnosticResult["llmProvider"] => {
      const provider = selectProvider({ skill: "diagnosticien" }).providerName;
      if (
        provider === "ollama" ||
        provider === "openai" ||
        provider === "mock" ||
        provider === "mistral_reasoning" ||
        provider === "mistral_large" ||
        provider === "mistral_standard" ||
        provider === "mistral_micro" ||
        provider === "mistral_ocr"
      ) {
        return provider;
      }
      return "ollama";
    })(),
  };
  await saveDiagnosticResult(diagnosticResult);

  // Persistance MCP de l'évaluation diagnostique (non-bloquante).
  // Le diagnostic est déjà persisté localement via saveDiagnosticResult().
  void mcpClient.evaluation.saveEvaluation(
    {
      studentId,
      evaluationType: "diagnostic",
      score: Math.round(
        (selfAssessment?.ecrit ?? 10) +
          (selfAssessment?.oral ?? 10) +
          (selfAssessment?.langue ?? 10)
      ),
      maxScore: 60,
      details: [],
      triggerBadgeCheck: true,
    },
    studentId
  ).catch(() => undefined);

  // Déclenchement asynchrone du plan MCP (non-bloquant).
  // Le plan 7j est déjà généré via getOrRefreshPlan7Days().
  void mcpClient.planning.generatePlan(studentId, {
    forceRegenerate: true,
    constraints: { availableDaysThisWeek: 5, maxMinutesPerDay: 45 },
  }).catch(() => undefined);

  return {
    skill: "diagnosticien",
    status: "ok",
    data: {
      diagnosticResult,
      skillMap,
      studyPlan,
      plan7Days,
      priorities,
      risks,
    },
    citations: [],
    logs: [
      {
        skill: "diagnosticien",
        action: "diagnostic_complete",
        studentId,
        progressionMode,
        llmProvider: selectProvider({ skill: "diagnosticien" }).providerName,
        diagnosticResultId: diagnosticResult.id,
      },
    ],
  };
}

/**
 * Generate a 6-week study plan based on skill map and progression mode.
 */
function generateStudyPlan(
  studentId: string,
  skillMap: SkillMap,
  mode: string
): StudyPlan {
  const now = new Date().toISOString();
  const weakAxes = identifyWeakAxes(skillMap);

  const modeWeights: Record<string, Record<string, number>> = {
    difficulte: { ecrit: 3, oral: 2, langue: 3, oeuvres: 1, methode: 1 },
    objectif_14_plus: { ecrit: 3, oral: 3, langue: 2, oeuvres: 2, methode: 1 },
    fort_desorganise: { ecrit: 2, oral: 2, langue: 1, oeuvres: 1, methode: 4 },
    oral_prioritaire: { ecrit: 1, oral: 5, langue: 2, oeuvres: 1, methode: 1 },
  };

  const weights = modeWeights[mode] || modeWeights.objectif_14_plus;

  const weeks = [];
  for (let w = 1; w <= 6; w++) {
    const sessions: PlannedSession[] = [];

    // 3 sessions per week
    for (let d = 1; d <= 3; d++) {
      const sessionType = pickSessionType(w, d, weights, weakAxes);
      sessions.push({
        id: randomUUID(),
        week: w,
        day: d * 2 + 1, // Mon, Wed, Fri
        type: sessionType.type,
        durationMin: sessionType.duration,
        objectives: sessionType.objectives,
        resourceIds: [],
        completed: false,
      });
    }

    weeks.push({ week: w, sessions });
  }

  return {
    studentId,
    weeks,
    createdAt: now,
    updatedAt: now,
  };
}

function identifyWeakAxes(
  skillMap: SkillMap
): Array<{ axis: SkillAxis; avgScore: number }> {
  const results: Array<{ axis: SkillAxis; avgScore: number }> = [];

  for (const [axis, skills] of Object.entries(skillMap.axes)) {
    if (!skills || skills.length === 0) continue;
    const avg = skills.reduce((sum, s) => sum + s.score, 0) / skills.length;
    results.push({ axis: axis as SkillAxis, avgScore: avg });
  }

  return results.sort((a, b) => a.avgScore - b.avgScore);
}

function pickSessionType(
  week: number,
  dayIndex: number,
  weights: Record<string, number>,
  weakAxes: Array<{ axis: SkillAxis; avgScore: number }>
): {
  type: PlannedSession["type"];
  duration: number;
  objectives: string[];
} {
  const sessionTypes: Array<{
    type: PlannedSession["type"];
    axis: string;
    duration: number;
    objectives: string[];
  }> = [
    {
      type: "ecrit_commentaire",
      axis: "ecrit",
      duration: 25,
      objectives: [
        "Rédiger une introduction de commentaire",
        "Analyser un procédé d'écriture",
      ],
    },
    {
      type: "ecrit_dissertation",
      axis: "ecrit",
      duration: 25,
      objectives: [
        "Formuler une problématique",
        "Construire un plan en 3 parties",
      ],
    },
    {
      type: "oral_explication",
      axis: "oral",
      duration: 20,
      objectives: [
        "Identifier les mouvements du texte",
        "Analyser 3 procédés",
      ],
    },
    {
      type: "oral_entretien",
      axis: "oral",
      duration: 15,
      objectives: [
        "Préparer 5 citations clés",
        "S'entraîner aux relances",
      ],
    },
    {
      type: "grammaire",
      axis: "langue",
      duration: 15,
      objectives: [
        "Identifier nature et fonction",
        "Analyser une subordonnée",
      ],
    },
    {
      type: "revision_erreurs",
      axis: "methode",
      duration: 10,
      objectives: [
        "Revoir les erreurs de la semaine",
        "Exercices de consolidation",
      ],
    },
  ];

  // Weight-based selection
  const weighted = sessionTypes.map((st) => ({
    ...st,
    weight: weights[st.axis] || 1,
  }));

  // Boost weak axes
  for (const weak of weakAxes.slice(0, 2)) {
    for (const st of weighted) {
      if (st.axis === weak.axis) {
        st.weight *= 1.5;
      }
    }
  }

  // Deterministic selection based on week + day
  const index = (week * 3 + dayIndex) % weighted.length;
  const sorted = weighted.sort((a, b) => b.weight - a.weight);
  const selected = sorted[index % sorted.length];

  return {
    type: selected.type,
    duration: selected.duration,
    objectives: selected.objectives,
  };
}
