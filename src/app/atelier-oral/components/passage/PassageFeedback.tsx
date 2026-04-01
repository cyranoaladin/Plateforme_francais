import { AlertCircle, Star, Volume2 } from 'lucide-react';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { type OralStep, type StepFeedback } from '../../types';

type Props = {
  steps: OralStep[];
  stepLabels: Record<OralStep, string>;
  aggregated: { totalScore: number; totalMax: number };
  feedbacks: Record<OralStep, StepFeedback | undefined>;
};

function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  window.speechSynthesis.speak(utterance);
}

export function PassageFeedback({
  steps,
  stepLabels,
  aggregated,
  feedbacks,
}: Props) {
  return (
    <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">
          Feedbacks intermédiaires
        </p>
        <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--c-success)]">
          {aggregated.totalScore.toFixed(1)} / {aggregated.totalMax.toFixed(1) || 20}
        </span>
      </div>

      <div className="mt-4 space-y-4" role="status" aria-live="polite">
        {steps.map((step) => {
          const item = feedbacks[step];
          if (!item) return null;

          return (
            <div
              key={step}
              className="rounded-[22px] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--c-primary)]">{stepLabels[step]}</p>
                <span className="rounded-full bg-[var(--c-primary)]/8 px-3 py-1 text-sm font-semibold text-[var(--c-primary)]">
                  {item.score}/{item.max}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
                {sanitizeLlmText(item.feedback)}
              </p>

              {item.evaluationFailed ? (
                <div className="mt-4 rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] px-4 py-3 text-sm font-medium text-[var(--text-reward-on-subtle)]">
                  ⚠️ Évaluation indisponible - score non comptabilisé
                </div>
              ) : null}

              {item.points_forts.length > 0 ? (
                <div className="mt-4 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-success)]">
                    Points forts
                  </p>
                  <ul className="space-y-1 text-xs leading-6 text-[var(--text-body)]">
                    {item.points_forts.map((point) => (
                      <li key={point} className="flex gap-2">
                        <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--c-success)]" />
                        <span>{sanitizeLlmText(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.axes.length > 0 ? (
                <div className="mt-4 rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-reward)]">
                    Axes d’amélioration
                  </p>
                  <ul className="space-y-1 text-xs leading-6 text-[var(--text-reward-on-subtle)]">
                    {item.axes.map((axis) => (
                      <li key={axis} className="flex gap-2">
                        <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--c-reward)]" />
                        <span>{sanitizeLlmText(axis)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => speakText(item.feedback)}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--c-primary)]"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Écouter
                </button>
                {item.relance ? (
                  <span className="text-xs font-medium text-[var(--c-success)]">
                    Relance de l’examinateur : {sanitizeLlmText(item.relance)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
