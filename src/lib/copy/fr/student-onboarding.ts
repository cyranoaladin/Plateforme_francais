export const studentOnboardingCopy = {
  aria: {
    stepRail: 'Étapes de l’onboarding',
  },
  common: {
    missingValue: 'À renseigner',
  },
  header: {
    badge: 'Onboarding 2026',
    returnHome: 'Revoir l’accueil',
    duration: 'Environ 3 minutes',
  },
  hero: {
    badge: 'Mise en route premium',
    title: 'Nous réglons la plateforme autour de ton vrai contexte.',
    body:
      'L’objectif n’est pas de remplir un profil pour la forme. L’objectif est de caler les premiers ateliers sur tes œuvres, ton rythme, tes points d’appui et les attendus officiels dès la première connexion.',
    chips: ['Modifiable plus tard', 'Parcours personnalisé', 'Aucune configuration inutile'],
    summaryEyebrow: 'Ce que Nexus a déjà compris',
    summaryCards: {
      profileTitle: 'Profil',
      corpusTitle: 'Corpus',
      prioritiesTitle: 'Priorités',
      missingName: 'Nom affiché à renseigner',
      missingClass: 'Classe à confirmer',
      buildCorpusCount: (count: number) => `${count} œuvre(s) et parcours déjà pris en compte`,
      noCorpus: 'Aucune œuvre du programme sélectionnée pour l’instant',
      noPriorities: 'Aucune faiblesse auto-déclarée forte à ce stade',
    },
    privacyNote:
      'Les informations saisies ici servent à cadrer les premières recommandations, les ressources mobilisées et la progression visible. Elles restent modifiables ensuite dans le profil.',
  },
  stepLabels: ['Profil', 'Œuvres', 'Auto-évaluation'],
  stepMeta: {
    1: {
      kicker: 'Étape 1',
      title: 'Installe le contexte réel de travail.',
      description:
        'Nom affiché, classe, date EAF, établissement et code enseignant éventuel : on règle d’abord le terrain, pas l’interface.',
      benefit: 'Ces données servent à personnaliser le parcours dès la première séance.',
    },
    2: {
      kicker: 'Étape 2',
      title: 'Rattache le produit à tes œuvres réelles.',
      description:
        'Le corpus et les relances ont plus de valeur si les œuvres étudiées sont connues dès le départ.',
      benefit: 'Tu peux sélectionner les œuvres officielles et ajouter une œuvre absente si besoin.',
    },
    3: {
      kicker: 'Étape 3',
      title: 'Calibre le point de départ sans te juger.',
      description:
        'Cette auto-évaluation ne remplace pas un diagnostic. Elle permet juste d’éviter un premier parcours mal ciblé.',
      benefit: 'Les axes faibles déclarés seront utilisés pour prioriser les prochains ateliers.',
    },
  },
  worksCatalog: [
    { id: 'douai', title: 'Cahier de Douai', author: 'Arthur Rimbaud', type: 'Poésie' },
    { id: 'ponge', title: 'La Rage de l’expression', author: 'Francis Ponge', type: 'Poésie' },
    { id: 'dorion', title: 'Mes forêts', author: 'Hélène Dorion', type: 'Poésie' },
    {
      id: 'boetie',
      title: 'Discours de la servitude volontaire',
      author: 'Étienne de La Boétie',
      type: 'Littérature d’idées',
    },
    {
      id: 'fontenelle',
      title: 'Entretiens sur la pluralité des mondes',
      author: 'Fontenelle',
      type: 'Littérature d’idées',
    },
    {
      id: 'graffigny',
      title: 'Lettres d’une Péruvienne',
      author: 'Françoise de Graffigny',
      type: 'Littérature d’idées',
    },
    { id: 'menteur', title: 'Le Menteur', author: 'Pierre Corneille', type: 'Théâtre' },
    { id: 'musset', title: 'On ne badine pas avec l’amour', author: 'Alfred de Musset', type: 'Théâtre' },
    { id: 'sarraute', title: 'Pour un oui ou pour un non', author: 'Nathalie Sarraute', type: 'Théâtre' },
    { id: 'prevost', title: 'Manon Lescaut', author: 'Abbé Prévost', type: 'Roman' },
    { id: 'peau', title: 'La Peau de chagrin', author: 'Honoré de Balzac', type: 'Roman' },
    { id: 'sido', title: 'Sido / Les Vrilles de la vigne', author: 'Colette', type: 'Roman' },
  ],
  classLevels: [
    'Première générale',
    'Première technologique',
    'Première STMG',
    'Première ST2S',
    'Première STI2D',
    'Première STL',
  ],
  profile: {
    nameLabel: 'Nom affiché',
    namePlaceholder: 'Comment veux-tu apparaître dans la plateforme ?',
    classLabel: 'Classe',
    eafDateLabel: 'Date EAF',
    establishmentLabel: 'Établissement',
    establishmentPlaceholder: 'Nom de ton lycée',
    classCodeLabel: 'Code classe enseignant',
    classCodePlaceholder: 'Ex. : PMF-1G2-2026',
    previewEyebrow: 'Prévisualisation',
    previewNameLabel: 'Nom',
    previewClassLabel: 'Classe',
    previewDeadlineLabel: 'Échéance',
  },
  works: {
    searchPlaceholder: 'Rechercher une œuvre, un auteur, un objet d’étude...',
    selectionEyebrow: 'Sélection en cours',
    missingWorkLabel: 'Œuvre absente de la liste',
    missingWorkPlaceholder: 'Saisis exactement l’œuvre donnée par ton professeur',
    oralWorkTitle: 'Ton œuvre d’entretien oral',
    oralWorkBody: 'Œuvre intégrale pour la 2e partie de l’oral (8 points sur 20).',
  },
  evaluation: {
    skillLabels: {
      comprehension: 'Compréhension du texte',
      procedes: 'Analyse des procédés',
      plan: 'Organisation du plan',
      lecture: 'Lecture expressive',
      grammaire: 'Grammaire',
      culture: 'Culture / œuvre & parcours',
    },
    initialGuidance: 'Réglage initial pour prioriser les prochains ateliers.',
    fragile: 'Fragile',
    solid: 'Solide',
    detectedPriorityEyebrow: 'Priorisation détectée',
    buildDetectedPriority: (weakSignals: string[]) =>
      `Le parcours mettra d’abord l’accent sur : ${weakSignals.join(', ')}.`,
    noDetectedPriority:
      'Aucune faiblesse forte auto-déclarée. Le parcours pourra commencer sur une base plus équilibrée.',
  },
  footer: {
    backCta: 'Retour',
    stepPrefix: 'Étape',
    stepSuffix: 'sur 3',
    submitting: 'Enregistrement...',
    continueCta: 'Continuer',
    finishCta: 'Terminer',
  },
  errors: {
    securityRefresh: 'Sécurité : rafraîchis la page puis réessaie.',
    defaultWelcome: 'Ton parcours est prêt.',
    finishUnavailable: 'Impossible de finaliser l’onboarding. Réessaie.',
  },
} as const;
