import { describe, it, expect } from 'vitest';
import {
  computeDictionMetrics,
  generateDictionFeedback,
  DICTION_TARGETS,
  type STTResult,
  type STTWord,
} from '@/lib/agents/diction/diction-analyzer';

describe('P0-SaaS-4: Diction Analyzer STT', () => {
  function makeWords(count: number, wpmTarget: number, pauseS: number = 0.1): STTWord[] {
    const words: STTWord[] = [];
    const interval = 60 / wpmTarget;
    for (let i = 0; i < count; i++) {
      const start = i * interval;
      const end = start + (interval - pauseS);
      words.push({ word: `mot${i}`, start, end, confidence: 0.95 });
    }
    return words;
  }

  describe('computeDictionMetrics', () => {
    it('returns zeros for empty words', () => {
      const result: STTResult = { transcript: '', words: [], segments: [] };
      const metrics = computeDictionMetrics(result);
      expect(metrics.wordsPerMinute).toBe(0);
      expect(metrics.longPausesCount).toBe(0);
      expect(metrics.disfluencesCount).toBe(0);
    });

    it('computes correct WPM', () => {
      const words = makeWords(120, 120);
      const result: STTResult = { transcript: '', words, segments: [] };
      const metrics = computeDictionMetrics(result);
      expect(metrics.wordsPerMinute).toBeGreaterThanOrEqual(115);
      expect(metrics.wordsPerMinute).toBeLessThanOrEqual(125);
    });

    it('detects long pauses', () => {
      const words: STTWord[] = [
        { word: 'début', start: 0, end: 0.5, confidence: 0.9 },
        { word: 'fin', start: 3.0, end: 3.5, confidence: 0.9 },
      ];
      const result: STTResult = { transcript: 'début fin', words, segments: [] };
      const metrics = computeDictionMetrics(result);
      expect(metrics.longPausesCount).toBe(1);
    });

    it('detects disfluences', () => {
      const words: STTWord[] = [
        { word: 'euh', start: 0, end: 0.3, confidence: 0.8 },
        { word: 'le', start: 0.4, end: 0.5, confidence: 0.9 },
        { word: 'hum', start: 0.6, end: 0.8, confidence: 0.7 },
        { word: 'texte', start: 0.9, end: 1.2, confidence: 0.9 },
        { word: 'ben', start: 1.3, end: 1.5, confidence: 0.8 },
      ];
      const result: STTResult = { transcript: '', words, segments: [] };
      const metrics = computeDictionMetrics(result);
      expect(metrics.disfluencesCount).toBe(3);
      expect(metrics.disfluenceWords).toEqual(['euh', 'hum', 'ben']);
    });
  });

  describe('generateDictionFeedback', () => {
    it('warns when too slow for poetry', () => {
      const metrics = {
        wordsPerMinute: 70,
        longPausesCount: 1,
        disfluencesCount: 0,
        averagePauseDurationMs: 200,
        totalDurationMs: 120_000,
        disfluenceWords: [],
      };
      const fb = generateDictionFeedback(metrics, 'poetry');
      expect(fb.some((f: string) => f.includes('70 mots/min'))).toBe(true);
      expect(fb.some((f: string) => f.includes('90-110'))).toBe(true);
    });

    it('warns when too fast for prose', () => {
      const metrics = {
        wordsPerMinute: 180,
        longPausesCount: 0,
        disfluencesCount: 0,
        averagePauseDurationMs: 50,
        totalDurationMs: 60_000,
        disfluenceWords: [],
      };
      const fb = generateDictionFeedback(metrics, 'prose');
      expect(fb.some((f: string) => f.includes('180 mots/min'))).toBe(true);
      expect(fb.some((f: string) => f.includes('trop rapide'))).toBe(true);
    });

    it('warns on excessive pauses', () => {
      const metrics = {
        wordsPerMinute: 100,
        longPausesCount: 5,
        disfluencesCount: 0,
        averagePauseDurationMs: 2000,
        totalDurationMs: 120_000,
        disfluenceWords: [],
      };
      const fb = generateDictionFeedback(metrics, 'poetry');
      expect(fb.some((f: string) => f.includes('5 longues pauses'))).toBe(true);
    });

    it('warns on excessive disfluences', () => {
      const metrics = {
        wordsPerMinute: 100,
        longPausesCount: 0,
        disfluencesCount: 4,
        averagePauseDurationMs: 100,
        totalDurationMs: 120_000,
        disfluenceWords: ['euh', 'hum', 'ben', 'voilà'],
      };
      const fb = generateDictionFeedback(metrics, 'poetry');
      expect(fb.some((f: string) => f.includes('4 hésitations'))).toBe(true);
    });

    it('gives positive feedback when all metrics are good', () => {
      const metrics = {
        wordsPerMinute: 100,
        longPausesCount: 1,
        disfluencesCount: 1,
        averagePauseDurationMs: 300,
        totalDurationMs: 120_000,
        disfluenceWords: ['euh'],
      };
      const fb = generateDictionFeedback(metrics, 'poetry');
      expect(fb.some((f: string) => f.includes('Bonne diction'))).toBe(true);
    });
  });

  describe('DICTION_TARGETS', () => {
    it('defines poetry and prose WPM ranges', () => {
      expect(DICTION_TARGETS.poetry.minWPM).toBe(90);
      expect(DICTION_TARGETS.poetry.maxWPM).toBe(110);
      expect(DICTION_TARGETS.prose.minWPM).toBe(120);
      expect(DICTION_TARGETS.prose.maxWPM).toBe(150);
    });

    it('limits pauses and disfluences to 2 max', () => {
      expect(DICTION_TARGETS.maxLongPauses).toBe(2);
      expect(DICTION_TARGETS.maxDisfluences).toBe(2);
    });
  });
});
