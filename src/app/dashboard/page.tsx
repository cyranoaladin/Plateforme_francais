'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Map as MapIcon,
  Sparkles,
  Target,
  Zap,
} from '@/components/ui/icons';
import { DescriptifRappelCard } from '@/components/dashboard/DescriptifRappelCard';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';
import { getDashboardUpgradeState } from '@/lib/billing/dashboard-upgrade';


const SKILL_META = [
  {
    key: 'ecrit' as const,
    label: 'Écrit',
    color: '#ef4444',
    copy: 'Structurer vite, sans perdre la tension de l\'argumentation.',
    href: '/atelier-ecrit',
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    color: 'var(--eaf-teal)',
    copy: 'Garder une parole nette, mobile et assez solide pour tenir la relance.',
    href: '/atelier-oral',
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    color: 'var(--eaf-orange)',
    copy: 'Verrouiller les notions qui coûtent des points trop rapidement.',
    href: '/atelier-langue',
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    color: 'var(--eaf-indigo)',
    copy: 'Réactiver les œuvres pour qu\'elles restent disponibles à l\'oral.',
    href: '/mon-parcours',
  },
];

const QUICK_ACCESS = [
  {
    title: 'Atelier oral',
    detail: 'Lecture, explication, entretien : repartir sur une séquence complète.',
    href: '/atelier-oral',
    emoji: '🎤',
    iconColor: '#1AD5A0',
    bgColor: 'rgba(26,213,160,0.12)',
  },
  {
    title: 'Atelier écrit',
    detail: 'Commentaire, dissertation ou sujet blanc selon le besoin réel.',
    href: '/atelier-ecrit',
    emoji: '✍️',
    iconColor: '#7B8EFF',
    bgColor: 'rgba(123,142,255,0.12)',
  },
  {
    title: 'Atelier langue',
    detail: 'Exercices courts pour verrouiller les notions qui coûtent le plus de points.',
    href: '/atelier-langue',
    emoji: '📝',
    iconColor: '#FFB547',
    bgColor: 'rgba(255,181,71,0.12)',
  },
  {
    title: 'Quiz',
    detail: 'Ancrer les repères sur les œuvres, les méthodes et les attentes du bac.',
    href: '/quiz',
    emoji: '❓',
    iconColor: '#FF6B35',
    bgColor: 'rgba(255,107,53,0.12)',
  },
  {
    title: 'Bibliothèque',
    detail: 'Ressources courtes pour relancer méthode, œuvres et repères utiles.',
    href: '/bibliotheque',
    emoji: '📚',
    iconColor: '#7B8EFF',
    bgColor: 'rgba(123,142,255,0.10)',
  },
  {
    title: 'Tuteur Nexus',
    detail: 'Débloquer une difficulté précise au lieu de tourner en rond.',
    href: '/tuteur',
    emoji: '💬',
    iconColor: '#1AD5A0',
    bgColor: 'rgba(26,213,160,0.10)',
  },
];

const OEUVRES_TAGS = [
  'Cahier de Douai', 'La Rage de l\'expression', 'Mes forêts',
  'Discours de la servitude volontaire', 'Entretiens sur la pluralité des mondes',
  'Lettres d\'une Péruvienne', 'Le Menteur', 'On ne badine pas avec l\'amour',
  'Pour un oui ou pour un non', 'Manon Lescaut', 'La Peau de chagrin',
  'Sido / Les Vrilles de la vigne'
];

const VIGILANCE_POINTS = [
  'Évite les formulations familières ou orales… Reformule ces phrases de manière plus soutenue et analytique. (1)',
  'Ne te contente pas de paraphraser le texte… analyse le procédé stylistique et son effet. (1)',
  'Cite davantage le texte pour appuyer tes analyses… cite le passage exact et explique en quoi cela illustre ta mémoire. (1)',
  'Structure mieux tes paragraphes. Commence chaque partie par une phrase d\'introduction claire… (1)',
];



function formatScoreLabel(value: number | null) {
  if (value === null) return 'Diagnostic à lancer';
  return `${value.toFixed(1)} / 20`;
}

function averageScoreValue(scores: { oral: number | null; ecrit: number | null; grammaire: number | null; lectureCursive: number | null }) {
  const values = Object.values(scores).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
}

function formatActivity(event: { id: string; type: string; feature: string; createdAt: string }) {
  const date = new Date(event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  return { id: event.id, label: 'Consultation de page', date };
}

export default function Dashboard() {
  const data = useDashboard();
  const [chartsReady, setChartsReady] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [descriptifTotal, setDescriptifTotal] = useState<number>(0);

  useEffect(() => {
    // Defer chart rendering until after browser layout so ResizeObserver
    // has real dimensions (avoids Recharts width(-1)/height(-1) warning).
    const raf = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    fetch('/api/v1/billing/status')
      .then(r => r.ok ? r.json() : null)
      .then((d: { subscription?: { planId?: string } } | null) => {
        if (d?.subscription?.planId) setPlanId(d.subscription.planId);
      })
      .catch(() => null);

    fetch('/api/v1/student/descriptif-lecture')
      .then(r => r.ok ? r.json() : { total: 0 })
      .then((d: { total: number }) => setDescriptifTotal(d.total))
      .catch(() => null);
  }, []);

  const weakestSkill = SKILL_META.reduce(
    (prev, curr) => ((data.scores[curr.key] ?? 0) < (data.scores[prev.key] ?? 0) ? curr : prev),
    SKILL_META[0]
  );

  const strongestSkill = SKILL_META.reduce(
    (prev, curr) => ((data.scores[curr.key] ?? 0) > (data.scores[prev.key] ?? 0) ? curr : prev),
    SKILL_META[0]
  );

  const radarData = SKILL_META.map((skill) => ({
    skill: skill.label,
    score: data.scores[skill.key] ?? 0,
    rawScore: data.scores[skill.key],
  }));

  const weakSignals = Object.entries(data.weakSignals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recentActivity = data.timeline.slice(0, 5).map(formatActivity);
  const averageScore = averageScoreValue(data.scores);
  const upgradeState = getDashboardUpgradeState(planId);

  // Sample progression data
  const progressionData = [
    { date: '01/04', commentaire: 8, dissertation: 6, oral: 10 },
    { date: '03/04', commentaire: 9, dissertation: 7, oral: 11 },
    { date: '05/04', commentaire: 8.5, dissertation: 8, oral: 10.5 },
    { date: '07/04', commentaire: 10, dissertation: 9, oral: 12 },
    { date: '09/04', commentaire: 9.5, dissertation: 8.5, oral: 11.5 },
  ];

  const latestInsight = recentActivity[0] ?? null;

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ width: '100%', minWidth: 0 }}>
      {/* ─── C.1 PILOTAGE DU JOUR (Hero card) ─── */}
      <section
        className="relative overflow-hidden rounded-[24px]"
        style={{
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid var(--eaf-indigo-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '32px',
          alignItems: 'start',
          padding: '36px 40px',
        }}
      >
        {/* Decorative orb */}
        <div 
          className="pointer-events-none absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(123,142,255,0.08), transparent 70%)' }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--eaf-orange)' }} />
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Pilotage du jour
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span 
                className="rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)', color: 'var(--eaf-text-secondary)' }}
              >
                Lundi 8 juin 2026
              </span>
              <span 
                className="rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-orange-border)', color: 'var(--eaf-orange)' }}
              >
                Écrit : J-{data.countdownEcrit ?? 59}
              </span>
              <span 
                className="rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)', color: 'var(--eaf-text-tertiary)' }}
              >
                Oral : {data.countdownOral ? `J-${data.countdownOral}` : 'date non renseignée'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-[32px] md:text-[36px] font-bold leading-[1.12] tracking-[-1.5px] mb-3"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            {data.displayName}, voilà la priorité qui doit faire bouger ta semaine.
          </h1>

          {/* Paragraph */}
          <p 
            className="text-[14px] leading-[1.6] mb-6 max-w-2xl"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            Axe prioritaire : <strong style={{ color: 'var(--eaf-text-primary)' }}>{weakestSkill.label.toLowerCase()}</strong>. 
            La lecture utile n&apos;est pas exhaustive : elle remet en circulation les repères décisifs. 
            Priorité : mini-séances quotidiennes (10-20 min), construire la carte des compétences, alimenter la banque d&apos;erreurs.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href="/bibliotheque"
              className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[14px] font-semibold text-white transition-all"
              style={{ 
                background: 'var(--eaf-orange)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--eaf-shadow-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--eaf-orange)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Réouvrir une œuvre
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/mon-parcours"
              className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-all"
              style={{ 
                background: 'transparent',
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                e.currentTarget.style.color = 'var(--eaf-indigo)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.color = 'var(--eaf-text-secondary)';
              }}
            >
              Voir le parcours
              <MapIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Voie', value: data.classLevel },
              { label: 'Point fort courant', value: data.hasEvaluationData ? strongestSkill.label : 'En construction' },
              { label: 'Angle à retrendre', value: data.hasEvaluationData ? weakestSkill.label : 'À préciser' },
              { label: 'Niveau moyen', value: formatScoreLabel(averageScore) },
              { label: 'Dernier passage', value: latestInsight?.date ?? 'pas encore de séance' },
            ].map((meta) => (
              <span 
                key={meta.label}
                className="rounded-md px-3 py-1 text-[12px]"
                style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
              >
                <span style={{ color: 'var(--eaf-text-tertiary)' }}>{meta.label}:</span>{' '}
                <span style={{ color: 'var(--eaf-text-primary)', fontWeight: 600 }}>{meta.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right column: CE QUE FAIRE MAINTENANT — ou alerte descriptif si vide */}
        <div
          className="relative rounded-[16px] self-start"
          style={{
            background: descriptifTotal === 0 ? 'transparent' : 'rgba(255,255,255,0.04)',
            border: descriptifTotal === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
            padding: descriptifTotal === 0 ? '0' : '24px',
          }}
        >
        {descriptifTotal === 0 ? (
          <DescriptifRappelCard current={0} minimum={16} />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-3.5 w-3.5" style={{ color: 'var(--eaf-orange)' }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Ce que tu dois faire maintenant
              </span>
            </div>

            <h2
              className="text-[18px] font-bold mb-2"
              style={{
                fontFamily: 'var(--eaf-font-display)',
                color: 'var(--eaf-text-primary)'
              }}
            >
              Réouvrir une œuvre
            </h2>

            <p
              className="text-[13px] leading-[1.5] mb-4"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              Réactiver les repères, citations et enjeux qui serviront vraiment.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Temps estimé', value: '12 min' },
                { label: 'Pourquoi', value: 'Lecture cursive' },
                { label: 'Échéance', value: `Écrit : J-${data.countdownEcrit ?? 59}` },
              ].map((info) => (
                <div
                  key={info.label}
                  className="rounded-lg p-2 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[10px] uppercase mb-1" style={{ color: 'var(--eaf-text-tertiary)' }}>{info.label}</p>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--eaf-text-primary)' }}>{info.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/bibliotheque"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all"
                style={{ background: 'var(--eaf-orange)' }}
              >
                Commencer maintenant
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/tuteur"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--eaf-text-secondary)'
                }}
              >
                Alternative rapide
                <Zap className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        )}
        </div>
      </section>

      {/* ─── C.2 MINI STATS — PLEINE LARGEUR ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'SÉRIE ACTIVE', value: String(data.streak), sub: 'jours', color: 'var(--eaf-teal)' },
          { label: 'SESSIONS TRACÉES', value: String(data.totalSessions), color: 'var(--eaf-indigo)' },
          { label: 'PERSONNALISATION', value: data.onboardingCompleted ? 'Activée' : 'À terminer', isBadge: true, badgeBg: 'var(--eaf-teal-dim)', badgeBorder: 'var(--eaf-teal-border)', badgeColor: 'var(--eaf-teal)' },
          { label: 'REPÈRE FORT', value: data.hasEvaluationData ? strongestSkill.label : 'À construire', isBadge: true, badgeBg: 'var(--eaf-gold-dim)', badgeBorder: 'var(--eaf-gold-border)', badgeColor: 'var(--eaf-gold)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--eaf-bg1)', border: '1px solid var(--eaf-border)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              {stat.label}
            </p>
            {stat.isBadge ? (
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                style={{
                  background: (stat as { badgeBg?: string }).badgeBg ?? 'var(--eaf-bg3)',
                  color: stat.badgeColor,
                  border: `1px solid ${(stat as { badgeBorder?: string }).badgeBorder ?? 'var(--eaf-border)'}`
                }}
              >
                {stat.value}
              </span>
            ) : (
              <p
                className="text-[28px] font-bold"
                style={{
                  fontFamily: 'var(--eaf-font-display)',
                  color: stat.color || 'var(--eaf-text-primary)'
                }}
              >
                {stat.value}
                {stat.sub && <span className="text-base ml-1" style={{ color: 'var(--eaf-text-secondary)' }}>{stat.sub}</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ─── C.3 GRID 2 COLONNES: Boussole + Trajectoire ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Boussole (Radar) */}
        <div 
          className="rounded-[20px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Boussole
              </span>
              <h2 
                className="text-[22px] font-bold tracking-[-1px] mt-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Une lecture visuelle rapide de tes quatre grands axes.
              </h2>
            </div>
            <span 
              className="rounded-full px-3 py-1 text-[12px] font-bold shrink-0"
              style={{ 
                background: 'var(--eaf-indigo-dim)', 
                border: '1px solid var(--eaf-indigo-border)',
                color: 'var(--eaf-indigo)',
                fontFamily: 'var(--eaf-font-display)'
              }}
            >
              Moyenne {formatScoreLabel(averageScore)}
            </span>
          </div>

          <div className="h-[180px] w-full min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={180} minWidth={0}>
                <RadarChart data={radarData}>
                  <PolarGrid 
                    stroke="var(--eaf-border)"
                    radialLines={true}
                  />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fontSize: 11, fill: 'var(--eaf-text-secondary)' }} 
                  />
                  <PolarRadiusAxis 
                    domain={[0, 20]} 
                    tick={{ fontSize: 10, fill: 'var(--eaf-text-tertiary)' }}
                    tickCount={5}
                  />
                  <Radar 
                    dataKey="score" 
                    stroke="var(--eaf-indigo)" 
                    fill="var(--eaf-indigo)" 
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--eaf-border)] border-t-[var(--eaf-indigo)]" />
              </div>
            )}
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {radarData.map((item) => (
              <span 
                key={item.skill}
                className="rounded-full px-3 py-1 text-[11px] font-medium"
                style={{ 
                  background: 'var(--eaf-bg2)', 
                  border: '1px solid var(--eaf-border)',
                  color: item.rawScore === null ? 'var(--eaf-indigo)' : 
                         (item.rawScore ?? 0) < 8 ? '#ef4444' : 
                         (item.rawScore ?? 0) < 12 ? 'var(--eaf-gold)' : 
                         'var(--eaf-teal)'
                }}
              >
                {item.skill}: {formatScoreLabel(item.rawScore)}
              </span>
            ))}
          </div>
        </div>

        {/* Trajectoire (Line chart) */}
        <div 
          className="rounded-[20px] p-7 relative"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Trajectoire
              </span>
              <h2 
                className="text-[22px] font-bold tracking-[-1px] mt-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                La progression doit être lisible, pas seulement ressentie.
              </h2>
            </div>
          </div>

          <span 
            className="absolute top-7 right-7 rounded-full px-3 py-1.5 text-[11px]"
            style={{ 
              background: 'var(--eaf-bg3)', 
              border: '1px solid var(--eaf-border)',
              color: 'var(--eaf-text-tertiary)'
            }}
          >
            Tendance en construction
          </span>

          <div className="h-[180px] w-full mt-8 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={180} minWidth={0}>
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--eaf-border)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'var(--eaf-text-tertiary)' }}
                    axisLine={{ stroke: 'var(--eaf-border)' }}
                  />
                  <YAxis 
                    domain={[0, 20]} 
                    tick={{ fontSize: 10, fill: 'var(--eaf-text-tertiary)' }}
                    axisLine={{ stroke: 'var(--eaf-border)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--eaf-bg1)', 
                      border: '1px solid var(--eaf-border)',
                      borderRadius: '8px',
                      color: 'var(--eaf-text-primary)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commentaire" 
                    stroke="var(--eaf-indigo)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--eaf-indigo)', r: 3 }}
                    name="Commentaire"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="dissertation" 
                    stroke="var(--eaf-gold)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--eaf-gold)', r: 3 }}
                    name="Dissertation"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="oral" 
                    stroke="var(--eaf-teal)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--eaf-teal)', r: 3 }}
                    name="Oral"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--eaf-border)] border-t-[var(--eaf-indigo)]" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {[
              { label: 'Commentaire', color: 'var(--eaf-indigo)' },
              { label: 'Dissertation', color: 'var(--eaf-gold)' },
              { label: 'Oral', color: 'var(--eaf-teal)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div 
                  className="h-2 w-2 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[11px]" style={{ color: 'var(--eaf-text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── C.4 GRID 2 COLONNES: Cartographie + Corpus ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cartographie fine */}
        <div 
          className="rounded-[18px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Cartographie fine
              </span>
              <h2 
                className="text-[22px] font-bold mt-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Ce que tu tiens bien, et ce qu&apos;il faut remettre sous tension.
              </h2>
            </div>
            <Link 
              href="/mon-parcours"
              className="text-[12px] font-medium transition-colors hover:underline"
              style={{ color: 'var(--eaf-indigo)' }}
            >
              Voir le parcours ⊞
            </Link>
          </div>

          <div className="space-y-4">
            {SKILL_META.map((skill) => {
              const score = data.scores[skill.key];
              const percent = ((score ?? 0) / 20) * 100;
              return (
                <div 
                  key={skill.key}
                  className="rounded-[10px] p-4"
                  style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--eaf-text-primary)' }}
                    >
                      {skill.label}
                    </span>
                    <span 
                      className="text-[13px] font-bold"
                      style={{ color: 'var(--eaf-text-primary)' }}
                    >
                      {formatScoreLabel(score)}
                    </span>
                  </div>
                  <p 
                    className="text-[12px] italic mb-3"
                    style={{ color: 'var(--eaf-text-secondary)' }}
                  >
                    {skill.copy}
                  </p>
                  <div 
                    className="h-1 rounded-full"
                    style={{ background: 'var(--eaf-bg3)' }}
                  >
                    <div 
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percent}%`,
                        background: score === null ? 'var(--eaf-indigo)' : skill.color
                      }}
                    />
                  </div>
                  {score === null && (
                    <Link 
                      href={skill.href}
                      className="inline-block mt-2 text-[11px] font-medium rounded-full px-2.5 py-1"
                      style={{ 
                        background: 'var(--eaf-indigo-dim)',
                        color: 'var(--eaf-indigo)',
                        border: '1px solid var(--eaf-indigo-border)'
                      }}
                    >
                      Diagnostic à lancer →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mon corpus */}
        <div 
          className="rounded-[18px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <span 
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--eaf-indigo)' }}
          >
            Mon corpus
          </span>
          <h2 
            className="text-[22px] font-bold mt-1 mb-5"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Les œuvres qui structurent ton parcours.
          </h2>

          {/* Œuvre principale */}
          <div className="mb-5">
            <p 
              className="text-[10px] font-semibold uppercase mb-2"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Œuvre principale pour l&apos;entretien
            </p>
            <div 
              className="rounded-r-lg py-3 px-4"
              style={{ 
                background: 'var(--eaf-bg2)',
                borderLeft: '3px solid var(--eaf-gold)'
              }}
            >
              <span 
                className="text-[16px] font-semibold"
                style={{ color: 'var(--eaf-text-primary)' }}
              >
                {data.oeuvreChoisieEntretien || 'Manon Lescaut'}
              </span>
            </div>
          </div>

          {/* Œuvres au programme */}
          <div>
            <p 
              className="text-[10px] font-semibold uppercase mb-3"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Œuvres au programme
            </p>
            <div className="flex flex-wrap gap-2">
              {(data.selectedOeuvres.length > 0 ? data.selectedOeuvres : OEUVRES_TAGS).map((oeuvre) => (
                <span 
                  key={oeuvre}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-all"
                  style={{ 
                    background: 'var(--eaf-bg2)', 
                    border: '1px solid var(--eaf-border)',
                    color: 'var(--eaf-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                    e.currentTarget.style.color = 'var(--eaf-indigo)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--eaf-border)';
                    e.currentTarget.style.color = 'var(--eaf-text-secondary)';
                  }}
                >
                  {oeuvre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── C.5 GRID 2 COLONNES: Historique + Points de vigilance ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Historique */}
        <div 
          className="rounded-[18px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Historique utile
              </span>
              <h2 
                className="text-[20px] font-bold mt-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Ce qui a vraiment bougé dans tes dernières séances.
              </h2>
            </div>
            <span 
              className="rounded-full px-3 py-1 text-[12px]"
              style={{ 
                background: 'var(--eaf-bg2)', 
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
            >
              {latestInsight?.date ?? '10 avr.'}
            </span>
          </div>

          <div className="space-y-2">
            {(recentActivity.length > 0 ? recentActivity : [
              { id: '1', label: 'Consultation de page', date: '10 avr.' },
              { id: '2', label: 'Consultation de page', date: '10 avr.' },
              { id: '3', label: 'Consultation de page', date: '10 avr.' },
              { id: '4', label: 'Consultation de page', date: '10 avr.' },
              { id: '5', label: 'login', date: '10 avr.' },
            ]).map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-3 rounded-[10px] p-3"
                style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
              >
                <Clock3 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--eaf-text-tertiary)' }} />
                <span 
                  className="text-[13px] font-medium flex-1"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {item.label}
                </span>
                <span 
                  className="text-[11px]"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Points de vigilance */}
        <div 
          className="rounded-[18px] p-7"
          style={{ 
            background: 'var(--eaf-bg1)',
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <span 
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--eaf-orange)' }}
            >
              Points de vigilance remontés
            </span>
            <button 
              className="rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{ 
                background: 'var(--eaf-orange-dim)',
                border: '1px solid var(--eaf-orange-border)',
                color: 'var(--eaf-orange)'
              }}
            >
              Soumettre à nouveau la copie. (2)
            </button>
          </div>

          <div className="space-y-2">
            {(weakSignals.length > 0 
              ? weakSignals.map(([skill, count]) => `${skill} (${count})`)
              : VIGILANCE_POINTS
            ).map((point, idx) => (
              <div 
                key={idx}
                className="rounded-r-lg py-2.5 px-3 text-[12px] leading-[1.5]"
                style={{ 
                  background: 'var(--eaf-bg2)',
                  borderLeft: '3px solid var(--eaf-orange)',
                  color: 'var(--eaf-text-secondary)'
                }}
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── C.6 PROCHAIN MEILLEUR LEVIER ─── */}
      <div 
        className="rounded-[16px] p-6"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.06))',
          border: '1px solid var(--eaf-orange-border)'
        }}
      >
        <span 
          className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-3 block"
          style={{ color: 'var(--eaf-orange)' }}
        >
          Prochain meilleur levier
        </span>

        <div className="flex items-start gap-4">
          <div 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(255,107,53,0.15)' }}
          >
            <Zap className="h-4 w-4" style={{ color: 'var(--eaf-orange)' }} />
          </div>

          <div className="flex-1">
            <h3 
              className="text-[18px] font-bold mb-1"
              style={{ color: 'var(--eaf-text-primary)' }}
            >
              Relancer la grammaire ciblée
            </h3>
            <p 
              className="text-[13px] mb-2"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              Reprendre un exercice bref et précis pour consolider la notion qui décroche le plus vite.
            </p>
            <p 
              className="text-[12px] italic"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              L&apos;idée n&apos;est pas d&apos;en faire plus, mais de relancer le bon atelier au bon moment.
            </p>
          </div>

          <Link
            href="/atelier-langue"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all"
            style={{ background: 'var(--eaf-orange)' }}
          >
            Ouvrir l&apos;atelier
          </Link>
        </div>
      </div>

      {/* ─── C.7 ACCÈS RAPIDE ─── */}
      <div>
        <span 
          className="text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--eaf-indigo)' }}
        >
          Accès rapide
        </span>
        <h2 
          className="text-[22px] font-bold mt-1 mb-2"
          style={{ 
            fontFamily: 'var(--eaf-font-display)',
            color: 'var(--eaf-text-primary)'
          }}
        >
          Les ateliers utiles doivent rester à un clic, sans bruit visuel.
        </h2>
        <p 
          className="text-[13px] mb-5 max-w-[500px]"
          style={{ color: 'var(--eaf-text-secondary)' }}
        >
          Choisis un bloc, lance-le, puis reviens vérifier l&apos;effet réel sur tes scores et tes repères de travail.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACCESS.map((atelier) => (
            <Link
              key={atelier.href}
              href={atelier.href}
              className="group rounded-[14px] p-5 transition-all duration-200"
              style={{ 
                background: 'var(--eaf-bg1)', 
                border: '1px solid var(--eaf-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--eaf-border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg mb-3"
                style={{ background: atelier.bgColor, width: '40px', height: '40px', fontSize: '20px' }}
              >
                {atelier.emoji}
              </div>
              <h3 
                className="text-[14px] font-semibold mb-1.5"
                style={{ color: 'var(--eaf-text-primary)' }}
              >
                {atelier.title}
              </h3>
              <p 
                className="text-[12px] leading-[1.5]"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                {atelier.detail}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── C.8 AVERTISSEMENT DESCRIPTIF (sous le hero si partiellement rempli) ─── */}
      {descriptifTotal > 0 && descriptifTotal < 16 && (
        <DescriptifRappelCard current={descriptifTotal} minimum={16} />
      )}

      {/* ─── Upgrade Banner (if applicable) ─── */}
      {upgradeState && (
        <section 
          className="relative overflow-hidden rounded-[16px] px-6 py-5"
          style={{ 
            background: 'linear-gradient(135deg, var(--eaf-indigo), #4458D4)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              <div>
                <p className="text-sm font-bold text-white">{upgradeState.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{upgradeState.detail}</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all"
              style={{ 
                background: 'var(--eaf-orange)',
                color: 'white'
              }}
            >
              {upgradeState.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
