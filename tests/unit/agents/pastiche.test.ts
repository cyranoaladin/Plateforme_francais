import { describe, it, expect } from 'vitest';
import {
  validatePasticheInput,
  hashForAudit,
  buildPasticheAuditLog,
  PASTICHE_MAX_WORDS,
  PASTICHE_NIVEAUX,
} from '@/lib/agents/pastiche/pastiche';

describe('P0-SaaS-2: Agent Mimétisme de Plume (Pastiche)', () => {
  describe('validatePasticheInput', () => {
    it('accepts valid short paragraph', () => {
      const result = validatePasticheInput('Baudelaire explore le spleen à travers des images sombres.');
      expect(result.valid).toBe(true);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('rejects empty text', () => {
      const result = validatePasticheInput('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('rejects text exceeding 300 words', () => {
      const longText = Array(301).fill('mot').join(' ');
      const result = validatePasticheInput(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('paragraphe à la fois');
      expect(result.wordCount).toBe(301);
    });

    it('accepts exactly 300 words', () => {
      const text = Array(300).fill('mot').join(' ');
      const result = validatePasticheInput(text);
      expect(result.valid).toBe(true);
      expect(result.wordCount).toBe(300);
    });

    it('PASTICHE_MAX_WORDS is 300', () => {
      expect(PASTICHE_MAX_WORDS).toBe(300);
    });
  });

  describe('hashForAudit', () => {
    it('returns a 16-char hex string', () => {
      const hash = hashForAudit('test input');
      expect(hash).toMatch(/^[a-f0-9]{16}$/);
    });

    it('same input gives same hash', () => {
      expect(hashForAudit('abc')).toBe(hashForAudit('abc'));
    });

    it('different input gives different hash', () => {
      expect(hashForAudit('abc')).not.toBe(hashForAudit('def'));
    });
  });

  describe('buildPasticheAuditLog', () => {
    it('builds a structured audit log entry', () => {
      const log = buildPasticheAuditLog('user-1', 'input text', 'output text');
      expect(log.userId).toBe('user-1');
      expect(log.action).toBe('PASTICHE');
      expect(log.hash_input).toMatch(/^[a-f0-9]{16}$/);
      expect(log.hash_output).toMatch(/^[a-f0-9]{16}$/);
      expect(log.timestamp).toBeTruthy();
    });
  });

  describe('PASTICHE_NIVEAUX', () => {
    it('has 3 levels: passable, attendu, excellence', () => {
      expect(PASTICHE_NIVEAUX.passable).toBeDefined();
      expect(PASTICHE_NIVEAUX.attendu).toBeDefined();
      expect(PASTICHE_NIVEAUX.excellence).toBeDefined();
    });

    it('each level has emoji, label, scoreRange, description', () => {
      const levels = [PASTICHE_NIVEAUX.passable, PASTICHE_NIVEAUX.attendu, PASTICHE_NIVEAUX.excellence];
      for (const level of levels) {
        expect(level.emoji).toBeTruthy();
        expect(level.label).toBeTruthy();
        expect(level.scoreRange).toBeTruthy();
        expect(level.description).toBeTruthy();
      }
    });
  });
});
