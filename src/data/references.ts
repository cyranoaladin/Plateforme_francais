export type ResourceType =
  | 'fiche_methode'
  | 'texte_officiel'
  | 'video'
  | 'audio'
  | 'exemple_corrige'
  | 'oeuvre';

export type ReferenceDoc = {
  id: string;
  title: string;
  type: ResourceType;
  source: 'BO' | 'EDUSCOL' | 'FRANCE_CULTURE' | 'YOUTUBE' | 'EAF_PREMIUM';
  sourceRef: string;
  level: 'Niveau A' | 'Niveau B' | 'Niveau C' | 'Niveau D';
  excerpt: string;
  content: string;
  tags: string[];
  url?: string;
  mediaUrl?: string;
  markdownContent?: string;
};

export const OFFICIAL_REFERENCES: ReferenceDoc[] = [
  {
    id: 'programme-eaf-2025-2026-complet',
    title: 'Programme EAF 2025-2026 — 12 oeuvres officielles voie generale',
    type: 'texte_officiel',
    source: 'BO',
    sourceRef: 'BO n30 du 24 juillet 2025 + programmation ete 2024',
    level: 'Niveau A',
    excerpt: 'Programme complet des 12 oeuvres (3 par objet d etude) pour la session 2026.',
    content: 'Programme EAF 2025-2026 voie generale : Poesie (Rimbaud, Ponge, Dorion), Litterature d idees (La Boetie, Fontenelle, Graffigny), Theatre (Corneille, Musset, Sarraute), Roman (Prevost, Balzac, Colette).',
    tags: ['programme', 'oeuvres', 'session 2026', 'bo officiel'],
    url: 'ref:programme-eaf-2025-2026',
  },
  {
    id: 'bareme-oral-officiel',
    title: 'Structure et bareme officiel de l epreuve orale EAF',
    type: 'texte_officiel',
    source: 'BO',
    sourceRef: 'Note de service consolidee mars 2024',
    level: 'Niveau A',
    excerpt: 'Oral /20: 12 points premiere partie + 8 points entretien.',
    content: 'Oral EAF: 20 minutes apres 30 minutes de preparation. 1) Lecture /2, 2) Explication lineaire /8, 3) Grammaire /2, 4) Entretien /8 sur l oeuvre choisie par le candidat.',
    tags: ['bareme', 'oral', 'lecture', 'explication', 'grammaire', 'entretien'],
    url: 'ref:bareme-oral-2024',
  },
  {
    id: 'bareme-ecrit-officiel',
    title: 'Structure et bareme officiel de l epreuve ecrite EAF',
    type: 'texte_officiel',
    source: 'BO',
    sourceRef: 'Note de service consolidee mars 2024',
    level: 'Niveau A',
    excerpt: 'Ecrit 4h, coefficient 5: commentaire ou dissertation.',
    content: 'Le candidat choisit entre commentaire et dissertation. La dissertation propose trois sujets lies aux trois oeuvres de l objet d etude.',
    tags: ['bareme', 'ecrit', 'commentaire', 'dissertation'],
    url: 'ref:bareme-ecrit-2024',
  },
  {
    id: 'descriptif-lecture-regles',
    title: 'Descriptif de lecture — regles officielles',
    type: 'fiche_methode',
    source: 'EDUSCOL',
    sourceRef: 'Note de service consolidee mars 2024',
    level: 'Niveau A',
    excerpt: '20 textes min, 5 par objet d etude, oeuvre choisie explicite.',
    content: 'Descriptif de lecture: 20 textes minimum, 5 minimum par objet d etude, 3 extraits minimum par oeuvre integrale, 2 extraits minimum pour le parcours associe.',
    tags: ['descriptif', 'oral', 'methodologie', 'onboarding'],
    url: 'ref:descriptif-lecture',
    markdownContent: '# Mon Descriptif\n\n- 20 textes minimum\n- 5 textes minimum par objet\n- Oeuvre choisie pour la 2e partie explicite',
  },
  {
    id: 'grammaire-programme-premiere',
    title: 'Notions de grammaire au programme de Premiere — EAF',
    type: 'fiche_methode',
    source: 'EDUSCOL',
    sourceRef: 'Ressources Eduscol, francais Premiere',
    level: 'Niveau A',
    excerpt: 'Trois axes: syntaxe complexe, relations logiques, systeme verbal.',
    content: 'Axe 1: phrase complexe (coordination, subordination, relatives, interrogatives indirectes). Axe 2: cause, consequence, opposition, condition, but. Axe 3: valeurs des temps, subjonctif, conditionnel, concordance, discours indirect libre.',
    tags: ['grammaire', 'premiere', 'oral', 'question grammaticale'],
    url: 'ref:grammaire-premiere-eaf',
  },
  {
    id: 'methode-explication-lineaire',
    title: 'Methode officielle de l explication lineaire',
    type: 'fiche_methode',
    source: 'EDUSCOL',
    sourceRef: 'Ressources Eduscol Premiere',
    level: 'Niveau A',
    excerpt: 'Suivre le texte, interpreter les procedes, eviter la paraphrase.',
    content: 'L explication lineaire suit les mouvements du texte, avec une problematique claire, des analyses appuyees sur des citations breves et un fil conducteur interprete.',
    tags: ['explication lineaire', 'oral', 'methode'],
    url: 'ref:methode-explication-lineaire',
    markdownContent: '# Explication lineaire\n\n1. Introduction problematisee\n2. Mouvements du texte\n3. Procede -> effet -> interpretation\n4. Conclusion courte',
  },
  {
    id: 'methode-dissertation',
    title: 'Methode officielle de la dissertation',
    type: 'fiche_methode',
    source: 'EDUSCOL',
    sourceRef: 'Ressources Eduscol Premiere',
    level: 'Niveau A',
    excerpt: 'Problematique, plan, arguments et exemples precis.',
    content: 'La dissertation exige une these claire, des transitions et des exemples tires de l oeuvre au programme et des lectures personnelles.',
    tags: ['dissertation', 'methode', 'ecrit'],
    url: 'ref:methode-dissertation',
    markdownContent: '# Dissertation\n\n- Intro: sujet, probleme, plan\n- Developpement: argument + exemple\n- Conclusion: bilan + ouverture',
  },
  {
    id: 'jury-oral-2024',
    title: 'Rapport de jury EAF 2024 — epreuve orale',
    type: 'texte_officiel',
    source: 'EAF_PREMIUM',
    sourceRef: 'Synthese interne du rapport de jury 2024',
    level: 'Niveau B',
    excerpt: 'Ne pas lister les procedes: toujours interpreter et argumenter.',
    content: 'Points saillants: fil conducteur indispensable, grammaire en trois temps (identifier, nommer, interpreter), entretien en questions ouvertes ancre dans les lectures du candidat.',
    tags: ['jury', 'oral', 'attendus', 'erreurs frequentes'],
    url: 'ref:jury-oral-2024',
  },
  {
    id: 'session-2026-calendrier',
    title: 'Calendrier session 2026 — ecrit et oral',
    type: 'texte_officiel',
    source: 'BO',
    sourceRef: 'Calendrier national session 2026',
    level: 'Niveau A',
    excerpt: 'Ecrit le 8 juin 2026, oraux a partir du 19 juin 2026.',
    content: 'Ecrit: lundi 8 juin 2026 (8h-12h). Oraux: a partir du 19 juin 2026 selon les convocations.',
    tags: ['calendrier', 'session 2026', 'compte a rebours'],
    url: 'ref:session-2026-calendrier',
  },
  {
    id: 'oeuvre-rimbaud-dossier',
    title: 'Dossier oeuvre — Cahier de Douai (Rimbaud)',
    type: 'oeuvre',
    source: 'EAF_PREMIUM',
    sourceRef: 'Dossier pedagogique interne',
    level: 'Niveau B',
    excerpt: 'Repères de lecture, axes possibles et points de vigilance.',
    content: 'Dossier synthese : emancipation poetique, rejet des conventions, energie du vers, voix adolescente et modernite.',
    tags: ['oeuvre', 'rimbaud', 'poesie', 'cahier de douai'],
    url: 'ref:oeuvre-rimbaud-dossier',
  },
  {
    id: 'oeuvre-balzac-dossier',
    title: 'Dossier oeuvre — La Peau de chagrin (Balzac)',
    type: 'oeuvre',
    source: 'EAF_PREMIUM',
    sourceRef: 'Dossier pedagogique interne',
    level: 'Niveau B',
    excerpt: 'Desir, energie, destruction: enjeux romanesques majeurs.',
    content: 'Dossier synthese : fantastique balzacien, allegorie de la volonte, critique sociale et energie autodestructrice.',
    tags: ['oeuvre', 'balzac', 'roman', 'la peau de chagrin'],
    url: 'ref:oeuvre-balzac-dossier',
  },
];
