'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Mic,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const OEUVRES = [
  { id: 'douai', title: 'Cahier de Douai', author: 'Arthur Rimbaud', type: 'Poésie' },
  { id: 'ponge', title: 'La Rage de l’expression', author: 'Francis Ponge', type: 'Poésie' },
  { id: 'dorion', title: 'Mes forêts', author: 'Hélène Dorion', type: 'Poésie' },
  { id: 'boetie', title: 'Discours de la servitude volontaire', author: 'Étienne de La Boétie', type: 'Littérature d’idées' },
  { id: 'fontenelle', title: 'Entretiens sur la pluralité des mondes', author: 'Fontenelle', type: 'Littérature d’idées' },
  { id: 'graffigny', title: 'Lettres d’une Péruvienne', author: 'Françoise de Graffigny', type: 'Littérature d’idées' },
  { id: 'menteur', title: 'Le Menteur', author: 'Pierre Corneille', type: 'Théâtre' },
  { id: 'musset', title: 'On ne badine pas avec l’amour', author: 'Alfred de Musset', type: 'Théâtre' },
  { id: 'sarraute', title: 'Pour un oui ou pour un non', author: 'Nathalie Sarraute', type: 'Théâtre' },
  { id: 'prevost', title: 'Manon Lescaut', author: 'Abbé Prévost', type: 'Roman' },
  { id: 'peau', title: 'La Peau de chagrin', author: 'Honoré de Balzac', type: 'Roman' },
  { id: 'sido', title: 'Sido / Les Vrilles de la vigne', author: 'Colette', type: 'Roman' },
];

const CLASS_LEVELS = [
  'Première générale',
  'Première technologique',
  'Première STMG',
  'Première ST2S',
  'Première STI2D',
  'Première STL',
];

const SKILLS = [
  { key: 'comprehension', label: 'Compréhension du texte', icon: BookOpen, color: 'text-[#b87333]' },
  { key: 'procedes', label: 'Analyse des procédés', icon: PenTool, color: 'text-[#17324d]' },
  { key: 'plan', label: 'Organisation du plan', icon: PenTool, color: 'text-[#0f766e]' },
  { key: 'lecture', label: 'Lecture expressive', icon: Mic, color: 'text-[#7b6f9c]' },
  { key: 'grammaire', label: 'Grammaire', icon: BrainCircuit, color: 'text-[#0f766e]' },
  { key: 'culture', label: 'Culture / œuvre & parcours', icon: BookOpen, color: 'text-[#17324d]' },
] as const;

const STEP_LABELS = ['Profil', 'Œuvres', 'Auto-évaluation'] as const;

const STEP_META = {
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
} satisfies Record<1 | 2 | 3, { kicker: string; title: string; description: string; benefit: string }>;

function StepRail({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Étapes de l'onboarding" className="space-y-3">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3;
        const isActive = stepNum === current;
        const isDone = stepNum < current;

        return (
          <div
            key={label}
            className={`rounded-[22px] border px-4 py-4 transition-colors ${
              isActive
                ? 'border-white/14 bg-white/12'
                : isDone
                  ? 'border-white/10 bg-black/10'
                  : 'border-white/8 bg-white/5'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive || isDone ? 'bg-[#f4efe5] text-[#17324d]' : 'bg-white/10 text-white/60'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isActive || isDone ? 'text-[#d7c4aa]' : 'text-white/45'}`}>
                  {`0${stepNum}`}
                </p>
                <p className={`text-sm font-semibold ${isActive || isDone ? 'text-white' : 'text-white/65'}`}>{label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function OnboardingErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-[22px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d]" role="alert">
      {message}
    </div>
  );
}

function formatDateLabel(date: string) {
  if (!date) return 'À renseigner';
  try {
    return new Date(date).toLocaleDateString('fr-FR');
  } catch {
    return date;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState('');
  const [classLevel, setClassLevel] = useState('Première générale');
  const [establishment, setEstablishment] = useState('');
  const [eafDate, setEafDate] = useState('');
  const [selectedOeuvres, setSelectedOeuvres] = useState<string[]>([]);
  const [customOeuvre, setCustomOeuvre] = useState('');
  const [oeuvreSearch, setOeuvreSearch] = useState('');
  const [classCode, setClassCode] = useState('');
  const [oeuvreEntretien, setOeuvreEntretien] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({
    comprehension: 3,
    procedes: 3,
    plan: 3,
    lecture: 3,
    grammaire: 3,
    culture: 3,
  });

  const weakSignals = useMemo(
    () =>
      Object.entries(ratings)
        .filter(([, value]) => value <= 2)
        .map(([key]) => {
          const skill = SKILLS.find((item) => item.key === key);
          return skill?.label ?? key;
        }),
    [ratings],
  );

  const filteredOeuvres = useMemo(() => {
    if (!oeuvreSearch.trim()) return OEUVRES;
    const query = oeuvreSearch.toLowerCase();
    return OEUVRES.filter(
      (oeuvre) =>
        oeuvre.title.toLowerCase().includes(query) ||
        oeuvre.author.toLowerCase().includes(query) ||
        oeuvre.type.toLowerCase().includes(query),
    );
  }, [oeuvreSearch]);

  const allSelectedOeuvres = useMemo(() => {
    return customOeuvre.trim() ? [...selectedOeuvres, customOeuvre.trim()] : selectedOeuvres;
  }, [customOeuvre, selectedOeuvres]);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/onboarding' } });
  }, []);

  useEffect(() => {
    track({ name: 'onboarding_step_view', props: { step } });
  }, [step]);

  const toggleOeuvre = (title: string) => {
    setSelectedOeuvres((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]));
  };

  const saveProfile = useCallback(async () => {
    try {
      await apiFetch('/api/v1/student/profile', {
        method: 'PUT',
        json: {
          displayName,
          classLevel,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSkills: weakSignals,
          classCode: classCode || undefined,
        },
      });
    } catch (err) {
      if (isApiError(err) && err.status === 403) {
        setError('Sécurité : rafraîchis la page puis réessaie.');
        return false;
      }
      console.warn('[onboarding] autosave failed:', err);
    }
    return true;
  }, [allSelectedOeuvres, classCode, classLevel, displayName, eafDate, establishment, weakSignals]);

  const handleNext = async () => {
    setError(null);
    setIsSubmitting(true);
    track({ name: 'onboarding_step_submit', props: { step } });

    const saved = await saveProfile();
    setIsSubmitting(false);
    if (!saved) return;

    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setIsSubmitting(true);
    track({ name: 'onboarding_step_submit', props: { step: 3 } });

    const saved = await saveProfile();
    if (!saved) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = await apiFetch<{ welcomeMessage?: string }>('/api/v1/onboarding/complete', {
        method: 'POST',
        json: {
          displayName,
          classLevel,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: allSelectedOeuvres,
          weakSignals,
          classCode: classCode || undefined,
          oeuvreChoisieEntretien: oeuvreEntretien || undefined,
        },
      });

      track({ name: 'onboarding_complete', props: {} });
      setWelcomeMessage(payload.welcomeMessage ?? 'Ton parcours est prêt.');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 403) {
          setError('Sécurité : rafraîchis la page puis réessaie.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Impossible de finaliser l’onboarding. Réessaie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const step1Valid = displayName.trim().length > 0 && classLevel.trim().length > 0 && eafDate.length > 0;
  const step2Valid = allSelectedOeuvres.length > 0;
  const canProceed = (step === 1 && step1Valid) || (step === 2 && step2Valid) || step === 3;
  const currentMeta = STEP_META[step];

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f4efe5] text-slate-900 [background-image:radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(184,115,51,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.9),transparent_65%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[#0f766e]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-[34rem] h-72 w-72 rounded-full bg-[#b87333]/10 blur-3xl" />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 rounded-[30px] border border-[#d8ccb9] bg-white/80 px-5 py-4 shadow-[0_16px_45px_rgba(23,50,77,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#d8ccb9] bg-[#f8f4ec] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#17324d]">
              <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
              Onboarding 2026
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-600">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:text-[#17324d]">
              Revoir l&apos;accueil
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-4 py-2 text-[#f7f2ea]">
              <Clock3 className="h-4 w-4" />
              Environ 3 minutes
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[34px] border border-white/10 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.24)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
                <Sparkles className="h-4 w-4" />
                Mise en route
              </div>

              <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">
                Nous réglons la plateforme autour de ton vrai contexte.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-200">
                L’objectif n’est pas de remplir un profil pour la forme. L’objectif est de caler les premiers ateliers sur tes œuvres, ton rythme,
                tes points d’appui et les attendus officiels dès la première connexion.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {['Modifiable plus tard', 'Parcours personnalisé', 'Aucune configuration inutile'].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-slate-100">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <StepRail current={step} />
              </div>

              <div className="mt-8 rounded-[28px] bg-[#0f2740] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Ce que Nexus a déjà compris</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                    <div>
                      <p className="font-semibold text-white">Profil</p>
                      <p className="mt-1 leading-6">{displayName.trim() || 'Nom affiché à renseigner'} · {classLevel || 'Classe à confirmer'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                    <div>
                      <p className="font-semibold text-white">Corpus</p>
                      <p className="mt-1 leading-6">
                        {allSelectedOeuvres.length > 0
                          ? `${allSelectedOeuvres.length} œuvre(s) et parcours déjà pris en compte`
                          : 'Aucune œuvre du programme sélectionnée pour l’instant'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/6 px-4 py-3">
                    <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                    <div>
                      <p className="font-semibold text-white">Priorités</p>
                      <p className="mt-1 leading-6">
                        {weakSignals.length > 0 ? weakSignals.join(', ') : 'Aucune faiblesse auto-déclarée forte à ce stade'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/8 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d7c4aa]" />
                  <p className="text-sm leading-6 text-slate-200">
                    Les informations saisies ici servent à cadrer les premières recommandations, les ressources mobilisées et la progression visible.
                    Elles restent modifiables ensuite dans le profil.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-[34px] border border-[#d8ccb9] bg-white/88 p-6 shadow-[0_24px_70px_rgba(23,50,77,0.08)] sm:p-8 lg:p-9">
            {error ? <OnboardingErrorBanner message={error} /> : null}
            {welcomeMessage ? (
              <div className="mb-6 flex items-center gap-2 rounded-[22px] border border-[#9cccaf] bg-[#eef8f0] p-4 text-sm text-[#25543d]" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {welcomeMessage}
              </div>
            ) : null}

            <div className="border-b border-[#e6dbca] pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">{currentMeta.kicker}</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                {currentMeta.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{currentMeta.description}</p>
              <div className="mt-4 rounded-[22px] border border-[#d8ccb9] bg-[#f8f4ec] px-4 py-3 text-sm text-slate-600">
                {currentMeta.benefit}
              </div>
            </div>

            <div className="mt-6">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="ob-name">Nom affiché</label>
                      <input
                        id="ob-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Comment veux-tu apparaître dans la plateforme ?"
                        className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="ob-class">Classe</label>
                      <select
                        id="ob-class"
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                      >
                        {CLASS_LEVELS.map((classItem) => (
                          <option key={classItem} value={classItem}>{classItem}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="ob-date">Date EAF</label>
                      <input
                        id="ob-date"
                        type="date"
                        value={eafDate}
                        onChange={(e) => setEafDate(e.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="ob-school">Établissement</label>
                      <input
                        id="ob-school"
                        value={establishment}
                        onChange={(e) => setEstablishment(e.target.value)}
                        placeholder="Nom de ton lycée"
                        className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="ob-code">Code classe enseignant</label>
                      <input
                        id="ob-code"
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        placeholder="Ex : PMF-1G2-2026"
                        className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                      />
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Prévisualisation</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[#d8ccb9] bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nom</p>
                        <p className="mt-1 text-sm font-semibold text-[#17324d]">{displayName.trim() || 'À renseigner'}</p>
                      </div>
                      <div className="rounded-[22px] border border-[#d8ccb9] bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Classe</p>
                        <p className="mt-1 text-sm font-semibold text-[#17324d]">{classLevel}</p>
                      </div>
                      <div className="rounded-[22px] border border-[#d8ccb9] bg-white px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Échéance</p>
                        <p className="mt-1 text-sm font-semibold text-[#17324d]">{formatDateLabel(eafDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={oeuvreSearch}
                      onChange={(e) => setOeuvreSearch(e.target.value)}
                      placeholder="Rechercher une œuvre, un auteur, un objet d’étude..."
                      className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] py-3 pl-10 pr-4 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                    />
                  </div>

                  {allSelectedOeuvres.length > 0 ? (
                    <div className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Sélection en cours</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {allSelectedOeuvres.map((oeuvre) => (
                          <span key={oeuvre} className="rounded-full border border-[#d8ccb9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#17324d]">
                            {oeuvre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredOeuvres.map((oeuvre) => {
                      const isSelected = selectedOeuvres.includes(oeuvre.title);

                      return (
                        <button
                          type="button"
                          key={oeuvre.id}
                          onClick={() => toggleOeuvre(oeuvre.title)}
                          className={`rounded-[24px] border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-[#17324d] bg-[#17324d] text-[#f7f2ea] shadow-[0_18px_45px_rgba(23,50,77,0.14)]'
                              : 'border-[#d8ccb9] bg-white hover:-translate-y-0.5 hover:border-[#0f766e]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${isSelected ? 'text-[#d7c4aa]' : 'text-slate-500'}`}>
                                {oeuvre.type}
                              </p>
                              <p className="mt-2 text-sm font-bold leading-6">{oeuvre.title}</p>
                              <p className={`mt-1 text-sm ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>{oeuvre.author}</p>
                            </div>
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-white bg-white text-[#17324d]' : 'border-[#d8ccb9] text-transparent'}`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#17324d]" htmlFor="custom-oeuvre">
                      Œuvre absente de la liste
                    </label>
                    <input
                      id="custom-oeuvre"
                      value={customOeuvre}
                      onChange={(e) => setCustomOeuvre(e.target.value)}
                      placeholder="Saisis exactement l’œuvre donnée par ton professeur"
                      className="w-full rounded-2xl border border-[#d8ccb9] bg-[#fcfaf6] px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20"
                    />
                  </div>

                  {allSelectedOeuvres.length > 0 && (
                    <div className="rounded-[26px] border border-[#0f766e]/20 bg-[#0f766e]/5 p-5">
                      <p className="text-sm font-semibold text-[#17324d]">Ton œuvre d&apos;entretien oral</p>
                      <p className="mt-1 text-xs text-slate-500">Œuvre intégrale pour la 2e partie de l&apos;oral (8 points sur 20).</p>
                      <div className="mt-3 space-y-2">
                        {allSelectedOeuvres.map((title) => {
                          const found = OEUVRES.find((o) => o.title === title);
                          const authorName = found?.author ?? '';
                          return (
                            <label
                              key={'entretien-' + title}
                              className={'flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors ' + (
                                oeuvreEntretien === title
                                  ? 'border-[#0f766e] bg-[#0f766e]/10'
                                  : 'border-[#d8ccb9] bg-white hover:border-[#0f766e]/40'
                              )}
                            >
                              <input
                                type="radio"
                                name="oeuvreEntretien"
                                value={title}
                                checked={oeuvreEntretien === title}
                                onChange={() => setOeuvreEntretien(title)}
                                className="accent-[#0f766e]"
                              />
                              <span className="text-sm font-medium text-[#17324d]">{title}</span>
                              {authorName && <span className="text-xs text-slate-400">{authorName}</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  {SKILLS.map((skill) => {
                    const Icon = skill.icon;
                    const value = ratings[skill.key];

                    return (
                      <div key={skill.key} className="rounded-[26px] border border-[#d8ccb9] bg-[#f8f4ec] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#17324d] shadow-sm">
                              <Icon className={`h-5 w-5 ${skill.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#17324d]">{skill.label}</p>
                              <p className="text-xs text-slate-500">Réglage initial pour prioriser les prochains ateliers.</p>
                            </div>
                          </div>
                          <div className="rounded-full border border-[#d8ccb9] bg-white px-3 py-1 text-xs font-bold text-[#17324d]">
                            {value} / 5
                          </div>
                        </div>
                        <div className="mt-4">
                          <input
                            type="range"
                            min={0}
                            max={5}
                            value={value}
                            onChange={(e) => setRatings((prev) => ({ ...prev, [skill.key]: Number(e.target.value) }))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#e3d7c7] accent-[#17324d]"
                            aria-label={`${skill.label} : ${value} sur 5`}
                          />
                          <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                            <span>Fragile</span>
                            <span>Solide</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-[26px] border border-[#d8ccb9] bg-white p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Priorisation détectée</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {weakSignals.length > 0
                        ? `Le parcours mettra d’abord l’accent sur : ${weakSignals.join(', ')}.`
                        : 'Aucune faiblesse forte auto-déclarée. Le parcours pourra commencer sur une base plus équilibrée.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#e6dbca] pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#f1e7d8] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </button>
              ) : (
                <div className="text-xs text-slate-500">Étape {step} sur 3</div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (step < 3) void handleNext();
                  else void handleFinish();
                }}
                disabled={!canProceed || isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-6 py-3.5 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : step === 3 ? (
                  'Terminer'
                ) : (
                  <>
                    Continuer
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
