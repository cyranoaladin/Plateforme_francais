import { orchestrate } from '@/lib/llm/orchestrator';
import { type CorrectionJson, type EpreuveType } from '@/lib/epreuves/types';

function baremeParType(typeEpreuve: EpreuveType): Array<{ titre: string; max: number }> {
  if (typeEpreuve === 'dissertation') {
    return [
      { titre: 'Problématisation', max: 4 },
      { titre: 'Argumentation', max: 8 },
      { titre: 'Exemples', max: 4 },
      { titre: 'Expression', max: 4 },
    ];
  }

  return [
    { titre: 'Compréhension du texte', max: 4 },
    { titre: 'Analyse littéraire', max: 8 },
    { titre: 'Expression écrite', max: 4 },
    { titre: 'Organisation', max: 4 },
  ];
}

export async function corrigerCopie(input: {
  texteOCR: string;
  sujet: string;
  typeEpreuve: EpreuveType;
  userId: string;
}): Promise<CorrectionJson> {
  const rubriques = baremeParType(input.typeEpreuve)
    .map((item) => `- ${item.titre} (${item.max})`)
    .join('\n');

  const result = await orchestrate({
    skill: 'correcteur',
    userId: input.userId,
    userQuery: `Sujet: ${input.sujet}\n\nCopie OCR:\n${input.texteOCR}`,
    context: `Type d'épreuve: ${input.typeEpreuve}.\nRubriques officielles:\n${rubriques}`,
  });

  return result.output as CorrectionJson;
}
