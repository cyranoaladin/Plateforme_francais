import { OralTimer } from '@/components/atelier-oral/OralTimer';
import { type OralStep } from '../../types';

type Props = {
  currentStep: OralStep;
  currentStepIndex: number;
  passageRemaining: number;
  phaseRemaining: number;
  isSimulation: boolean;
};

export function PassageTimer({
  currentStep,
  currentStepIndex,
  passageRemaining,
  phaseRemaining,
  isSimulation,
}: Props) {
  return (
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
  );
}
