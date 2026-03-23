import { NextResponse } from 'next/server';
import { loadTunisiaConfig, getDaysUntilExam, getExamPhase, getUpcomingSimulations } from '@/lib/config/tunisia';
import { buildExamInfoPayload } from '@/lib/exam/exam-info';

export async function GET() {
  const config = await loadTunisiaConfig();
  const daysUntil = getDaysUntilExam(config);
  const phase = getExamPhase(daysUntil);
  const simulations = getUpcomingSimulations(config);

  return NextResponse.json(buildExamInfoPayload({
    config,
    daysUntilExam: daysUntil,
    phase,
    simulations,
  }));
}
