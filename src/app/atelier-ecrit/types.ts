export type EpreuveType = 'commentaire' | 'dissertation' | 'contraction_essai';

export type EpreuvePayload = {
  epreuveId: string;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
  generatedAt: string;
};

export type CopieCreatePayload = {
  copieId: string;
  status: 'pending';
  newBadges?: string[];
};

export type CopieLink = {
  copieId: string;
  epreuveId: string;
};

export const PROCESSING_STEPS = [
  'Lecture attentive de ta copie…',
  'Analyse des points de méthode et de contenu…',
  'Rédaction de ton bilan personnalisé…',
];

export const STUDIO_STEPS = [
  {
    index: '01',
    title: 'Générer un sujet crédible',
    body: "Choisis le format, précise l'œuvre ou le thème si besoin, puis lance un sujet blanc exploitable immédiatement.",
  },
  {
    index: '02',
    title: 'Déposer la copie',
    body: "Ajoute un PDF ou des photos propres. La plateforme suit l'upload puis enclenche une lecture détaillée de la copie.",
  },
  {
    index: '03',
    title: 'Récupérer le rapport',
    body: "Une fois l'analyse terminée, tu ouvres le rapport détaillé pour travailler le prochain axe utile.",
  },
] as const;
