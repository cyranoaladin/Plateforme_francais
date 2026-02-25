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
  level: 'Niveau A' | 'Niveau B' | 'Niveau C' | 'Niveau D';
  excerpt: string;
  content: string;
  tags: string[];
  url: string;
  mediaUrl?: string;
  markdownContent?: string;
};

const METHOD_SHEETS: ReferenceDoc[] = [
  {
    id: 'fiche-commentaire-1',
    title: 'Fiche méthode: commentaire littéraire en 7 étapes',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: "Structurer l'introduction, l'analyse et la conclusion d'un commentaire.",
    content: 'Méthode complète du commentaire, de la problématique aux transitions.',
    tags: ['commentaire', 'méthode', 'écrit'],
    url: 'https://eaf.local/ressources/fiche-commentaire-1',
    markdownContent:
      '# Commentaire littéraire\n\n1. Lire et annoter le texte.\n2. Définir la problématique.\n3. Construire un plan lisible.\n4. Justifier par citations brèves.\n\n```text\nIdée -> Procédé -> Effet\n```',
  },
  {
    id: 'fiche-dissertation-1',
    title: 'Fiche méthode: dissertation EAF',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: 'Construire une argumentation rigoureuse en trois parties.',
    content: 'Méthode dissertation: problématisation, argumentation, exemples, conclusion.',
    tags: ['dissertation', 'méthode', 'écrit'],
    url: 'https://eaf.local/ressources/fiche-dissertation-1',
    markdownContent:
      '# Dissertation\n\n- Problématique claire\n- Plan dialectique ou thématique\n- Exemples précis issus des œuvres',
  },
  {
    id: 'fiche-explication-1',
    title: "Fiche méthode: explication linéaire à l'oral",
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: 'Conduire une explication linéaire du texte sans paraphrase.',
    content: 'Progression linéaire, analyse des procédés, effets de sens.',
    tags: ['oral', 'explication', 'méthode'],
    url: 'https://eaf.local/ressources/fiche-explication-1',
    markdownContent:
      '# Explication linéaire\n\nRepérer les mouvements du texte et relier **forme** et **sens**.',
  },
  {
    id: 'fiche-grammaire-1',
    title: 'Fiche méthode: question de grammaire officielle',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: 'Répondre avec la terminologie 2020: nature, fonction, valeur.',
    content: 'Méthode brève et efficace pour sécuriser les 2 points de grammaire.',
    tags: ['grammaire', 'oral', 'terminologie'],
    url: 'https://eaf.local/ressources/fiche-grammaire-1',
    markdownContent: '# Grammaire\n\nToujours nommer la **nature** puis la **fonction**.',
  },
  {
    id: 'fiche-contraction-1',
    title: 'Fiche méthode: contraction de texte',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau B',
    excerpt: 'Réduire un texte argumentatif en respectant sa logique.',
    content: 'Procédure de contraction: idées directrices, reformulation fidèle, concision.',
    tags: ['contraction', 'méthode', 'écrit'],
    url: 'https://eaf.local/ressources/fiche-contraction-1',
    markdownContent: '# Contraction\n\nConserver la structure argumentative du texte source.',
  },
  {
    id: 'fiche-essai-1',
    title: 'Fiche méthode: essai argumentatif',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau B',
    excerpt: 'Défendre une thèse personnelle avec nuance.',
    content: 'Méthodologie de l essai: thèse, arguments, contre-arguments, ouverture.',
    tags: ['essai', 'argumentation', 'écrit'],
    url: 'https://eaf.local/ressources/fiche-essai-1',
    markdownContent: '# Essai\n\nThèse explicite, exemples solides, style clair.',
  },
  {
    id: 'fiche-ouverture-1',
    title: 'Fiche méthode: réussir son introduction',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: 'Amorce, présentation du texte, problématique, annonce du plan.',
    content: 'Check-list des 4 éléments indispensables de l introduction.',
    tags: ['introduction', 'commentaire', 'dissertation'],
    url: 'https://eaf.local/ressources/fiche-ouverture-1',
    markdownContent: '# Introduction\n\nNe pas oublier l annonce de plan.',
  },
  {
    id: 'fiche-conclusion-1',
    title: 'Fiche méthode: conclure sans répétition',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau A',
    excerpt: 'Synthèse argumentée et ouverture pertinente.',
    content: 'Méthode pour conclure proprement un écrit EAF.',
    tags: ['conclusion', 'écrit'],
    url: 'https://eaf.local/ressources/fiche-conclusion-1',
    markdownContent: '# Conclusion\n\nBilan + réponse à la problématique + ouverture.',
  },
  {
    id: 'fiche-citations-1',
    title: 'Fiche méthode: intégrer les citations',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau B',
    excerpt: 'Citer court, analyser juste.',
    content: 'Techniques d insertion de citations et d analyse des effets.',
    tags: ['citations', 'analyse', 'méthode'],
    url: 'https://eaf.local/ressources/fiche-citations-1',
    markdownContent: '# Citations\n\nToujours expliquer la citation immédiatement.',
  },
  {
    id: 'fiche-oral-gestion-temps',
    title: 'Fiche méthode: gérer son temps à l oral',
    type: 'fiche_methode',
    source: 'EAF_PREMIUM',
    level: 'Niveau B',
    excerpt: 'Répartir lecture, explication, grammaire et entretien.',
    content: 'Stratégie de gestion du temps pour une prestation équilibrée.',
    tags: ['oral', 'gestion du temps'],
    url: 'https://eaf.local/ressources/fiche-oral-temps',
    markdownContent: '# Gestion du temps\n\n2 + 8 + 2 + 8 minutes.',
  },
];

const OFFICIAL_TEXTS: ReferenceDoc[] = [
  {
    id: 'bo-eaf-def-2024',
    title: 'Définition des EAF (version consolidée mars 2024)',
    type: 'texte_officiel',
    source: 'BO',
    level: 'Niveau A',
    excerpt: "L'épreuve anticipée de français évalue maîtrise linguistique et culture littéraire.",
    content: 'Attendus officiels pour oral et écrit, critères et finalités.',
    tags: ['barème', 'oral', 'écrit', 'explication linéaire'],
    url: 'https://eduscol.education.fr/document/52932/download',
  },
  {
    id: 'eduscol-explication-attendus',
    title: "Attendus de l'explication linéaire",
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau A',
    excerpt: 'Suivre le mouvement du texte et relier procédés et effets.',
    content: 'Attendus précis de l explication linéaire à l oral.',
    tags: ['explication', 'oral', 'analyse'],
    url: 'https://eduscol.education.fr/document/24379/download',
  },
  {
    id: 'eduscol-grammaire-2020',
    title: 'Terminologie grammaticale officielle (2020)',
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau A',
    excerpt: 'Identifier nature, fonction et marques syntaxiques.',
    content: 'Terminologie officielle pour les analyses grammaticales.',
    tags: ['grammaire', 'terminologie', 'syntaxe'],
    url: 'https://eduscol.education.fr/document/1872/download',
  },
  {
    id: 'eduscol-commentaire-grille',
    title: 'Grille d évaluation du commentaire',
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau A',
    excerpt: 'Compréhension, analyse, organisation et expression.',
    content: 'Répartition des critères du commentaire à l écrit.',
    tags: ['commentaire', 'barème', 'écrit'],
    url: 'https://eduscol.education.fr/',
  },
  {
    id: 'eduscol-dissertation-grille',
    title: 'Grille d évaluation de la dissertation',
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau A',
    excerpt: 'Problématisation, argumentation, exemples et expression.',
    content: 'Critères d évaluation de la dissertation EAF.',
    tags: ['dissertation', 'barème', 'écrit'],
    url: 'https://eduscol.education.fr/',
  },
  {
    id: 'bo-programme-oeuvres-2025',
    title: 'Programme national des œuvres 2024-2025',
    type: 'texte_officiel',
    source: 'BO',
    level: 'Niveau A',
    excerpt: 'Liste officielle des œuvres et parcours associés.',
    content: 'Cadre national des œuvres au programme de Première.',
    tags: ['programme', 'oeuvres', 'parcours'],
    url: 'https://www.education.gouv.fr/bo',
  },
  {
    id: 'eduscol-entretien-attendus',
    title: 'Attendus de la seconde partie de l oral (entretien)',
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau B',
    excerpt: 'Évaluer argumentation personnelle et culture de lecture.',
    content: 'Attendus sur la capacité à dialoguer et justifier ses choix.',
    tags: ['oral', 'entretien', 'lecture cursive'],
    url: 'https://eduscol.education.fr/',
  },
  {
    id: 'eduscol-copies-annotes',
    title: 'Copies annotées et exemples officiels',
    type: 'texte_officiel',
    source: 'EDUSCOL',
    level: 'Niveau B',
    excerpt: 'Comprendre ce qui distingue une copie moyenne d une excellente copie.',
    content: 'Exemples de productions annotées avec commentaires pédagogiques.',
    tags: ['exemples', 'copies', 'écrit'],
    url: 'https://eduscol.education.fr/',
  },
  {
    id: 'bo-epreuve-temps',
    title: 'Durée et organisation des épreuves EAF',
    type: 'texte_officiel',
    source: 'BO',
    level: 'Niveau A',
    excerpt: 'Rappel des durées: écrit 4h, oral structuré en deux parties.',
    content: 'Organisation temporelle et logistique des épreuves.',
    tags: ['durée', 'organisation', 'oral', 'écrit'],
    url: 'https://www.education.gouv.fr/bo',
  },
  {
    id: 'eu-ai-act-education',
    title: 'AI Act article 5: usage en contexte éducatif',
    type: 'texte_officiel',
    source: 'BO',
    level: 'Niveau C',
    excerpt: 'Encadrement des usages IA et limites de certaines inférences.',
    content: 'Points de conformité et prudence pour outils éducatifs IA.',
    tags: ['conformité', 'ai', 'éducation'],
    url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=fr',
  },
];

const VIDEOS: ReferenceDoc[] = Array.from({ length: 12 }, (_, i) => ({
  id: `video-${i + 1}`,
  title: `Vidéo méthode EAF #${i + 1}`,
  type: 'video',
  source: 'YOUTUBE',
  level: i % 2 === 0 ? 'Niveau B' : 'Niveau C',
  excerpt: 'Capsule méthodologique sur l oral, le commentaire ou la dissertation.',
  content: 'Explications guidées, exemples et erreurs fréquentes.',
  tags: ['video', 'méthode', i % 2 === 0 ? 'oral' : 'écrit'],
  url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=${i + 1}`,
  mediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
}));

const AUDIOS: ReferenceDoc[] = Array.from({ length: 8 }, (_, i) => ({
  id: `audio-${i + 1}`,
  title: `Podcast littérature France Culture #${i + 1}`,
  type: 'audio',
  source: 'FRANCE_CULTURE',
  level: 'Niveau B',
  excerpt: 'Épisode de contextualisation historique et littéraire.',
  content: 'Éclairage culturel mobilisable à l entretien.',
  tags: ['audio', 'culture littéraire', 'entretien'],
  url: `https://www.radiofrance.fr/franceculture/podcasts/episode-${i + 1}`,
  mediaUrl: `https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav`,
}));

const EXEMPLES: ReferenceDoc[] = Array.from({ length: 10 }, (_, i) => ({
  id: `exemple-corrige-${i + 1}`,
  title: `Exemple corrigé commentaire #${i + 1}`,
  type: 'exemple_corrige',
  source: 'EAF_PREMIUM',
  level: i < 4 ? 'Niveau A' : 'Niveau B',
  excerpt: 'Extrait de copie corrigée avec annotations ciblées.',
  content: 'Analyse des points forts et axes d amélioration.',
  tags: ['exemple corrigé', 'commentaire', 'écrit'],
  url: `https://eaf.local/exemples/corrige-${i + 1}`,
}));

const OEUVRES: ReferenceDoc[] = [
  'Le Mariage forcé',
  "La Surprise de l'amour",
  'Déclaration des droits de la femme',
  'Les Contemplations',
  'Cahier de Douai',
  'Sido / Les Vrilles de la vigne',
  'Le Rouge et le Noir',
  'La Peau de chagrin',
  'La Peste',
  'Corpus transversal EAF',
].map((oeuvre, i) => ({
  id: `oeuvre-${i + 1}`,
  title: `Dossier œuvre: ${oeuvre}`,
  type: 'oeuvre' as const,
  source: 'EAF_PREMIUM' as const,
  level: 'Niveau A' as const,
  excerpt: 'Repères auteur, enjeux du parcours et pistes de lecture.',
  content: `Dossier synthèse sur ${oeuvre}, avec contexte, thèmes majeurs et citations utiles.`,
  tags: ['oeuvre', 'parcours', oeuvre.toLowerCase()],
  url: `https://eaf.local/oeuvres/${i + 1}`,
}));

export const OFFICIAL_REFERENCES: ReferenceDoc[] = [
  ...METHOD_SHEETS,
  ...OFFICIAL_TEXTS,
  ...VIDEOS,
  ...AUDIOS,
  ...EXEMPLES,
  ...OEUVRES,
];
