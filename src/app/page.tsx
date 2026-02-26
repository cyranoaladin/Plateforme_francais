'use client';

import {
  AlertTriangle,
  BrainCircuit,
  ChevronRight,
  Clock,
  Flame,
  Mic,
  MessageSquare,
  PenTool,
  BookOpen,
  Target,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { ParcoursRecommandation } from '@/components/dashboard/parcours-recommandation';
import { useDashboard } from '@/hooks/useDashboard';

const SKILL_BARS = [
  { key: 'ecrit' as const, label: 'Écrit', color: 'bg-blue-500' },
  { key: 'oral' as const, label: 'Oral', color: 'bg-purple-500' },
  { key: 'grammaire' as const, label: 'Grammaire', color: 'bg-emerald-500' },
  { key: 'lectureCursive' as const, label: 'Lecture cursive', color: 'bg-amber-500' },
];

const RECOMMENDED_ACTIONS = [
  { title: 'Simulation orale guidée', duration: '15 min', type: 'oral', icon: Mic, href: '/atelier-oral', colorBg: 'bg-purple-500/10', colorText: 'text-purple-600 dark:text-purple-400' },
  { title: 'Exercice de grammaire ciblé', duration: '5 min', type: 'langue', icon: BookOpen, href: '/atelier-langue', colorBg: 'bg-emerald-500/10', colorText: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Entraînement écrit commentaire', duration: '20 min', type: 'ecrit', icon: PenTool, href: '/atelier-ecrit', colorBg: 'bg-blue-500/10', colorText: 'text-blue-600 dark:text-blue-400' },
];

export default function Dashboard() {
  const data = useDashboard();

  const radarData = [
    { skill: 'Oral', score: data.scores.oral },
    { skill: 'Écrit', score: data.scores.ecrit },
    { skill: 'Grammaire', score: data.scores.grammaire },
    { skill: 'Lecture cursive', score: data.scores.lectureCursive },
  ];

  const weakSignals = Object.entries(data.weakSignals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const weakestSkill = SKILL_BARS.reduce(
    (prev, curr) => (data.scores[curr.key] < data.scores[prev.key] ? curr : prev),
    SKILL_BARS[0],
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ─── Hero Header ─── */}
      <header className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-full p-1.5 shrink-0 border border-white/30 shadow-xl flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-white/90 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo_nexus_reussite.png"
              alt="Nexus Réussite"
              width={80}
              height={80}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Bonjour, {data.displayName} !</h1>
          <p className="text-indigo-100 text-sm md:text-base mb-4 max-w-xl">
            Je suis <strong>Nexus</strong>, ton tuteur IA.
            {data.countdownEcrit !== null && data.countdownEcrit > 0 && <> <strong>J-{data.countdownEcrit}</strong> avant l&apos;écrit · <strong>J-{data.countdownOral}</strong> avant les oraux. </>}
            {weakestSkill && <>Aujourd&apos;hui, je te conseille de travailler <strong>{weakestSkill.label.toLowerCase()}</strong>.</>}
          </p>
          <Link href="/tuteur" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm text-sm">
            <MessageSquare className="w-4 h-4" /> Discuter avec Nexus
          </Link>
        </div>

        <div className="relative z-10 hidden lg:flex flex-col gap-3 shrink-0">
          <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-full"><Flame className="w-5 h-5 text-orange-300" /></div>
            <div>
              <div className="text-[10px] text-indigo-100 uppercase tracking-wide font-semibold">Série active</div>
              <div className="font-bold text-lg">{data.streak} Jours</div>
            </div>
          </div>
          <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-full"><Target className="w-5 h-5 text-emerald-300" /></div>
            <div>
              <div className="text-[10px] text-indigo-100 uppercase tracking-wide font-semibold">Sessions</div>
              <div className="font-bold text-lg">{data.totalSessions}</div>
            </div>
          </div>
        </div>
      </header>

      {data.error && (
        <div className="p-4 bg-error/10 text-error border border-error/30 rounded-xl">{data.error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Skill Map (bars) ─── */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> Skill Map
          </h3>
          <div className="space-y-5">
            {SKILL_BARS.map((skill) => {
              const score = data.scores[skill.key];
              return (
                <div key={skill.key}>
                  <div className="flex justify-between text-sm font-medium mb-1.5">
                    <span className="text-foreground">{skill.label}</span>
                    <span className="text-muted-foreground">{score.toFixed(1)}/20</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${skill.color} transition-all duration-1000 ease-out`} style={{ width: `${(score / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {weakestSkill && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Axe prioritaire :</p>
              <div className={`${weakestSkill.color.replace('bg-', 'bg-')}/10 p-3 rounded-xl text-sm font-medium flex items-center gap-2 text-foreground border border-border`}>
                <Target className="w-4 h-4 text-primary" /> Renforcer {weakestSkill.label.toLowerCase()}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right column: Recommended + Charts ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended actions */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-5">Parcours recommandé</h3>
            <div className="space-y-3">
              {RECOMMENDED_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer bg-muted/20 hover:bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${action.colorBg} ${action.colorText}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.duration}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
              <ParcoursRecommandation />
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Radar compétences</h3>
                <span className="px-2.5 py-1 bg-primary/15 text-primary text-xs font-bold rounded-full">Réel</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke="var(--color-primary, #6366f1)" fill="var(--color-primary, #6366f1)" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Progression hebdo</h3>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weeklyProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="var(--color-warning, #f59e0b)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {data.isLoading && <p className="text-xs text-muted-foreground mt-2">Chargement...</p>}
            </div>
          </div>

          {/* Weak signals */}
          {weakSignals.length > 0 && (
            <div className="bg-card rounded-2xl border border-error/20 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-error/70" />
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-error" /> Points de vigilance
              </h3>
              <div className="flex flex-wrap gap-2">
                {weakSignals.map(([skill, count]) => (
                  <span key={skill} className="px-3 py-1.5 rounded-full bg-error/10 text-error text-sm font-medium border border-error/20">
                    {skill} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
