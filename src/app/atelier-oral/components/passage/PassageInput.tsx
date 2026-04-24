import { Mic, Square } from '@/components/ui/icons';

type Props = {
  currentStepLabel: string;
  isMicOn: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
  toggleMic: () => Promise<void>;
};

export function PassageInput({
  currentStepLabel,
  isMicOn,
  transcript,
  setTranscript,
  toggleMic,
}: Props) {
  return (
    <>
      <div className="flex flex-col items-center rounded-[var(--radius-2xl)] border border-[var(--border-success)] bg-[var(--bg-success)] px-5 py-6 text-center">
        {!isMicOn ? (
          <>
            <button
              type="button"
              onClick={() => void toggleMic()}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition hover:bg-[var(--c-primary-active)]"
            >
              <Mic className="h-9 w-9" />
            </button>
            <p className="mt-4 text-sm font-semibold text-[var(--c-primary)]">
              Clique pour enregistrer — {currentStepLabel}
            </p>
          </>
        ) : (
          <>
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[var(--c-accent-text)] opacity-20" />
              <button
                type="button"
                onClick={() => void toggleMic()}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-accent-text)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition hover:bg-[var(--c-accent-hover)]"
              >
                <Square className="h-8 w-8" fill="currentColor" />
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-[var(--c-accent-text)]">
              Enregistrement en cours...
            </p>
          </>
        )}
      </div>

      <div>
        <label htmlFor="oral-transcript" className="mb-2 block text-sm font-semibold text-[var(--c-primary)]">
          Transcription / réponse
        </label>
        <textarea
          id="oral-transcript"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          className="min-h-40 w-full rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4 text-sm leading-7 text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--c-success)] focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/20"
          placeholder="Le transcript micro apparaît ici, tu peux le corriger avant envoi..."
        />
      </div>
    </>
  );
}
