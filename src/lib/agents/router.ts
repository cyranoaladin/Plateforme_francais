/**
 * Router Agent — classifies user intent to dispatch to the correct agent.
 * Categories: methode, entrainement, correction, oeuvre, langue, administratif
 */

import { type Skill } from '@/lib/llm/skills/types';

export type IntentCategory =
  | "methode"
  | "entrainement_ecrit"
  | "entrainement_oral"
  | "correction"
  | "oeuvre"
  | "langue"
  | "bibliotheque"
  | "administratif"
  | "diagnostic"
  | "unknown";

const INTENT_KEYWORDS: Record<IntentCategory, string[]> = {
  methode: [
    "méthode", "methode", "comment faire", "plan", "brouillon",
    "introduction", "conclusion", "transition", "problématique",
    "stratégie", "conseil", "astuce", "technique",
  ],
  entrainement_ecrit: [
    "commentaire", "dissertation", "rédiger", "écrire", "écrit",
    "sujet", "analyse", "rédaction",
  ],
  entrainement_oral: [
    "oral", "lecture", "explication linéaire", "entretien",
    "simulation", "passage", "jury", "présentation",
  ],
  correction: [
    "corriger", "correction", "évaluer", "noter", "feedback",
    "améliorer", "relire", "vérifier",
  ],
  oeuvre: [
    "rimbaud", "baudelaire", "verlaine", "apollinaire", "prévert", "ponge",
    "dorion", "hugo", "lamartine", "vigny", "musset", "de vigny",
    "molière", "corneille", "racine", "marivaux", "beaumarchais", "ionesco",
    "sarraute", "duras", "beckett", "anouilh", "claudel",
    "montaigne", "rabelais", "la bruyère", "la fontaine", "voltaire", "rousseau",
    "diderot", "montesquieu", "bossuet",
    "balzac", "stendhal", "flaubert", "zola", "maupassant", "colette",
    "proust", "camus", "sartre", "de beauvoir", "gide",
    "gouges", "prévost", "manon lescaut", "candide", "les fleurs du mal",
    "les misérables", "phèdre", "le cid", "les caractères",
    "œuvre", "oeuvre", "auteur", "parcours", "programme", "session 2026",
    "objet d'étude", "poésie", "roman", "théâtre", "récit", "idées",
  ],
  langue: [
    "grammaire", "syntaxe", "subordonnée", "relative", "conjonctive",
    "négation", "interrogation", "concordance", "connecteur",
    "phrase complexe", "fonction", "nature",
  ],
  bibliotheque: [
    "chercher", "recherche", "source", "document", "référence",
    "officiel", "éduscol", "barème", "règlement", "texte officiel",
  ],
  administratif: [
    "admin", "ingestion", "corpus", "ressource", "cohorte",
    "configuration",
  ],
  diagnostic: [
    "diagnostic", "bilan", "évaluation initiale", "positionnement",
    "niveau", "profil",
  ],
  unknown: [],
};

/** Contexte optionnel pour affiner le choix de skill */
export interface SkillResolutionContext {
  hasText?: boolean;
  isOralSession?: boolean;
  isEcritSession?: boolean;
  subType?: string; // "commentaire" | "dissertation" | "contraction" | "essai"
}

/**
 * Résout le skill optimal à appeler pour une intention donnée.
 * Prend en compte le contexte de la session pour affiner le choix.
 */
export function resolveSkillForIntent(
  category: IntentCategory,
  context: SkillResolutionContext = {},
): Skill {
  switch (category) {
    case 'methode':
      if (context.isOralSession) return 'coach_oral';
      if (context.isEcritSession) {
        if (context.subType === 'commentaire' || context.subType === 'dissertation') return 'ecrit_plans';
        return 'coach_ecrit';
      }
      return 'tuteur_libre';

    case 'entrainement_oral':
      if (context.isOralSession) return 'coach_lecture';
      return 'oral_tirage';

    case 'entrainement_ecrit':
      if (context.subType === 'commentaire') return 'ecrit_baremage';
      if (context.subType === 'dissertation') return 'ecrit_baremage';
      if (context.subType === 'contraction') return 'ecrit_contraction';
      if (context.subType === 'essai') return 'ecrit_essai';
      return 'ecrit_diagnostic';

    case 'correction':
      if (context.hasText) return 'correcteur';
      return 'coach_ecrit';

    case 'oeuvre':
      return 'bibliothecaire';

    case 'langue':
      if (context.isOralSession) return 'grammaire_ciblee';
      return 'ecrit_langue';

    case 'bibliotheque':
      return 'bibliothecaire';

    case 'diagnostic':
      return 'ecrit_diagnostic';

    case 'administratif':
      return 'support_produit';

    case 'unknown':
    default:
      return 'tuteur_libre';
  }
}

/**
 * One-shot: classify + resolve.
 * API entry point for the chatbot interface.
 */
export function routeQuery(
  query: string,
  context: SkillResolutionContext = {},
): { category: IntentCategory; skill: Skill; confidence: number } {
  const category = classifyIntent(query);
  const skill = resolveSkillForIntent(category, context);
  const confidence = category === 'unknown' ? 0.3 : 0.85;
  return { category, skill, confidence };
}

/**
 * Classify user intent based on keyword matching.
 * Returns the best-matching category.
 */
export function classifyIntent(query: string): IntentCategory {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let bestCategory: IntentCategory = "unknown";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (category === "unknown") continue;

    let score = 0;
    for (const keyword of keywords) {
      const normalizedKeyword = keyword
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(normalizedKeyword)) {
        score += normalizedKeyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as IntentCategory;
    }
  }

  return bestCategory;
}
