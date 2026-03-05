'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, Mic, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, Loader2, Search } from 'lucide-react';
import { apiFetch, isApiError } from '@/lib/api/client';
import { track } from '@/components/analytics/events';

/* ─────────────────── Data ─────────────────── */

const OEUVRES = [
  { id: 'douai', title: 'Cahier de Douai', author: 'Arthur Rimbaud', type: 'Poésie' },
  { id: 'ponge', title: 'La Rage de l\u2019expression', author: 'Francis Ponge', type: 'Poésie' },
  { id: 'dorion', title: 'Mes forêts', author: 'Hélène Dorion', type: 'Poésie' },
  { id: 'boetie', title: 'Discours de la servitude volontaire', author: 'Étienne de La Boétie', type: 'Littérature d\u2019idées' },
  { id: 'fontenelle', title: 'Entretiens sur la pluralité des mondes', author: 'Fontenelle', type: 'Littérature d\u2019idées' },
  { id: 'graffigny', title: 'Lettres d\u2019une Péruvienne', author: 'Françoise de Graffigny', type: 'Littérature d\u2019idées' },
  { id: 'menteur', title: 'Le Menteur', author: 'Pierre Corneille', type: 'Théâtre' },
  { id: 'musset', title: 'On ne badine pas avec l\u2019amour', author: 'Alfred de Musset', type: 'Théâtre' },
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
  { key: 'comprehension', label: 'Compréhension du texte', icon: BookOpen, color: 'text-amber-500' },
  { key: 'procedes', label: 'Analyse des procédés', icon: BookOpen, color: 'text-blue-500' },
  { key: 'plan', label: 'Organisation du plan', icon: PenTool, color: 'text-rose-500' },
  { key: 'lecture', label: 'Lecture expressive', icon: Mic, color: 'text-purple-500' },
  { key: 'grammaire', label: 'Grammaire', icon: BrainCircuit, color: 'text-emerald-500' },
  { key: 'culture', label: 'Culture / œuvre & parcours', icon: BookOpen, color: 'text-indigo-500' },
] as const;

const STEP_LABELS = ['Profil', 'Œuvres', 'Auto-évaluation'] as const;

/* ─────────────────── Stepper ─────────────────── */

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Étapes de l'onboarding" className="flex items-center justify-center gap-2">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {idx > 0 && <div className={`w-8 h-0.5 rounded-full transition-colors ${isDone ? 'bg-white' : 'bg-white/30'}`} />}
            <div className="flex items-center gap-1.5" aria-current={isActive ? 'step' : undefined}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isDone ? 'bg-white text-violet-700' : isActive ? 'bg-white text-violet-700' : 'bg-white/20 text-white/60'
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${isActive || isDone ? 'text-white' : 'text-white/50'}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/* ─────────────────── Error Banner ─────────────────── */

function OnboardingErrorBanner({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-xl border border-error/30 bg-error/10 text-error mb-6 text-sm" role="alert">
      {message}
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */

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
          const skill = SKILLS.find((s) => s.key === key);
          return skill?.label ?? key;
        }),
    [ratings],
  );

  const filteredOeuvres = useMemo(() => {
    if (!oeuvreSearch.trim()) return OEUVRES;
    const q = oeuvreSearch.toLowerCase();
    return OEUVRES.filter(
      (o) => o.title.toLowerCase().includes(q) || o.author.toLowerCase().includes(q) || o.type.toLowerCase().includes(q),
    );
  }, [oeuvreSearch]);

  useEffect(() => {
    track({ name: 'page_view', props: { path: '/onboarding' } });
  }, []);

  useEffect(() => {
    track({ name: 'onboarding_step_view', props: { step } });
  }, [step]);

  const toggleOeuvre = (title: string) => {
    setSelectedOeuvres((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    );
  };

  /**
   * Save profile data via PUT /api/v1/student/profile (autosave on step transition).
   */
  const saveProfile = useCallback(async () => {
    try {
      await apiFetch('/api/v1/student/profile', {
        method: 'PUT',
        json: {
          displayName,
          classLevel,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres: customOeuvre.trim() ? [...selectedOeuvres, customOeuvre.trim()] : selectedOeuvres,
          weakSkills: weakSignals,
          classCode: classCode || undefined,
        },
      });
    } catch (err) {
      if (isApiError(err) && err.status === 403) {
        setError('Sécurité : rafraîchis la page puis réessaie.');
        return false;
      }
      // Non-blocking for autosave: log but don't block navigation
      console.warn('[onboarding] autosave failed:', err);
    }
    return true;
  }, [displayName, classLevel, establishment, eafDate, selectedOeuvres, customOeuvre, weakSignals, classCode]);

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
          selectedOeuvres: customOeuvre.trim() ? [...selectedOeuvres, customOeuvre.trim()] : selectedOeuvres,
          weakSignals,
          classCode: classCode || undefined,
        },
      });

      track({ name: 'onboarding_complete', props: {} });
      setWelcomeMessage(payload.welcomeMessage ?? 'Ton parcours est prêt !');
      setTimeout(() => {
        router.push('/');
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
        setError('Impossible de finaliser l\'onboarding. Réessaie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const step1Valid = displayName.trim().length > 0 && classLevel.trim().length > 0 && eafDate.length > 0;
  const step2Valid = selectedOeuvres.length > 0 || customOeuvre.trim().length > 0;

  const canProceed =
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    step === 3;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* ─── Header ─── */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
              <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-10 w-auto object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold">Onboarding (3 minutes)</h1>
              <p className="text-violet-100 text-sm mt-1">Personnalisons ton parcours EAF</p>
            </div>
            <Stepper current={step} />
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 flex items-start justify-center p-4 md:p-6">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm mt-4">
          {error && <OnboardingErrorBanner message={error} />}
          {welcomeMessage && (
            <div className="p-3 rounded-xl border border-success/30 bg-success/10 text-success mb-6 text-sm flex items-center gap-2" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {welcomeMessage}
            </div>
          )}

          {/* Step 1 — Profil */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Étape 1/3 — Ton profil</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Ces informations servent à personnaliser ton parcours. Tu pourras les modifier plus tard.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="ob-name">Nom et prénom</label>
                  <input
                    id="ob-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ton nom affiché"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="ob-class">Classe</label>
                    <select
                      id="ob-class"
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      {CLASS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="ob-date">Date EAF</label>
                    <input
                      id="ob-date"
                      type="date"
                      value={eafDate}
                      onChange={(e) => setEafDate(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="ob-school">Établissement (optionnel)</label>
                  <input
                    id="ob-school"
                    value={establishment}
                    onChange={(e) => setEstablishment(e.target.value)}
                    placeholder="Nom de ton lycée"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="ob-code">Code classe enseignant (optionnel)</label>
                  <input
                    id="ob-code"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    placeholder="Ex : PMF-1G2-2026"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Œuvres */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Étape 2/3 — Tes œuvres</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Sélectionne les œuvres étudiées cette année. Tu peux en ajouter plus tard.
              </p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={oeuvreSearch}
                  onChange={(e) => setOeuvreSearch(e.target.value)}
                  placeholder="Rechercher une œuvre, un auteur…"
                  className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
                {filteredOeuvres.map((oeuvre) => {
                  const isSelected = selectedOeuvres.includes(oeuvre.title);
                  return (
                    <button
                      type="button"
                      key={oeuvre.id}
                      onClick={() => toggleOeuvre(oeuvre.title)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group text-left ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-500 shadow-sm'
                          : 'bg-card border-border hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>{oeuvre.type}</div>
                        <div className="font-bold text-foreground text-sm leading-tight truncate">{oeuvre.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{oeuvre.author}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-2 ${
                        isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'border-border text-transparent group-hover:border-violet-300'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedOeuvres.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{selectedOeuvres.length} œuvre{selectedOeuvres.length > 1 ? 's' : ''} sélectionnée{selectedOeuvres.length > 1 ? 's' : ''}</p>
              )}
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">Œuvre absente de la liste (optionnel)</label>
                <input
                  value={customOeuvre}
                  onChange={(e) => setCustomOeuvre(e.target.value)}
                  placeholder="Saisis ton œuvre exacte donnée par ton professeur"
                  className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Auto-évaluation */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Étape 3/3 — Ton point de départ</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Ce n&apos;est pas une note. C&apos;est un réglage pour proposer les bons entraînements.
              </p>
              <div className="space-y-3">
                {SKILLS.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div key={skill.key} className="bg-muted/30 p-4 rounded-xl border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                          <Icon className={`w-4 h-4 ${skill.color}`} />
                          {skill.label}
                        </div>
                        <span className="font-bold text-foreground bg-background px-2.5 py-0.5 rounded-lg border border-border text-xs">
                          {ratings[skill.key]} / 5
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        value={ratings[skill.key]}
                        onChange={(e) => setRatings((prev) => ({ ...prev, [skill.key]: Number(e.target.value) }))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-violet-600"
                        aria-label={`${skill.label} : ${ratings[skill.key]} sur 5`}
                      />
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground mt-1 px-0.5">
                        <span>Débutant</span>
                        <span>Avancé</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {weakSignals.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Points faibles détectés : <strong>{weakSignals.join(', ')}</strong> — la plateforme priorisera ces axes.
                </p>
              )}
            </div>
          )}

          {/* ─── Footer (Back/Next/Finish) ─── */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Retour
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                if (step < 3) void handleNext();
                else void handleFinish();
              }}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement&hellip;</>
              ) : step === 3 ? (
                'Terminer'
              ) : (
                <>Continuer <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
