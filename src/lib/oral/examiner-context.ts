import {
  injectPersonaIntoPrompt,
  type ExamPersona,
} from '@/lib/agents/prompts/examiner-persona';

export function buildExaminerPersonaContext(
  persona: ExamPersona = 'NEUTRE',
): string {
  return injectPersonaIntoPrompt(
    'Applique strictement le persona examinateur ci-dessous pour formuler la prochaine relance.',
    persona,
  ).prompt;
}
