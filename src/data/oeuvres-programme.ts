export interface OeuvresProgramme {
  anneeScolaire: string;
  oeuvres: string[];
}

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
    oeuvres: ['Programme 2026-2027 — à mettre à jour à la rentrée'],
  },
];

export function getOeuvresForYear(anneeScolaire: string): string[] {
  const programme = OEUVRES_PROGRAMME.find((item) => item.anneeScolaire === anneeScolaire);
  if (programme) {
    return programme.oeuvres;
  }
  return OEUVRES_PROGRAMME[OEUVRES_PROGRAMME.length - 1]?.oeuvres ?? [];
}
