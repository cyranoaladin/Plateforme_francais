import { useCallback, useEffect, useState } from 'react';

export type VoiceMode = 'browser' | 'server' | 'auto';
const VOICE_MODE_STORAGE_KEY = 'eaf_oral_voice_mode';
const STORAGE_CUTOFF_MS = 30 * 24 * 60 * 60 * 1000;

function readStoredMode(): VoiceMode {
  if (typeof window === 'undefined') return 'browser';
  const raw = window.localStorage.getItem(VOICE_MODE_STORAGE_KEY) ?? window.localStorage.getItem('oral_voice_mode');
  return raw === 'browser' || raw === 'server' || raw === 'auto' ? raw : 'browser';
}

function pruneOldEntries() {
  if (typeof window === 'undefined') return;
  const prefix = 'prep_checklist_';
  const entries = Object.entries(localStorage);
  const now = Date.now();
  for (const [key] of entries) {
    if (!key.startsWith(prefix)) continue;
    const timestampStr = localStorage.getItem(`${key}_ts`);
    if (!timestampStr) continue;
    const ts = Number(timestampStr);
    if (Number.isNaN(ts)) continue;
    if (now - ts > STORAGE_CUTOFF_MS) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_ts`);
    }
  }
}

export function useVoiceMode(): [VoiceMode, (next: VoiceMode) => void] {
  const [mode, setMode] = useState<VoiceMode>(() => readStoredMode());

  useEffect(() => {
    pruneOldEntries();
  }, []);

  const updateMode = useCallback((next: VoiceMode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VOICE_MODE_STORAGE_KEY, next);
    }
    setMode(next);
  }, []);

  return [mode, updateMode];
}
