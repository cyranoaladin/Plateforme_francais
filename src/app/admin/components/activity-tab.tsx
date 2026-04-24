'use client';

import { useState } from 'react';
import { Activity, Cpu, Zap, TrendingUp } from '@/components/ui/icons';
import { Card, Badge, Button } from '@/components/ui';
import { StatCard } from './stat-card';

type ActivityData = {
  period: { days: number; since: string };
  recentEvents: Array<{
    id: string;
    userId: string;
    email: string;
    type: string;
    feature: string;
    createdAt: string;
  }>;
  featureBreakdown: Array<{ feature: string; count: number }>;
  typeBreakdown: Array<{ type: string; count: number }>;
  llm: {
    bySkill: Array<{
      skill: string;
      calls: number;
      costCents: number;
      inputTokens: number;
      outputTokens: number;
    }>;
    totals: {
      calls: number;
      costCents: number;
      inputTokens: number;
      outputTokens: number;
    };
  };
  dailyActive: Array<{ day: string; count: number }>;
};

const TYPE_LABELS: Record<string, string> = {
  interaction: 'Interaction',
  question: 'Question',
  search: 'Recherche',
  evaluation: 'Evaluation',
  navigation: 'Navigation',
};

export function ActivityTab({
  data,
  onReload,
}: {
  data: ActivityData;
  onReload: (days: number) => void;
}) {
  const [periodDays, setPeriodDays] = useState(data.period.days);

  const totalEvents = data.typeBreakdown.reduce((s, t) => s + t.count, 0);
  const llm = data.llm.totals;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[7, 14, 30].map((d) => (
          <Button
            key={d}
            onClick={() => {
              setPeriodDays(d);
              onReload(d);
            }}
            className={`text-sm px-3 py-1.5 ${
              periodDays === d
                ? 'bg-[var(--c-accent)] text-white'
                : 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {d}j
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Evenements" value={totalEvents} icon={Activity} />
        <StatCard
          label="Appels LLM"
          value={llm.calls}
          icon={Cpu}
          iconColor="text-brand"
        />
        <StatCard
          label="Cout LLM"
          value={`${(llm.costCents / 100).toFixed(2)} EUR`}
          icon={Zap}
          iconColor="text-warning"
        />
        <StatCard
          label="Tokens"
          value={`${((llm.inputTokens + llm.outputTokens) / 1000).toFixed(0)}k`}
          icon={TrendingUp}
          iconColor="text-success"
        />
      </div>

      {/* Daily active chart (simple bar) */}
      {data.dailyActive.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Utilisateurs actifs par jour</h2>
          <div className="flex items-end gap-1 h-32">
            {data.dailyActive
              .slice()
              .reverse()
              .map((d) => {
                const max = Math.max(...data.dailyActive.map((x) => x.count), 1);
                const pct = (d.count / max) * 100;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--text-secondary)]">{d.count}</span>
                    <div
                      className="w-full bg-[var(--c-accent)] rounded-t opacity-80"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Utilisation par fonctionnalite</h2>
          <div className="space-y-2">
            {data.featureBreakdown.map((f) => {
              const maxCount = data.featureBreakdown[0]?.count ?? 1;
              const pct = (f.count / maxCount) * 100;
              return (
                <div key={f.feature} className="flex items-center gap-3">
                  <span className="w-36 text-sm truncate">{f.feature}</span>
                  <div className="flex-1 bg-[var(--bg-surface-secondary)] rounded-full h-2">
                    <div
                      className="bg-[var(--c-accent)] h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-12 text-right">{f.count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* LLM costs by skill */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Couts LLM par skill</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="text-left py-1.5 px-2">Skill</th>
                  <th className="text-right py-1.5 px-2">Appels</th>
                  <th className="text-right py-1.5 px-2">Tokens</th>
                  <th className="text-right py-1.5 px-2">Cout</th>
                </tr>
              </thead>
              <tbody>
                {data.llm.bySkill.map((s) => (
                  <tr key={s.skill} className="border-b border-[var(--border-primary)]">
                    <td className="py-1.5 px-2 font-medium">{s.skill}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{s.calls}</td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {((s.inputTokens + s.outputTokens) / 1000).toFixed(1)}k
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {(s.costCents / 100).toFixed(2)} EUR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Type breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Types d'evenements</h2>
        <div className="flex flex-wrap gap-2">
          {data.typeBreakdown.map((t) => (
            <Badge key={t.type} className="bg-brand-subtle text-brand px-3 py-1.5">
              {TYPE_LABELS[t.type] ?? t.type}: {t.count}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Recent events */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Evenements recents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-left py-2 px-3">Feature</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border-primary)]">
                  <td className="py-1.5 px-3">{e.email}</td>
                  <td className="py-1.5 px-3">
                    <Badge className="bg-surface-secondary text-body text-xs">
                      {TYPE_LABELS[e.type] ?? e.type}
                    </Badge>
                  </td>
                  <td className="py-1.5 px-3">{e.feature}</td>
                  <td className="py-1.5 px-3 text-[var(--text-secondary)]">
                    {new Date(e.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
