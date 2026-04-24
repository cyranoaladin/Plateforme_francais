'use client';

import { type LucideIcon } from '@/components/ui/icons';
import { Card } from '@/components/ui';

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-[var(--c-accent)]',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </Card>
  );
}
