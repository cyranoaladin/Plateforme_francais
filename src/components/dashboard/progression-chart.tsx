'use client';

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

export function ProgressionChart({ data, target = 12 }: ProgressionChartProps) {
  return (
    <div className="w-full" style={{ height: 224 }}>
      <ResponsiveContainer width="100%" height={224}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={target} strokeDasharray="5 5" stroke="#f59e0b" label={{ value: 'Objectif', position: 'insideTopRight', fontSize: 10 }} />
          <Line type="monotone" dataKey="commentaire" name="Commentaire" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
          <Line type="monotone" dataKey="dissertation" name="Dissertation" stroke="#22c55e" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
          <Line type="monotone" dataKey="oral" name="Oral" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
