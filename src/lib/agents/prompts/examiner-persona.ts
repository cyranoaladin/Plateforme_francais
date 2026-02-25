/**
 * P0-SaaS-1 — Agent Jury Hostile: Examiner Personas
 * Per ADDENDUM §Partie A, Différenciateur #1.
 *
 * Three injectable personas + RANDOM mode for LLM system prompt.
 * Persisted in OralSession.personaType for bilan readback.
 */

export const ExamPersonaValues = ['BIENVEILLANT', 'NEUTRE', 'HOSTILE', 'RANDOM'] as const;
export type ExamPersona = (typeof ExamPersonaValues)[number];

/**
 * System prompt fragments per persona.
 * Injected into Agent_EntretienOeuvre / Agent_ExaminateurVirtuel.
 */
export const EXAMINER_PERSONAS: Record<Exclude<ExamPersona, 'RANDOM'>, string> = {
  BIENVEILLANT: `Tu es un examinateur bienveillant. Tu encourages l'élève.
Si une idée est bonne mais mal formulée, aide-le à la reformuler.
Jamais d'interruption brutale. Valorise chaque effort.`,

  NEUTRE: `Tu es un examinateur de lycée professionnel et factuel.
Tu poses des questions directes. Tu n'encourages pas, tu n'intimides pas.
Ton ton est neutre et mesuré.`,

  HOSTILE: `Tu es un examinateur exigeant. Tes règles :
- Si l'élève énonce une banalité, interromps poliment : 'C'est une observation commune. Qu'est-ce qui vous a frappé personnellement dans ce texte ?'
- Si l'élève hésite > 5 secondes, creuse : 'Développez cette idée.'
- Si une citation est approximative : 'Pouvez-vous citer exactement ?'
- Si l'argument manque de source : 'Sur quoi vous basez-vous ?'
Tu es exigeant mais jamais moqueur ni irrespectueux.`,
};

/**
 * Resolve a persona type. RANDOM picks one of the 3 deterministic personas.
 */
export function resolvePersona(persona: ExamPersona): Exclude<ExamPersona, 'RANDOM'> {
  if (persona === 'RANDOM') {
    const keys = Object.keys(EXAMINER_PERSONAS) as Exclude<ExamPersona, 'RANDOM'>[];
    return keys[Math.floor(Math.random() * keys.length)];
  }
  return persona;
}

/**
 * Build the full system prompt with persona injection.
 */
export function injectPersonaIntoPrompt(
  basePrompt: string,
  persona: ExamPersona,
): { prompt: string; resolvedPersona: Exclude<ExamPersona, 'RANDOM'> } {
  const resolved = resolvePersona(persona);
  const personaBlock = EXAMINER_PERSONAS[resolved];
  const prompt = `${basePrompt}

--- PERSONA ACTIF ---
${personaBlock}`;
  return { prompt, resolvedPersona: resolved };
}

/**
 * Labels for UI display.
 */
export const PERSONA_LABELS: Record<ExamPersona, { emoji: string; label: string; description: string }> = {
  BIENVEILLANT: {
    emoji: '😊',
    label: 'Bienveillant',
    description: 'Encourage, reformule, relance doucement',
  },
  NEUTRE: {
    emoji: '😐',
    label: 'Neutre',
    description: 'Questions directes, ton professionnel et factuel',
  },
  HOSTILE: {
    emoji: '😤',
    label: 'Jury Exigeant',
    description: 'Interrompt les banalités, creuse les hésitations, exige des sources',
  },
  RANDOM: {
    emoji: '🎭',
    label: 'Aléatoire',
    description: 'Tire un persona au hasard — simulation examen réel',
  },
};
