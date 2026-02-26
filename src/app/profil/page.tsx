'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  Award,
  Target,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Flame,
} from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type StudentProfile = {
  skillMap: {
    ecrit: number;
    oral: number;
    grammaire: number;
    lectureCursive: number;
    lastUpdated: string;
  };
  errorBank: Array<{
    type: string;
    description: string;
    count: number;
    firstSeen: string;
  }>;
  studyPlan: {
    tasks: Array<{
      id: string;
      description: string;
      dueDate: string;
      estimatedMinutes: number;
      skill: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  badges: string[];
  streak: number;
  totalSessions: number;
  totalCopies: number;
  oeuvreChoisieEntretien?: string;
};

const BADGE_ICONS: Record<string, string> = {
  'Première simulation': '🎯',
  'Série de 3': '🔥',
  'Grammaire +': '📖',
  'Oral confirmé': '🎤',
  'Écrivain en herbe': '✍️',
  default: '⭐',
};

export default function ProfilPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/student/profile')
      .then((r) => {
        if (!r.ok) throw new Error('Impossible de charger le profil.');
        return r.json();
      })
      .then((data) => {
        setProfile(data as StudentProfile);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const radarData = profile
    ? [
        { skill: 'Oral', score: profile.skillMap.oral },
        { skill: 'Écrit', score: profile.skillMap.ecrit },
        { skill: 'Grammaire', score: profile.skillMap.grammaire },
        { skill: 'Lecture', score: profile.skillMap.lectureCursive },
      ]
    : [];

  const hasTasks = (profile?.studyPlan?.tasks?.length ?? 0) > 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold">Mon profil EAF</h1>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{profile?.streak ?? 0}</p>
          <p className="text-xs text-muted-foreground">jours consécutifs</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Target className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{profile?.totalSessions ?? 0}</p>
          <p className="text-xs text-muted-foreground">sessions orales</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold">{profile?.totalCopies ?? 0}</p>
          <p className="text-xs text-muted-foreground">copies corrigées</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Carte de compétences
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 20]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Error Bank */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Points à travailler
          </h2>
          {!profile?.errorBank?.length ? (
            <p className="text-sm text-muted-foreground">Aucune erreur récurrente détectée.</p>
          ) : (
            <div className="space-y-2">
              {profile.errorBank.slice(0, 5).map((err, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                  <span className="text-lg font-bold text-amber-500 w-6">{err.count}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{err.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{err.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Plan */}
      {hasTasks && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Plan de révision
          </h2>
          <div className="space-y-3">
            {profile!.studyPlan.tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/20">
                <div className={`w-2 h-8 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.description}</p>
                  <p className="text-xs text-muted-foreground">{task.estimatedMinutes} min · {new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" /> Badges obtenus ({profile?.badges?.length ?? 0})
        </h2>
        {!profile?.badges?.length ? (
          <p className="text-sm text-muted-foreground">Complète tes premières sessions pour débloquer des badges.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {profile.badges.map((badge) => (
              <div key={badge} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <span className="text-2xl">{BADGE_ICONS[badge] ?? BADGE_ICONS.default}</span>
                <span className="text-sm font-medium text-foreground">{badge}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Œuvre choisie pour l'entretien oral */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Mon œuvre pour l&apos;entretien oral (2e partie /8)
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          L&apos;œuvre que vous présenterez lors de la 2e partie de l&apos;oral (8 min, /8).
          Choisissez parmi vos lectures cursives ou œuvres étudiées en classe.
        </p>
        <select
          value={profile?.oeuvreChoisieEntretien ?? ''}
          onChange={async (e) => {
            const value = e.target.value;
            try {
              await fetch('/api/v1/student/oeuvre-choisie', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
                body: JSON.stringify({ oeuvreChoisieEntretien: value }),
              });
              setProfile((prev) => (prev ? { ...prev, oeuvreChoisieEntretien: value } : prev));
            } catch { /* handled silently */ }
          }}
          className="w-full rounded-xl border border-border bg-muted/20 p-3 text-sm"
        >
          <option value="">— Sélectionner une œuvre —</option>
          <optgroup label="Programme EAF 2025-2026">
            <option value="Cahier de Douai — Rimbaud">Cahier de Douai — Rimbaud</option>
            <option value="La rage de l'expression — Ponge">La rage de l&apos;expression — Ponge</option>
            <option value="Mes forêts — Hélène Dorion">Mes forêts — Hélène Dorion</option>
            <option value="Discours de la servitude volontaire — La Boétie">Discours de la servitude volontaire — La Boétie</option>
            <option value="Entretiens sur la pluralité des mondes — Fontenelle">Entretiens sur la pluralité des mondes — Fontenelle</option>
            <option value="Lettres d'une Péruvienne — Graffigny">Lettres d&apos;une Péruvienne — Graffigny</option>
            <option value="Le Menteur — Corneille">Le Menteur — Corneille</option>
            <option value="On ne badine pas avec l'amour — Musset">On ne badine pas avec l&apos;amour — Musset</option>
            <option value="Pour un oui ou pour un non — Sarraute">Pour un oui ou pour un non — Sarraute</option>
            <option value="Manon Lescaut — Abbé Prévost">Manon Lescaut — Abbé Prévost</option>
            <option value="La Peau de chagrin — Balzac">La Peau de chagrin — Balzac</option>
            <option value="Sido suivi de Les Vrilles de la vigne — Colette">Sido suivi de Les Vrilles de la vigne — Colette</option>
          </optgroup>
          <option value="autre">Autre œuvre (saisir dans le descriptif)</option>
        </select>
      </div>
    </div>
  );
}
