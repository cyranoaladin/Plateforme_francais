/**
 * Barèmes officiels EAF alignés sur les échelles descriptives
 * Source : Échelles descriptives — Académie de Nantes
 *        + Note de Service n°2019-042 du 18-4-2019
 *
 * NOTE : L'introduction et la conclusion ne sont PAS des critères autonomes.
 * Ce qui est évalué : l'organisation du propos, le fil de l'argumentation.
 */

export type NiveauBareme = {
  level: 1 | 2 | 3 | 4;
  label: string;
  points: number;
};

export type CritereBareme = {
  id: string;
  label: string;
  points: number;
  description: string;
  niveaux: readonly NiveauBareme[];
};

export type Bareme = {
  exercice: string;
  total: number;
  source: string;
  criteres: readonly CritereBareme[];
};

export const BAREME_COMMENTAIRE_SERIE_GENERALE = {
  exercice: 'commentaire' as const,
  source: 'Échelles descriptives — Académie de Nantes',
  total: 20,
  criteres: [
    {
      id: 'comprehension_interpretation',
      label: 'Compréhension et interprétation du texte',
      points: 6,
      description: 'Aptitude à lire, analyser et interpréter. '
        + 'Compréhension du sens général et des nuances. '
        + 'Citations pertinentes et analysées.',
      niveaux: [
        { level: 1, label: 'Compréhension lacunaire ou fautive', points: 0 },
        { level: 2, label: 'Compréhension partielle', points: 2 },
        { level: 3, label: 'Compréhension de la globalité', points: 4 },
        { level: 4, label: 'Bonne compréhension, nuances saisies', points: 6 },
      ],
    },
    {
      id: 'construction_reflexion',
      label: 'Construction de la réflexion et projet de lecture',
      points: 6,
      description: 'Organisation du propos, fil de l\'argumentation, '
        + 'projet de lecture adapté au texte, progression cohérente, '
        + 'absence de paraphrase.',
      niveaux: [
        { level: 1, label: 'Absence de projet de lecture, paraphrase', points: 0 },
        { level: 2, label: 'Projet de lecture mal adapté, ébauche d\'organisation', points: 2 },
        { level: 3, label: 'Organisation cohérente, étapes identifiées', points: 4 },
        { level: 4, label: 'Réflexion organisée, progression vers une réponse', points: 6 },
      ],
    },
    {
      id: 'culture_litteraire',
      label: 'Mobilisation d\'une culture littéraire',
      points: 4,
      description: 'Vocabulaire d\'analyse, connaissances linguistiques, '
        + 'histoire littéraire, genres, objets d\'étude, '
        + 'mises au service de l\'interprétation.',
      niveaux: [
        { level: 1, label: 'Pas ou très peu de connaissances', points: 0 },
        { level: 2, label: 'Connaissances approximatives ou mal exploitées', points: 1 },
        { level: 3, label: 'Connaissances adaptées et correctement exploitées', points: 3 },
        { level: 4, label: 'Connaissances variées, mises au service du texte', points: 4 },
      ],
    },
    {
      id: 'maitrise_langue',
      label: 'Maîtrise de la langue et de l\'expression',
      points: 4,
      description: 'Correction orthographique et syntaxique, '
        + 'précision lexicale, lisibilité du devoir.',
      niveaux: [
        { level: 1, label: 'Incorrections nombreuses, clarté compromise', points: 0 },
        { level: 2, label: 'Maladresses qui altèrent la clarté', points: 1 },
        { level: 3, label: 'Expression correcte et compréhensible', points: 3 },
        { level: 4, label: 'Expression satisfaisante, précision lexicale', points: 4 },
      ],
    },
  ],
} as const;

export const BAREME_DISSERTATION = {
  exercice: 'dissertation' as const,
  source: 'Échelles descriptives — Académie de Nantes',
  total: 20,
  criteres: [
    {
      id: 'prise_en_compte_sujet',
      label: 'Prise en compte du sujet',
      points: 4,
      description: 'Compréhension de la portée du sujet et de ses enjeux.',
      niveaux: [
        { level: 1, label: 'Sujet non traité', points: 0 },
        { level: 2, label: 'Sujet partiellement traité', points: 1 },
        { level: 3, label: 'Sujet globalement traité', points: 3 },
        { level: 4, label: 'Sujet bien traité, portée saisie', points: 4 },
      ],
    },
    {
      id: 'construction_reflexion',
      label: 'Construction de la réflexion argumentative',
      points: 8,
      description: 'Fil de l\'argumentation, organisation du propos, '
        + 'pertinence et variété des arguments, progression vers une réponse.',
      niveaux: [
        { level: 1, label: 'Absence d\'arguments ou hors sujet', points: 0 },
        { level: 2, label: 'Quelques arguments peu pertinents', points: 2 },
        { level: 3, label: 'Arguments intéressants, organisation repérable', points: 5 },
        { level: 4, label: 'Stratégie argumentative maîtrisée, réponse claire', points: 8 },
      ],
    },
    {
      id: 'culture_litteraire',
      label: 'Mobilisation d\'une culture littéraire',
      points: 4,
      description: 'Références à l\'œuvre, au parcours associé, '
        + 'aux lectures personnelles. Richesse et pertinence.',
      niveaux: [
        { level: 1, label: 'Pas de référence à l\'œuvre', points: 0 },
        { level: 2, label: 'Références en nombre limité', points: 1 },
        { level: 3, label: 'Références pertinentes de l\'œuvre', points: 3 },
        { level: 4, label: 'Références riches et bien exploitées', points: 4 },
      ],
    },
    {
      id: 'maitrise_langue',
      label: 'Maîtrise de la langue et de l\'expression',
      points: 4,
      description: 'Correction de l\'expression, précision lexicale, lisibilité.',
      niveaux: [
        { level: 1, label: 'Langue incorrecte, intelligibilité compromise', points: 0 },
        { level: 2, label: 'Expression ponctuellement incorrecte', points: 1 },
        { level: 3, label: 'Expression correcte et lexique adapté', points: 3 },
        { level: 4, label: 'Expression satisfaisante, précision lexicale', points: 4 },
      ],
    },
  ],
} as const;

export const BAREME_GRAMMAIRE = {
  exercice: 'grammaire' as const,
  source: 'Note de Service n°2019-042 du 18-4-2019',
  total: 2,
  description: 'Analyse syntaxique uniquement. Pas d\'interprétation stylistique.',
  criteres: [
    {
      id: 'analyse_syntaxique',
      label: 'Analyse syntaxique',
      points: 2,
      niveaux: [
        { level: 1, label: 'Réponse absente ou erronée, pas de raisonnement', points: 0 },
        { level: 2, label: 'Réponse incomplète ou inexacte, raisonnement partiel', points: 1 },
        { level: 3, label: 'Réponse satisfaisante : identification + dénomination + fonction', points: 2 },
      ],
    },
  ],
} as const;

export const BAREMES = {
  commentaire_serie_generale: BAREME_COMMENTAIRE_SERIE_GENERALE,
  commentaire_serie_techno: BAREME_COMMENTAIRE_SERIE_GENERALE, // same structure
  dissertation: BAREME_DISSERTATION,
  grammaire: BAREME_GRAMMAIRE,
} as const;
