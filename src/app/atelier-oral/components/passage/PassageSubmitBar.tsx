import { Play } from 'lucide-react';
import { Button } from '@/components/ui';

type Props = {
  currentStepLabel: string;
  canSubmit: boolean;
  isLoading: boolean;
  useServerVoice: boolean;
  submitStep: () => Promise<void>;
};

export function PassageSubmitBar({
  currentStepLabel,
  canSubmit,
  isLoading,
  useServerVoice,
  submitStep,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() => void submitStep()}
        disabled={isLoading || !canSubmit}
        variant="primary"
        size="md"
        loading={isLoading}
        icon={!isLoading ? <Play className="h-4 w-4" /> : undefined}
      >
        Soumettre — {currentStepLabel}
      </Button>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          {useServerVoice ? 'Mode vocal serveur' : 'Mode vocal navigateur'}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {useServerVoice
            ? 'Ton audio est envoyé pour transcription puis supprimé. Seul le texte transcrit est conservé.'
            : "La reconnaissance vocale est assurée par ton navigateur. Aucun audio n'est envoyé à nos serveurs."}
        </p>
      </div>
    </div>
  );
}
