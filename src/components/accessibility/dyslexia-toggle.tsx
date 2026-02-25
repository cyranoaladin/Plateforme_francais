'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';

const STORAGE_KEY = 'eaf_dyslexia_mode';

/**
 * Dyslexia mode toggle — WCAG 2.1 AA per cahier V2 P0-11.
 * Toggles the `.dyslexia-mode` class on <body> for wider spacing and OpenDyslexic font.
 */
export function DyslexiaToggle() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      if (enabled) document.body.classList.add('dyslexia-mode');
    }
  }, [enabled]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      document.body.classList.add('dyslexia-mode');
    } else {
      document.body.classList.remove('dyslexia-mode');
    }
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-muted"
      aria-pressed={enabled}
      title={enabled ? 'Désactiver le mode dyslexie' : 'Activer le mode dyslexie'}
    >
      <Eye className="w-4 h-4" />
      <span className="hidden md:inline">{enabled ? 'Dyslexie ✓' : 'Dyslexie'}</span>
    </button>
  );
}
