import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

function coerceStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => coerceStringArray(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .flatMap((item) => coerceStringArray(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function coerceCriterionFeedback(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  const sections: Array<[string, string[]]> = [
    ["Connaissance de l'œuvre", ['connaissance_de_l_oeuvre', 'connaissance', 'oeuvre']],
    ['Réactivité', ['reactivite', 'reponse_aux_relances', 'aisance_orale']],
    ['Culture littéraire', ['culture_litteraire', 'ouverture_culturelle', 'culture_generale']],
    ['Esprit critique', ['esprit_critique', 'avis_personnel', 'regard_critique']],
  ];

  const rendered = sections
    .map(([label, keys]) => {
      const sectionValue = keys
        .map((key) => record[key])
        .find((item) => typeof item === 'string' && item.trim().length > 0);

      return typeof sectionValue === 'string' && sectionValue.trim().length > 0
        ? `${label} : ${sectionValue.trim()}`
        : null;
    })
    .filter((item): item is string => item !== null);

  if (rendered.length > 0) {
    return rendered.join('\n\n');
  }

  return coerceStringArray(record).join('\n\n');
}

function sumNumericLeaves(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + sumNumericLeaves(item), 0);
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .reduce<number>((total, item) => total + sumNumericLeaves(item), 0);
  }

  return 0;
}

function coerceEntretienScore(value: unknown): number {
  const total = sumNumericLeaves(value);
  return Math.round(Math.max(0, Math.min(8, total)) * 10) / 10;
}

function coerceEntretienMax(): 8 {
  return 8;
}

function coerceOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const values = coerceStringArray(value);
  return values.length > 0 ? values[0] : undefined;
}

const schema = z.object({
  feedback: z.preprocess(coerceCriterionFeedback, z.string().min(1)),
  score: z.preprocess(coerceEntretienScore, z.number().min(0).max(8)),
  max: z.preprocess(coerceEntretienMax, z.literal(8)),
  points_forts: z.preprocess(coerceStringArray, z.array(z.string())),
  axes: z.preprocess(coerceStringArray, z.array(z.string())),
  relance: z.preprocess(coerceOptionalString, z.string().optional()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralEntretienOutput = z.infer<typeof schema>;

export const oralEntretienSkill: SkillConfig<OralEntretienOutput> = {
  prompt: `Rôle : Examinateur d'entretien EAF 2026 — tu simules un membre du jury oral du baccalauréat de Français.

CONTEXTE :
L'entretien dure environ 8 minutes et porte sur l'œuvre intégrale choisie par l'élève et son parcours associé. Tu évalues la capacité de l'élève à parler d'une œuvre avec recul, à argumenter ses choix de lecture et à mobiliser sa culture littéraire.

CRITÈRES DE NOTATION (8 pts) :
- CONNAISSANCE DE L'ŒUVRE (3 pts) : maîtrise de l'intrigue, des personnages, des thèmes majeurs, du contexte de création. L'élève parle-t-il de l'œuvre avec précision ou reste-t-il en surface ?
- RÉACTIVITÉ (2 pts) : réponses construites et argumentées, sans hésitation excessive, capacité à rebondir sur les relances.
- CULTURE LITTÉRAIRE (2 pts) : références à d'autres œuvres du parcours ou du programme, mise en perspective, intertextualité.
- ESPRIT CRITIQUE (1 pt) : point de vue personnel justifié, nuance, capacité à défendre une interprétation.

EXIGENCES DE QUALITÉ DU FEEDBACK :
1. Feedback de 200-350 mots, structuré par critère
2. Citer des passages PRÉCIS des réponses de l'élève entre guillemets
3. Minimum 3 points forts ancrés dans la prestation
4. Minimum 3 axes d'amélioration ACTIONNABLES
5. Proposer TOUJOURS une question de relance pertinente adaptée au niveau montré
6. Si des sources RAG sont disponibles (rapports de jury, attendus officiels), les citer

STRATÉGIE DE RELANCE :
- Réponse banale → relance exigeante : « Vous dites que Phèdre est "passionnée", mais en quoi sa passion diffère-t-elle de celle d'un personnage de roman ? »
- Réponse riche → valider et approfondir : « Vous mentionnez la "fatalité tragique" — comment Racine la met-il en scène concrètement dans cette scène ? »
- Réponse hors sujet → recentrer : « Intéressant, mais revenons au parcours : en quoi cet aspect éclaire-t-il le thème "passion et tragédie" ? »

ANTI-TRICHE : Jamais de réponse à la place de l'élève. Questions ouvertes uniquement.

FORMAT DE SORTIE (JSON strict) :
{ "feedback": "200-350 mots structuré par critère", "score": 0-8, "max": 8, "points_forts": ["ancré 1", "ancré 2", "ancré 3"], "axes": ["actionnable 1", "actionnable 2", "actionnable 3"], "relance": "question de suivi adaptée au niveau" }`,
  outputSchema: schema as z.ZodType<OralEntretienOutput>,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 8,
    points_forts: [],
    axes: ['Approfondir la connaissance des œuvres du parcours.'],
  },
};
