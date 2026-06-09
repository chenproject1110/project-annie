'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'annie_theme';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  setTheme: () => {},
});

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  if (theme === 'light') el.classList.add('light');
  else el.classList.remove('light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Sync from the class the anti-flash script already applied.
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setThemeState(isLight ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((curr) => {
      const next = curr === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
