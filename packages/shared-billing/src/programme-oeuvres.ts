export type ProgrammeObjetEtude =
  | 'poesie'
  | 'roman'
  | 'theatre'
  | 'litterature_idees';

export type ProgrammeOeuvre = {
  titre: string;
  auteur: string;
  genre: string;
  siecle: string;
  objet_etude: ProgrammeObjetEtude;
  parcours: string;
  themes: string[];
};

export const PROGRAMME_2025_2026_GENERAL: ProgrammeOeuvre[] = [
  { titre: 'Cahier de Douai', auteur: 'Arthur Rimbaud', genre: 'Poésie', siecle: '19e', objet_etude: 'poesie', parcours: 'Vouloir esquisser', themes: ['écriture', 'révolte'] },
  { titre: "La rage de l'expression", auteur: 'Francis Ponge', genre: 'Poésie', siecle: '20e', objet_etude: 'poesie', parcours: 'Langage et matière', themes: ['langage', 'matière'] },
  { titre: 'Mes forêts', auteur: 'Hélène Dorion', genre: 'Poésie', siecle: '21e', objet_etude: 'poesie', parcours: 'Éveiller l’espace', themes: ['nature', 'immersion'] },
  { titre: 'Discours de la servitude volontaire', auteur: 'Étienne de La Boétie', genre: "Littérature d'idées", siecle: '16e', objet_etude: 'litterature_idees', parcours: 'Liberté et pouvoir', themes: ['liberté', 'individualisme'] },
  { titre: 'Entretiens sur la pluralité des mondes', auteur: 'Fontenelle', genre: "Littérature d'idées", siecle: '17e', objet_etude: 'litterature_idees', parcours: 'Philosophie scientifique', themes: ['science', 'raison'] },
  { titre: "Lettres d'une Péruvienne", auteur: 'Françoise de Graffigny', genre: "Littérature d'idées", siecle: '18e', objet_etude: 'litterature_idees', parcours: 'Échanges épistolaires', themes: ['éloquence', 'émancipation'] },
  { titre: 'Le Menteur', auteur: 'Pierre Corneille', genre: 'Théâtre', siecle: '17e', objet_etude: 'theatre', parcours: 'Comédie et identité', themes: ['mensonge', 'comédie'] },
  { titre: 'On ne badine pas avec l’amour', auteur: 'Alfred de Musset', genre: 'Théâtre', siecle: '19e', objet_etude: 'theatre', parcours: 'Conflit amoureux', themes: ['orgueil', 'désir'] },
  { titre: 'Pour un oui ou pour un non', auteur: 'Nathalie Sarraute', genre: 'Théâtre', siecle: '20e', objet_etude: 'theatre', parcours: 'Génération & langage', themes: ['langage', 'incommunicabilité'] },
  { titre: 'Manon Lescaut', auteur: 'Abbé Prévost', genre: 'Roman', siecle: '18e', objet_etude: 'roman', parcours: 'Passion & destin', themes: ['passion', 'rupture'] },
  { titre: 'La Peau de chagrin', auteur: 'Honoré de Balzac', genre: 'Roman', siecle: '19e', objet_etude: 'roman', parcours: 'Désir & limite', themes: ['quête', 'fatalité'] },
  { titre: 'Sido & Les Vrilles de la vigne', auteur: 'Colette', genre: 'Roman', siecle: '20e', objet_etude: 'roman', parcours: 'Solitude moderne', themes: ['corps', 'intimité'] }
];

export function getProgrammeOeuvres(objetEtude: ProgrammeObjetEtude | 'tous'): ProgrammeOeuvre[] {
  if (objetEtude === 'tous') {
    return PROGRAMME_2025_2026_GENERAL;
  }

  return PROGRAMME_2025_2026_GENERAL.filter((oeuvre) => oeuvre.objet_etude === objetEtude);
}
