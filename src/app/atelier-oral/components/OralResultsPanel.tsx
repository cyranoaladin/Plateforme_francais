import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { type BilanResult } from '../types';

type Props = {
  bilan: BilanResult;
  oralTutorHref: string;
  onReset: () => void;
};

export function OralResultsPanel({ bilan, oralTutorHref, onReset }: Props) {
  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-success)] text-[var(--c-success)] shadow-[var(--shadow-md)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Bilan officiel</p>
        <h2 className="font-display mt-2 text-4xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
          {bilan.note}/{bilan.maxNote}
        </h2>
        <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${bilan.note >= 16 ? 'bg-[var(--bg-success)] text-[var(--c-success)]' : bilan.note >= 12 ? 'bg-[var(--bg-primary)] text-[var(--c-primary)]' : bilan.note >= 10 ? 'bg-[var(--bg-reward)] text-[var(--c-reward)]' : 'bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]'}`}>
          {bilan.mention}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {([
          { key: 'lecture', label: 'Lecture', data: bilan.phases.lecture },
          { key: 'explication', label: 'Explication', data: bilan.phases.explication },
          { key: 'grammaire', label: 'Grammaire', data: bilan.phases.grammaire },
          { key: 'entretien', label: 'Entretien', data: bilan.phases.entretien },
        ] as const).map(({ key, label, data }) => (
          <div key={key} className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-center shadow-[var(--shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-body)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--c-primary)]">
              {data.note}
              <span className="text-sm text-[var(--text-icon)]">/{data.max}</span>
            </p>
            <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">{sanitizeLlmText(data.commentaire)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Bilan global</p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(bilan.bilan_global)}</p>
        </div>
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Conseil final</p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-reward-on-subtle)]">{sanitizeLlmText(bilan.conseil_final)}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button onClick={onReset} variant="primary" size="md">
          Nouvelle simulation
        </Button>
        <Link
          href={oralTutorHref}
          className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[var(--c-primary)] transition-all duration-[var(--transition-normal)] hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
        >
          Débriefer cette simulation
        </Link>
      </div>
    </section>
  );
}
