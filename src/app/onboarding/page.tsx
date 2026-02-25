'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, PenTool, Mic, BookOpen, BrainCircuit, CheckCircle2, ChevronRight } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

const OEUVRES = [
  { id: 'mariage', title: 'Le Mariage forcé', author: 'Molière', type: 'Théâtre' },
  { id: 'surprise', title: "La Surprise de l'amour", author: 'Marivaux', type: 'Théâtre' },
  { id: 'gouges', title: 'Déclaration des droits de la femme', author: 'O. de Gouges', type: 'Idées' },
  { id: 'contemplations', title: 'Les Contemplations', author: 'V. Hugo', type: 'Poésie' },
  { id: 'douai', title: 'Cahier de Douai', author: 'A. Rimbaud', type: 'Poésie' },
  { id: 'sido', title: 'Sido / Les Vrilles de la vigne', author: 'Colette', type: 'Roman' },
  { id: 'rouge', title: 'Le Rouge et le Noir', author: 'Stendhal', type: 'Roman' },
  { id: 'peau', title: 'La Peau de chagrin', author: 'H. de Balzac', type: 'Roman' },
  { id: 'peste', title: 'La Peste', author: 'A. Camus', type: 'Roman' },
];

const SKILLS = [
  { key: 'lecture cursive', label: 'Lecture cursive', icon: BookOpen, color: 'text-amber-500' },
  { key: 'explication linéaire', label: 'Explication linéaire', icon: BookOpen, color: 'text-blue-500' },
  { key: 'question de grammaire', label: 'Question de grammaire', icon: BrainCircuit, color: 'text-emerald-500' },
  { key: 'dissertation', label: 'Dissertation', icon: PenTool, color: 'text-rose-500' },
  { key: 'commentaire', label: 'Commentaire', icon: PenTool, color: 'text-blue-500' },
  { key: 'expression orale', label: 'Expression orale', icon: Mic, color: 'text-purple-500' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [classLevel, setClassLevel] = useState('Première générale');
  const [establishment, setEstablishment] = useState('');
  const [eafDate, setEafDate] = useState('');
  const [selectedOeuvres, setSelectedOeuvres] = useState<string[]>([]);
  const [classCode, setClassCode] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({
    'lecture cursive': 3,
    'explication linéaire': 3,
    'question de grammaire': 3,
    dissertation: 3,
    commentaire: 3,
    'expression orale': 3,
  });

  const weakSignals = useMemo(
    () =>
      Object.entries(ratings)
        .filter(([, value]) => value <= 2)
        .map(([key]) => key),
    [ratings],
  );

  const toggleOeuvre = (title: string) => {
    setSelectedOeuvres((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    );
  };

  const submit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          displayName,
          classLevel,
          establishment: establishment || undefined,
          eafDate,
          selectedOeuvres,
          weakSignals,
          classCode: classCode || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de finaliser l\'onboarding.');
      }

      const payload = (await response.json()) as { welcomeMessage: string };
      setWelcomeMessage(payload.welcomeMessage);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
        {/* ─── Gradient Header ─── */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Bienvenue sur Nexus</h1>
            <p className="text-indigo-100 font-medium">Personnalisons ton parcours EAF en 3 étapes</p>
          </div>
          {/* Progress dots */}
          <div className="mt-8 flex justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-white w-12' : 'bg-white/30 w-6'}`} />
            ))}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="p-6 md:p-10">
          {error && <div className="p-3 rounded-xl border border-error/30 bg-error/10 text-error mb-6 text-sm">{error}</div>}
          {welcomeMessage && <div className="p-3 rounded-xl border border-success/30 bg-success/10 text-success mb-6 text-sm">{welcomeMessage}</div>}

          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-foreground mb-6">Faisons connaissance</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Comment t&apos;appelles-tu ?</label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ton prénom..." className="w-full p-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Classe</label>
                    <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Date EAF</label>
                    <input type="date" value={eafDate} onChange={(e) => setEafDate(e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Établissement (optionnel)</label>
                  <input value={establishment} onChange={(e) => setEstablishment(e.target.value)} placeholder="Nom de ton lycée..." className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Code classe (optionnel)</label>
                  <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Donné par ton enseignant..." className="w-full p-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground text-sm" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-foreground mb-2">Ton programme (2026)</h2>
              <p className="text-muted-foreground mb-6">Sélectionne les oeuvres que tu étudies. Le tuteur IA s&apos;adaptera.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-1">
                {OEUVRES.map((oeuvre) => {
                  const isSelected = selectedOeuvres.includes(oeuvre.title);
                  return (
                    <div
                      key={oeuvre.id}
                      onClick={() => toggleOeuvre(oeuvre.title)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{oeuvre.type}</div>
                        <div className={`font-bold leading-tight mb-0.5 ${isSelected ? 'text-foreground' : 'text-foreground'}`}>{oeuvre.title}</div>
                        <div className={`text-sm ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{oeuvre.author}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent group-hover:border-primary/40'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-foreground mb-2">Auto-évaluation</h2>
              <p className="text-muted-foreground mb-6">Ajuste les curseurs pour initialiser ta Skill Map. Sois honnête !</p>
              <div className="space-y-4">
                {SKILLS.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div key={skill.key} className="bg-muted/30 p-4 rounded-2xl border border-border">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                          <Icon className={`w-4 h-4 ${skill.color}`} />
                          {skill.label}
                        </div>
                        <span className="font-bold text-foreground bg-background px-3 py-1 rounded-xl border border-border text-sm shadow-sm">
                          {ratings[skill.key]} / 5
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={ratings[skill.key]}
                        onChange={(e) => setRatings((prev) => ({ ...prev, [skill.key]: Number(e.target.value) }))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs font-medium text-muted-foreground mt-2 px-1">
                        <span>Débutant</span>
                        <span>Avancé</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            {step > 1 ? (
              <button onClick={() => setStep((prev) => prev - 1)} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors">
                Retour
              </button>
            ) : <div />}

            <button
              onClick={() => {
                if (step < 3) setStep((prev) => prev + 1);
                else void submit();
              }}
              disabled={(step === 1 && (!displayName.trim() || !eafDate)) || (step === 2 && selectedOeuvres.length === 0) || isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
            >
              {isSubmitting ? 'Finalisation...' : step === 3 ? 'Générer mon parcours' : 'Suivant'}
              {step < 3 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
