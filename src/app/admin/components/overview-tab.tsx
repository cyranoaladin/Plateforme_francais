'use client';

import { Users, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { StatCard } from './stat-card';
import { type Stats, type Payment, getVisiblePlanColor, statusColors, statusLabels } from './shared';

export function OverviewTab({
  stats,
  recentPayments,
}: {
  stats: Stats;
  recentPayments: Payment[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs" value={stats.totalUsers} icon={Users} />
        <StatCard label="Abonnements actifs" value={stats.activeSubscriptions} icon={CheckCircle} iconColor="text-success" />
        <StatCard label="Paiements en attente" value={stats.pendingPayments} icon={Clock} iconColor="text-warning" />
        <StatCard label="Revenu total" value={`${stats.totalRevenueTND.toFixed(2)} TND`} icon={DollarSign} iconColor="text-success" />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Repartition par plan</h2>
        <div className="space-y-2">
          {stats.subscriptionsByPlan.map((item) => (
            <div key={item.plan} className="flex items-center justify-between">
              <span className="font-medium">{formatPlanLabel(item.plan)}</span>
              <Badge className={getVisiblePlanColor(item.plan)}>
                {item.count} utilisateur{item.count > 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Derniers paiements</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-2 px-4">Email</th>
                <th className="text-left py-2 px-4">Plan</th>
                <th className="text-left py-2 px-4">Montant</th>
                <th className="text-left py-2 px-4">Statut</th>
                <th className="text-left py-2 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-[var(--border-primary)]">
                  <td className="py-2 px-4">{payment.user.email}</td>
                  <td className="py-2 px-4">
                    <Badge className={getVisiblePlanColor(payment.plan)}>{formatPlanLabel(payment.plan)}</Badge>
                  </td>
                  <td className="py-2 px-4">{(payment.amountMillimes / 1000).toFixed(2)} TND</td>
                  <td className="py-2 px-4">
                    <Badge className={statusColors[payment.status]}>{statusLabels[payment.status] || payment.status}</Badge>
                  </td>
                  <td className="py-2 px-4">
                    {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
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
