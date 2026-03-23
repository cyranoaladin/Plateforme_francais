'use client';

import { useSyncExternalStore } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ProgressionPoint = {
  date: string;
  commentaire: number | null;
  dissertation: number | null;
  oral: number | null;
};

type ProgressionChartProps = {
  data: ProgressionPoint[];
  target?: number;
};

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(216, 204, 185, 0.9)',
  backgroundColor: 'rgba(249, 246, 239, 0.96)',
  boxShadow: '0 16px 45px rgba(23, 50, 77, 0.12)',
};

export function ProgressionChart({ data, target = 12 }: ProgressionChartProps) {
  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isReady) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-[24px] bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-muted)]">
        Préparation du graphique...
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={256} minWidth={200}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="progression-commentaire" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--c-primary)" />
              <stop offset="100%" stopColor="var(--c-primary-muted)" />
            </linearGradient>
            <linearGradient id="progression-dissertation" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--color-amber-300)" />
              <stop offset="100%" stopColor="var(--c-reward)" />
            </linearGradient>
            <linearGradient id="progression-oral" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--c-success)" />
              <stop offset="100%" stopColor="var(--color-emerald-400)" />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--border-strong)" strokeDasharray="4 6" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-chart)', fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} domain={[0, 20]} tick={{ fill: 'var(--text-chart)', fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
            formatter={(value: number | string | Array<number | string> | undefined) => {
              if (Array.isArray(value)) {
                return value.join(', ');
              }
              return `${value ?? '—'} / 20`;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11 }} iconType="circle" />
          <ReferenceLine
            y={target}
            stroke="var(--color-amber-300)"
            strokeDasharray="5 5"
            label={{ value: 'Objectif', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-amber-700)' }}
          />
          <Line
            type="monotone"
            dataKey="commentaire"
            name="Commentaire"
            stroke="url(#progression-commentaire)"
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--c-primary)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="dissertation"
            name="Dissertation"
            stroke="url(#progression-dissertation)"
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--color-amber-300)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="oral"
            name="Oral"
            stroke="url(#progression-oral)"
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--c-success)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
