export interface OeuvresProgramme {
  anneeScolaire: string;
  oeuvres: string[];
}

export type ProgrammeSelection = {
  availableWorks: string[];
  showProgrammeWarning: boolean;
  warningMessage?: string;
};

export const OEUVRES_PROGRAMME: OeuvresProgramme[] = [
  {
    anneeScolaire: '2025-2026',
    oeuvres: [
      'Cahier de Douai — Arthur Rimbaud',
      "La rage de l'expression — Francis Ponge",
      'Mes forêts — Hélène Dorion',
      'Discours de la servitude volontaire — Étienne de La Boétie',
      'Entretiens sur la pluralité des mondes — Fontenelle',
      "Lettres d'une Péruvienne — Françoise de Graffigny",
      'Le Menteur — Pierre Corneille',
      "On ne badine pas avec l'amour — Alfred de Musset",
      'Pour un oui ou pour un non — Nathalie Sarraute',
      'Manon Lescaut — Abbé Prévost',
      'La Peau de chagrin — Honoré de Balzac',
      'Sido suivi de Les Vrilles de la vigne — Colette',
    ],
  },
  {
    anneeScolaire: '2026-2027',
    oeuvres: [
      'Rimbaud, Cahier de Douai',
      "Ponge, La rage de l'expression",
      'Hélène Dorion, Mes forêts',
      'Étienne de La Boétie, Discours de la servitude volontaire',
      'Fontenelle, Entretiens sur la pluralité des mondes',
      "Françoise de Graffigny, Lettres d'une Péruvienne",
      'Pierre Corneille, Le Menteur',
      "Alfred de Musset, On ne badine pas avec l'amour",
      'Nathalie Sarraute, Pour un oui ou pour un non',
      'Chrétien de Troyes, Le Chevalier de la charrette',
      'Zola, Pot-Bouille',
      'Simone Schwarz-Bart, Pluie et vent sur Télumée Miracle',
    ],
  },
];

export function getOeuvresForYear(anneeScolaire: string): string[] {
  const programme = OEUVRES_PROGRAMME.find((item) => item.anneeScolaire === anneeScolaire);
  if (programme) {
    return programme.oeuvres;
  }
  return OEUVRES_PROGRAMME[OEUVRES_PROGRAMME.length - 1]?.oeuvres ?? [];
}

export function getProgrammeSelection(anneeScolaire: string): ProgrammeSelection {
  const directProgramme = OEUVRES_PROGRAMME.find((item) => item.anneeScolaire === anneeScolaire);
  const fallbackProgramme = OEUVRES_PROGRAMME[OEUVRES_PROGRAMME.length - 1];
  const works = directProgramme?.oeuvres ?? getOeuvresForYear(anneeScolaire);
  const placeholderDetected = works.some((item) => {
    const normalized = item.toLowerCase();
    return normalized.includes('programme') || normalized.includes('à mettre à jour');
  });
  const missingProgramme = !directProgramme;
  const filteredWorks = works.filter((item) => {
    const normalized = item.toLowerCase();
    return !normalized.includes('programme') && !normalized.includes('à mettre à jour');
  });

  if (placeholderDetected || missingProgramme) {
    console.warn(
      `[programme] ${anneeScolaire} non encore disponible, fallback vers le programme le plus récent.`,
    );
  }

  return {
    availableWorks: filteredWorks.length > 0 ? filteredWorks : (fallbackProgramme?.oeuvres ?? []),
    showProgrammeWarning: placeholderDetected || missingProgramme,
    warningMessage: placeholderDetected || missingProgramme
      ? `Le programme ${anneeScolaire} n'est pas encore disponible. Les œuvres affichées sont celles du programme ${fallbackProgramme?.anneeScolaire ?? 'le plus récent disponible'}.`
      : undefined,
  };
}
