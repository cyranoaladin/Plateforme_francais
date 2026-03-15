export const studentPathCopy = {
  fallbackDate: 'Date à préciser',
  errors: {
    generationUnavailable: 'Génération du parcours indisponible.',
    genericLoad: 'Erreur de chargement.',
  },
  hero: {
    badge: 'Feuille de route Nexus',
    title: 'Ton parcours doit rendre la semaine lisible avant de la rendre ambitieuse.',
    buildBody: (displayName?: string) =>
      `${displayName ? `${displayName}, ` : ''}ici, le plan transforme le profil, l’historique de travail et les attendus officiels en blocs concrets: quoi lancer, dans quel ordre, et comment reprendre sans perdre le fil.`,
    launchNextCta: 'Lancer la prochaine activité',
    openWorkshopCta: 'Ouvrir un atelier',
    returnDashboardCta: 'Retour dashboard',
  },
  metrics: {
    framedWeeks: 'Semaines cadrées',
    plannedBlocks: 'Blocs prévus',
    checkedBlocks: 'Blocs cochés',
    progress: 'Avancement',
  },
  loading: 'Chargement du plan personnalisé à partir du profil et des activités déjà réalisées...',
  priorities: {
    eyebrow: 'Priorités immédiates',
    title: 'Les trois prochains blocs qui méritent d’ouvrir la semaine.',
    sourceBadge: 'Plan nourri par le travail réel',
    levels: {
      high: 'Priorité haute',
      medium: 'Priorité moyenne',
      low: 'Priorité basse',
    },
    buildMeta: (estimatedMinutes: number, dueDateLabel: string) => `${estimatedMinutes} min · ${dueDateLabel}`,
  },
  week: {
    eyebrowPrefix: 'Semaine',
    progressLabel: 'Avancement',
    buildCheckedActivities: (completed: number, total: number) => `${completed} / ${total} activités cochées`,
    checkedActivitiesSuffix: 'activités cochées',
    openCta: 'Ouvrir',
  },
  empty: {
    eyebrow: 'Parcours indisponible',
    title: 'Il n’y a pas encore assez de matière pour composer une feuille de route utile.',
    body:
      'Termine l’onboarding, lance un premier atelier, puis reviens ici pour afficher un parcours plus net et réellement personnalisé.',
    finishOnboardingCta: 'Terminer l’onboarding',
    openTutorCta: 'Ouvrir le guidage',
  },
  sidebar: {
    eyebrow: 'Cap du moment',
    title: 'Une vue compacte pour reprendre le plan sans inertie.',
    globalProgressLabel: 'Progression globale',
    buildGlobalProgress: (completed: number, total: number) =>
      `${completed} blocs validés sur ${total}. L’objectif est de garder une cadence tenable, pas de cocher pour cocher.`,
    nextBlockEyebrow: 'Prochain bloc conseillé',
    noPendingTitle: 'Aucun bloc en attente pour le moment.',
    noPendingDetail: 'Le plan courant est entièrement coché ou pas encore généré.',
    buildNextBlockDetail: (duration: string, weekNumber: number) => `${duration} · semaine ${weekNumber}`,
    launchBlockCta: 'Lancer ce bloc',
    cards: {
      dashboard: {
        title: 'Revenir au dashboard',
        detail: 'Reprendre les signaux récents et vérifier ce que la dernière session a bougé.',
      },
      tutor: {
        title: 'Débloquer un passage précis',
        detail: 'Utiliser le guidage de parcours pour débloquer un passage avant de relancer la semaine.',
      },
    },
  },
  skills: {
    eyebrow: 'Niveau de départ',
    title: 'Le parcours doit rester cohérent avec le profil mesuré.',
    labels: {
      ecrit: 'Écrit',
      oral: 'Oral',
      grammaire: 'Grammaire',
      lectureCursive: 'Lecture cursive',
    },
  },
  activityTypes: {
    oral: 'Oral',
    grammaire: 'Grammaire',
    langue: 'Langue',
    ecrit: 'Écrit',
    lecture: 'Lecture',
    revisions: 'Révisions',
    fiches: 'Fiches',
    quiz: 'Quiz',
    organisation: 'Organisation',
  },
} as const;
