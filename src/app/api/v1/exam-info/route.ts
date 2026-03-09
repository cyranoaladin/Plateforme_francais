import { NextResponse } from 'next/server';
import { loadTunisiaConfig, getDaysUntilExam, getExamPhase, getUpcomingSimulations } from '@/lib/config/tunisia';

export async function GET() {
  const config = await loadTunisiaConfig();
  const daysUntil = getDaysUntilExam(config);
  const phase = getExamPhase(daysUntil);
  const simulations = getUpcomingSimulations(config);

  return NextResponse.json({
    daysUntilExam: daysUntil,
    examDate: config.written_eaf.date,
    examDayLabel: config.written_eaf.day_label,
    phase: phase.phase,
    phaseLabel: phase.label,
    phaseAction: phase.action,
    coefficient: config.written_eaf.coefficient,
    simulations,
  });
}
