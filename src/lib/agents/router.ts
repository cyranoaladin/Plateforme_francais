/**
 * Router Agent — classifies user intent to dispatch to the correct agent.
 * Categories: methode, entrainement, correction, oeuvre, langue, administratif
 */

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
    "œuvre", "oeuvre", "auteur", "rimbaud", "corneille", "musset",
    "sarraute", "ponge", "dorion", "rabelais", "la bruyère",
    "gouges", "prévost", "balzac", "colette", "parcours",
    "programme", "session 2026",
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
