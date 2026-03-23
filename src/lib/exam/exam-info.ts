import type { ExamPhase, TunisiaConfig } from '@/lib/config/tunisia';

export type ExamSimulation = {
  id: string;
  label: string;
  date: string;
  daysUntil: number;
  overdue: boolean;
};

export type ExamInfoPayload = {
  daysUntilExam: number;
  examDate: string;
  examDayLabel: string;
  phase: ExamPhase;
  phaseLabel: string;
  phaseAction: string;
  coefficient: number;
  simulations: ExamSimulation[];
  oralDate: string | null;
  oralDateStatus: string;
  oralDateNote: string | null;
  oralDaysUntil: number | null;
};

type ExamPhaseInfo = {
  phase: ExamPhase;
  label: string;
  action: string;
};

type CountdownSource = Pick<ExamInfoPayload, 'daysUntilExam' | 'examDate' | 'oralDate' | 'oralDaysUntil'>;

export function computeCountdownDays(date: string | null | undefined, now: Date = new Date()): number | null {
  if (!date) {
    return null;
  }

  const normalizedDate = date.includes('T') ? date : `${date}T00:00:00`;
  const parsed = new Date(normalizedDate);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.max(0, Math.ceil((parsed.getTime() - now.getTime()) / 86_400_000));
}

export function buildExamInfoPayload(input: {
  config: TunisiaConfig;
  daysUntilExam: number;
  phase: ExamPhaseInfo;
  simulations: ExamSimulation[];
}): ExamInfoPayload {
  return {
    daysUntilExam: input.daysUntilExam,
    examDate: input.config.written_eaf.date,
    examDayLabel: input.config.written_eaf.day_label,
    phase: input.phase.phase,
    phaseLabel: input.phase.label,
    phaseAction: input.phase.action,
    coefficient: input.config.written_eaf.coefficient,
    simulations: input.simulations,
    oralDate: input.config.oral_eaf.date,
    oralDateStatus: input.config.oral_eaf.date_status,
    oralDateNote: input.config.oral_eaf.date_note,
    oralDaysUntil: computeCountdownDays(input.config.oral_eaf.date),
  };
}

export function resolveDashboardCountdowns(
  source: CountdownSource | null | undefined,
  now: Date = new Date(),
): {
  countdownDays: number | null;
  countdownEcrit: number | null;
  countdownOral: number | null;
} {
  const countdownEcrit =
    typeof source?.daysUntilExam === 'number'
      ? source.daysUntilExam
      : computeCountdownDays(source?.examDate, now);

  const countdownOral =
    typeof source?.oralDaysUntil === 'number'
      ? source.oralDaysUntil
      : computeCountdownDays(source?.oralDate, now);

  return {
    countdownDays: countdownEcrit,
    countdownEcrit,
    countdownOral,
  };
}
