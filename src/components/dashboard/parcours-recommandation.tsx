'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, BrainCircuit, Mic, Sparkles } from 'lucide-react';

type TimelineResponse = {
  profile: { weakSkills?: string[] };
  weakSignals: Record<string, number>;
};

type ParcoursRecommandationProps = {
  weakSignals?: Record<string, number>;
  weakSkills?: string[];
  className?: string;
};

const MAP_RECO: Record<
  string,
  {
    href: string;
    label: string;
    detail: string;
    icon: typeof BrainCircuit;
    accent: string;
  }
> = {
  grammaire: {
    href: '/atelier-langue',
    label: 'Relancer la grammaire ciblée',
    detail: 'Reprendre un exercice bref et précis pour consolider la notion qui décroche le plus vite.',
    icon: BrainCircuit,
    accent: 'from-[var(--c-primary)] via-[#22486e] to-[var(--c-success)]',
  },
  problematisation: {
    href: '/atelier-ecrit',
    label: 'Retendre la problématique',
    detail: 'Retravailler la tension du sujet avant de produire pour éviter un plan correct mais sans colonne vertébrale.',
    icon: BookOpen,
    accent: 'from-[var(--color-amber-700)] via-[var(--color-amber-300)] to-[#d6a15d]',
  },
  'explication lineaire': {
    href: '/atelier-oral',
    label: 'Relancer une explication linéaire',
    detail: 'Refaire une prise de parole guidée pour retrouver l’enchaînement texte, axe, procédé, effet.',
    icon: Mic,
    accent: 'from-[var(--c-success)] via-[#149a8f] to-[#7ed4c2]',
  },
  'lecture cursive': {
    href: '/bibliotheque',
    label: 'Réouvrir la lecture cursive',
    detail: 'Réactiver l’œuvre et ses repères avant qu’elle ne sorte du champ de rappel utile pour l’oral.',
    icon: BookOpen,
    accent: 'from-[#503a64] via-[#7b6f9c] to-[#b8afd0]',
  },
};

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function ParcoursRecommandation({ weakSignals, weakSkills = [], className = '' }: ParcoursRecommandationProps) {
  const [remoteWeakSignals, setRemoteWeakSignals] = useState<Record<string, number>>({});
  const [remoteWeakSkills, setRemoteWeakSkills] = useState<string[]>([]);

  const shouldFetch = !weakSignals && weakSkills.length === 0;

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    const load = async () => {
      try {
        const response = await fetch('/api/v1/memory/timeline?limit=100');
        if (!response.ok) return;

        const payload = (await response.json()) as TimelineResponse;
        setRemoteWeakSignals(payload.weakSignals);
        setRemoteWeakSkills(payload.profile.weakSkills ?? []);
      } catch {
        // noop
      }
    };

    void load();
  }, [shouldFetch]);

  const resolvedWeakSignals = weakSignals ?? remoteWeakSignals;
  const resolvedWeakSkills = weakSkills.length > 0 ? weakSkills : remoteWeakSkills;

  const recommended = useMemo(() => {
    const firstWeakSignal = Object.entries(resolvedWeakSignals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const fallbackWeak = resolvedWeakSkills[0];
    const normalized = normalizeLabel(firstWeakSignal ?? fallbackWeak ?? 'grammaire');

    return MAP_RECO[normalized] ?? MAP_RECO.grammaire;
  }, [resolvedWeakSignals, resolvedWeakSkills]);

  const Icon = recommended.icon;

  return (
    <div className={`mt-6 overflow-hidden rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] ${className}`.trim()}>
      <div className={`bg-gradient-to-r ${recommended.accent} px-5 py-4 text-white`}>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
          <Sparkles className="h-4 w-4" />
          Prochain meilleur levier
        </div>
        <div className="mt-4 flex items-start gap-3">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white shadow-[0_12px_25px_rgba(15,23,42,0.18)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold leading-7 text-white">{recommended.label}</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-white/78">{recommended.detail}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          L’idée n’est pas d’en faire plus, mais de relancer le bon atelier au bon moment.
        </p>
        <Link
          href={recommended.href}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--c-primary)]/14 bg-[var(--bg-surface)] px-4 py-2 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
        >
          Ouvrir l’atelier
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
