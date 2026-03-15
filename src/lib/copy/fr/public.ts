import { publicHeaderCopy } from './public-header';
import { publicLandingFooterCopy } from './public-landing-footer';
import { publicPaymentCopy } from './public-payment';
import { publicFooterCopy } from './public-footer';
import { publicHomeCopy } from './public-home';
import { publicLegalCopy } from './public-legal';
import { publicPricingPageCopy } from './public-pricing-page';

export const publicCopy = {
  home: publicHomeCopy,
  header: publicHeaderCopy,
  landingFooter: publicLandingFooterCopy,
  legacyLandingHero: {
    badge: '🇫🇷 Plateforme de préparation aux EAF',
    titleLead: 'Maîtrisez le français',
    titleAccent: 'en 8 semaines',
    subtitle: "Tuteur IA 24/7 + Corrections d'experts + Progression garantie",
    primaryCta: 'Essai gratuit 7 jours',
    secondaryCta: '▶ Voir les tarifs',
    rating: '⭐ 4.8/5 (2,341 avis)',
    socialProofs: ['✓ 12,450 élèves', '✓ 94% taux de réussite'],
  },
  legacyLandingHeader: {
    brand: 'Nexus Réussite',
    toggleMenuAriaLabel: 'Toggle menu',
    nav: {
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      faq: 'FAQ',
    },
    loginCta: 'Connexion',
    primaryCta: 'Essai gratuit',
  },
  legacyLandingPricing: {
    title: 'Tarifs transparents, flexibles',
    subtitle: 'Choisissez ce qui vous convient',
    tiers: [
      {
        id: 'apprenti',
        name: 'Free',
        symbol: '📚',
        price: '0 TND',
        period: 'pour toujours',
        description: 'Débuter votre parcours',
        features: [
          '3 corrections écrites / mois',
          'OCR 2 copies / mois',
          '10 échanges guidés / jour',
          'Échantillon de bibliothèque',
          'Support FAQ',
        ],
        cta: 'Commencer mon parcours',
        highlight: false,
      },
      {
        id: 'developpement',
        name: 'Premium',
        symbol: '🚀',
        price: '99 TND',
        period: '/mois',
        description: "Progresser vers l'excellence",
        badge: 'Le plus choisi par les élèves',
        features: [
          '20 corrections écrites / mois',
          '100 échanges guidés / jour',
          'OCR 20 copies / mois',
          'Parcours personnalisé',
          'Accès bibliothèque complète',
          'Support email',
        ],
        cta: 'Commencer en Premium',
        highlight: true,
      },
      {
        id: 'maitrise',
        name: 'Pro',
        symbol: '👑',
        price: '129 TND',
        period: '/mois',
        description: 'Atteindre la maîtrise',
        features: [
          'Oral illimité',
          'Corrections écrites illimitées',
          'OCR 50 copies / mois',
          'Graph RAG avancé',
          'Historique oral complet',
          'Support prioritaire',
        ],
        cta: 'Passer en Pro',
        highlight: false,
      },
    ],
    helpLead: 'Besoin d’aide ?',
    helpFaqCta: 'Consultez notre FAQ',
    helpConjunction: 'ou',
    helpContactCta: 'contactez notre équipe',
  },
  legacyLandingFaq: {
    title: 'Questions fréquentes',
    subtitle: 'Tout ce que vous devez savoir',
    items: [
      {
        question: 'Comment fonctionne le tuteur IA ?',
        answer:
          "Notre tuteur IA analyse votre texte en temps réel et fournit des suggestions personnalisées sur la grammaire, le style, la structure argumentative et la cohérence. Il s'adapte à votre niveau et à vos points faibles.",
      },
      {
        question: 'Puis-je annuler mon abonnement ?',
        answer:
          "Oui, vous pouvez annuler à tout moment. Votre accès reste actif jusqu'à la fin de la période payée. Aucun frais de résiliation.",
      },
      {
        question: "Qu'est-ce qui est inclus dans chaque tier ?",
        answer:
          'Free : 3 corrections écrites/mois, OCR 2 copies/mois, 10 échanges guidés/jour et un échantillon de bibliothèque. Premium : 20 corrections/mois, OCR 20 copies/mois et bibliothèque complète. Pro : tout Premium avec quotas intensifs et support prioritaire.',
      },
      {
        question: 'Combien de corrections IA par mois ?',
        answer:
          'Free : 3 corrections écrites/mois. Premium : 20/mois. Pro : illimitées. Chaque correction inclut feedback détaillé sur la méthode, la structure et les axes de reprise.',
      },
      {
        question: "Est-ce que ça prépare bien à l'EAF ?",
        answer:
          'Oui ! Notre plateforme suit le programme officiel EAF 2026. 94% de nos élèves obtiennent leur note cible ou mieux. Nous couvrons écrit, oral, grammaire et méthodologie.',
      },
      {
        question: "Comment fonctionne la période d'essai gratuit ?",
        answer:
          'Le plan Free permet déjà de tester le vrai workflow sans carte bancaire : onboarding, premiers ateliers et échantillon de bibliothèque. Vous montez ensuite en Premium ou Pro seulement si le volume de travail le justifie.',
      },
      {
        question: 'Peut-on changer de tier ?',
        answer:
          'Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement avec ajustement au prorata.',
      },
      {
        question: 'Y a-t-il des ressources supplémentaires ?',
        answer:
          "Oui. La bibliothèque réunit annales EAF, œuvres au programme, vidéos explicatives, documents extraits et rapports de jury. Le plan Free donne accès à un échantillon par catégorie ; l'accès complet est débloqué en Premium et Pro.",
      },
    ],
    ctaPrompt: 'Vous avez d’autres questions ?',
    ctaLabel: 'Contactez notre équipe',
  },
  pricingPage: publicPricingPageCopy,
  pricing: {
    sampleLibrary: 'Échantillon de bibliothèque',
    ocrMonthlyFree: 'OCR 2 copies / mois',
    paymentUnavailable: 'Paiement indisponible. Réessaie dans quelques minutes.',
    tooManyAttemptsPrefix: 'Trop de tentatives. Réessaie dans',
    unexpectedError: 'Erreur inattendue. Vérifie ta connexion.',
    returnHome: "Retour à l'accueil",
    flouciMailto: 'Je souhaite régler mon abonnement Nexus via Flouci.',
    paidPlanLabel: 'Plan réglé : Premium / Pro',
  },
  payment: publicPaymentCopy,
  auth: {
    tooManyAttemptsPrefix: 'Trop de tentatives. Réessaie dans',
    defensibleFrameworkTitle: 'Cadre défendable',
    lowFrictionEntryTitle: 'Entrée sans friction',
    mainTitle: 'Connexion à ton espace EAF',
    createAccount: 'Créer un compte',
    csrfError: 'Sécurité : rafraîchis la page puis réessaie.',
    startFree: 'Démarrer gratuitement',
    page: {
      proof: {
        badge: 'Espace élève premium',
        title: 'Entre dans un cadre de travail qui se laisse vérifier avant de demander plus.',
        body:
          "Cette page ne doit pas juste connecter un utilisateur. Elle doit montrer qu'on peut essayer le produit, comprendre le cadre pédagogique, voir les sources mobilisables et commencer sans devoir décider tout de suite pour un abonnement.",
        trustPoints: ['Compte gratuit', 'Aucun paiement avant essai', 'Onboarding en ~3 minutes'],
        cards: {
          guidedPath: {
            title: 'Parcours vraiment guidé',
            body:
              "Le produit structure l'effort, relance les priorités et fait travailler l'élève à partir de ses œuvres, de son historique et de ses compétences actives.",
          },
          defensibleFramework: {
            title: 'Cadre défendable',
            body:
              "Corpus officiel, logique EAF, attentes visibles et sécurité d'accès : le produit reste explicable à un parent comme à un enseignant.",
          },
          lowFrictionEntry: {
            title: 'Entrée sans friction',
            body:
              'La page permet de commencer tout de suite, de vérifier la qualité du parcours puis de choisir un plan seulement si le rythme le demande.',
          },
        },
        onboardingHint:
          "En inscription, l'onboarding prend environ trois minutes. En connexion, tu récupères ton espace sans refaire un tunnel inutile.",
      },
      form: {
        badges: {
          login: 'Accès sécurisé',
          register: 'Inscription gratuite',
        },
        titles: {
          forgot: 'Mot de passe oublié',
          reset: 'Nouveau mot de passe',
        },
        subtitles: {
          login: 'Retrouve ton parcours, tes ateliers, tes priorités et ton historique sans repartir de zéro.',
          register:
            "Commence gratuitement. Le parcours se construit à partir de tes œuvres, de ton niveau et du travail déjà réalisé.",
          forgot: 'Entre ton email pour recevoir un lien de réinitialisation.',
          reset: 'Choisis un nouveau mot de passe sécurisé.',
        },
        trustPoints: {
          login: ['Connexion sécurisée', 'Protection CSRF', "Récupération rapide de l'espace"],
          register: ['Aucun paiement avant essai', 'Onboarding ~3 minutes', 'Free disponible tout de suite'],
        },
        loginCta: 'Se connecter',
        displayNameLabel: 'Prénom ou nom affiché',
        displayNamePlaceholder: 'Ton prénom',
        emailLabel: 'Email',
        emailPlaceholder: 'jean@eaf.local',
        passwordLabel: 'Mot de passe',
        confirmPasswordLabel: 'Confirmer le mot de passe',
        termsAcceptance: "J'accepte les Conditions d'utilisation et la Politique de confidentialité.",
        minorConsent: "J'ai moins de 15 ans. Un consentement parental est nécessaire.",
        parentEmailLabel: 'Email du parent / responsable légal',
        parentEmailPlaceholder: 'parent@email.com',
        parentEmailHint: 'Ce champ est requis pour les moins de 15 ans dans le cadre RGPD.',
        loading: {
          login: 'Connexion...',
          forgot: 'Envoi...',
          reset: 'Réinitialisation...',
          register: 'Création...',
        },
        registerLead:
          "Une fois le compte créé, tu arrives directement sur l'onboarding pour cadrer tes œuvres, ton rythme et ton point de départ, sans rien payer pour voir le produit.",
      },
      help: {
        forgotPassword: 'Mot de passe oublié ?',
        connectionProblem: 'Problème de connexion ?',
        connectionProblemDetails:
          "Vérifie ton email, ton mot de passe et rafraîchis la page en cas d'erreur de sécurité. Si le blocage persiste, repasse par la création de compte ou compare les plans avant de réessayer.",
        backToLogin: 'Retour à la connexion',
      },
      header: {
        badge: 'Connexion 2026',
        returnHome: "Retour à l'accueil",
        viewPlans: 'Voir les plans',
      },
      footer: {
        home: 'Accueil',
        pricing: 'Tarifs',
        faq: 'FAQ',
      },
    },
  },
  legal: publicLegalCopy,
  footer: publicFooterCopy,
  notFound: {
    returnHome: "Retour à l'accueil",
  },
} as const;
