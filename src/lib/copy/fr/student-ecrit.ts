export const studentEcritCopy = {
  usageGuidance: "Le bon usage de l'atelier écrit n'est pas de collectionner des sujets.",
  workflowGuidance:
    'Il sert à produire une copie, lire un retour structuré puis réinjecter ce retour dans la séance suivante.',
  processingSteps: ['Lecture de la copie…', 'Analyse littéraire…', 'Rédaction du bilan…'],
  stepPrefix: 'Étape',
  hero: {
    badge: 'Atelier écrit',
    title: 'Un studio d’entraînement pour produire, déposer et relire comme dans un vrai cycle de travail EAF.',
    body:
      'Génère un sujet blanc, dépose une copie propre et récupère une correction détaillée sans te disperser entre dix écrans. L’interface suit un seul objectif : te faire passer d’une intention floue à un rapport exploitable.',
    status: {
      subjectLabel: 'Sujet',
      subjectReady: 'Prêt',
      subjectPending: 'À générer',
      copyLabel: 'Copie',
      copyLoaded: 'Chargée',
      copyPending: 'En attente',
      reportLabel: 'Rapport',
      reportAvailable: 'Disponible',
      reportAnalyzing: 'En analyse',
      reportPending: 'À venir',
    },
  },
  studioSteps: [
    {
      index: '01',
      title: 'Générer un sujet crédible',
      body:
        'Choisis le format, précise l’œuvre ou le thème si besoin, puis lance un sujet blanc exploitable immédiatement.',
    },
    {
      index: '02',
      title: 'Déposer la copie',
      body:
        'Ajoute un PDF ou des photos propres. La plateforme suit l’upload puis enclenche une lecture détaillée de la copie.',
    },
    {
      index: '03',
      title: 'Récupérer le rapport',
      body:
        'Une fois l’analyse terminée, tu ouvres le rapport détaillé pour travailler le prochain axe utile.',
    },
  ],
  generation: {
    stepEyebrow: 'Étape 1',
    title: 'Générer un sujet d’épreuve blanche.',
    body:
      'Le sujet doit être suffisamment cadré pour lancer un vrai travail, mais assez souple pour coller à l’œuvre ou au thème que tu veux réactiver.',
    typeLabel: 'Type',
    typeOptions: {
      commentaire: 'Commentaire',
      dissertation: 'Dissertation',
      contractionEssai: 'Contraction / essai',
    },
    workLabel: 'Œuvre (optionnelle)',
    workPlaceholder: 'Ex. : Sido',
    themeLabel: 'Thème (optionnel)',
    themePlaceholder: 'Ex. : la mémoire',
    generateLoading: 'Génération…',
    generateIdle: 'Générer mon sujet',
    gradingEyebrow: 'Barème',
    pointsSuffix: 'pts',
    changeSubject: 'Changer de sujet',
  },
  upload: {
    stepEyebrow: 'Étape 2',
    title: 'Déposer ma copie',
    body:
      'Une photo nette ou un PDF propre suffit. Le studio suit l’upload, puis bascule vers l’analyse sans changer de contexte.',
    analyzingTitle: 'Analyse de la copie en cours…',
    dropTitle: 'Dépose ta copie ici',
    dropHint: 'PDF, JPG, PNG ou WEBP (20 Mo max)',
    chooseFile: 'Choisir un fichier',
    photo: 'Photo',
    selectFileAria: 'Sélectionner un fichier de copie',
    takePhotoAria: 'Prendre une photo de copie',
    sizeUnit: 'Mo',
    fileTypePdf: 'PDF',
    fileTypeImage: 'Image',
    previewAlt: 'Aperçu de la copie',
    pdfReady: 'PDF prêt à l’envoi',
    uploadInProgressPrefix: 'Upload en cours…',
    launchCorrection: 'Lancer la correction détaillée',
    completeTitle: 'Correction terminée !',
    completeBody:
      'Le rapport est prêt. Ouvre-le pendant que les points de correction sont encore frais.',
    viewReport: 'Voir mon rapport',
    prepareRevision: 'Préparer le retravail avec le guidage',
  },
  sidebar: {
    workframeEyebrow: 'Cadre de travail',
    workframeItems: [
      'Utilise un sujet à la fois pour garder une correction lisible.',
      'Privilégie des photos nettes, plates, bien éclairées.',
      'Relis le rapport immédiatement pour transformer le feedback en prochaine action.',
    ],
    whyTitle: 'Pourquoi cette page existe',
    whySubtitle: 'Écrire, déposer, corriger, puis retravailler',
    activeSubjectEyebrow: 'Sujet actif',
    buildGeneratedAtLabel: (formattedDate: string) => `Généré le ${formattedDate}`,
    readySubject: 'Sujet prêt à être travaillé.',
    questionWithGuidance: 'Questionner le sujet avec le guidage',
  },
  errors: {
    uploadFailure: 'Échec du dépôt de copie.',
    invalidResponse: 'Réponse invalide du serveur.',
    uploadNetwork: 'Erreur réseau pendant le dépôt.',
    generateUnavailable: 'Impossible de générer un sujet pour le moment.',
    unknown: 'Erreur inconnue.',
    detailedCorrectionFailed:
      'La correction détaillée a échoué. Vous pouvez relancer avec une nouvelle copie.',
    uploadGeneric: 'Erreur d’upload.',
  },
  badgePrefix: 'Badge débloqué :',
} as const;
