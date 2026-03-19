import {
  injectPersonaIntoPrompt,
  type ExamPersona,
} from '@/lib/agents/prompts/examiner-persona';

type SupportedExaminerPersona = Exclude<ExamPersona, 'RANDOM'>;

export function buildExaminerPersonaContext(
  persona: SupportedExaminerPersona = 'NEUTRE',
): string {
  return injectPersonaIntoPrompt(
    'Applique strictement le persona examinateur ci-dessous pour formuler la prochaine relance.',
    persona,
  ).prompt;
}
