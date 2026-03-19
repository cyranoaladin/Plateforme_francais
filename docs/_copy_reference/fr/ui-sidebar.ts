export const uiSidebarCopy = {
  desktop: {
    brand: {
      title: 'Nexus Réussite',
      subtitle: 'Cockpit élève EAF',
      body: 'Travail guidé, progression lisible, matière exploitable.',
    },
    stats: {
      daysToExam: 'J-EAF',
      streak: 'Série',
      badges: 'Badges',
    },
    sections: {
      pilotage: {
        title: 'Pilotage',
        description: 'Voir où tu en es et quoi lancer ensuite.',
      },
      ateliers: {
        title: 'Ateliers',
        description: 'Pratique guidée, évaluée et relancée selon le parcours.',
      },
      resources: {
        title: 'Ressources',
        description: 'Matière personnelle et supports à exploiter.',
      },
    },
    nav: {
      dashboard: { label: 'Tableau de bord', hint: 'Vue d’ensemble' },
      path: { label: 'Mon Parcours', hint: 'Plan de progression' },
      profile: { label: 'Profil', hint: 'Cap et repères' },
      tuteur: { label: 'Tuteur de parcours', hint: 'Question guidée' },
      ecrit: { label: 'Atelier Écrit', hint: 'Sujet, copie, rapport' },
      oral: { label: 'Atelier Oral', hint: 'Simulation officielle' },
      langue: { label: 'Atelier Langue', hint: 'Grammaire ciblée' },
      quiz: { label: 'Quiz', hint: 'Ancrage rapide' },
      carnet: { label: 'Carnet', hint: 'Notes personnelles' },
      library: { label: 'Bibliothèque', hint: 'Corpus et médias' },
    },
  },
  mobile: {
    nav: {
      home: { label: 'Accueil' },
      tuteur: { label: 'Tuteur' },
      oral: { label: 'Oral' },
      quiz: { label: 'Quiz' },
      carnet: { label: 'Carnet' },
      path: { label: 'Parcours' },
      profile: { label: 'Profil' },
    },
  },
  shell: {
    currentTrajectory: 'Trajectoire actuelle',
    targetScorePrefix: 'Objectif visé :',
    themeToggleAria: 'Basculer le thème',
    settingsAria: 'Paramètres',
    logoutAria: 'Se déconnecter',
    connectedSpace: 'Espace connecté EAF',
    fallbackStudent: 'Élève',
  },
} as const;
