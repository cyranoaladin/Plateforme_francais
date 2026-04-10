import { CheckCircle2 } from 'lucide-react';

type OralStepIndicatorProps<TStep extends string> = {
  steps: readonly TStep[];
  labels: Record<TStep, string>;
  currentStepIndex: number;
};

export function OralStepIndicator<TStep extends string>({
  steps,
  labels,
  currentStepIndex,
}: OralStepIndicatorProps<TStep>) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-4">
      {steps.map((stepName, index) => {
        const complete = index < currentStepIndex;
        const active = index === currentStepIndex;

        return (
          <div
            key={stepName}
            className={`rounded-[var(--radius-xl)] border px-4 py-4 text-center ${
              active
                ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]'
                : complete
                  ? 'border-[var(--border-success)] bg-[var(--bg-success)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
            }`}
          >
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                active
                  ? 'bg-[var(--c-primary)] text-[var(--text-on-primary)]'
                  : complete
                    ? 'bg-[var(--c-success)]/10 text-[var(--c-success)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
              }`}
            >
              {complete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${active ? 'text-[var(--c-primary)]' : 'text-[var(--text-body)]'}`}>
              {labels[stepName]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
