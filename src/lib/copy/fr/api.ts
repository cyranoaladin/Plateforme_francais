export const apiCopy = {
  auth: {
    tooManyAttempts: 'Trop de tentatives. Réessayez plus tard.',
    forgotPasswordSent:
      'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.',
    invalidCredentials: 'Email ou mot de passe incorrect.',
    emailAlreadyExists: 'Un compte existe déjà pour cet email.',
    resetInvalidLink: 'Lien de réinitialisation invalide.',
    resetUsedLink: 'Ce lien a déjà été utilisé.',
    resetExpiredLink: 'Ce lien a expiré. Veuillez refaire une demande.',
    resetSuccess: 'Mot de passe réinitialisé. Vous pouvez vous connecter.',
  },
  billing: {
    invalidFeature: 'Fonctionnalité invalide.',
  },
  common: {
    unauthenticated: 'Non authentifié.',
    accessDenied: 'Accès refusé.',
    unavailableResource: 'Ressource non disponible.',
    notFound: 'Ressource non trouvée.',
  },
  resources: {
    missingPath: 'Chemin de ressource manquant.',
    upgradeRequired: 'Ressource réservée aux abonnés Premium ou Pro.',
    readError: 'Erreur de lecture du fichier.',
  },
  rag: {
    tooManySearches: 'Trop de recherches. Réessayez dans quelques secondes.',
  },
  uploads: {
    tooManySubmissions: 'Trop de soumissions. Réessayez dans 1 heure.',
    missingFile: 'Fichier manquant.',
    fileTooLarge: (maxMb: number) => `Fichier trop volumineux (max ${maxMb}MB).`,
    unsupportedFileType: 'Type de fichier non supporté.',
    transcriptionUnavailable: 'La transcription vocale serveur est indisponible pour le moment.',
  },
  copies: {
    profileNotFound: 'Profil introuvable.',
    resourceNotFound: 'Ressource non disponible.',
    fileUnavailable: 'Fichier indisponible.',
    reportUnavailable: 'Rapport indisponible.',
    correctionQueueUnavailable:
      "La correction n'a pas pu être planifiée pour le moment. Réessaie dans quelques minutes.",
  },
  redeemCode: {
    rateLimited: 'Trop de tentatives. Réessaie plus tard.',
    invalidBody: 'Corps de requête invalide.',
    missingCode: 'Le champ "code" est requis.',
    internalError: 'Erreur interne. Réessaie dans quelques instants.',
  },
  payments: {
    callbackForbidden: 'Accès refusé.',
    signatureInvalid: 'Signature invalide.',
    missingParams: 'Paramètres manquants.',
    callbackError: 'Erreur traitement callback.',
    userNotFound: 'Utilisateur introuvable.',
    initFailed: 'Impossible d\'initier le paiement. Réessayez.',
    publicStatusMissingParam: 'Paramètre orderRef ou orderId requis.',
    publicStatusNotFound: 'Transaction introuvable.',
    publicStatusError: 'Impossible de vérifier le statut du paiement.',
    statusLoadError: 'Impossible de charger le statut de facturation.',
  },
  cron: {
    serverMisconfigured: 'Le serveur est mal configuré.',
    unauthorized: 'Accès refusé.',
    databaseUnavailable: 'Base de données indisponible.',
  },
  comments: {
    manualUnavailable: 'Commentaire manuel indisponible sans base PostgreSQL.',
    outOfClass: 'Copie hors de votre classe ou code classe non configuré.',
  },
  metrics: {
    rateLimitExceeded: 'Trop de requêtes. Réessayez plus tard.',
    invalidBody: 'Body JSON invalide.',
    invalidPayload: 'Payload invalide.',
  },
  quiz: {
    rateLimited: 'Trop de quiz générés. Réessaie dans quelques minutes.',
    generationError: 'Impossible de générer le quiz. Réessayez.',
    generatorFailed:
      "Le générateur de quiz n'a pas pu produire de questions. Réessayez.",
  },
  tutor: {
    tooManyMessages: 'Trop de messages. Réessayez dans quelques minutes.',
  },
  oral: {
    invalidPhase: 'Phase invalide.',
    tooManySessions: 'Trop de sessions orales. Réessayez dans 1 heure.',
    evaluationQuotaExceeded: (scope: string) =>
      `Limite atteinte pour cette evaluation orale (${scope}). Réessayez plus tard.`,
    extractSelectionError: "Erreur lors de la sélection de l'extrait.",
    sessionCreationError: 'Erreur lors de la création de la session.',
    internalServerError: 'Erreur interne du serveur.',
    emptySessionCannotBeFinalized: "Impossible de finaliser une session orale sans interaction.",
    sessionAlreadyFinalized: 'Cette session orale est déjà finalisée.',
    ttsUnavailableTextOnly: "La voix de l'examinateur est indisponible pour le moment. La relance reste disponible en texte.",
  },
} as const;
