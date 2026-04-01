import { useCallback, useEffect, useMemo, useState } from 'react';

const CHECK_KEY_PREFIX = 'prep_checklist_';
const CHECK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function storageKey(sessionId: string) {
  return `${CHECK_KEY_PREFIX}${sessionId}`;
}

function persistChecklist(sessionId: string, value: string[]) {
  if (typeof window === 'undefined') return;
  const key = storageKey(sessionId);
  window.localStorage.setItem(key, JSON.stringify(value));
  window.localStorage.setItem(`${key}_ts`, Date.now().toString());
}

function loadChecklist(sessionId: string): string[] {
  if (typeof window === 'undefined') return [];
  const key = storageKey(sessionId);
  const ts = Number(window.localStorage.getItem(`${key}_ts`) ?? '0');
  if (Number.isNaN(ts) || Date.now() - ts > CHECK_TTL_MS) {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}_ts`);
    return [];
  }
  const payload = window.localStorage.getItem(key);
  if (!payload) return [];
  try {
    return JSON.parse(payload);
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function usePrepChecklist(sessionId: string) {
  const [checked, setChecked] = useState<string[]>(() => loadChecklist(sessionId));

  useEffect(() => {
    setChecked(loadChecklist(sessionId));
  }, [sessionId]);

  useEffect(() => {
    persistChecklist(sessionId, checked);
  }, [checked, sessionId]);

  const toggle = useCallback(
    (id: string) => {
      setChecked((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
    },
    [],
  );

  const isChecked = useMemo(() => new Set(checked), [checked]);

  return { checked, isChecked, toggle, reset: () => setChecked([]) };
}
