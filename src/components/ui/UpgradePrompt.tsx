'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

type Plan = 'FREE' | 'PREMIUM' | 'PRO';

type Props = {
  currentPlan: Plan;
  feature: string;
  message: string;
  compact?: boolean;
};

const UPGRADE_TARGET: Record<Plan, string> = {
  FREE: 'Premium',
  PREMIUM: 'Pro',
  PRO: 'Pro',
};

export function UpgradePrompt({ currentPlan, feature, message, compact = false }: Props) {
  const router = useRouter();
  const targetPlan = UPGRADE_TARGET[currentPlan];

  if (currentPlan === 'PRO') return null;

  if (compact) {
    return (
      <button
        onClick={() => router.push('/paiement/checkout')}
        className="inline-flex items-center gap-1.5 text-xs font-medium
                   text-[var(--c-primary)] hover:text-[var(--c-primary-dark)]
                   underline underline-offset-2"
        aria-label={`Passer en ${targetPlan} pour accéder à ${feature}`}
      >
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
        Passer en {targetPlan}
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Fonctionnalité Premium"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start gap-3">
        <Sparkles
          className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 mb-1">{message}</p>
          <button
            onClick={() => router.push('/paiement/checkout')}
            className="inline-flex items-center gap-1.5 text-sm font-medium
                       text-amber-800 hover:text-amber-900 underline underline-offset-2"
            aria-label={`Voir les offres ${targetPlan}`}
          >
            Passer en {targetPlan}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
