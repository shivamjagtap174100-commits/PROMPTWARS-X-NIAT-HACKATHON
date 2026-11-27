import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '../types/privacy';
import { STORAGE_KEYS } from '../utils/localPersistence';

function readStoredTheme(fallback: ThemeMode): ThemeMode {
  try {
    const saved =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.THEME) : null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage read blocks
  }
  return fallback;
}

export function useTheme(initialTheme: ThemeMode = 'light') {
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme(initialTheme));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, next);
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
