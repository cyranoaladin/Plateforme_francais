import { toCitations } from '@/lib/rag/citations';
import {
  formatRagContextForPrompt,
  searchOfficialReferences,
} from '@/lib/rag/search';
import type { OralPhaseKey } from '@/lib/oral/scoring';

export type OralRagContext = {
  promptContext: string;
  citations: ReturnType<typeof toCitations>;
};

export async function buildOralRagContext(input: {
  phase: OralPhaseKey | 'JURY';
  oeuvre?: string | null;
  oeuvreChoisie?: string | null;
  transcript?: string;
  questionGrammaire?: string;
}): Promise<OralRagContext> {
  const targetOeuvre = input.oeuvreChoisie ?? input.oeuvre ?? undefined;
  const query = [
    input.phase === 'JURY' ? 'Relance examinateur EAF' : `Evaluation orale EAF phase ${input.phase}`,
    targetOeuvre ? `Oeuvre: ${targetOeuvre}` : '',
    input.questionGrammaire ? `Question de grammaire: ${input.questionGrammaire}` : '',
    input.transcript ? `Reponse eleve: ${input.transcript}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const results = await searchOfficialReferences(query, 3, {
      oeuvre: targetOeuvre,
    });

    return {
      promptContext: formatRagContextForPrompt(results),
      citations: toCitations(results),
    };
  } catch {
    return {
      promptContext: '',
      citations: [],
    };
  }
}
