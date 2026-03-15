export const publicLegalCopy = {
  metadata: {
    title: 'Mentions légales & CGU',
    description: "Mentions légales et conditions générales d'utilisation de Nexus EAF",
  },
  privacyMetadata: {
    title: 'Politique de confidentialité',
    description: 'Politique de confidentialité et traitement des données personnelles de Nexus EAF',
  },
  termsMetadata: {
    title: 'CGU',
    description: "Conditions générales d'utilisation de Nexus EAF",
  },
  pageTitle: "Mentions légales & Conditions Générales d'Utilisation",
  privacyPageTitle: 'Politique de confidentialité',
  termsPageTitle: "Conditions Générales d'Utilisation",
  publisher: {
    title: 'Éditeur du site',
    companyLabel: 'Raison sociale :',
    company: 'STE M&M ACADEMY SUARL',
    emailLabel: 'Email de contact :',
    email: 'contact@nexusreussite.academy',
    websiteLabel: 'Site web :',
    website: 'https://eaf.nexusreussite.academy',
  },
  hosting: {
    title: 'Hébergement',
    intro: 'Le site est hébergé par :',
    providers: [
      'OVH SAS - 2 rue Kellermann, 59100 Roubaix, France',
      'Vercel Inc. - 440 N Barranca Ave #4133, Covina, CA 91723, USA',
    ],
  },
  dataProtection: {
    title: 'Protection des données (RGPD)',
    intro: "Nexus EAF s'engage à protéger vos données personnelles conformément au RGPD :",
    items: [
      {
        label: 'Collecte minimale :',
        body: 'Nous ne collectons que les données strictement nécessaires au fonctionnement du service.',
      },
      {
        label: 'Traitement des mineurs :',
        body: 'Pour les utilisateurs de moins de 15 ans, un consentement parental est requis (email parent).',
      },
      {
        label: "Droit d'accès et de suppression :",
        body: "Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données via contact@nexusreussite.academy.",
      },
      {
        label: 'Pas de revente :',
        body: 'Vos données ne sont jamais vendues à des tiers.',
      },
      {
        label: 'Sécurité :',
        body: 'Les mots de passe sont hachés, les sessions sécurisées par cookies HttpOnly.',
      },
    ],
  },
  terms: {
    title: "Conditions Générales d'Utilisation",
    versionLabel: 'Version :',
    version: '2026-03',
    intro: 'En utilisant Nexus EAF, vous acceptez les conditions suivantes :',
    items: [
      "Le service est destiné aux élèves de Première préparant l'EAF.",
      "L'utilisation doit respecter le cadre pédagogique et les règles de propriété intellectuelle.",
      'Les contenus générés par IA sont fournis à titre indicatif et ne remplacent pas un enseignement officiel.',
      "Nexus EAF se réserve le droit de suspendre un compte en cas d'usage abusif ou frauduleux.",
    ],
    buildPricingNotice: (plans: string) =>
      `Les tarifs des ${plans} sont affichés en TND et peuvent être modifiés avec préavis de 30 jours.`,
  },
  intellectualProperty: {
    title: 'Propriété intellectuelle',
    body:
      "Tous les contenus du site (textes, images, logos, structure) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite.",
  },
  contact: {
    title: 'Contact',
    intro: 'Pour toute question concernant ces mentions légales ou les CGU, contactez-nous à :',
    email: 'contact@nexusreussite.academy',
  },
  publicPlans: 'plans Premium et Pro',
  returnHome: "Retour à l'accueil",
} as const;
