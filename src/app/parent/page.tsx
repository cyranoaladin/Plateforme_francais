'use client';

import {
  TrendingUp,
  Clock,
  Target,
  Search,
  ChevronRight,
  TrendingDown,
  BarChart2,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { ProgressionChart } from '@/components/dashboard/progression-chart';

const SKILL_LABELS: Record<string, string> = {
  oral: 'Oral',
  ecrit: 'Écrit',
  grammaire: 'Langue & Grammaire',
  lectureCursive: 'Lecture cursive',
};

export default function ParentDashboard() {
  const data = useDashboard();

  const radarData = [
    { skill: 'Oral', score: data.scores.oral },
    { skill: 'Écrit', score: data.scores.ecrit },
    { skill: 'Grammaire', score: data.scores.grammaire },
    { skill: 'Lecture', score: data.scores.lectureCursive },
  ];

  const averageScore = (
    (data.scores.oral + data.scores.ecrit + data.scores.grammaire + data.scores.lectureCursive) / 4
  ).toFixed(1);

  const progressionData = data.weeklyProgression.map((item) => ({
    date: item.week,
    commentaire: item.score,
    dissertation: null,
    oral: null,
  }));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Espace Parent</h1>
          <p className="text-muted-foreground mt-1">Suivi de progression de <strong>{data.displayName}</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 border border-primary/20">
            <Calendar className="w-4 h-4" />
            EAF Juin 2026
          </div>
          <button className="p-2 hover:bg-muted rounded-xl transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ─── Key Metrics ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Moyenne Générale"
          value={`${averageScore}/20`}
          trend="+1.2"
          trendType="up"
          icon={TrendingUp}
          color="indigo"
        />
        <MetricCard
          title="Sessions complétées"
          value={data.totalSessions}
          subtext="depuis l'inscription"
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="Série actuelle"
          value={`${data.streak} j.`}
          subtext="jours consécutifs"
          icon={Target}
          color="emerald"
        />
        <MetricCard
          title="Prochaine étape"
          value="J-15"
          subtext="Bac Blanc #2"
          icon={BarChart2}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Skill Analysis ─── */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Analyse des compétences
          </h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 20]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {Object.entries(data.scores).map(([key, score]) => (
              <div key={key} className="p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{SKILL_LABELS[key] || key}</div>
                <div className="text-lg font-extrabold text-foreground">{score.toFixed(1)}/20</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Weekly Progression ─── */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              Progression par semaine
            </h3>
            <span className="text-xs font-bold px-3 py-1.5 bg-background border border-border rounded-full text-muted-foreground">Obj: 12/20</span>
          </div>
          <div className="h-[280px]">
            <ProgressionChart data={progressionData} target={12} />
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Dernières évaluations</h4>
            <div className="space-y-3">
              {data.timeline.filter(e => e.type === 'evaluation').slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <div className="text-sm font-bold text-foreground">{event.feature}</div>
                      <div className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-primary">
                    {event.payload?.score}/{event.payload?.max ?? 20}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer Advice ─── */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-border shrink-0">
          <TrendingUp className="w-8 h-8 text-indigo-500" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-bold text-foreground">Recommandation du tuteur Nexus</h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {data.displayName} progresse régulièrement. Pour optimiser les résultats, nous recommandons de se concentrer sur
            l&apos;axe <strong>{Object.entries(data.scores).sort((a, b) => a[1] - b[1])[0][0]}</strong> cette semaine.
          </p>
        </div>
        <button className="px-6 py-3 bg-foreground text-background rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
          Télécharger le bilan PDF <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  trendType = 'up',
  icon: Icon,
  color,
  subtext
}: {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: 'up' | 'down';
  icon: LucideIcon;
  color: string;
  subtext?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  };

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendType === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trendType === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
        {subtext && <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{subtext}</div>}
      </div>
    </div>
  );
}
