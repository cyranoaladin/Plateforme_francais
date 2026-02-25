export type EpreuveType = 'commentaire' | 'dissertation' | 'contraction_essai';

export type EpreuveRecord = {
  id: string;
  userId: string;
  type: EpreuveType;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
  generatedAt: string;
};

export type CopieStatus = 'pending' | 'processing' | 'done' | 'error';

export type CorrectionJson = {
  note: number;
  mention: string;
  bilan: {
    global: string;
    points_forts: string[];
    axes_amelioration: string[];
  };
  rubriques: {
    titre: string;
    note: number;
    max: number;
    appreciation: string;
    conseils: string[];
  }[];
  annotations: {
    extrait: string;
    commentaire: string;
    type: 'erreur' | 'remarque' | 'bravo';
  }[];
  corrige_type: string;
  conseil_final: string;
};

export type CopieRecord = {
  id: string;
  epreuveId: string;
  userId: string;
  filePath: string;
  fileType: string;
  status: CopieStatus;
  ocrText: string | null;
  correction: CorrectionJson | null;
  createdAt: string;
  correctedAt: string | null;
};
