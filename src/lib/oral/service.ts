import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';
import { getRouterProvider } from '@/lib/llm/factory';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { logger } from '@/lib/logger';
import type { OralSessionState } from '@/lib/oral/repository';

export type OralSessionResult = {
  note: number;
  mention: string;
  phases: {
    lecture: { note: number; commentaire: string };
    explication: { note: number; commentaire: string };
    entretien: { note: number; commentaire: string };
  };
  bilan_global: string;
  conseil_final: string;
};

export function pickOralExtrait(oeuvre: string): {
  texte: string;
  questionGrammaire: string;
} {
  const candidates = EXTRAITS_OEUVRES.filter((item) =>
    item.oeuvre.toLowerCase().includes(oeuvre.toLowerCase()),
  );

  const pool = candidates.length > 0 ? candidates : EXTRAITS_OEUVRES;
  const index = Math.floor(Math.random() * pool.length);
  const choice = pool[index] ?? pool[0];

  return {
    texte: choice?.extrait ?? 'Aucun extrait disponible.',
    questionGrammaire: choice?.questionGrammaire ?? 'Analysez la syntaxe de la phrase.',
  };
}

/**
 * Génère le bilan final structuré d'une session orale via LLM tier-2.
 */
export async function generateOralBilan(session: OralSessionState): Promise<OralSessionResult> {
  const historyJson = JSON.stringify(session.interactions, null, 2);
  const messages: ProviderChatMessage[] = [
    {
      role: 'system',
      content: `Tu es examinateur EAF. À partir de l'historique de la simulation orale, génère une évaluation complète en JSON :
{
  "note": <0-20>,
  "mention": <"Très bien"|"Bien"|"Assez bien"|"Passable"|"Insuffisant">,
  "phases": {
    "lecture": { "note": <0-6>, "commentaire": <string> },
    "explication": { "note": <0-8>, "commentaire": <string> },
    "entretien": { "note": <0-6>, "commentaire": <string> }
  },
  "bilan_global": <string>,
  "conseil_final": <string>
}
Réponds UNIQUEMENT en JSON valide.`,
    },
    {
      role: 'user',
      content: `Historique de la session :\n${historyJson}\n\nŒuvre : ${session.oeuvre}`,
    },
  ];

  try {
    const provider = getRouterProvider('coach_oral', estimateTokens(messages));
    const response = await provider.generateContent(messages, {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxTokens: 800,
    });

    const raw = (response.content ?? response.text ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as OralSessionResult;
    }
  } catch (error) {
    logger.warn({ error, sessionId: session.id }, 'oral.generateBilan.failed');
  }

  // Fallback basé sur les scores accumulés
  const totalScore = session.interactions.reduce((s, i) => s + i.feedback.score, 0);
  const totalMax = session.interactions.reduce((s, i) => s + i.feedback.max, 0);
  const note = totalMax > 0 ? Number(((totalScore / totalMax) * 20).toFixed(1)) : 10;

  return {
    note,
    mention: note >= 16 ? 'Très bien' : note >= 14 ? 'Bien' : note >= 12 ? 'Assez bien' : note >= 10 ? 'Passable' : 'Insuffisant',
    phases: {
      lecture: { note: 3, commentaire: 'Évaluation automatique.' },
      explication: { note: 4, commentaire: 'Évaluation automatique.' },
      entretien: { note: 3, commentaire: 'Évaluation automatique.' },
    },
    bilan_global: 'Session complétée.',
    conseil_final: 'Continuez à pratiquer régulièrement.',
  };
}
