import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { speakText, speakTextSafe, playAudioBase64 } from '@/lib/oral/audio-utils';

describe('audio-utils', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original window state
    if (originalWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  describe('speakText', () => {
    it('does nothing when window is undefined', () => {
      delete (globalThis as Record<string, unknown>).window;
      expect(() => speakText('hello')).not.toThrow();
    });

    it('does nothing when speechSynthesis is absent', () => {
      // @ts-expect-error — partial mock
      globalThis.window = {};
      expect(() => speakText('hello')).not.toThrow();
    });

    it('calls speechSynthesis.speak with a French utterance', () => {
      const speak = vi.fn();
      const getVoices = vi.fn().mockReturnValue([]);
      class MockUtterance { lang = ''; voice: unknown = null; }
      // @ts-expect-error — partial mock
      globalThis.window = { speechSynthesis: { speak, getVoices } };
      // @ts-expect-error — browser API mock
      globalThis.SpeechSynthesisUtterance = MockUtterance;
      speakText('Bonjour');
      expect(speak).toHaveBeenCalledOnce();
      // @ts-expect-error — cleanup
      delete globalThis.SpeechSynthesisUtterance;
    });

    it('prefers a Google French voice when available', () => {
      const speak = vi.fn();
      const frGoogle = { lang: 'fr-FR', name: 'Google Français' };
      const frOther = { lang: 'fr-FR', name: 'Autre' };
      const getVoices = vi.fn().mockReturnValue([frOther, frGoogle]);
      class MockUtterance { lang = ''; voice: unknown = null; }
      // @ts-expect-error — partial mock
      globalThis.window = { speechSynthesis: { speak, getVoices } };
      // @ts-expect-error — browser API mock
      globalThis.SpeechSynthesisUtterance = MockUtterance;
      speakText('Test');
      expect(speak).toHaveBeenCalledOnce();
      const utterance = speak.mock.calls[0][0] as { voice: unknown };
      expect(utterance.voice).toBe(frGoogle);
      // @ts-expect-error — cleanup
      delete globalThis.SpeechSynthesisUtterance;
    });
  });

  describe('speakTextSafe', () => {
    it('does not throw when window is undefined', () => {
      delete (globalThis as Record<string, unknown>).window;
      expect(() => speakTextSafe('safe')).not.toThrow();
    });
  });

  describe('playAudioBase64', () => {
    it('rejects on invalid base64', async () => {
      await expect(playAudioBase64('!!!invalid!!!', 'audio/wav')).rejects.toThrow();
    });
  });
});
