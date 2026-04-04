/**
 * Programme officiel EAF 2025 — Voie Générale
 * Source : Bulletin Officiel + arrêté ministériel session 2025
 */

export const OBJETS_ETUDE = [
  {
    id: 'POESIE',
    label: 'La poésie du XIXe au XXIe siècle',
    icone: '✍️',
    oeuvres: [
      { titre: 'Cahier de Douai', auteur: 'Arthur Rimbaud' },
      { titre: "La Rage de l'expression", auteur: 'Francis Ponge' },
      { titre: 'Mes forêts', auteur: 'Hélène Dorion' },
    ],
    parcours: [
      'Émancipations créatrices',
      "Dans l'atelier du poète",
      "La poésie, la nature, l'intime",
    ],
  },
  {
    id: 'THEATRE',
    label: 'Le théâtre du XVIIe au XXIe siècle',
    icone: '🎭',
    oeuvres: [
      { titre: 'Le Menteur', auteur: 'Pierre Corneille' },
      { titre: "On ne badine pas avec l'amour", auteur: 'Alfred de Musset' },
      { titre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute' },
    ],
    parcours: [
      'Mensonge et comédie',
      'Les jeux du cœur et de la parole',
      'Théâtre et dispute',
    ],
  },
  {
    id: 'LITTERATURE_IDEES',
    label: "La littérature d'idées du XVIe au XVIIIe siècle",
    icone: '💡',
    oeuvres: [
      { titre: 'Gargantua', auteur: 'François Rabelais' },
      { titre: 'Les Caractères (livres V à X)', auteur: 'Jean de La Bruyère' },
      { titre: 'Déclaration des droits de la femme et de la citoyenne', auteur: 'Olympe de Gouges' },
    ],
    parcours: [
      'Rire et savoir',
      'La comédie sociale',
      "Écrire et combattre pour l'égalité",
    ],
  },
  {
    id: 'ROMAN_RECIT',
    label: 'Le roman et le récit du XVIIIe au XXIe siècle',
    icone: '📖',
    oeuvres: [
      { titre: 'Manon Lescaut', auteur: 'Abbé Prévost' },
      { titre: 'La Peau de chagrin', auteur: 'Honoré de Balzac' },
      { titre: 'Sido / Les Vrilles de la vigne', auteur: 'Colette' },
    ],
    parcours: [
      'Personnages en marge',
      "Romans de l'énergie",
      'La célébration du monde',
    ],
  },
] as const;

export type ObjetEtudeId = (typeof OBJETS_ETUDE)[number]['id'];

export const TYPE_TEXTE_OPTIONS = [
  { value: 'EXTRAIT_OEUVRE', label: "Extrait d'œuvre" },
  { value: 'EXTRAIT_PARCOURS', label: 'Texte du parcours associé' },
  { value: 'LECTURE_CURSIVE', label: 'Lecture cursive' },
  { value: 'OEUVRE_CHOISIE_ENTRETIEN', label: "Œuvre choisie pour l'entretien" },
] as const;

export type TypeTexteId = (typeof TYPE_TEXTE_OPTIONS)[number]['value'];

/** Structure minimale réglementaire du descriptif (voie générale) */
export const DESCRIPTIF_REGLEMENTAIRE = {
  totalTextesMinimum: 16,
  parObjetEtude: {
    extraitsOeuvreMinimum: 2,
    extraitsParcours: 1,
    lecturesCursivesMinimum: 1,
  },
} as const;

/** Thématiques grammaticales interrogeables (BO programme) */
export const THEMES_GRAMMAIRE_EAF = [
  'Accords dans le groupe nominal et entre sujet et verbe',
  'Valeurs temporelles, aspectuelles et modales du verbe',
  'Concordance des temps',
  'Relations au sein de la phrase complexe (juxtaposition, coordination, subordination)',
  'Syntaxe de la négation',
  "Syntaxe de l'interrogation",
  'Propositions subordonnées relatives',
  'Propositions subordonnées conjonctives',
  'Transformation interrogation directe / interrogation indirecte',
] as const;
