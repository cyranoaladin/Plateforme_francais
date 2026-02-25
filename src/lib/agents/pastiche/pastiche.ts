/**
 * P0-SaaS-2 — Agent Mimétisme de Plume (Pastiche)
 * Per ADDENDUM §Partie A, Différenciateur #2.
 *
 * Three-level rewrite of a student paragraph with anti-triche guards.
 * The agent rewrites ONLY the submitted paragraph (max 300 words),
 * never generates continuation of the student's work.
 */

import { z } from 'zod';
import { createHash } from 'crypto';

/** Maximum word count for pastiche input. */
export const PASTICHE_MAX_WORDS = 300;

export const EpreuveTypeValues = ['COMMENTAIRE', 'DISSERTATION', 'ESSAI'] as const;
export type EpreuveType = (typeof EpreuveTypeValues)[number];

export const pasticheInputSchema = z.object({
  userId: z.string().uuid(),
  paragrapheEleve: z.string().min(10).max(5000),
  typeEpreuve: z.enum(EpreuveTypeValues),
  workId: z.string().uuid().optional(),
});

export type PasticheInput = z.infer<typeof pasticheInputSchema>;

export interface PasticheNiveau {
  texte: string;
  commentaire: string;
  score_estime: string;
}

export interface PasticheOutput {
  original: string;
  niveaux: {
    passable: PasticheNiveau;
    attendu: PasticheNiveau;
    excellence: PasticheNiveau;
  };
  pointsAmelioration: string[];
  sourcesRAG: Array<{ titre: string; extrait: string }>;
}

/**
 * Validate pastiche input: enforce 300-word limit per ADDENDUM anti-triche rule.
 * Returns { valid, error?, wordCount }.
 */
export function validatePasticheInput(text: string): {
  valid: boolean;
  wordCount: number;
  error?: string;
} {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, wordCount: 0, error: 'Le texte est vide.' };
  }

  const words = trimmed.split(/\s+/);
  const wordCount = words.length;

  if (wordCount > PASTICHE_MAX_WORDS) {
    return {
      valid: false,
      wordCount,
      error: `Je peux t'aider à améliorer un paragraphe à la fois (max ${PASTICHE_MAX_WORDS} mots). Envoie-moi ta phrase ou ton introduction.`,
    };
  }

  return { valid: true, wordCount };
}

/**
 * Hash input/output for anti-triche audit logging.
 * Per ADDENDUM: { userId, hash_input, hash_output, action: 'PASTICHE', timestamp }
 */
export function hashForAudit(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Build an anti-triche audit log entry.
 */
export function buildPasticheAuditLog(
  userId: string,
  input: string,
  output: string,
): {
  userId: string;
  hash_input: string;
  hash_output: string;
  action: 'PASTICHE';
  timestamp: string;
} {
  return {
    userId,
    hash_input: hashForAudit(input),
    hash_output: hashForAudit(output),
    action: 'PASTICHE',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Niveaux labels for UI display.
 */
export const PASTICHE_NIVEAUX = {
  passable: { emoji: '📝', label: 'Passable', scoreRange: '8-11/20', description: 'Correct mais basique' },
  attendu: { emoji: '📘', label: 'Attendu EAF', scoreRange: '12-15/20', description: 'Registre soutenu, connecteurs logiques' },
  excellence: { emoji: '🌟', label: 'Excellence', scoreRange: '17-20/20', description: 'Syntaxe complexe, vocabulaire riche, intertextualité' },
} as const;
