'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface AppSettings {
  /** Hide synopsis & dense metadata for a cleaner, faster read. */
  minimal: boolean;
  /** Blur the synopsis of shows you're mid-watch until revealed. */
  spoilerSafe: boolean;
}

export const SETTINGS_STORAGE_KEY = 'annie_settings';

interface SettingsContextValue extends AppSettings {
  setMinimal: (v: boolean) => void;
  setSpoilerSafe: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  minimal: false,
  spoilerSafe: false,
  setMinimal: () => {},
  setSpoilerSafe: () => {},
});

function applyMinimal(on: boolean) {
  document.documentElement.classList.toggle('minimal', on);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ minimal: false, spoilerSafe: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<AppSettings>;
        const next = { minimal: !!s.minimal, spoilerSafe: !!s.spoilerSafe };
        setSettings(next);
        applyMinimal(next.minimal);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if ('minimal' in patch) applyMinimal(next.minimal);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setMinimal: (v) => update({ minimal: v }),
        setSpoilerSafe: (v) => update({ spoilerSafe: v }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
