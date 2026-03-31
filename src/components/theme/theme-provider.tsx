'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setTheme: (pref: ThemePreference) => void;
  /** @deprecated Use setTheme('light') / setTheme('dark') instead. Kept for backward compat. */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('eaf_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'system';
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') return getSystemTheme();
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredPreference());
  const [theme, setThemeState] = useState<Theme>(() => resolveTheme(getStoredPreference()));

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    if (pref === 'system') {
      localStorage.removeItem('eaf_theme');
      setThemeState(getSystemTheme());
    } else {
      localStorage.setItem('eaf_theme', pref);
      setThemeState(pref);
    }
  }, []);

  // Backward-compatible toggle: cycles light -> dark -> light
  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  // Apply theme to DOM — .dark/.light classes are the source of truth
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Mark theme as ready after initial paint to enable CSS transitions
  useEffect(() => {
    // Use rAF + setTimeout to ensure the initial theme is painted without animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.documentElement.classList.add('theme-ready');
      }, 50);
    });
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only follow system changes if user hasn't made explicit choice
      if (getStoredPreference() === 'system') {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setTheme, toggleTheme }),
    [theme, preference, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider');
  }
  return ctx;
}
