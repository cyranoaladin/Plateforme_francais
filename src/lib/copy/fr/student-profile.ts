export const studentProfileCopy = {
  fallbackDisplayName: 'Élève',
  loadingDateFallback: 'Date à préciser',
  errors: {
    loadImpossible: 'Chargement du profil impossible.',
    genericLoad: 'Erreur de chargement du profil.',
  },
  skillMeta: {
    ecrit: {
      label: 'Écrit',
      copy: 'Construire plus vite une réponse solide, sans perdre la tension du sujet.',
    },
    oral: {
      label: 'Oral',
      copy: 'Tenir la lecture, l’explication et la relance avec plus de fluidité.',
    },
    grammaire: {
      label: 'Grammaire',
      copy: 'Stabiliser les notions qui font perdre des points trop vite.',
    },
    lectureCursive: {
      label: 'Lecture cursive',
      copy: 'Garder les œuvres et leurs enjeux disponibles au moment utile.',
    },
  },
  hero: {
    badge: 'Profil de progression EAF',
    titleSuffix: ', ton profil doit te dire où appuyer, pas seulement où tu en es.',
    body:
      'Le rôle de cette page est de condenser ton état réel: compétences les plus stables, erreurs récurrentes, tâches immédiates et badges déjà acquis.',
    averageLabel: 'Niveau moyen:',
    strongestLabel: 'Point fort:',
    weakestLabel: 'Axe à retendre:',
    updatedLabel: 'Mise à jour:',
    openPathCta: 'Ouvrir mon parcours',
    unlockPointCta: 'Débloquer un point précis',
    metricCards: {
      streak: 'Série active',
      sessions: 'Sessions',
      copies: 'Copies',
      badges: 'Badges',
      streakUnit: 'jours',
    },
    globalSignalEyebrow: 'Signal global',
  },
  signals: {
    strongBase: {
      label: 'Base solide',
      detail:
        'Le profil est déjà crédible. L’enjeu est maintenant de rendre la régularité plus nette que l’intensité.',
    },
    engagedProgress: {
      label: 'Progression engagée',
      detail:
        'Le niveau est intermédiaire mais exploitable. Les gains viendront surtout d’un meilleur ciblage, pas d’un volume aveugle.',
    },
    priorityRelaunch: {
      label: 'Relance prioritaire',
      detail:
        'Le profil montre un besoin de réamorçage sur les bases. Il faut réduire la dispersion et remettre le bon axe au centre.',
    },
  },
  cartography: {
    eyebrow: 'Cartographie actuelle',
    title: 'Quatre axes lisibles, pour éviter une lecture floue de tes progrès.',
    strongAxisEyebrow: 'Axe fort',
    strongAxisBody: 'C’est là que le niveau est le plus naturellement stable aujourd’hui.',
    priorityAxisEyebrow: 'Axe prioritaire',
    priorityAxisBody: 'C’est l’endroit où une séance bien choisie rapportera le plus vite.',
  },
  vigilance: {
    eyebrow: 'Points de vigilance',
    title: 'Les erreurs récurrentes doivent rester visibles, pas seulement ressenties.',
    emptyState:
      'Aucune erreur récurrente forte n’est remontée pour l’instant. Continue à alimenter le profil avec des ateliers et des évaluations réelles.',
    countSuffix: 'occurrences',
  },
  next72h: {
    eyebrow: '72 prochaines heures',
    title: 'Les prochaines tâches doivent être courtes, claires et immédiatement lançables.',
    priorityLabels: {
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible',
    },
    durationUnit: 'min',
    separator: '·',
    emptyState:
      'Le plan court n’est pas encore suffisamment renseigné. Passe par le parcours ou le guidage de parcours pour faire émerger les prochaines actions utiles.',
    viewPlanCta: 'Voir tout le plan',
    askFollowUpCta: 'Demander une relance',
  },
  badges: {
    eyebrow: 'Badges et traces positives',
    title: 'Les marqueurs de progression comptent aussi pour soutenir la constance.',
    activeSuffix: 'badges actifs',
    emptyState:
      'Aucun badge n’est encore enregistré. Les premiers arrivent vite dès que la régularité et les ateliers commencent à se cumuler.',
    cardBody:
      'Trace de progression utile: ce badge matérialise une régularité ou un passage de seuil déjà atteint.',
  },
} as const;
