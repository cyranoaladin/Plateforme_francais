import Link from 'next/link';
import { type RefObject } from 'react';
import {
  AlertCircle,
  Headphones,
  Loader2,
  Mic,
  Play,
  Square,
  Star,
  Volume2,
} from 'lucide-react';
import { PERSONA_LABELS } from '@/lib/agents/prompts/examiner-persona';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { OralStepIndicator } from '@/components/atelier-oral/OralStepIndicator';
import { OralTimer } from '@/components/atelier-oral/OralTimer';
import { Button } from '@/components/ui';
import {
  type ExaminerProfile,
  type JuryTurn,
  type OralStep,
  type SessionPayload,
  type StepFeedback,
} from '../types';

type Props = {
  session: SessionPayload;
  currentStep: OralStep;
  currentStepIndex: number;
  steps: OralStep[];
  stepLabels: Record<OralStep, string>;
  stepGuidance: Record<OralStep, { title: string; body: string }>;
  passageRemaining: number;
  phaseRemaining: number;
  isSimulation: boolean;
  isMicOn: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
  toggleMic: () => Promise<void>;
  submitStep: () => Promise<void>;
  isLoading: boolean;
  useServerVoice: boolean;
  aggregated: { totalScore: number; totalMax: number };
  feedbacks: Record<OralStep, StepFeedback | undefined>;
  examinerProfile: ExaminerProfile;
  setExaminerProfile: (profile: ExaminerProfile) => void;
  juryTurns: JuryTurn[];
  juryContainerRef: RefObject<HTMLDivElement | null>;
  isJuryLoading: boolean;
  askExaminerFollowUp: () => Promise<void>;
  oralTutorHref: string;
};

function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  window.speechSynthesis.speak(utterance);
}

export function OralPassagePhase({
  session,
  currentStep,
  currentStepIndex,
  steps,
  stepLabels,
  stepGuidance,
  passageRemaining,
  phaseRemaining,
  isSimulation,
  isMicOn,
  transcript,
  setTranscript,
  toggleMic,
  submitStep,
  isLoading,
  useServerVoice,
  aggregated,
  feedbacks,
  examinerProfile,
  setExaminerProfile,
  juryTurns,
  juryContainerRef,
  isJuryLoading,
  askExaminerFollowUp,
  oralTutorHref,
}: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Passage oral</p>
            <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
              {stepGuidance[currentStep].title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              {stepGuidance[currentStep].body}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <OralTimer
              remaining={passageRemaining}
              label="Temps restant passage"
              mode={isSimulation ? 'simulation' : 'free'}
            />
            {isSimulation ? (
              <OralTimer
                key={currentStepIndex}
                remaining={phaseRemaining}
                label={`Temps restant phase ${currentStep.toLowerCase()}`}
                mode="simulation"
                variant="compact"
              />
            ) : null}
          </div>
        </div>

        <OralStepIndicator steps={steps} labels={stepLabels} currentStepIndex={currentStepIndex} />

        <details className="mt-6 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--c-primary)]">
            Extrait & question de grammaire
          </summary>
          <p className="mt-3 font-serif text-sm leading-7 text-[var(--c-primary)]">{session.texte}</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-body)]">
            <p>
              <span className="font-semibold text-[var(--c-primary)]">Grammaire :</span>{' '}
              {session.questionGrammaire}
            </p>
            {session.phraseGrammaire ? (
              <p>
                <span className="font-semibold text-[var(--c-primary)]">Phrase cible :</span>{' '}
                {session.phraseGrammaire}
              </p>
            ) : null}
            {session.oeuvreChoisie ? (
              <p>
                <span className="font-semibold text-[var(--c-primary)]">Entretien sur :</span>{' '}
                {session.oeuvreChoisie}
              </p>
            ) : null}
          </div>
        </details>

        <div className="mt-6 space-y-5">
          <div className="flex flex-col items-center rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] px-5 py-6 text-center">
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
                  Clique pour enregistrer — {stepLabels[currentStep]}
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
                <p className="mt-4 text-sm font-bold text-[var(--c-accent-text)]">Enregistrement en cours...</p>
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

          {currentStep === 'ENTRETIEN' ? (
            <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
              <p className="text-sm font-semibold text-[var(--c-primary)]">Simulation examinateur dialoguant</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['BIENVEILLANT', 'NEUTRE', 'HOSTILE', 'RANDOM'] as ExaminerProfile[]).map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => setExaminerProfile(profile)}
                    className={`rounded-[var(--radius-lg)] border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-[var(--transition-normal)] ${examinerProfile === profile ? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--text-on-primary)]' : 'border-[var(--border-success)] bg-[var(--bg-surface)] text-[var(--c-primary)]'}`}
                  >
                    {PERSONA_LABELS[profile].label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void askExaminerFollowUp()}
                disabled={isJuryLoading || transcript.trim().length === 0}
                className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--c-primary)] transition-all duration-[var(--transition-normal)] disabled:opacity-50"
              >
                {isJuryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                Obtenir une relance examinateur
              </button>

              {juryTurns.length > 0 ? (
                <div
                  ref={juryContainerRef}
                  className="mt-4 max-h-52 space-y-2 overflow-auto rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4"
                >
                  {juryTurns.slice(-6).map((turn, idx) => (
                    <p key={`${turn.role}-${idx}`} className="text-sm leading-7 text-[var(--text-body)]">
                      <span className="font-semibold text-[var(--c-primary)]">
                        {turn.role === 'jury' ? 'Examinateur' : 'Toi'} :
                      </span>{' '}
                      {turn.role === 'jury' ? sanitizeLlmText(turn.content) : turn.content}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void submitStep()}
              disabled={isLoading || transcript.trim().length === 0}
              variant="primary"
              size="md"
              loading={isLoading}
              icon={!isLoading ? <Play className="h-4 w-4" /> : undefined}
            >
              Soumettre — {stepLabels[currentStep]}
            </Button>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-placeholder)]">
                {useServerVoice ? 'Mode vocal serveur' : 'Mode vocal navigateur'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {useServerVoice
                  ? 'Ton audio est envoyé pour transcription puis supprimé. Seul le texte transcrit est conservé.'
                  : "La reconnaissance vocale est assurée par ton navigateur. Aucun audio n'est envoyé à nos serveurs."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
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
                  <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(item.feedback)}</p>

                  {item.evaluationFailed ? (
                    <div className="mt-4 rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] px-4 py-3 text-sm font-medium text-[var(--text-reward-on-subtle)]">
                      ⚠️ Évaluation indisponible - score non comptabilisé
                    </div>
                  ) : null}

                  {item.points_forts.length > 0 ? (
                    <div className="mt-4 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] p-3">
                      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-success)]">Points forts</p>
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

        <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Principe de séance</p>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
            Mieux vaut quatre prises de parole nettes avec un vrai retour intermédiaire qu’une longue réponse confuse.
          </p>
          <Link
            href={oralTutorHref}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
          >
            Reprendre cette phase avec le guidage
          </Link>
        </section>
      </aside>
    </div>
  );
}
