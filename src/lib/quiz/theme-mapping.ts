/**
 * Quiz Theme Mapping — Maps each quiz theme to:
 * - RAG search query (for context enrichment from 13,661 chunks)
 * - LLM prompt specialization
 * - Media category filter
 * - weakSkill label for student profile tracking
 */

import type { QuizTheme } from '@/lib/validation/schemas';
import type { MediaCategory } from '@/data/media-catalog';

export type ThemeConfig = {
  /** Human-readable label */
  label: string;
  /** RAG search query to fetch relevant context chunks */
  ragQuery: string;
  /** RAG filter: oeuvre name if applicable */
  ragOeuvreFilter?: string;
  /** RAG filter: parcours if applicable */
  ragParcoursFilter?: string;
  /** LLM prompt: theme-specific instructions appended to the quiz_maitre skill */
  llmPromptSuffix: string;
  /** Media categories to inject as context */
  mediaCategories: MediaCategory[];
  /** weakSkill key for student profile tracking */
  weakSkillKey: string;
};

export const THEME_MAP: Record<QuizTheme, ThemeConfig> = {
  grammaire: {
    label: 'Grammaire EAF',
    ragQuery: 'grammaire programme première syntaxe phrase complexe subordination relations logiques système verbal',
    llmPromptSuffix: `Thème: GRAMMAIRE EAF (programme Première).
Domaines: syntaxe de la phrase complexe (coordination, subordination conjonctive/relative/interrogative indirecte), relations logiques (cause, conséquence, opposition, concession, condition, but), système verbal (valeurs des temps, subjonctif, conditionnel, concordance, discours indirect libre).
Chaque question doit porter sur un fait de langue précis avec terminologie officielle 2020.`,
    mediaCategories: ['GRAMMAIRE'],
    weakSkillKey: 'Grammaire',
  },

  figures_de_style: {
    label: 'Figures de style',
    ragQuery: 'figures de style procédés stylistiques métaphore métonymie hyperbole anaphore antithèse chiasme',
    llmPromptSuffix: `Thème: FIGURES DE STYLE et procédés littéraires.
Couvre: figures d'analogie (comparaison, métaphore, personnification, allégorie), figures d'opposition (antithèse, oxymore, chiasme), figures d'amplification (hyperbole, gradation, anaphore, accumulation), figures d'atténuation (litote, euphémisme), figures de substitution (métonymie, synecdoque, périphrase).
Chaque question doit demander d'identifier ou de définir un procédé, avec un exemple littéraire concret.`,
    mediaCategories: ['METHODE_ECRIT', 'METHODE_ORAL'],
    weakSkillKey: 'Figures de style',
  },

  mouvements_litteraires: {
    label: 'Mouvements littéraires',
    ragQuery: 'mouvements littéraires humanisme classicisme lumières romantisme réalisme naturalisme symbolisme surréalisme',
    llmPromptSuffix: `Thème: MOUVEMENTS LITTÉRAIRES (du XVIe au XXe siècle).
Couvre: Humanisme, Pléiade, Baroque, Classicisme, Lumières, Romantisme, Réalisme, Naturalisme, Symbolisme, Surréalisme, Existentialisme, Nouveau Roman, OuLiPo.
Chaque question doit porter sur: caractéristiques, dates repères, auteurs représentatifs, œuvres clés, ou contexte historique.`,
    mediaCategories: ['CULTURE_OEUVRE', 'BO_PROGRAMME'],
    weakSkillKey: 'Mouvements littéraires',
  },

  poesie: {
    label: 'Poésie (objet d\u2019étude)',
    ragQuery: 'poésie programme EAF Rimbaud Cahiers de Douai Ponge Rage expression Dorion Mes forêts versification',
    ragParcoursFilter: 'poésie',
    llmPromptSuffix: `Thème: POÉSIE — Objet d'étude EAF "La poésie du XIXe au XXIe siècle".
Œuvres au programme 2025-2026: Rimbaud (Cahiers de Douai), Ponge (La Rage de l'expression), Dorion (Mes forêts).
Parcours associés: "Émancipations créatrices", "Dans l'atelier du poète", "La poésie, la nature, l'intime".
Questions sur: versification, thèmes, procédés poétiques, contexte, parcours associé.`,
    mediaCategories: ['CULTURE_OEUVRE', 'BO_PROGRAMME'],
    weakSkillKey: 'Poésie',
  },

  roman: {
    label: 'Roman (objet d\u2019étude)',
    ragQuery: 'roman programme EAF Prévost Manon Lescaut Balzac Peau de chagrin Colette Sido personnage narrateur',
    ragParcoursFilter: 'roman',
    llmPromptSuffix: `Thème: ROMAN — Objet d'étude EAF "Le roman et le récit du Moyen Âge au XXIe siècle".
Œuvres au programme 2025-2026: Prévost (Manon Lescaut), Balzac (La Peau de chagrin), Colette (Sido suivi de Les Vrilles de la vigne).
Parcours associés: "Personnages en marge, plaisirs du romanesque", "Les romans de l'énergie", "La célébration du monde".
Questions sur: narratologie, personnages, thèmes, extraits clés, parcours associé.`,
    mediaCategories: ['CULTURE_OEUVRE', 'BO_PROGRAMME'],
    weakSkillKey: 'Roman',
  },

  theatre: {
    label: 'Théâtre (objet d\u2019étude)',
    ragQuery: 'théâtre programme EAF Corneille Menteur Musset badine Sarraute double énonciation didascalies',
    ragParcoursFilter: 'théâtre',
    llmPromptSuffix: `Thème: THÉÂTRE — Objet d'étude EAF "Le théâtre du XVIIe au XXIe siècle".
Œuvres au programme 2025-2026: Corneille (Le Menteur), Musset (On ne badine pas avec l'amour), Sarraute (Pour un oui ou pour un non).
Parcours associés: "Mensonge et comédie", "Les jeux du cœur et de la parole", "Théâtre et dispute".
Questions sur: double énonciation, didascalies, registres dramatiques, scènes clés, parcours associé.`,
    mediaCategories: ['CULTURE_OEUVRE', 'BO_PROGRAMME', 'METHODE_ECRIT'],
    weakSkillKey: 'Théâtre',
  },

  litterature_idees: {
    label: 'Littérature d\u2019idées (objet d\u2019étude)',
    ragQuery: 'littérature idées programme EAF La Boétie Servitude volontaire Fontenelle Pluralité mondes Graffigny argumentation',
    ragParcoursFilter: 'littérature d\u2019idées',
    llmPromptSuffix: `Thème: LITTÉRATURE D'IDÉES — Objet d'étude EAF "La littérature d'idées du XVIe au XVIIIe siècle".
Œuvres au programme 2025-2026: La Boétie (Discours de la servitude volontaire), Fontenelle (Entretiens sur la pluralité des mondes), Graffigny (Lettres d'une Péruvienne).
Parcours associés: "Langue et autorité", "Imagination et pensée au XVIIIe", "Regard éloigné, regard critique".
Questions sur: stratégies argumentatives, thèses, registres, contexte des Lumières, parcours associé.`,
    mediaCategories: ['CULTURE_OEUVRE', 'BO_PROGRAMME'],
    weakSkillKey: 'Littérature d\u2019idées',
  },

  methode_commentaire: {
    label: 'Méthode du commentaire',
    ragQuery: 'méthodologie commentaire littéraire introduction problématique axes plan conclusion procédés citations intégration',
    llmPromptSuffix: `Thème: MÉTHODOLOGIE DU COMMENTAIRE LITTÉRAIRE.
Couvre: lecture analytique, repérage des procédés, construction de la problématique, plan en 2-3 axes, rédaction de l'introduction (amorce, présentation, problématique, annonce), développement (sous-parties, citations intégrées, analyse), conclusion (bilan, ouverture).
Questions sur: étapes, pièges fréquents, barème (/20), gestion du temps (4h).`,
    mediaCategories: ['METHODE_ECRIT'],
    weakSkillKey: 'Commentaire',
  },

  methode_dissertation: {
    label: 'Méthode de la dissertation',
    ragQuery: 'méthodologie dissertation littéraire plan dialectique thématique problématique argumentation œuvre programme',
    llmPromptSuffix: `Thème: MÉTHODOLOGIE DE LA DISSERTATION SUR ŒUVRE.
Couvre: analyse du sujet (mots-clés, tension, reformulation), types de plans (dialectique, thématique, analytique), construction de la problématique, rédaction des paragraphes argumentés (argument, exemple, analyse), mobilisation de l'œuvre intégrale et du parcours, introduction et conclusion.
Questions sur: étapes, types de plans, barème, pièges fréquents, gestion du temps.`,
    mediaCategories: ['METHODE_ECRIT'],
    weakSkillKey: 'Dissertation',
  },

  oral_eaf: {
    label: 'Oral EAF (méthode & déroulement)',
    ragQuery: 'oral EAF déroulement épreuve lecture expressive explication linéaire grammaire entretien œuvre choisie barème',
    llmPromptSuffix: `Thème: ÉPREUVE ORALE EAF — méthode et déroulement.
Couvre: les 4 étapes officielles (lecture expressive /2, explication linéaire /8, question de grammaire /2, entretien sur l'œuvre choisie /8), la préparation 30 min, le descriptif, les attentes du jury.
Questions sur: barème détaillé, durée de chaque étape, critères de notation, erreurs fréquentes, stratégies de préparation.`,
    mediaCategories: ['METHODE_ORAL', 'GRAMMAIRE', 'RAPPORT_JURY'],
    weakSkillKey: 'Oral',
  },
};

/**
 * Returns the theme config for a given theme key.
 */
export function getThemeConfig(theme: QuizTheme): ThemeConfig {
  return THEME_MAP[theme];
}

/**
 * Returns the human-readable label for the theme select UI.
 */
export function getThemeLabel(theme: QuizTheme): string {
  return THEME_MAP[theme].label;
}
