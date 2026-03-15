import { studentEcritCorrectionCopy } from './student-ecrit-correction';
import { studentLangueCopy } from './student-langue';
import { studentEcritCopy } from './student-ecrit';
import { studentOnboardingCopy } from './student-onboarding';
import { studentOralCopy } from './student-oral';
import { studentProfileCopy } from './student-profile';
import { studentPathCopy } from './student-path';
import { studentTuteurCopy } from './student-tuteur';

export const studentCopy = {
  langue: studentLangueCopy,
  ecrit: studentEcritCopy,
  ecritCorrection: studentEcritCorrectionCopy,
  descriptif: {
    loadingTitle: 'Chargement du descriptif',
    loadingDescription:
      'Les textes déjà saisis, les contrôles de répartition et les règles de couverture sont en cours de lecture.',
    heroBadge: 'Mon Descriptif de lecture',
    heroTitle:
      'Le descriptif doit devenir une carte de passage crédible pour l\u2019oral, pas une simple liste remplie à la hâte.',
    editorialLead:
      "Répartis les textes par objet d'étude, équilibre œuvres et parcours, puis sauvegarde un descriptif cohérent avec le programme officiel et réellement pilotable pour l'oral.",
    metrics: {
      texts: 'Textes',
      objects: 'Objets',
      status: 'Statut',
    },
    statusStable: 'Stable',
    statusIncomplete: 'À compléter',
    unsatisfiedRulesTitle: 'Règles non satisfaites',
    serverWarningsTitle: 'Avertissements serveur',
    addTextEyebrow: 'Ajouter un texte',
    addTextTitle: 'Enrichir le descriptif',
    objectLabels: {
      poesie: 'Poésie',
      litteratureIdees: "Littérature d'idées",
      theatre: 'Théâtre',
      roman: 'Roman',
    },
    excerptTypes: {
      work: "Extrait d'œuvre",
      path: 'Extrait du parcours',
    },
    addCta: 'Ajouter',
    titlePlaceholder: 'Titre du texte (ex: Acte I, scène 1)',
    openingLinesPlaceholder: 'Premières lignes (optionnel)',
    balanceRuleTitle: "Règle d\u2019équilibre",
    balanceRuleLead:
      "Un bon descriptif répartit les textes par objet d'étude, couvre les attendus officiels et évite les trous.",
    balanceGuidance:
      "Le but n'est pas de remplir une contrainte administrative, mais de rendre l'oral réellement défendable.",
    emptyObjectTitle: 'Aucun texte ajouté.',
    itemTypeLabels: {
      work: 'Œuvre',
      path: 'Parcours',
    },
    deleteLabel: 'Supprimer',
    saveCta: 'Sauvegarder le descriptif',
    buildTotalWarning: (total: number) => `Total insuffisant : ${total}/20 textes.`,
    buildObjectWarning: (label: string, count: number) => `${label} : ${count}/5 textes.`,
    buildWorkWarning: (work: string, count: number) => `Œuvre "${work}" : ${count}/3 extraits.`,
    buildPathWarning: (path: string, count: number) => `Parcours "${path}" : ${count}/2 extraits.`,
    buildSaveSuccess: (count: number) => `${count} textes sauvegardés.`,
  },
  quiz: {
    explanationGuidance:
      "Lis l'explication après validation : c'est elle qui transforme le score en progrès réel.",
    lowScoreGuidance:
      "Un score faible n'est pas un échec : c'est un signal pour cibler la prochaine révision.",
    page: {
      hero: {
        badge: 'Quiz adaptatif',
        title: 'Des QCM courts pour fixer les repères utiles avant qu’ils ne glissent hors du radar.',
        body:
          'Choisis un thème, ajuste la difficulté, génère un bloc de questions et transforme le résultat en signal utile pour la suite de ton parcours.',
      },
      config: {
        eyebrow: 'Configuration du quiz',
        title: 'Paramètres de séance',
        themeLabel: 'Thème',
        difficultyLabel: 'Difficulté',
        difficultyOptions: {
          easy: 'Facile — Révision des bases',
          standard: 'Intermédiaire — Niveau EAF',
          hard: 'Difficile — Entraînement exigeant',
        },
        questionsLabel: 'Nombre de questions',
        questionOptions: {
          quick: '5 questions — Rapide',
          standard: '10 questions — Standard',
          complete: '20 questions — Complet',
        },
        generating: 'Composition du quiz en cours...',
        generateCta: 'Générer',
      },
      usage: {
        eyebrow: 'Usage conseillé',
        lead: 'Lance un quiz court avant un atelier pour réactiver les repères utiles.',
      },
      summary: {
        prefix: 'Quiz :',
        buildQuestionCountLabel: (count: number) => `${count} question${count > 1 ? 's' : ''}`,
      },
      empty: {
        title: 'Le bloc de questions apparaîtra ici.',
        body:
          'Configure la séance puis génère un quiz pour passer d\u2019une intuition vague à un test rapide et exploitable.',
      },
      actions: {
        validate: 'Valider',
        scoreLabel: 'Score :',
        newQuiz: 'Nouveau quiz',
        resumeWithTutor: 'Reprendre ce thème avec le guidage',
      },
      badgePrefix: 'Badge débloqué :',
    },
  },
  path: studentPathCopy,
  tuteur: studentTuteurCopy,
  library: {
    badge: 'Bibliothèque pédagogique',
    heroTitle: 'Un fonds de travail EAF qui aide à avancer, pas un simple stock de fichiers.',
    heroBody:
      'Annales, œuvres, rapports de jury, documents et vidéos sont réunis dans un espace conçu pour réactiver vite une méthode, une œuvre ou un repère utile juste avant un atelier, un oral ou une révision ciblée.',
    activeResources: 'Ressources actives',
    managedCategories: 'Catégories pilotées',
    advisedUse: 'Usage conseillé',
    advisedUseValue: 'Court + ciblé',
    searchEyebrow: 'Recherche assistée',
    searchTitle: 'Cherche par besoin réel : œuvre, auteur, méthode, rapport ou question précise.',
    searchBody:
      'La recherche standard filtre le catalogue. La recherche RAG tente en plus de remonter les passages les plus pertinents pour ta requête.',
    resourceCountSuffix: 'ressources',
    searchLabel: 'Recherche',
    searchPlaceholder:
      'Exemple : explication linéaire, problématique dissertation, Rimbaud, rapport jury...',
    ragButtonLoading: 'Recherche…',
    ragButtonIdle: 'Recherche RAG',
    ragUnavailable: 'Recherche RAG indisponible pour le moment.',
    searchUnavailable: 'Recherche indisponible.',
    filtersLabel: 'Filtrer',
    allResources: 'Toutes les ressources',
    ragResultsEyebrow: 'Résultats RAG',
    buildRagResultsTitle: (query: string) => `Passages remontés pour “${query}”.`,
    prioritizedResultsSuffix: 'résultats priorisés',
    scoreLabel: 'score',
    catalogEyebrow: 'Catalogue vivant',
    visibleResourcesSuffix: 'ressources visibles',
    sizeUnspecified: 'Taille non précisée',
    openSheet: 'Ouvrir la fiche',
    emptyTitle: 'Aucune ressource visible avec ces filtres.',
    emptyBody: 'Élargis la recherche ou reviens à “Toutes les ressources”.',
    resourceSheet: 'Fiche ressource',
    whyOpen: "Pourquoi l'ouvrir",
    typeLabel: 'Type',
    formatLabel: 'Format',
    yearLabel: 'Année',
    actions: 'Actions',
    download: 'Télécharger',
    open: 'Ouvrir',
    resumeWithTutor: 'Reprendre cette ressource avec le guidage',
    videoPlayer: 'Lecteur vidéo',
    videoUnsupported: 'Votre navigateur ne supporte pas la lecture vidéo.',
    pdfPreview: 'Aperçu PDF',
    pdfLabel: 'PDF',
    pdfPreviewNote:
      'Aperçu rendu dans la plateforme via PDF.js. Si un document résiste au rendu, les boutons ci-dessus restent la sortie fiable.',
    descriptions: {
      annales:
        "Sujet blanc, annale ou document de cadrage pour travailler dans un format d'épreuve crédible.",
      oeuvres:
        "Texte d'œuvre au programme pour relire, annoter et réactiver les repères utiles à l'oral comme à l'écrit.",
      videos:
        'Capsule vidéo à consulter quand il faut relancer un point de méthode sans repartir de zéro.',
      jury:
        'Lecture stratégique pour comprendre ce que les correcteurs et jurys attendent réellement.',
      fallback: 'Document interne à la plateforme pour cadrer méthode, attentes et repères utiles.',
    },
  },
  dashboard: {
    badge: 'Cockpit de progression EAF',
    buildHeroTitle: (displayName: string) =>
      `${displayName}, ton tableau de bord doit toujours déboucher sur une action exploitable.`,
    writtenLabel: 'Écrit',
    oralLabel: 'Oral',
    missingDate: 'Date non renseignée',
    examPassed: 'Épreuve passée',
    heroBodyLead: 'Le signal du moment indique de remettre d’abord',
    heroBodyTail:
      'au centre, à partir de l’historique réel des séances et des attendus EAF, puis seulement ensuite d’élargir.',
    currentStrength: 'Point fort courant',
    tightenAngle: 'Angle à retendre',
    averageLevel: 'Niveau moyen',
    lastSession: 'Dernier passage',
    noSessionYet: 'pas encore de session',
    onboardingIncompleteTitle: 'Le profil n’est pas encore entièrement personnalisé.',
    onboardingIncompleteBody:
      'Finaliser l’onboarding permettra d’ancrer le cockpit sur les œuvres, le niveau déclaré et les priorités à travailler.',
    resumeOnboarding: 'Reprendre l’onboarding',
    activeStreak: 'Série active',
    trackedSessions: 'Sessions tracées',
    personalization: 'Personnalisation',
    personalizationActive: 'Active',
    personalizationPending: 'À terminer',
    strongMarker: 'Repère fort',
    ritualEyebrow: 'Rituel recommandé aujourd’hui',
    examWindow: 'Fenêtre d’épreuve',
    currentHeading: 'Cap du moment',
    openPriorityAction: 'Ouvrir l’action prioritaire',
    compassEyebrow: 'Boussole',
    compassTitle: 'Une lecture visuelle rapide de tes quatre grands axes.',
    averageLabel: 'Moyenne',
    chartPreparing: 'Préparation du graphique...',
    trajectoryEyebrow: 'Trajectoire',
    trajectoryTitle: 'La progression doit être lisible, pas seulement ressentie.',
    progressLoading: 'Chargement de la progression...',
    mappingEyebrow: 'Cartographie fine',
    mappingTitle: 'Ce que tu tiens bien, et ce qu’il faut remettre sous tension.',
    viewPath: 'Voir le parcours',
    alertsEyebrow: 'Points de vigilance remontés',
    noWeakSignals: 'Aucun signal faible fort n’est remonté sur la fenêtre récente.',
    recentActivity: 'Activité récente',
    noRecentActivity:
      'Pas encore d’activité exploitable. Lance un premier atelier pour transformer ce cockpit en vrai tableau de pilotage.',
    launchpadEyebrow: 'Lanceur',
    launchpadTitle: 'Le bon tableau de bord réduit la décision à un prochain geste clair.',
    launchpadBody:
      'Tu ne dois pas quitter cet écran avec une intention floue. Choisis un bloc, lance-le, puis reviens lire ce que la session a réellement déplacé.',
    dayPrefix: 'J-',
    coefficientLabel: 'Coefficient',
    skillMeta: {
      ecrit: {
        label: 'Écrit',
        copy: 'Structurer vite, sans perdre la tension de l’argumentation.',
      },
      oral: {
        label: 'Oral',
        copy: 'Garder une parole nette, mobile et assez solide pour tenir la relance.',
      },
      grammaire: {
        label: 'Grammaire',
        copy: 'Verrouiller les notions qui coûtent des points trop rapidement.',
      },
      lectureCursive: {
        label: 'Lecture cursive',
        copy: 'Réactiver les œuvres pour qu’elles restent disponibles à l’oral.',
      },
    },
    actions: {
      oral: [
        {
          title: 'Simulation orale guidée',
          detail: 'Remettre en route lecture, explication et relance sans te disperser.',
          duration: '15 min',
        },
        {
          title: 'Question de grammaire courte',
          detail: 'Réactiver une notion précise avant qu’elle ne sorte du radar.',
          duration: '5 min',
        },
        {
          title: 'Débrief avec Nexus',
          detail: 'Faire verbaliser ce qui a coincé et repartir avec un axe net.',
          duration: '8 min',
        },
      ],
      ecrit: [
        {
          title: 'Bloc commentaire ou dissertation',
          detail: 'Passer d’une intention vague à une structure exploitable.',
          duration: '20 min',
        },
        {
          title: 'Revoir la méthode utile',
          detail: 'Reprendre une ressource courte qui élimine les erreurs de charpente.',
          duration: '6 min',
        },
        {
          title: 'Questionner le tuteur',
          detail: 'Lever un blocage ciblé avant de relancer la production.',
          duration: '8 min',
        },
      ],
      grammaire: [
        {
          title: 'Exercice de langue ciblé',
          detail: 'Travailler le point faible sans replonger dans un tunnel théorique.',
          duration: '7 min',
        },
        {
          title: 'Retour au texte support',
          detail: 'Remettre la notion en contexte pour l’ancrer plus durablement.',
          duration: '8 min',
        },
        {
          title: 'Clarifier avec Nexus',
          detail: 'Formuler la règle, puis la réutiliser dans un cas proche.',
          duration: '8 min',
        },
      ],
      lectureCursive: [
        {
          title: 'Réouvrir une œuvre',
          detail: 'Réactiver les repères, citations et enjeux qui servent vraiment.',
          duration: '12 min',
        },
        {
          title: 'Préparer l’oral sur l’œuvre',
          detail: 'Reconnecter la lecture au futur entretien, pas à une fiche morte.',
          duration: '15 min',
        },
        {
          title: 'Faire émerger les enjeux',
          detail: 'Utiliser Nexus pour transformer une lecture floue en matière exploitable.',
          duration: '8 min',
        },
      ],
    },
    focus: {
      oral: {
        eyebrow: 'Axe dominant du moment',
        title: 'Stabiliser ta prise de parole avant d’augmenter le volume de travail.',
        detail: 'L’oral se gagne sur l’enchaînement des gestes justes, pas sur des sessions trop longues.',
      },
      ecrit: {
        eyebrow: 'Axe dominant du moment',
        title: 'Sécuriser la charpente de l’écrit avant de chercher plus d’ampleur.',
        detail: 'Quand la structure tient, les progrès deviennent enfin cumulables.',
      },
      grammaire: {
        eyebrow: 'Axe dominant du moment',
        title: 'Verrouiller le point de langue qui fait perdre des points trop vite.',
        detail: 'La bonne séance de grammaire est courte, contextualisée et immédiatement réutilisable.',
      },
      lectureCursive: {
        eyebrow: 'Axe dominant du moment',
        title: 'Réactiver les œuvres pour retrouver de la matière à l’oral et à l’écrit.',
        detail: 'La lecture utile n’est pas exhaustive: elle remet en circulation les repères décisifs.',
      },
    },
    launchpad: {
      oral: {
        title: 'Atelier oral',
        detail: 'Lecture, explication, entretien: repartir sur une séquence complète.',
      },
      ecrit: {
        title: 'Atelier écrit',
        detail: 'Commentaire, dissertation ou sujet blanc selon le besoin réel.',
      },
      library: {
        title: 'Bibliothèque',
        detail: 'Ressources courtes pour relancer méthode, œuvres et repères utiles.',
      },
      tutor: {
        title: 'Tuteur Nexus',
        detail: 'Débloquer une difficulté précise au lieu de tourner en rond.',
      },
    },
    momentum: {
      incompleteLabel: 'Lecture encore incomplète',
      incompleteDetail:
        'Le tableau de bord a besoin de davantage de sessions pour dégager une tendance propre.',
      upLabel: 'Trajectoire en hausse',
      buildUpDetail: (delta: number) =>
        `Tu gagnes ${delta.toFixed(1)} point sur la dernière fenêtre utile. Continue sans changer de méthode trop tôt.`,
      downLabel: 'Trajectoire à resserrer',
      buildDownDetail: (delta: number) =>
        `Tu perds ${Math.abs(delta).toFixed(1)} point. Mieux vaut réduire la dispersion et revenir à un bloc plus simple.`,
      stableLabel: 'Rythme stable',
      stableDetail:
        'La progression existe, mais elle demande encore quelques sessions pour devenir franchement lisible.',
    },
    evaluationPrefix: 'Évaluation',
    navigationPrefix: 'Passage par',
  },
  onboarding: studentOnboardingCopy,
  oral: studentOralCopy,
  profile: studentProfileCopy,
  carnet: {
    unavailableTitle: "Carnet indisponible pour l'instant",
    heroBadge: 'Carnet de lecture',
    heroTitle: 'Un lieu pour garder les œuvres vivantes, pas seulement les résumer.',
    heroBodyLead: 'Note une citation, une réaction, un lien culturel ou un mini résumé.',
    stats: {
      entries: 'Entrées',
      works: 'Œuvres',
      export: 'Export',
      exportCta: 'Export PDF',
    },
    newEntryEyebrow: 'Nouvelle entrée',
    editorialTitle: "Noter pendant que c'est encore vivant",
    editorialBody:
      "Le carnet sert à préparer l'entretien et à retrouver vite une matière personnelle quand il faut reparler d'une œuvre.",
    typeLabels: {
      citation: 'Citation',
      note: 'Note',
      reaction: 'Réaction',
      resume: 'Résumé',
      lienCulturel: 'Lien culturel',
    },
    workPlaceholder: 'Œuvre',
    pagePlaceholder: 'Page (optionnel)',
    pagePrefix: 'p.',
    tagsPlaceholder: 'Tags séparés par virgules',
    contentPlaceholder: 'Contenu',
    addCta: 'Ajouter',
    notesDistributionTitle: 'Répartition des notes',
    loadingTitle: 'Chargement du carnet',
    loadingDescription:
      'Les entrées, les regroupements par œuvre et les statistiques de notes sont en cours de préparation.',
    emptyTitle: 'Aucune entrée pour le moment.',
    emptyDescription:
      'Commence par une citation, une réaction ou un lien culturel. Le carnet prend de la valeur quand il reste personnel et précis.',
    requiredFieldsError: 'Œuvre et contenu sont obligatoires.',
    fetchFailedError: 'Chargement du carnet impossible.',
    createFailedError: 'Enregistrement impossible.',
    saveError: "Erreur d'enregistrement.",
    loadError: 'Erreur de chargement.',
    buildEntryCount: (count: number) => `${count} entrée${count > 1 ? 's' : ''}`,
  },
} as const;
