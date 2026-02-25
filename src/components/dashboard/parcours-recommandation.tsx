'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

type TimelineResponse = {
  profile: { weakSkills: string[] };
  weakSignals: Record<string, number>;
};

const MAP_RECO: Record<string, { href: string; label: string }> = {
  Grammaire: { href: '/atelier-langue', label: 'Faire un exercice de langue ciblé' },
  'Problématisation': { href: '/atelier-ecrit', label: 'Travailler la problématique en dissertation' },
  'Explication linéaire': { href: '/atelier-oral', label: 'Relancer une simulation orale guidée' },
};

export function ParcoursRecommandation() {
  const [weakSignals, setWeakSignals] = useState<Record<string, number>>({});
  const [fallbackWeak, setFallbackWeak] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/v1/memory/timeline?limit=100');
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as TimelineResponse;
        setWeakSignals(payload.weakSignals);
        setFallbackWeak(payload.profile.weakSkills);
      } catch {
        // ignore
      }
    };

    void load();
  }, []);

  const recommended = useMemo(() => {
    const firstWeak = Object.entries(weakSignals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const fallback = fallbackWeak[0];
    return MAP_RECO[firstWeak ?? fallback ?? 'Grammaire'] ?? MAP_RECO.Grammaire;
  }, [weakSignals, fallbackWeak]);

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recommandation:</p>
      <Link
        href={recommended.href}
        className="flex items-center text-sm font-medium text-accent hover:text-accent-foreground hover:underline p-3 bg-accent/10 rounded-lg border border-accent/20 transition-all"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> {recommended.label}
      </Link>
    </div>
  );
}
