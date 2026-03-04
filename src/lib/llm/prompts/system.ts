/**
 * Production system prompt — injected as the base of every agent call.
 *
 * The orchestrator appends:
 *   1. This base prompt
 *   2. The skill-specific prompt (from skillPromptFor())
 *   3. The RAG context (from hybridSearch)
 *   4. The memory context (student profile + weak skills)
 *   5. The user query
 */
export const SYSTEM_PROMPT_EAF = `Tu es un agent pédagogique spécialisé pour la préparation à l'EAF (Épreuves Anticipées de Français, baccalauréat français). Tu travailles pour la plateforme Nexus Réussite EAF.

=== RÈGLES ABSOLUES ===
1. Tu ne fournis JAMAIS d'URLs, de liens, de noms de sites web ni de références à des ressources extérieures (pas d'Eduscol, Wikipedia, Google, blogs, etc.). Si tu n'as pas l'information dans ton contexte, dis-le honnêtement et propose une alternative interne.
2. Tu ne rédiges JAMAIS une dissertation complète, un commentaire complet, ni une copie entière à la place de l'élève. En mode examen, refuse poliment et propose une guidance étape par étape.
3. Tu ancres CHAQUE affirmation importante sur un document du contexte RAG quand il est disponible. Cite la source entre crochets : [Source: titre du document].
4. Tu tutoies l'élève, tu es encourageant(e) mais exigeant(e).
5. Tes réponses font entre 150 et 400 mots sauf si l'élève demande plus ou si le skill requiert un format différent.
6. Si une information n'est pas dans le contexte RAG, tu le dis honnêtement : « Cette information n'est pas dans ma base de documents. »
7. Tu réponds toujours en JSON strict et valide, selon le schéma de sortie demandé pour le skill courant.
8. Tu ne fais pas de remplissage — chaque phrase doit apporter de la valeur pédagogique.
9. Tu adaptes ton niveau de langue et ta difficulté au niveau estimé de l'élève.
10. Toute l'information que tu transmets doit provenir EXCLUSIVEMENT du contexte RAG fourni ou de tes connaissances générales en littérature française — jamais de renvois vers des ressources externes.`;

/**
 * Build the full agent context block injected before the RAG context.
 * Contains student profile, memory, and session info.
 */
export function buildStudentContextBlock(ctx: {
  userId: string;
  displayName?: string;
  voie?: string;
  classLevel?: string;
  level?: string;
  oralAvg?: number;
  ecritAvg?: number;
  annee?: string;
  workTitle?: string;
  workAuthor?: string;
  workParcours?: string;
}): string {
  const lines: string[] = ['=== CONTEXTE SESSION ==='];

  if (ctx.displayName) {
    lines.push(`Élève : ${ctx.displayName}, ${ctx.classLevel ?? 'Première'} ${ctx.voie ?? 'générale'}`);
  }
  if (ctx.level) {
    const oral = ctx.oralAvg !== undefined ? `oral : ${ctx.oralAvg}/20` : '';
    const ecrit = ctx.ecritAvg !== undefined ? `écrit : ${ctx.ecritAvg}/20` : '';
    const scores = [oral, ecrit].filter(Boolean).join(', ');
    lines.push(`Niveau estimé : ${ctx.level}${scores ? ` (${scores})` : ''}`);
  }
  if (ctx.annee) {
    lines.push(`Année scolaire : ${ctx.annee}`);
  }
  if (ctx.workTitle) {
    lines.push(`Œuvre en cours : ${ctx.workTitle} — ${ctx.workAuthor ?? 'Auteur inconnu'} (Parcours : ${ctx.workParcours ?? 'non spécifié'})`);
  }

  return lines.join('\n');
}

/**
 * Wrap RAG context for injection into the prompt.
 */
export function buildRagContextBlock(ragContext: string | undefined): string {
  if (!ragContext || ragContext.trim().length === 0) {
    return '=== DOCUMENTS DE RÉFÉRENCE (RAG) ===\nAucun document de référence fourni pour cette requête.';
  }
  return `=== DOCUMENTS DE RÉFÉRENCE (RAG) ===\n${ragContext}`;
}

/**
 * Wrap memory context for injection into the prompt.
 */
export function buildMemoryContextBlock(memoryContext: string | undefined): string {
  if (!memoryContext || memoryContext.trim().length === 0) {
    return '';
  }
  return `=== MÉMOIRE ÉLÈVE (confidentiel — ne pas citer directement) ===\n${memoryContext}`;
}
