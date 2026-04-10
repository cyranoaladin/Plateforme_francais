import { FileText, Sparkles, Upload } from 'lucide-react';
import { STUDIO_STEPS } from '../types';

type Props = {
  epreuveReady: boolean;
  copieReady: boolean;
  reportReady: boolean;
};

const STEP_ICONS = [Sparkles, Upload, FileText];
const STEP_COLORS = ['indigo', 'gold', 'teal'] as const;

const COLOR_STYLES = {
  indigo: {
    badge: 'var(--eaf-indigo)',
    title: 'var(--eaf-fg0)',
    border: 'rgba(123, 142, 255, 0.3)',
    bg: 'var(--eaf-bg2)',
  },
  gold: {
    badge: 'var(--eaf-gold)',
    title: 'var(--eaf-fg0)',
    border: 'rgba(255, 181, 71, 0.3)',
    bg: 'var(--eaf-bg2)',
  },
  teal: {
    badge: 'var(--eaf-teal)',
    title: 'var(--eaf-fg0)',
    border: 'rgba(26, 213, 160, 0.3)',
    bg: 'var(--eaf-bg2)',
  },
};

export function EcritCorrectionProgress({
  epreuveReady,
  copieReady,
  reportReady,
}: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {STUDIO_STEPS.map((step, index) => {
        const isActive = index === 0 ? !epreuveReady : index === 1 ? epreuveReady && !reportReady : reportReady;
        const isPast = index === 0 ? epreuveReady : index === 1 ? copieReady || reportReady : reportReady;
        const Icon = STEP_ICONS[index];
        const colorKey = STEP_COLORS[index];
        const styles = COLOR_STYLES[colorKey];

        return (
          <article
            key={step.index}
            className="rounded-xl border px-5 py-5 transition"
            style={{
              background: styles.bg,
              borderColor: isActive || isPast ? styles.border : 'rgba(123, 142, 255, 0.1)',
              opacity: isActive || isPast ? 1 : 0.7,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${styles.badge}15`, color: styles.badge }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{ color: styles.badge }}
              >
                Étape {step.index}
              </p>
            </div>
            <h2
              className="mt-3 text-lg font-semibold"
              style={{ color: styles.title }}
            >
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--eaf-fg2)]">{step.body}</p>
          </article>
        );
      })}
    </section>
  );
}
