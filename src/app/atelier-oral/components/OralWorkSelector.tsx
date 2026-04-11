import { type ExamPersona, PERSONA_LABELS } from '@/lib/agents/prompts/examiner-persona';
import { Smile, Meh, Frown, Dices } from 'lucide-react';

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

const PERSONA_ICONS: Record<ExamPersona, typeof Smile> = {
  BIENVEILLANT: Smile,
  NEUTRE: Meh,
  HOSTILE: Frown,
  RANDOM: Dices,
};

const PERSONA_COLORS: Record<ExamPersona, { bg: string; text: string; border: string }> = {
  BIENVEILLANT: {
    bg: 'var(--eaf-teal)',
    text: '#050913',
    border: 'var(--eaf-teal)',
  },
  NEUTRE: {
    bg: 'var(--eaf-indigo)',
    text: '#050913',
    border: 'var(--eaf-indigo)',
  },
  HOSTILE: {
    bg: '#EF4444',
    text: '#050913',
    border: '#EF4444',
  },
  RANDOM: {
    bg: 'var(--eaf-gold)',
    text: '#050913',
    border: 'var(--eaf-gold)',
  },
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
    <section className="space-y-6">
      {/* Mode Tabs */}
      <div
        className="inline-flex rounded-xl p-1"
        style={{
          background: 'var(--eaf-bg2)',
          border: '1px solid rgba(123, 142, 255, 0.15)',
        }}
      >
        {[
          { mode: 'SIMULATION' as const, label: 'Simulation officielle' },
          { mode: 'FREE_PRACTICE' as const, label: 'Pratique libre' },
        ].map((item) => (
          <button
            key={item.mode}
            onClick={() => onChangeMode(item.mode)}
            data-testid={item.mode === 'FREE_PRACTICE' ? 'mode-practice-btn' : undefined}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: selectedMode === item.mode ? 'var(--eaf-bg3)' : 'transparent',
              color: selectedMode === item.mode ? 'var(--eaf-fg0)' : 'var(--eaf-fg2)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Work Grid */}
      <div className="grid gap-2 sm:grid-cols-2" data-testid="oeuvre-select">
        {availableWorks.map((work) => {
          const isSelected = work === currentWork;
          return (
            <button
              key={work}
              data-testid={`oeuvre-option-${work}`}
              onClick={() => onSelectWork(work)}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all hover:border-[var(--eaf-indigo)]/30"
              style={{
                background: isSelected ? 'var(--eaf-indigo)/10' : 'var(--eaf-bg2)',
                borderColor: isSelected ? 'var(--eaf-indigo)' : 'rgba(123, 142, 255, 0.15)',
                color: isSelected ? 'var(--eaf-fg0)' : 'var(--eaf-fg1)',
              }}
            >
              {isSelected && (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: 'var(--eaf-indigo)' }}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#050913" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="flex-1">{work}</span>
            </button>
          );
        })}
      </div>

      {/* Examiner Profile */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--eaf-fg2)]">
          Profil de l'examinateur
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERSONA_LABELS).map(([value, persona]) => {
            const isSelected = examinerProfile === value;
            const colors = PERSONA_COLORS[value as ExamPersona];
            const Icon = PERSONA_ICONS[value as ExamPersona];

            return (
              <button
                key={value}
                onClick={() => onChangeProfile(value as ExamPersona)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: isSelected ? colors.bg : 'var(--eaf-bg2)',
                  color: isSelected ? colors.text : 'var(--eaf-fg1)',
                  border: `1px solid ${isSelected ? colors.border : 'rgba(123, 142, 255, 0.15)'}`,
                }}
              >
                <Icon className="h-4 w-4" />
                {persona.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Programme Warning */}
      {showProgrammeWarning && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            background: 'var(--eaf-gold)/10',
            borderColor: 'var(--eaf-gold)/30',
            color: 'var(--eaf-gold)',
          }}
        >
          {warningMessage ??
            'Le programme 2026-2027 n\'est pas encore publié : nous affichons temporairement le programme 2025-2026.'}
        </div>
      )}
    </section>
  );
}
