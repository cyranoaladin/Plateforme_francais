'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Mic, 
  Languages, 
  HelpCircle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Clock,
  Target,
  Library,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  FileText,
  Brain,
  Zap,
  Shield,
  Award,
  Star,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// LANDING PAGE EAF 2026 - Machine à Conversions
// ============================================================================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// ============================================================================
// FAQ ITEM COMPONENT
// ============================================================================

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================

export default function LandingPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  // Calcul des jours restants avant EAF 2026 (environ début juin 2026)
  const joursRestants = Math.ceil((new Date('2026-06-05').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // ============================================================================
  // DATA: RÉSULTATS CONCRETS
  // ============================================================================
  const stats = [
    { icon: TrendingUp, value: '+4.2', label: 'points en moyenne à l\'oral', sublabel: '(passage de 11.8 à 16.0/20)', color: 'emerald' },
    { icon: Clock, value: '3 min', label: 'temps moyen de correction', sublabel: 'contre 48h chez un prof particulier', color: 'blue' },
    { icon: Target, value: '98%', label: 'taux de mention', sublabel: '(Assez Bien et supérieur)', color: 'emerald' },
    { icon: Library, value: '548', label: 'ressources', sublabel: 'BO, rapports jury, analyses d\'oeuvres à jour', color: 'blue' },
  ];

  // ============================================================================
  // DATA: MÉTHODE EN 3 ÉTAPES
  // ============================================================================
  const steps = [
    {
      number: '01',
      icon: Target,
      title: 'Diagnostic express',
      description: 'En 5 minutes, notre IA analyse ton niveau réel sur les 5 compétences EAF : analyse de texte, argumentation, expression orale, maîtrise linguistique, culture littéraire.',
      outcome: 'Tu sais exactement par où commencer et quoi travailler en priorité.',
      color: 'blue'
    },
    {
      number: '02',
      icon: FileText,
      title: 'Production guidée',
      description: 'Tu rédiges des vrais sujets EAF tirés des annales. Le tuteur IA ne te donne JAMAIS la réponse. Il te guide avec des questions, des pistes, des exemples des corpus officiels (BO, Eduscol, rapports de jury).',
      outcome: 'Tu construis TON raisonnement, pas celui d\'une machine.',
      color: 'emerald'
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Correction immédiate',
      description: 'En 3 minutes, reçois une correction rubrique par rubrique avec : note /20 et détail par compétence, annotations sur chaque erreur, explications des points à améliorer, rappel des règles du BO.',
      outcome: 'Tu comprends TES erreurs spécifiques, pas des généralités.',
      color: 'orange'
    }
  ];

  // ============================================================================
  // DATA: LES 4 ATELIERS EAF
  // ============================================================================
  const workshops = [
    {
      badge: 'Corrections 24h/24',
      badgeColor: 'blue',
      icon: BookOpen,
      title: 'Atelier Écrit',
      subtitle: 'Sujets générés à partir des annales 2015-2025',
      features: [
        'Sujets de dissertation conformes au BO',
        'Textes argumentatifs avec corpus officiels',
        'Dépose ta copie (photo ou PDF)',
        'Correction en 3 min avec barème /20',
        'Feedback rubrique par rubrique'
      ],
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      badge: 'Le plus utilisé par nos élèves',
      badgeColor: 'emerald',
      icon: Mic,
      title: 'Atelier Oral',
      subtitle: 'Simulation complète au barème officiel /2 /8 /2 /8',
      features: [
        'Tirage au sort des oeuvres (même aléatoire que le bac)',
        'Préparation 30 min avec minuteur',
        'Passage 10 min enregistrable',
        'Notation /2 /8 /2 /8 comme le vrai bac',
        'Bilan PDF avec points forts et axes progrès'
      ],
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50',
      featured: true
    },
    {
      badge: 'Points rapides à gagner',
      badgeColor: 'purple',
      icon: Languages,
      title: 'Atelier Langue',
      subtitle: 'Grammaire et expression ciblées sur TES erreurs',
      features: [
        'Exercices adaptés à ton niveau réel',
        'Rappel des règles du BO 2026',
        'Entraînement sur les fautes fréquentes',
        'Quiz rapides entre deux révisions',
        'Progression mesurée compétence par compétence'
      ],
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      badge: 'Révision efficace',
      badgeColor: 'orange',
      icon: HelpCircle,
      title: 'Atelier Quiz',
      subtitle: 'Teste tes connaissances sur les oeuvres',
      features: [
        'Questions sur les oeuvres du programme',
        'Citations à identifier (auteur, contexte, sens)',
        'Thèmes et personnages',
        'Niveau adaptatif (plus tu réussis, plus c\'est exigeant)',
        'Suivi des erreurs pour revoir tes points faibles'
      ],
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  // ============================================================================
  // DATA: PREUVE SOCIALE
  // ============================================================================
  const testimonials = [
    {
      name: 'Mehdi K.',
      school: 'Lycée Pierre Mendès France, Tunis',
      before: '8/20 à l\'oral blanc',
      after: '16/20 à l\'EAF → Mention Bien',
      quote: 'J\'avais peur de l\'oral, je bafouillais dès que je voyais un examinateur. Avec Nexus, j\'ai fait 8 simulations réelles. Le jour J, j\'étais habitué au stress. Le tuteur ne me donnait jamais la réponse, mais me guidait pour que JE trouve. Résultat: 16/20 et mention Bien.',
      details: 'Utilisateur Premium pendant 4 mois • 12 oraux simulés • 45 corrections effectuées',
      initials: 'MK',
      color: 'blue'
    },
    {
      name: 'Sarah L.',
      school: 'Lycée International, Lyon',
      before: 'Dissertations à 9/20',
      after: '14/20 en moyenne → Mention Assez Bien',
      quote: 'Je croyais que ChatGPT m\'aiderait, mais je recopiais sans comprendre. Sur Nexus, le tuteur me demandait des questions, me faisait chercher dans les rapports de jury. J\'ai appris à STRUCTURER ma pensée, pas à la recopier. Ma mère voit mes progrès en direct sur son dashboard.',
      details: 'Utilisatrice Masterium pendant 3 mois • 28 corrections • Dashboard parent actif',
      initials: 'SL',
      color: 'emerald'
    },
    {
      name: 'Youssef B.',
      school: 'Lycée Carthage Présidence, Tunis',
      before: 'Grammaire "catastrophique" selon sa prof',
      after: '0 faute d\'orthographe à l\'EAF',
      quote: 'Mes fautes de français me coûtaient des points bêtes. L\'atelier Langue m\'a fait travailler EXACTEMENT là où j\'avais des lacunes. Pas de théorie inutile, juste des exercices sur mes erreurs. L\'oral a été ma force parce que j\'étais préparé au format /2 /8 /2 /8.',
      details: 'Utilisateur Premium pendant 5 mois • Atelier Langue quotidien • 18 oraux simulés',
      initials: 'YB',
      color: 'purple'
    }
  ];

  // ============================================================================
  // DATA: POURQUOI NEXUS RÉUSSITE
  // ============================================================================
  const comparisonFeatures = [
    { name: 'Sources', chatbot: 'Internet générique, pas sourcé', nexus: 'BO 2026, Eduscol, rapports de jury officiels', winner: 'nexus' },
    { name: 'Correction', chatbot: 'Fait la rédaction à ta place', nexus: 'Guide sans jamais rédiger, tu produis toi-même', winner: 'nexus' },
    { name: 'Barème EAF', chatbot: 'Pas adapté au format spécifique', nexus: 'Oral noté /2 /8 /2 /8 comme le vrai bac', winner: 'nexus' },
    { name: 'Anti-copie', chatbot: 'Facilement détectable par l\'IA du bac', nexus: 'Parcours personnalisé impossible à copier', winner: 'nexus' },
    { name: 'Rapidité', chatbot: 'Réponses génériques longues', nexus: 'Corrections en 3 minutes, 24h/24', winner: 'nexus' },
    { name: 'Suivi', chatbot: 'Pas de suivi de progression', nexus: 'Dashboard parent + évolution mois par mois', winner: 'nexus' },
    { name: 'Expertise', chatbot: 'IA générique', nexus: 'Coach agrégé + IA pédagogique combinés', winner: 'nexus' },
    { name: 'Prix', chatbot: 'Gratuit ou abonnement générique', nexus: 'À partir de 0 TND, Premium 99 TND', winner: 'nexus' },
  ];

  // ============================================================================
  // DATA: TARIFS
  // ============================================================================
  const plans = [
    {
      name: 'Freemium',
      badge: 'Pour tester',
      badgeColor: 'gray',
      price: '0',
      period: 'Gratuit, sans limite de temps',
      features: [
        '1 oral/mois (simulation complète /2 /8 /2 /8)',
        '2 corrections/mois',
        '3 questions/jour au tuteur IA',
        'Accès bibliothèque limité (20% des ressources)',
        'Quiz adaptatif'
      ],
      cta: 'Commencer gratuitement →',
      ctaStyle: 'outline',
      borderColor: 'border-gray-200'
    },
    {
      name: 'Premium',
      badge: '⭐ RECOMMANDÉ PAR NOS ÉLÈVES',
      badgeColor: 'emerald',
      price: '99',
      period: 'Par mois',
      subperiod: 'Sans engagement • Résiliation immédiate',
      features: [
        '10 oraux/semaine (illimité pratiquement)',
        '20 corrections/mois',
        '100 questions/jour au tuteur IA',
        'Bibliothèque complète (548 ressources)',
        'Rapports PDF de progression',
        'Dashboard parent',
        'Support email prioritaire',
        'Parcours adaptatif IA'
      ],
      cta: 'Choisir Premium',
      ctaStyle: 'solid',
      featured: true,
      borderColor: 'border-emerald-500'
    },
    {
      name: 'Masterium',
      badge: 'Excellence',
      badgeColor: 'yellow',
      price: '129',
      period: 'Par mois',
      subperiod: 'Sans engagement • Pour les mentions Très Bien',
      features: [
        'Oral illimité (toutes simulations)',
        'Corrections illimitées',
        'Questions illimitées au tuteur IA',
        'Bibliothèque complète + accès anticipé',
        'Rapports PDF détaillés + historique',
        'Dashboard parent avancé',
        'Support prioritaire (réponse < 4h)',
        'Parcours ultra-personnalisé',
        'Mode "Avocat du diable"'
      ],
      cta: 'Choisir Masterium →',
      ctaStyle: 'outline',
      borderColor: 'border-yellow-400'
    }
  ];

  // ============================================================================
  // DATA: FAQ
  // ============================================================================
  const faqs = [
    {
      question: 'Est-ce que l\'IA me rédige mes copies ?',
      answer: 'NON. C\'est fondamental : notre tuteur IA pose des questions, donne des pistes, cite les sources officielles, mais ne rédige JAMAIS à ta place. Tu dois produire, c\'est la seule façon d\'apprendre. L\'anti-copie est dans notre ADN.'
    },
    {
      question: 'Les corrections sont-elles fiables ?',
      answer: 'Oui. Nos algorithmes s\'appuient sur les rapports de jury officiels et le barème EAF. Chaque correction est structurée comme le ferait un professeur agrégé : rubrique par rubrique, avec des exemples concrets et des pistes d\'amélioration.'
    },
    {
      question: 'Comment ça marche pour l\'oral ?',
      answer: 'Tu choisis une oeuvre (ou on tire au sort), tu as 30 min de préparation avec le texte, puis 10 min de passage enregistrable. Tu reçois une note /2 /8 /2 /8 avec un bilan détaillé et un PDF. C\'est le vrai format EAF.'
    },
    {
      question: 'Mes parents peuvent-ils suivre ma progression ?',
      answer: 'Oui, avec les plans Premium et Masterium. Ils ont un dashboard avec tes notes, ton temps d\'entraînement, tes progrès par compétence. C\'est rassurant pour eux, motivant pour toi.'
    },
    {
      question: 'Combien de temps faut-il s\'entraîner par jour ?',
      answer: '30 minutes par jour suffisent pour progresser significativement. Notre IA adapte les exercices à TON niveau, donc pas de temps perdu sur des choses que tu maîtrises déjà.'
    },
    {
      question: 'C\'est vraiment différent de ChatGPT ?',
      answer: 'Complètement. ChatGPT a été entraîné sur Internet générique. Nexus Réussite intègre uniquement les sources officielles (BO, Eduscol, rapports de jury). De plus, notre IA ne te donne pas les réponses, elle t\'apprend à réfléchir.'
    },
    {
      question: 'Je suis en Tunisie, ça marche pour moi ?',
      answer: 'Absolument. Nombreux de nos élèves sont en Tunisie (Lycée Pierre Mendès France, Carthage Présidence, etc.). Le programme EAF est identique. Paiement par virement ou espèces, activation sous 2h ouvrées.'
    },
    {
      question: 'Puis-je annuler mon abonnement ?',
      answer: 'Oui, à tout moment. Pas d\'engagement, pas de pénalité. Tu restes Premium jusqu\'à la fin de la période payée.'
    }
  ];

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <main className="min-h-screen">
      {/* ================================================================== */}
      {/* SECTION 1: HERO */}
      {/* ================================================================== */}
      <section className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#264969] to-[#2d5a87] text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-full text-emerald-300 text-sm font-medium mb-6"
            >
              <Target className="w-4 h-4" />
              J-{joursRestants} avant l'épreuve EAF 2026
            </motion.div>

            {/* H1 - Exact text as specified */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              EAF 2026 : passe de 10 à 17+ à l'oral et décroche la mention avec la seule méthode qui te fait vraiment produire
            </h1>

            {/* Subtitle - Exact text as specified */}
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Nexus combine coach agrégé + IA pédagogique. Corrections en 3 min, oral noté au barème officiel, parcours sur mesure. Zéro rédaction à ta place. Sources BO & Eduscol garanties.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>98% de mention</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>J-{joursRestants} avant l'épreuve</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Anti-copie par design</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/login?mode=register')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Commencer gratuitement (3 minutes)
              </button>
              <button
                onClick={() => {
                  const demoSection = document.getElementById('demo-video');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </div>
                Voir la démo IA en 45 secondes
              </button>
            </div>

            {/* Micro-trust */}
            <p className="mt-4 text-sm text-blue-200/80">
              Pas de carte bancaire requise • Freemium illimité en temps
            </p>
          </motion.div>

          {/* Right Column - Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
              {/* Mockup Header */}
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-xs text-gray-500">Atelier Oral - Nexus Réussite</span>
              </div>
              
              {/* Mockup Content */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Simulation officielle EAF</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Oral sur Candide - Voltaire</h3>
                  </div>
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                    Noté /2 /8 /2 /8
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Tuteur IA</p>
                      <p className="text-xs text-gray-500">Sources: BO 2026, Rapport jury 2025</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    "Comment Voltaire critique-t-il l'optimisme de Leibniz dans ce passage ? Identifie les éléments qui montrent l'échec de la philosophie de Pangloss."
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-mono text-gray-700">Préparation: 18:42</span>
                  </div>
                  <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Commencer le passage
                  </button>
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-600">Session d'oral simulée</p>
              <p className="text-sm font-bold text-emerald-600">avec transcription et notation en temps réel</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

      {/* ================================================================== */}
      {/* SECTION 2: RÉSULTATS CONCRETS */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Des résultats mesurables en 4 à 8 semaines
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              Moyenne constatée sur 1 200 élèves Premium actifs entre janvier et mars 2025
            </motion.p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="font-semibold text-gray-800 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.sublabel}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Before/After */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Ce que ça change concrètement</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-gray-100 rounded-2xl p-6 border-l-4 border-red-400">
                <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Avant Nexus
                </h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span>Rédige des dissertations qui tournent en rond</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span>Récite des fiches sans comprendre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span>Panique à l'oral devant l'examinateur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span>Perd des points sur des fautes évitables</span>
                  </li>
                </ul>
              </div>

              {/* After */}
              <div className="bg-emerald-50 rounded-2xl p-6 border-l-4 border-emerald-500">
                <h4 className="font-bold text-emerald-600 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Avec Nexus
                </h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Structure des arguments solide et progressif</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Maîtrise les œuvres grâce aux explications contextualisées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>S'entraîne sur 10 oraux simulés avec note réelle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Corrige ses erreurs grâce au feedback instantané</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 3: MÉTHODE EN 3 ÉTAPES */}
      {/* ================================================================== */}
      <section className="py-24 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Une méthode éprouvée en 3 étapes
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              Pas de cours théorique interminable. Tu produis, tu corriges, tu progresses.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-full bg-${step.color}-100 flex items-center justify-center mb-6`}>
                  <span className={`text-2xl font-bold text-${step.color}-600`}>{step.number}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-${step.color}-100 flex items-center justify-center mb-4`}>
                  <step.icon className={`w-6 h-6 text-${step.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                <div className={`bg-${step.color}-50 rounded-lg p-3 border-l-4 border-${step.color}-400`}>
                  <p className={`text-sm font-medium text-${step.color}-700`}>→ {step.outcome}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 4: LES 4 ATELIERS EAF */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              4 ateliers pour maîtriser chaque épreuve EAF
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              Chaque atelier reproduit les conditions réelles de l'examen avec les outils qui te font progresser.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {workshops.map((workshop, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`bg-white rounded-2xl p-8 border-2 ${workshop.borderColor} shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden`}
              >
                {workshop.featured && (
                  <div className="absolute top-4 right-4">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${workshop.badgeColor}-100 text-${workshop.badgeColor}-700 mb-4`}>
                  {workshop.badge}
                </div>
                <div className={`w-14 h-14 rounded-xl ${workshop.bgColor} flex items-center justify-center mb-4`}>
                  <workshop.icon className={`w-7 h-7 text-${workshop.badgeColor}-600`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{workshop.title}</h3>
                <p className="text-gray-600 mb-4">{workshop.subtitle}</p>
                <ul className="space-y-2">
                  {workshop.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 5: MOCKUPS PLATEFORME (Dashboards) */}
      {/* ================================================================== */}
      <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Une plateforme pensée pour les élèves ET les parents
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-gray-600">
            Le suivi de progression en temps réel pour toi, le tableau de bord parent pour rassurer ta famille.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-8"
        >
          {/* Dashboard Élève */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <span className="text-white font-semibold">Vue Élève</span>
              <div className="text-white/80 text-sm">Parcours personnalisé</div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Sarah L.</h4>
                  <p className="text-sm text-gray-500">Niveau: En progression • Objectif: 14/20</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progression vers l'objectif</span>
                  <span className="text-sm font-bold text-emerald-600">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '67%' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">12</div>
                  <div className="text-xs text-gray-600">Corrections</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-emerald-600">5</div>
                  <div className="text-xs text-gray-600">Oraux</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">+2.3</div>
                  <div className="text-xs text-gray-600">Points gagnés</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4">
                <p className="text-sm mb-2">Prochaine session recommandée</p>
                <p className="font-semibold">Oral sur Candide</p>
                <p className="text-xs text-emerald-100">Préparation estimée: 35 min</p>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Parent */}
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
              <span className="text-white font-semibold">Vue Parent</span>
              <div className="text-white/80 text-sm">Suivi détaillé</div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-4">Suivi de Sarah L.</h4>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Évolution des notes (4 dernières semaines)</p>
                <div className="flex items-end gap-2 h-24">
                  {[11, 12, 13.5, 14].map((note, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t" style={{ height: `${(note / 20) * 100}%` }} />
                      <span className="text-xs text-gray-600 mt-1">{note}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-emerald-600 mt-2">📈 +2 points en 4 semaines</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-700">Niveau en grammaire amélioré de 20%</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-700">Correction dissertation - 14/20 - Hier</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">Prochaine étape recommandée</p>
                <p className="text-xs">Continuer l'entraînement oral pour consolider la fluidité d'expression</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <p className="text-center text-gray-500 mt-8 text-sm">
          Dashboard élève avec parcours adaptatif (gauche) • Dashboard parent avec suivi détaillé (droite)
        </p>
      </div>
    </section>

      {/* ================================================================== */}
      {/* SECTION 6: PREUVE SOCIALE */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Ils ont transformé leur EAF avec Nexus
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              Témoignages d'élèves de Première, Tunisie et France
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full bg-${testimonial.color}-100 flex items-center justify-center text-${testimonial.color}-600 font-bold text-lg`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.school}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    Avant: {testimonial.before}
                  </span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                    Après: {testimonial.after}
                  </span>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "{testimonial.quote}"
                </p>

                <p className="text-xs text-gray-500">
                  {testimonial.details}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 7: POURQUOI NEXUS RÉUSSITE */}
      {/* ================================================================== */}
      <section className="py-24 bg-[#1e3a5f] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Pourquoi choisir Nexus Réussite ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-blue-200">
              Ce qui nous différencie des chatbots génériques et des cours particuliers classiques
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-white/5 backdrop-blur rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-white/10 font-semibold">
              <div className="text-gray-300">Critère</div>
              <div className="text-gray-300 text-center">Chatbot générique</div>
              <div className="text-emerald-400 text-center">Nexus Réussite</div>
            </div>
            {comparisonFeatures.map((feature, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center">
                <div className="font-medium">{feature.name}</div>
                <div className="text-gray-400 text-sm text-center">{feature.chatbot}</div>
                <div className="text-emerald-300 text-sm text-center font-medium">✓ {feature.nexus}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-emerald-400 font-semibold text-lg mb-6">
              ✓ Nexus Réussite = les sources officielles du Bac + la pédagogie d'un agrégé + la rapidité de l'IA
            </p>
            <button
              onClick={() => router.push('/login?mode=register')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105"
            >
              Commencer gratuitement
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 8: TARIFS */}
      {/* ================================================================== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Des tarifs pensés pour tous les budgets
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600">
              Freemium illimité en temps. Premium et Masterium sans engagement, résiliation immédiate.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid lg:grid-cols-3 gap-8 items-start"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={`bg-white rounded-2xl p-8 border-2 ${plan.borderColor} shadow-sm hover:shadow-xl transition-all ${plan.featured ? 'lg:scale-105 lg:-translate-y-2' : ''}`}
              >
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${plan.badgeColor}-100 text-${plan.badgeColor}-700 mb-4`}>
                  {plan.badge}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-1">TND</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{plan.period}</p>
                {plan.subperiod && <p className="text-xs text-gray-500 mt-1">{plan.subperiod}</p>}

                <ul className="mt-6 space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/login?mode=register')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.ctaStyle === 'solid'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
                      : 'border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 text-gray-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* FAQ Tarifs */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-16 bg-gray-50 rounded-2xl p-8"
          >
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900">❓ Puis-je changer de plan ?</p>
                <p className="text-gray-600">Oui, à tout moment. Passage immédiat, facturation au prorata.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">❓ Comment se passe le paiement ?</p>
                <p className="text-gray-600">Virement bancaire ou espèces en Tunisie. L&apos;admin active ton compte sous 2h ouvrées.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">❓ Le Freemium est-il vraiment gratuit ?</p>
                <p className="text-gray-600">Oui, sans limite de temps. Tu peux t&apos;entraîner pendant des mois gratuitement, avec des quotas raisonnables.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 9: FAQ */}
      {/* ================================================================== */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Les questions fréquentes
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-6"
          >
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => toggleFAQ(index)}
              />
            ))}
          </motion.div>

          {/* CTA WhatsApp */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">Encore une question ? Contacte-nous par WhatsApp</p>
            <a
              href="https://wa.me/21699192829"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25d366] hover:bg-[#128c7e] text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              +216 99 192 829
            </a>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SECTION 10: FOOTER */}
      {/* ================================================================== */}
      <footer className="bg-[#0f172a] text-gray-300 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1: Logo + Description */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Nexus Réussite</h3>
            <p className="text-sm leading-relaxed mb-4">
              La seule plateforme qui combine coach agrégé + IA pédagogique pour préparer efficacement les Épreuves Anticipées de Français.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Award className="w-4 h-4" />
              <span>98% de mention</span>
              <span className="text-gray-500">•</span>
              <span>J-{joursRestants} avant l&apos;EAF 2026</span>
            </div>
          </div>

          {/* Colonne 2: Liens rapides */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liens rapides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link href="/login?mode=register" className="hover:text-white transition-colors">Inscription</Link></li>
            </ul>
          </div>

          {/* Colonne 3: Ateliers */}
          <div>
            <h4 className="text-white font-semibold mb-4">Les ateliers</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors cursor-pointer">Atelier Écrit</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Atelier Oral</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Atelier Langue</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Quiz</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Tuteur IA</span></li>
            </ul>
          </div>

          {/* Colonne 4: Contact & Légal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact & Légal</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:contact@nexusreussite.academy" className="hover:text-white transition-colors">
                  contact@nexusreussite.academy
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span>
                <span>+216 99 192 829 (WhatsApp)</span>
              </li>
              <li className="flex items-center gap-2">
                <span>🕐</span>
                <span>Lun-Ven: 9h-18h</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-gray-700 text-xs space-y-1">
              <Link href="/mentions-legales" className="block hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/politique-de-confidentialite" className="block hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link href="/cgu" className="block hover:text-white transition-colors">CGU</Link>
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            © 2026 Nexus Réussite. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Sources officielles
            </span>
            <span>🇹🇳 🇫🇷 Tunisie & France</span>
          </div>
        </div>
      </div>
    </footer>
    </main>
  );
}
