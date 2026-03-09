'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

type PaywallBannerProps = {
  message: string;
  planLabel?: string;
};

export function PaywallBanner({ message, planLabel }: PaywallBannerProps) {
  return (
    <div className="rounded-2xl border border-[#B87333]/40 bg-gradient-to-r from-[#B87333]/10 to-[#B87333]/5 p-5 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-[#B87333] mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-[#17324D]">
            Limite atteinte{planLabel ? ` — Plan ${planLabel}` : ''}
          </p>
          <p className="text-sm text-[#17324D]/80">{message}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F766E]/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Voir les plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
