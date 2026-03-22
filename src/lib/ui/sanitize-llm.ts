/**
 * Strip leaked prompt artifacts, RAG citations, and internal instructions
 * from LLM output before displaying to students.
 */
export function sanitizeLlmText(text: string): string {
  return text
    // Remove [Ressource: ...] or [Source: ...] citations
    .replace(/\[Ressource\s*:[^\]]*\]/gi, '')
    .replace(/\[Source\s*:[^\]]*\]/gi, '')
    // Remove prompt artifacts like "Note:", "Instructions:", "Remarque:"
    .replace(/^(Note\s*:|Instructions?\s*:|Remarque\s*:|NB\s*:|Attention\s*:).*$/gim, '')
    // Remove unicode escape sequences that weren't parsed
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Collapse multiple spaces/newlines left by removals
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
