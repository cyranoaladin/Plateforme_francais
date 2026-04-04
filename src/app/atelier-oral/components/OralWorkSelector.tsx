import { type ExamPersona, PERSONA_LABELS } from '@/lib/agents/prompts/examiner-persona';
import { Badge, Button } from '@/components/ui';
import React from 'react';

export type WorkMode = 'SIMULATION' | 'FREE_PRACTICE';

type Props = {
  currentWork: string;
  availableWorks: string[];
  selectedMode: WorkMode;
  onSelectWork: (work: string) => void;
  onChangeMode: (mode: WorkMode) => void;
  examinerProfile: ExamPersona;
  onChangeProfile: (profile: ExamPersona) => void;
  showProgrammeWarning?: boolean;
  warningMessage?: string;
};

export function OralWorkSelector({
  availableWorks,
  currentWork,
  selectedMode,
  onSelectWork,
  onChangeMode,
  examinerProfile,
  onChangeProfile,
  showProgrammeWarning,
  warningMessage,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant={selectedMode === 'SIMULATION' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onChangeMode('SIMULATION')}
        >
          Simulation officielle
        </Button>
        <Button
          variant={selectedMode === 'FREE_PRACTICE' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onChangeMode('FREE_PRACTICE')}
          data-testid="mode-practice-btn"
        >
          Pratique libre
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Œuvre choisie : <strong>{currentWork}</strong>
      </p>
      <div className="grid gap-2 sm:grid-cols-2" data-testid="oeuvre-select">
        {availableWorks.map((work) => (
          <Badge
            key={work}
            data-testid={`oeuvre-option-${work}`}
            variant={work === currentWork ? 'navy' : 'outline'}
            className="cursor-pointer"
            onClick={() => onSelectWork(work)}
          >
            {work}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PERSONA_LABELS).map(([value, persona]) => (
          <Button
            key={value}
            variant={examinerProfile === value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onChangeProfile(value as ExamPersona)}
          >
            {persona.emoji} {persona.label}
          </Button>
        ))}
      </div>
      {showProgrammeWarning && (
        <div className="rounded-lg border border-amber-500 bg-amber-50 p-3 text-amber-700 text-sm">
          {warningMessage ??
            'Le programme 2026-2027 n’est pas encore publié : nous affichons temporairement le programme 2025-2026.'}
        </div>
      )}
    </section>
  );
}
