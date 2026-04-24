import { type RefObject } from 'react';
import { Headphones, Loader2 } from '@/components/ui/icons';
import { PERSONA_LABELS } from '@/lib/agents/prompts/examiner-persona';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { OralStepIndicator } from '@/components/atelier-oral/OralStepIndicator';
import { PassageContext } from './passage/PassageContext';
import { PassageFeedback } from './passage/PassageFeedback';
import { PassageInput } from './passage/PassageInput';
import { PassagePrincipe } from './passage/PassagePrincipe';
import { PassageSubmitBar } from './passage/PassageSubmitBar';
import { PassageTimer } from './passage/PassageTimer';
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
      <section className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
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
          <PassageTimer
            currentStep={currentStep}
            currentStepIndex={currentStepIndex}
            passageRemaining={passageRemaining}
            phaseRemaining={phaseRemaining}
            isSimulation={isSimulation}
          />
        </div>

        <OralStepIndicator steps={steps} labels={stepLabels} currentStepIndex={currentStepIndex} />

        <PassageContext session={session} />

        <div className="mt-6 space-y-5">
          <PassageInput
            currentStepLabel={stepLabels[currentStep]}
            isMicOn={isMicOn}
            transcript={transcript}
            setTranscript={setTranscript}
            toggleMic={toggleMic}
          />

          {currentStep === 'ENTRETIEN' ? (
            <div className="rounded-[var(--radius-2xl)] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
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
                Obtenir une question de l'examinateur
              </button>

              {juryTurns.length > 0 ? (
                <div
                  ref={juryContainerRef}
                  className="mt-4 max-h-52 space-y-2 overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4"
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

          <PassageSubmitBar
            currentStepLabel={stepLabels[currentStep]}
            canSubmit={transcript.trim().length > 0}
            isLoading={isLoading}
            useServerVoice={useServerVoice}
            submitStep={submitStep}
          />
        </div>
      </section>

      <aside className="space-y-6">
        <PassageFeedback
          steps={steps}
          stepLabels={stepLabels}
          aggregated={aggregated}
          feedbacks={feedbacks}
        />
        <PassagePrincipe oralTutorHref={oralTutorHref} />
      </aside>
    </div>
  );
}
